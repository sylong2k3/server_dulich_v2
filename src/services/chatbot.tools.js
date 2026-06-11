/**
 * Chatbot tool registry — OpenAI function-calling.
 *
 * Mỗi tool có:
 *   - definition: schema gửi cho OpenAI
 *   - handler:    hàm thực thi, gọi service domain (KHÔNG dùng pool.query trực tiếp)
 *   - returns:    { items?, item?, count?, map_hint?, ... } — map_hint giúp model tự gọi
 *                 navigate_map với fit_bounds / highlight đúng dữ liệu vừa lấy.
 *
 * map_actions hỗ trợ (frontend tự render theo thư viện map đang dùng):
 *   fly_to        { center: [lng, lat], zoom?, label? }
 *   pan            { center: [lng, lat] }
 *   zoom           { zoom: number }
 *   highlight      { spot_ids: string[] }
 *   add_marker     { center: [lng, lat], label?, color? }
 *   fit_bounds     { bounds: [[minLng,minLat],[maxLng,maxLat]], padding? }
 *   draw_route     { coordinates: [[lng,lat]...], color?, label? }
 *   clear_markers  { scope?: 'ai'|'all' }
 *   show_popup     { spot_id?, center: [lng, lat], html?: string }
 *   filter_layer   { layers: string[], visible: boolean }
 */

const { pool } = require('../configs/database');
const SpotService = require('./spot.service');
const FestivalService = require('./festival.service');
const CulinaryService = require('./culinary.service');
const OcopService = require('./ocop.service');
const NewsService = require('./news.service');
const VlogService = require('./vlog.service');
const ItineraryAiService = require('./itinerary-ai.service');
const TourService = require('./tour.service');
const MapMeasureService = require('./map-measure.service');
const { cacheOrFetch } = require('../utils/cache.utils');

const SPOT_DETAIL_TTL = 120; // giây — đủ để gộp các tool call trong cùng 1 cuộc hội thoại

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trả về [lng, lat] từ một row có sẵn nhiều dạng geom. */
function pickLngLat(row) {
  if (row?.lng != null && row?.lat != null) return [Number(row.lng), Number(row.lat)];
  if (row?.longitude != null && row?.latitude != null) return [Number(row.longitude), Number(row.latitude)];

  // GeoJSON object hoặc chuỗi JSON (PostGIS ST_AsGeoJSON)
  for (const key of ['geojson', 'geom']) {
    const g = row?.[key];
    if (!g) continue;
    const obj = typeof g === 'string' ? safeParse(g) : g;
    if (obj?.coordinates && Array.isArray(obj.coordinates)) {
      const [lng, lat] = obj.coordinates;
      if (lng != null && lat != null) return [Number(lng), Number(lat)];
    }
  }
  return null;
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function firstValue(...values) {
  return values.find(v => v !== undefined && v !== null && v !== '');
}

function slugToSearchText(slug) {
  return String(slug || '')
    .trim()
    .replace(/^-+|-+$/g, '')
    .replace(/-/g, ' ');
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSlugSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, '-');
}

const SERVICE_CATEGORY_KEYWORDS = new Set([
  'san bay',
  'ngan hang',
  'ben xe',
  'rap chieu phim',
  'cau lac bo',
  'pha',
  'cang ben cang',
  'benh vien',
  'khach san',
  'khu nghi duong',
  'nha hang',
  'cang bien',
  'buu dien',
  'cua hang luu niem',
  'trung tam the thao',
  'san van dong',
  'sieu thi',
  'ga tau',
  'cong ty du lich',
  'cua khau',
  'thap vien thong',
  'dai su quan lanh su quan',
  'khu cong nghiep',
  'khu dan cu',
  'truong hoc',
]);

function serviceCategoryKey(row) {
  return normalizeSearchText(firstValue(row.category_name, row.category));
}

function isServiceCategory(row) {
  return SERVICE_CATEGORY_KEYWORDS.has(serviceCategoryKey(row));
}

function keywordRequestsServiceCategory(keyword) {
  const q = normalizeSearchText(keyword);
  if (!q) return false;
  return Array.from(SERVICE_CATEGORY_KEYWORDS).some((cat) => q.includes(cat) || cat.includes(q));
}

function spotMatchScore(row, keyword) {
  const q = normalizeSearchText(keyword);
  if (!q) return 0;

  const name = normalizeSearchText(firstValue(row.name_vi, row.name, row.title, row.name_en));
  const slug = normalizeSearchText(String(row.slug || '').replace(/-/g, ' '));
  const haystack = `${name} ${slug}`;
  const tokens = q.split(' ').filter(Boolean);

  if (name === q || slug === q) return 100;
  if (slug.startsWith(q) || name.startsWith(q)) return 90;
  if (slug.includes(q) || name.includes(q)) return 80;
  if (tokens.length && tokens.every((token) => haystack.includes(token))) return 60 + tokens.length;
  return tokens.filter((token) => haystack.includes(token)).length * 10;
}

function rankAndFilterSpotRows(rows, keyword, categoryId) {
  const allowServiceCategories = !!categoryId || keywordRequestsServiceCategory(keyword);
  const scopedRows = allowServiceCategories ? rows : rows.filter((row) => !isServiceCategory(row));

  return scopedRows
    .map((row, index) => ({ row, index, score: spotMatchScore(row, keyword) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ratingDiff = Number(b.row.rating_avg || 0) - Number(a.row.rating_avg || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

/** Tính bounds [[minLng,minLat],[maxLng,maxLat]] từ list rows có toạ độ. */
function computeBounds(rows = []) {
  const points = rows.map(pickLngLat).filter(Boolean);
  if (!points.length) return null;
  let minLng = points[0][0], maxLng = points[0][0];
  let minLat = points[0][1], maxLat = points[0][1];
  for (const [lng, lat] of points) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}

/** Chuẩn hoá item nhẹ (cho tool result) — bỏ field nặng/không cần cho AI. */
function trimSpot(s) {
  if (!s) return null;
  const [lng, lat] = pickLngLat(s) || [null, null];
  return {
    id: s.id,
    slug: s.slug,
    name_vi: firstValue(s.name_vi, s.name, s.title),
    name_en: s.name_en,
    category: firstValue(s.category_name, s.category, null),
    province: s.province_name || null,
    rating_avg: s.rating_avg ?? null,
    rating_count: s.rating_count ?? 0,
    ticket_price_adult: s.ticket_price_adult ?? null,
    is_featured: !!s.is_featured,
    has_vr_360: !!s.has_vr_360,
    has_audio_guide: !!s.has_audio_guide,
    distance_m: s.distance_m != null ? Number(s.distance_m) : undefined,
    lat, lng,
  };
}

function trimFestival(f) {
  const [lng, lat] = pickLngLat(f) || [null, null];
  return {
    id: f.id, name_vi: f.name_vi, festival_type: f.festival_type,
    start_date: f.start_date, end_date: f.end_date,
    location_name: f.location_name, spot_id: f.spot_id || null,
    cover_image_url: f.cover_image_url, lat, lng,
  };
}

function trimCuisine(c) {
  return {
    id: c.id, name_vi: c.name_vi, category: c.category,
    is_speciality: !!c.is_speciality, rating_avg: c.rating_avg ?? null,
    cover_image_url: c.cover_image_url,
  };
}

function trimOcop(o) {
  return {
    id: o.id, name_vi: o.name_vi, category: o.category,
    star_rating: o.star_rating, certified_at: o.certified_at,
    cover_image_url: o.cover_image_url, business_id: o.business_id || null,
  };
}

function trimVlog(v) {
  return {
    id: v.id, title: v.title, excerpt: v.excerpt,
    cover_image_url: v.cover_image_url, video_url: v.video_url,
    spot_id: v.spot_id || null, view_count: v.view_count, like_count: v.like_count,
  };
}

function trimNews(n) {
  return {
    id: n.id, title: n.title, slug: n.slug, excerpt: n.excerpt,
    cover_image_url: n.cover_image_url, published_at: n.published_at,
  };
}

function trimTour(t) {
  return {
    id: t.id,
    slug: t.slug,
    name_vi: firstValue(t.name, t.name_vi),
    province: t.province_name || null,
    business_name: t.business_name || null,
    duration_days: t.duration_days ?? null,
    price_from_vnd: t.price_from_vnd ?? null,
    max_guests: t.max_guests ?? null,
    rating_avg: t.rating_avg ?? null,
    rating_count: t.rating_count ?? 0,
    is_featured: !!t.is_featured,
    cover_image_url: t.cover_image_url || null,
    start_location: t.start_location_vi || null,
    end_location: t.end_location_vi || null,
  };
}

/** Chuyển một stop của tour (có geom GeoJSON) thành card điểm dừng có toạ độ. */
function tourStopToPoint(stop) {
  const ll = pickLngLat(stop);
  // Bỏ điểm dừng thiếu toạ độ hoặc dùng placeholder POINT(0 0).
  if (!ll || (ll[0] === 0 && ll[1] === 0)) return null;
  return {
    id: stop.spot_id || stop.id,
    type: 'spot',
    name: firstValue(stop.spot_name, stop.title_vi, 'Điểm dừng'),
    slug: null,
    lng: ll[0],
    lat: ll[1],
    day_number: stop.day_number ?? null,
    stop_order: stop.stop_order ?? null,
  };
}

// ─── Tool-specific helpers ───────────────────────────────────────────────────

async function findSpotDetail({ id, slug }) {
  const normalizedSlug = String(slug || '').trim();
  if (!id && !normalizedSlug) return null;

  const cacheKey = id
    ? `chatbot:spot:id:${id}`
    : `chatbot:spot:slug:${normalizedSlug.toLowerCase()}`;

  return cacheOrFetch(cacheKey, async () => {
    if (id) return SpotService.getSpotById(id);

    try {
      return await SpotService.getSpotBySlug(normalizedSlug);
    } catch (_) {
      // The model often sends short slugs like "trang-an"; DB slugs can be longer.
    }

    const searchTerms = [...new Set([normalizedSlug, slugToSearchText(normalizedSlug)].filter(Boolean))];
    for (const search of searchTerms) {
      const { spots = [] } = await SpotService.getAllSpots({
        page: 1,
        limit: 20,
        search,
        sortBy: 'rating_avg',
        sortOrder: 'DESC',
      });
      const ranked = rankAndFilterSpotRows(spots, search);
      const candidate = ranked.find(s => s.slug === normalizedSlug)
        || ranked.find(s => String(s.slug || '').includes(normalizedSlug))
        || ranked[0];
      if (candidate?.id) {
        return SpotService.getSpotById(candidate.id);
      }
    }

    return null;
  }, SPOT_DETAIL_TTL);
}

function buildFallbackItinerary({ num_days, preferences = [], budget_vnd, start_location }, spots = []) {
  const daysCount = Math.min(14, Math.max(1, Number(num_days) || 1));
  const usableSpots = spots.length ? spots : [
    { name_vi: 'Tràng An' },
    { name_vi: 'Hoa Lư' },
    { name_vi: 'Tam Cốc - Bích Động' },
    { name_vi: 'Chùa Bái Đính' },
  ];

  const days = Array.from({ length: daysCount }, (_, index) => {
    const start = (index * 3) % usableSpots.length;
    const daySpots = Array.from({ length: Math.min(3, usableSpots.length) }, (_, offset) => {
      const spot = usableSpots[(start + offset) % usableSpots.length];
      return {
        spot_id: spot.id || null,
        name: firstValue(spot.name_vi, spot.name, spot.slug, `Điểm ${offset + 1}`),
        slug: spot.slug || null,
      };
    });

    return {
      day_number: index + 1,
      title: `Ngày ${index + 1}: ${daySpots.map(s => s.name).join(' - ')}`,
      stops_count: daySpots.length,
      stops: daySpots,
    };
  });

  const prefText = preferences.length ? ` theo sở thích ${preferences.join(', ')}` : '';
  const budgetText = budget_vnd ? `, ngân sách khoảng ${Number(budget_vnd).toLocaleString('vi-VN')} VNĐ` : '';
  const startText = start_location ? ` từ ${start_location}` : '';

  return {
    id: null,
    persisted: false,
    title: `Lịch trình ${daysCount} ngày khám phá Ninh Bình`,
    description: `Gợi ý lịch trình nháp${startText}${prefText}${budgetText}.`,
    total_days: daysCount,
    total_distance_km: null,
    days,
  };
}

// ─── Tool definitions (gửi cho OpenAI) ────────────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_spots',
      description: 'Tìm điểm du lịch ở Ninh Bình. Mặc định sắp theo rating_avg DESC nên hợp cho câu "top điểm". Truyền is_featured=true cho "nổi bật", rating_min=4 cho "đẹp nhất". Có lat/lng+radius_km để tìm gần một toạ độ.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Từ khoá tên hoặc mô tả' },
          category_id: { type: 'integer', description: 'ID danh mục điểm du lịch' },
          province_code: { type: 'string', description: 'Mã tỉnh' },
          rating_min: { type: 'number', description: 'Rating tối thiểu (0-5)' },
          is_featured: { type: 'boolean' },
          lat: { type: 'number', description: 'Vĩ độ (kèm radius_km nếu muốn lọc theo khoảng cách)' },
          lng: { type: 'number', description: 'Kinh độ' },
          radius_km: { type: 'number', default: 10 },
          limit: { type: 'integer', default: 8, maximum: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spot_detail',
      description: 'Lấy chi tiết một điểm du lịch theo id hoặc slug: mô tả, giờ mở cửa, giá vé, ảnh, VR/audio guide.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID' },
          slug: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_random_spot',
      description: 'Lấy 1 điểm du lịch NGẪU NHIÊN. Gọi tool này (KHÔNG dùng search_spots) khi user nói "gợi ý ngẫu nhiên", "bất kỳ", "tuỳ bạn", "random", "không biết đi đâu". Mặc định ưu tiên điểm có rating ≥ 4.',
      parameters: {
        type: 'object',
        properties: {
          min_rating: { type: 'number', description: 'Rating tối thiểu (mặc định 4)', default: 4 },
          featured_only: { type: 'boolean', description: 'Chỉ chọn trong điểm featured', default: false },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spot_capacity',
      description: 'Kiểm tra sức chứa hiện tại / cảnh báo quá tải của một điểm du lịch.',
      parameters: {
        type: 'object',
        required: ['spot_id'],
        properties: { spot_id: { type: 'string' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_festivals',
      description: 'Tìm lễ hội: theo từ khoá, loại, sắp diễn ra. Có toạ độ → nên gọi navigate_map.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          festival_type: { type: 'string' },
          upcoming: { type: 'boolean', description: 'Chỉ lấy lễ hội từ hôm nay trở đi' },
          limit: { type: 'integer', default: 8, maximum: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_culinary',
      description: 'Tìm món ăn / đặc sản Ninh Bình theo từ khoá, loại, đặc sản (is_speciality).',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          category: { type: 'string' },
          is_speciality: { type: 'boolean' },
          limit: { type: 'integer', default: 8, maximum: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_ocop_products',
      description: 'Tìm sản phẩm OCOP theo từ khoá, loại, số sao (3-5).',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          category: { type: 'string' },
          star_rating: { type: 'integer', minimum: 3, maximum: 5 },
          province_code: { type: 'string' },
          limit: { type: 'integer', default: 8, maximum: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_vlogs',
      description: 'Tìm bài vlog/video review du lịch.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          limit: { type: 'integer', default: 5, maximum: 10 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_news',
      description: 'Tìm tin tức du lịch theo từ khoá / tag / featured.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          tag: { type: 'string' },
          is_featured: { type: 'boolean' },
          limit: { type: 'integer', default: 5, maximum: 10 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_tours',
      description: 'Tìm TUYẾN / TOUR du lịch CÓ SẴN trong hệ thống (gói tour do doanh nghiệp xây sẵn, gồm nhiều điểm dừng). Gọi khi user hỏi "tuyến du lịch", "tour", "gói tour", "lộ trình có sẵn", "tour trọn gói". Muốn 1 tuyến NGẪU NHIÊN ("tuyến bất kỳ", "tour ngẫu nhiên", "gợi ý 1 tuyến") → truyền random=true. KHÁC với suggest_itinerary (AI tự sinh lịch trình mới) và get_random_spot (1 điểm lẻ).',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Từ khoá tên/mô tả tuyến' },
          is_featured: { type: 'boolean', description: 'Chỉ lấy tuyến nổi bật' },
          random: { type: 'boolean', description: 'true = chọn ngẫu nhiên 1 tuyến', default: false },
          duration_days: { type: 'integer', description: 'Lọc theo số ngày của tuyến' },
          price_max: { type: 'integer', description: 'Giá tối đa (VNĐ) cho 1 khách' },
          limit: { type: 'integer', default: 6, maximum: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tour_detail',
      description: 'Lấy chi tiết một TUYẾN / TOUR có sẵn theo id hoặc slug: mô tả, số ngày, giá, các điểm dừng theo từng ngày. Server tự vẽ lộ trình (draw_route) các điểm dừng lên bản đồ.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID của tuyến' },
          slug: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_itinerary',
      description: 'Sinh lịch trình du lịch nhiều ngày bằng AI (TẠO MỚI theo yêu cầu, không phải tour có sẵn). CHỈ GỌI khi user muốn lịch trình cụ thể (1-14 ngày). Nếu user muốn TUYẾN/TOUR CÓ SẴN thì dùng search_tours.',
      parameters: {
        type: 'object',
        required: ['num_days'],
        properties: {
          num_days: { type: 'integer', minimum: 1, maximum: 14 },
          preferences: { type: 'array', items: { type: 'string' }, description: 'VD: ["thiên nhiên","tâm linh"]' },
          budget_vnd: { type: 'integer', description: 'Ngân sách (VNĐ)' },
          start_location: { type: 'string', description: 'Điểm xuất phát' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_route_between',
      description: 'Tính khoảng cách đường thẳng giữa các điểm theo thứ tự. ƯU TIÊN truyền points=[{slug|id|name},...] (server tự tra DB lấy toạ độ thật, chính xác hơn) — chỉ truyền coordinates [[lng,lat],...] khi user đã cho sẵn toạ độ cụ thể, KHÔNG tự đoán toạ độ điểm du lịch.',
      parameters: {
        type: 'object',
        properties: {
          points: {
            type: 'array',
            description: 'Danh sách điểm theo thứ tự. Mỗi điểm: {slug} hoặc {id} hoặc {name}. Server resolve thành coords thật.',
            items: {
              type: 'object',
              properties: {
                slug: { type: 'string' },
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            minItems: 2,
          },
          coordinates: {
            type: 'array',
            description: '[[lng,lat],...] — chỉ dùng khi user cho sẵn toạ độ',
            items: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
            minItems: 2,
          },
          unit: { type: 'string', enum: ['m', 'km'], default: 'km' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_nearby_services',
      description: 'Tìm KHÁCH SẠN / NHÀ HÀNG (cơ sở lưu trú & ăn uống) ở Ninh Bình. Gọi khi user hỏi "khách sạn", "chỗ ở", "resort", "homestay", "nhà hàng", "quán ăn", hoặc muốn tìm chỗ ăn/ở GẦN một điểm du lịch / trong lịch trình. Ưu tiên truyền near_spot={name|slug|id} để tìm quanh một điểm (server tự tra toạ độ thật) — chỉ dùng lat/lng khi user cho sẵn toạ độ.',
      parameters: {
        type: 'object',
        properties: {
          service_type: { type: 'string', enum: ['hotel', 'restaurant', 'all'], default: 'hotel', description: 'hotel = khách sạn/lưu trú, restaurant = nhà hàng/quán ăn, all = cả hai' },
          near_spot: {
            type: 'object',
            description: 'Điểm trung tâm để tìm quanh. {slug} hoặc {id} hoặc {name}.',
            properties: {
              slug: { type: 'string' },
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          lat: { type: 'number', description: 'Vĩ độ trung tâm (chỉ khi user cho sẵn toạ độ)' },
          lng: { type: 'number', description: 'Kinh độ trung tâm' },
          radius_km: { type: 'number', default: 8, description: 'Bán kính tìm quanh tâm (km)' },
          keyword: { type: 'string', description: 'Lọc thêm theo tên/địa chỉ' },
          limit: { type: 'integer', default: 6, maximum: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_statistics_summary',
      description: '[manager] Thống kê tổng hợp: số điểm hoạt động, doanh nghiệp duyệt, số lễ hội sắp diễn ra.',
      parameters: {
        type: 'object',
        properties: {
          province_code: { type: 'string' },
          from_date: { type: 'string' },
          to_date: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_map',
      description: 'Điều khiển bản đồ ở UI client. Nhiều điểm → fit_bounds; 1 điểm → fly_to hoặc pan + show_popup.',
      parameters: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['fly_to', 'pan', 'zoom', 'highlight', 'add_marker', 'fit_bounds', 'draw_route', 'clear_markers', 'show_popup', 'filter_layer'],
          },
          center: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2, description: '[lng, lat]' },
          zoom: { type: 'integer', minimum: 1, maximum: 20 },
          spot_ids: { type: 'array', items: { type: 'string' } },
          bounds: {
            type: 'array',
            description: '[[minLng,minLat],[maxLng,maxLat]]',
            items: { type: 'array', items: { type: 'number' } },
          },
          coordinates: {
            type: 'array',
            description: '[[lng,lat],...] — dùng cho draw_route',
            items: { type: 'array', items: { type: 'number' } },
          },
          layers: { type: 'array', items: { type: 'string' }, description: 'VD: ["festival","ocop","spot"]' },
          visible: { type: 'boolean' },
          label: { type: 'string' },
          color: { type: 'string', description: 'Hex / tên màu' },
          html: { type: 'string', description: 'Nội dung popup (text/HTML ngắn)' },
          padding: { type: 'integer', description: 'Padding khi fit_bounds (px)' },
          scope: { type: 'string', enum: ['ai', 'all'], description: 'clear_markers: ai = chỉ marker AI thêm' },
        },
      },
    },
  },
];

// ─── Handlers ─────────────────────────────────────────────────────────────────

const HANDLERS = {
  async search_spots(args) {
    const { keyword, category_id, province_code, rating_min, is_featured, lat, lng, radius_km = 10, limit = 8 } = args;

    let rows;
    if (lat != null && lng != null) {
      rows = await SpotService.getNearbySpots(lat, lng, radius_km, limit);
      if (keyword) {
        const kw = String(keyword).toLowerCase();
        rows = rows.filter(s => [s.name_vi, s.name_en, s.name, s.slug]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(kw));
      }
    } else {
      const fetchLimit = Math.max(limit * 3, 20);
      const searchTerms = keyword
        ? [...new Set([keyword, toSlugSearchText(keyword)].filter(Boolean))]
        : [keyword];
      const rowsById = new Map();

      for (const search of searchTerms) {
        const { spots } = await SpotService.getAllSpots({
          page: 1,
          limit: fetchLimit,
          search,
          category_id: category_id,
          province_code,
          rating_min,
          is_featured,
          sortBy: 'rating_avg',
          sortOrder: 'DESC',
        });
        for (const spot of spots) {
          if (spot?.id && !rowsById.has(spot.id)) rowsById.set(spot.id, spot);
        }
      }

      rows = Array.from(rowsById.values());
      rows = rankAndFilterSpotRows(rows, keyword, category_id);
    }

    const items = rows.slice(0, limit).map(trimSpot);
    return {
      items,
      count: items.length,
      map_hint: {
        spot_ids: items.map(i => i.id),
        bounds: computeBounds(items),
        suggested_action: items.length > 1 ? 'fit_bounds' : items.length === 1 ? 'pan_and_popup' : null,
      },
    };
  },

  async get_spot_detail(args) {
    const { id, slug } = args;
    if (!id && !slug) return { error: 'Cần truyền id hoặc slug' };
    const spot = await findSpotDetail({ id, slug });
    if (!spot) return { error: 'Không tìm thấy điểm du lịch' };
    const trimmed = trimSpot(spot);
    return {
      item: {
        ...trimmed,
        description_vi: firstValue(spot.description_vi, spot.description),
        address_vi: firstValue(spot.address_vi, spot.address),
        opening_hours: spot.opening_hours,
        ticket_price_child: spot.ticket_price_child,
        phone: spot.phone,
        website: spot.website,
        primary_image: spot.primary_image,
      },
      map_hint: trimmed.lat != null
        ? { spot_ids: [trimmed.id], center: [trimmed.lng, trimmed.lat], suggested_action: 'pan_and_popup' }
        : null,
    };
  },

  async get_random_spot(args = {}) {
    const minRating = Number.isFinite(Number(args.min_rating)) ? Number(args.min_rating) : 4;
    const featuredOnly = !!args.featured_only;

    // Loại nhóm "Cơ sở vật chất kỹ thuật" (spot_categories.parent_id = 3) —
    // bao gồm khách sạn, resort, nhà thuyền, ngân hàng, bệnh viện, ga tàu, v.v.
    // Giữ parent 1 (du lịch tự nhiên) + 2 (du lịch văn hoá) + spot chưa có category.
    const EXCLUDE_INFRASTRUCTURE = `
      NOT EXISTS (
        SELECT 1 FROM spot_categories sc
        WHERE sc.id = s.category_id AND sc.parent_id = 3
      )
    `;

    // Lấy ngẫu nhiên 1 điểm. PostgreSQL ORDER BY RANDOM() OK với bảng cỡ vừa.
    const conds = [`s.status = 'active'`, EXCLUDE_INFRASTRUCTURE, `s.rating_avg >= $1`];
    const params = [minRating];
    if (featuredOnly) conds.push('s.is_featured = true');

    let { rows } = await pool.query(
      `SELECT s.id FROM tourism_spots s
       WHERE ${conds.join(' AND ')}
       ORDER BY RANDOM() LIMIT 1`,
      params
    );

    // Fallback: nếu không có điểm nào đạt ngưỡng → nới rating, vẫn loại parent=3
    if (!rows[0] && minRating > 0) {
      const fb = await pool.query(
        `SELECT s.id FROM tourism_spots s
         WHERE s.status='active' AND ${EXCLUDE_INFRASTRUCTURE}
         ORDER BY RANDOM() LIMIT 1`
      );
      rows = fb.rows;
    }
    if (!rows[0]) return { error: 'Không có điểm du lịch nào trong hệ thống' };

    const spot = await SpotService.getSpotById(rows[0].id);
    if (!spot) return { error: 'Không tìm thấy chi tiết điểm' };

    const trimmed = trimSpot(spot);
    return {
      item: {
        ...trimmed,
        description_vi: firstValue(spot.description_vi, spot.description),
        address_vi: firstValue(spot.address_vi, spot.address),
        opening_hours: spot.opening_hours,
        ticket_price_child: spot.ticket_price_child,
        phone: spot.phone,
        website: spot.website,
        primary_image: spot.primary_image,
      },
      map_hint: trimmed.lat != null
        ? { spot_ids: [trimmed.id], center: [trimmed.lng, trimmed.lat], suggested_action: 'pan_and_popup' }
        : null,
    };
  },

  async get_spot_capacity(args) {
    const { spot_id } = args;
    const { rows } = await pool.query(
      `SELECT s.id, s.name_vi, s.max_capacity,
              c.visitor_count AS current_occupancy,
              c.capacity_pct  AS occupancy_pct,
              c.status        AS capacity_status,
              c.recorded_at,
              CASE
                WHEN s.max_capacity IS NULL OR s.max_capacity = 0 THEN NULL
                WHEN c.visitor_count IS NULL THEN NULL
                WHEN c.visitor_count >= s.max_capacity THEN true
                ELSE false
              END AS is_overloaded
       FROM tourism_spots s
       LEFT JOIN LATERAL (
         SELECT visitor_count, capacity_pct, status, recorded_at
         FROM capacity_logs WHERE spot_id = s.id
         ORDER BY recorded_at DESC LIMIT 1
       ) c ON true
       WHERE s.id = $1`,
      [spot_id]
    );
    if (!rows[0]) return { error: 'Không tìm thấy điểm du lịch' };
    return {
      ...rows[0],
      capacity_unknown: rows[0].max_capacity == null || rows[0].max_capacity === 0,
    };
  },

  async search_festivals(args) {
    const { keyword, festival_type, upcoming, limit = 8 } = args;
    const { items } = await FestivalService.getAll({
      page: 1, limit, search: keyword, festival_type,
      upcoming: upcoming === true ? 'true' : undefined,
      sortBy: 'start_date', sortOrder: 'ASC',
    });
    const trimmed = items.map(trimFestival);
    return {
      items: trimmed,
      count: trimmed.length,
      map_hint: {
        bounds: computeBounds(trimmed),
        spot_ids: trimmed.filter(f => f.spot_id).map(f => f.spot_id),
        layers: ['festival'],
        suggested_action: trimmed.length > 1 ? 'fit_bounds' : 'pan_and_popup',
      },
    };
  },

  async search_culinary(args) {
    const { keyword, category, is_speciality, limit = 8 } = args;
    const { items } = await CulinaryService.getAll({
      page: 1, limit, search: keyword, category, is_speciality,
    });
    const trimmed = items.map(trimCuisine);
    return { items: trimmed, count: trimmed.length, map_hint: { layers: ['culinary'] } };
  },

  async search_ocop_products(args) {
    const { keyword, category, star_rating, province_code, limit = 8 } = args;
    const { items } = await OcopService.getAll({
      page: 1, limit, search: keyword, category, star_rating, province_code,
    });
    const trimmed = items.map(trimOcop);
    return { items: trimmed, count: trimmed.length, map_hint: { layers: ['ocop'] } };
  },

  async search_vlogs(args) {
    const { keyword, limit = 5 } = args;
    const { items } = await VlogService.getAll({ page: 1, limit, search: keyword });
    const trimmed = items.map(trimVlog);
    return { items: trimmed, count: trimmed.length };
  },

  async search_news(args) {
    const { keyword, tag, is_featured, limit = 5 } = args;
    const { items } = await NewsService.getAll({ page: 1, limit, search: keyword, tag, is_featured });
    const trimmed = items.map(trimNews);
    return { items: trimmed, count: trimmed.length };
  },

  async suggest_itinerary(args, { userId } = {}) {
    const { num_days, preferences = [], budget_vnd, start_location } = args;
    const spotsForFallback = async () => {
      const { spots = [] } = await SpotService.getAllSpots({
        page: 1,
        limit: Math.min(12, Math.max(4, (Number(num_days) || 1) * 3)),
        sortBy: 'rating_avg',
        sortOrder: 'DESC',
        exclude_parent_category_id: 3,
      });
      return spots;
    };

    if (!userId) {
      const spots = await spotsForFallback();
      return { item: buildFallbackItinerary({ num_days, preferences, budget_vnd, start_location }, spots) };
    }

    let itinerary;
    try {
      itinerary = await ItineraryAiService.generate(
        { num_days, preferences, budget_vnd, start_location, language: 'vi' },
        userId
      );
    } catch (_) {
      const spots = await spotsForFallback();
      return { item: buildFallbackItinerary({ num_days, preferences, budget_vnd, start_location }, spots) };
    }
    return {
      item: {
        id: itinerary.id, title: itinerary.title, description: itinerary.description,
        total_days: itinerary.total_days || Number(num_days) || null,
        total_distance_km: itinerary.total_distance_km,
        persisted: true,
        days: (itinerary.days || []).map(d => ({
          day_number: d.day_number, title: d.title,
          stops_count: Array.isArray(d.stops) ? d.stops.length : undefined,
        })),
      },
    };
  },

  async search_tours(args = {}) {
    const { keyword, is_featured, random = false, duration_days, price_max, limit = 6 } = args;
    const cleanLimit = Math.min(20, Math.max(1, Number(limit) || 6));
    // Khi cần ngẫu nhiên thì lấy rộng hơn rồi tự bốc 1 tuyến.
    const fetchLimit = random ? 30 : cleanLimit;

    const { tours = [] } = await TourService.getAll({
      page: 1,
      limit: fetchLimit,
      search: keyword,
      is_featured,
      sortBy: 'rating_avg',
      sortOrder: 'DESC',
    });

    let rows = tours;
    if (duration_days != null) {
      rows = rows.filter((t) => Number(t.duration_days) === Number(duration_days));
    }
    if (price_max != null) {
      rows = rows.filter((t) => t.price_from_vnd == null || Number(t.price_from_vnd) <= Number(price_max));
    }

    if (!rows.length) return { items: [], count: 0 };

    if (random) {
      rows = [rows[Math.floor(Math.random() * rows.length)]];
    } else {
      rows = rows.slice(0, cleanLimit);
    }

    const items = rows.map(trimTour);
    return { items, count: items.length };
  },

  async get_tour_detail(args = {}) {
    const { id, slug } = args;
    if (!id && !slug) return { error: 'Cần truyền id hoặc slug' };

    let tour = null;
    try {
      tour = id ? await TourService.getById(id) : await TourService.getBySlug(slug);
    } catch (_) {
      tour = null;
    }
    if (!tour) return { error: 'Không tìm thấy tuyến du lịch' };

    const stops = Array.isArray(tour.stops) ? tour.stops : [];
    const stopPoints = stops.map(tourStopToPoint).filter(Boolean);
    const coordinates = stopPoints.map((p) => [p.lng, p.lat]);

    const item = {
      ...trimTour(tour),
      description_vi: truncateText(firstValue(tour.description_vi, tour.description), 500),
      includes: tour.includes || null,
      excludes: tour.excludes || null,
      total_stops: stops.length,
      stops: stops.map((s) => ({
        day_number: s.day_number,
        stop_order: s.stop_order,
        name: firstValue(s.spot_name, s.title_vi),
      })),
    };

    return {
      item,
      stop_points: stopPoints,
      map_action: coordinates.length >= 2
        ? { action: 'draw_route', coordinates, label: item.name_vi }
        : null,
      map_hint: {
        spot_ids: stopPoints.map((p) => p.id).filter(Boolean),
        bounds: computeBounds(stopPoints),
        suggested_action: coordinates.length >= 2 ? 'draw_route' : 'fit_bounds',
      },
    };
  },

  async get_route_between(args) {
    const { points, coordinates: rawCoords, unit = 'km' } = args;
    // Ưu tiên resolve theo points (slug/id/name) để tránh model tự đoán toạ độ.
    let coordinates = Array.isArray(rawCoords) ? rawCoords.slice() : [];
    const resolvedItems = [];

    if (Array.isArray(points) && points.length >= 2) {
      coordinates = [];
      for (const p of points) {
        if (!p) {
          resolvedItems.push({ error: 'Điểm rỗng' });
          continue;
        }
        const spot = await findSpotDetail({
          id: p.id,
          slug: p.slug || (p.name ? p.name.toLowerCase().trim().replace(/\s+/g, '-') : null),
        });
        if (!spot) {
          resolvedItems.push({ query: p, error: 'Không tìm thấy điểm' });
          continue;
        }
        const ll = pickLngLat(spot);
        if (!ll) {
          resolvedItems.push({ query: p, id: spot.id, name: spot.name_vi, error: 'Điểm thiếu toạ độ' });
          continue;
        }
        coordinates.push(ll);
        resolvedItems.push({
          query: p,
          id: spot.id,
          slug: spot.slug,
          name: spot.name_vi,
          lng: ll[0],
          lat: ll[1],
        });
      }
    }

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return {
        error: 'Cần ít nhất 2 điểm hợp lệ (points hoặc coordinates)',
        resolved: resolvedItems.length ? resolvedItems : undefined,
      };
    }

    const distance = await MapMeasureService.measureDistance(coordinates, unit);
    const asRows = coordinates.map(([lng, lat]) => ({ lng, lat }));
    return {
      distance,
      coordinates,
      resolved: resolvedItems.length ? resolvedItems : undefined,
      map_hint: {
        coordinates,
        bounds: computeBounds(asRows),
        suggested_action: 'draw_route',
      },
    };
  },

  async search_nearby_services(args = {}) {
    const {
      service_type = 'hotel',
      near_spot,
      lat: rawLat,
      lng: rawLng,
      radius_km = 8,
      keyword,
      limit = 6,
    } = args;

    // Resolve tâm tìm kiếm: ưu tiên near_spot (tra DB lấy toạ độ thật), rồi tới lat/lng.
    let centerLat = Number.isFinite(Number(rawLat)) ? Number(rawLat) : null;
    let centerLng = Number.isFinite(Number(rawLng)) ? Number(rawLng) : null;
    let centerLabel = null;

    if ((centerLat == null || centerLng == null) && near_spot && (near_spot.id || near_spot.slug || near_spot.name)) {
      const spot = await findSpotDetail({
        id: near_spot.id,
        slug: near_spot.slug || (near_spot.name ? toSlugSearchText(near_spot.name) : null),
      });
      const ll = spot ? pickLngLat(spot) : null;
      if (ll) {
        centerLng = ll[0];
        centerLat = ll[1];
        centerLabel = firstValue(spot.name_vi, spot.name);
      }
    }

    // Lọc danh mục theo loại dịch vụ (khách sạn/nhà hàng nằm trong tourism_spots,
    // category con của "Cơ sở vật chất kỹ thuật" parent_id=3).
    const HOTEL_FILTERS = [
      `sc.name_vi ILIKE '%khách sạn%'`,
      `sc.name_vi ILIKE '%nghỉ dưỡng%'`,
      `sc.name_vi ILIKE '%lưu trú%'`,
      `sc.name_vi ILIKE '%resort%'`,
      `sc.name_vi ILIKE '%homestay%'`,
    ];
    const RESTAURANT_FILTERS = [
      `sc.name_vi ILIKE '%nhà hàng%'`,
      `sc.name_vi ILIKE '%quán ăn%'`,
      `sc.name_vi ILIKE '%ẩm thực%'`,
    ];
    const catFilters = service_type === 'restaurant'
      ? RESTAURANT_FILTERS
      : service_type === 'all'
        ? [...HOTEL_FILTERS, ...RESTAURANT_FILTERS]
        : HOTEL_FILTERS;

    const params = [];
    const conds = [`s.status = 'active'`, `(${catFilters.join(' OR ')})`];

    if (keyword) {
      params.push(`%${keyword}%`);
      conds.push(`(s.name_vi ILIKE $${params.length} OR s.address_vi ILIKE $${params.length})`);
    }

    let distanceSelect = '';
    let orderBy = 'ORDER BY s.is_featured DESC, s.rating_avg DESC NULLS LAST';

    if (centerLat != null && centerLng != null) {
      params.push(centerLng, centerLat);
      const lngIdx = params.length - 1;
      const latIdx = params.length;
      const distExpr = `ST_DistanceSphere(s.geom, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326))`;
      distanceSelect = `, ${distExpr} AS distance_m`;
      params.push(Math.max(0.1, Number(radius_km) || 8) * 1000);
      conds.push(`${distExpr} <= $${params.length}`);
      orderBy = 'ORDER BY distance_m ASC';
    }

    params.push(Math.min(20, Math.max(1, Number(limit) || 6)));
    const limitIdx = params.length;

    const sql = `
      SELECT s.id, s.slug, s.name_vi, s.name_en, sc.name_vi AS category_name,
             s.rating_avg, s.rating_count, s.ticket_price_adult,
             s.is_featured, s.has_vr_360, s.has_audio_guide,
             s.address_vi, s.phone, s.website,
             ST_Y(s.geom) AS lat, ST_X(s.geom) AS lng
             ${distanceSelect}
      FROM tourism_spots s
      JOIN spot_categories sc ON sc.id = s.category_id
      WHERE ${conds.join(' AND ')}
      ${orderBy}
      LIMIT $${limitIdx}`;

    const { rows } = await pool.query(sql, params);
    const items = rows.map(trimSpot);

    return {
      items,
      count: items.length,
      service_type,
      center: centerLat != null ? { lat: centerLat, lng: centerLng, label: centerLabel } : null,
      map_hint: {
        spot_ids: items.map(i => i.id),
        bounds: computeBounds(items),
        layers: [service_type === 'restaurant' ? 'restaurant' : 'hotel'],
        suggested_action: items.length > 1 ? 'fit_bounds' : items.length === 1 ? 'pan_and_popup' : null,
      },
    };
  },

  async get_statistics_summary(args) {
    const { province_code, from_date, to_date } = args || {};

    // Builder: ghép điều kiện theo cột date của từng bảng, đánh số $i tuần tự.
    const buildWhere = (dateCol) => {
      const conds = [];
      const params = [];
      if (province_code) {
        params.push(province_code);
        conds.push(`province_code = $${params.length}`);
      }
      if (from_date && dateCol) {
        params.push(from_date);
        conds.push(`${dateCol} >= $${params.length}`);
      }
      if (to_date && dateCol) {
        params.push(to_date);
        conds.push(`${dateCol} <= $${params.length}`);
      }
      return { suffix: conds.length ? `AND ${conds.join(' AND ')}` : '', params };
    };

    const spotsW = buildWhere('created_at');
    const bizW   = buildWhere('created_at');
    // festivals: nếu có from_date dùng nó làm mốc "upcoming", else CURRENT_DATE.
    const fesParams = [];
    const fesConds = [];
    if (province_code) { fesParams.push(province_code); fesConds.push(`province_code = $${fesParams.length}`); }
    if (to_date)       { fesParams.push(to_date);       fesConds.push(`start_date <= $${fesParams.length}`); }
    fesParams.push(from_date || null);
    const fesAnchorIdx = fesParams.length;

    const [spotsRes, businessesRes, festivalsRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS n FROM tourism_spots WHERE status='active' ${spotsW.suffix}`,
        spotsW.params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM businesses WHERE status='approved' ${bizW.suffix}`,
        bizW.params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM festivals
         WHERE end_date >= COALESCE($${fesAnchorIdx}::date, CURRENT_DATE)
         ${fesConds.length ? 'AND ' + fesConds.join(' AND ') : ''}`,
        fesParams
      ),
    ]);
    return {
      active_spots: spotsRes.rows[0].n,
      approved_businesses: businessesRes.rows[0].n,
      upcoming_festivals: festivalsRes.rows[0].n,
      province_code: province_code || null,
      period: { from_date: from_date || null, to_date: to_date || null },
    };
  },

  async navigate_map(args) {
    // Pure passthrough — frontend sẽ áp dụng action lên map.
    return { map_action: args };
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Filter tool definitions theo session_type (manager mới được gọi statistics). */
function getToolDefinitions(sessionType = 'tourist') {
  if (sessionType === 'manager') return TOOL_DEFINITIONS;
  return TOOL_DEFINITIONS.filter(t => t.function.name !== 'get_statistics_summary');
}

/**
 * Gọi tool và trả về { result, mapAction? }.
 * mapAction được set khi tool là navigate_map.
 */
/**
 * Trích xuất các item ĐỊA ĐIỂM (có toạ độ lat/lng) từ kết quả tool, chuẩn hoá
 * thành card mà FE Mapbox hiển thị + nút "Fly to". KHÔNG bao gồm category.
 *
 * Chỉ áp dụng cho các tool về địa điểm: search_spots, get_spot_detail,
 * search_festivals. Các tool không có toạ độ (news, vlog, culinary, ocop,
 * route, capacity) trả về [] → service không inject attach_items.
 */
/**
 * Cắt mô tả về tối đa N ký tự, bảo toàn ranh giới câu/từ.
 */
function truncateText(text, max = 280) {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastDot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  if (lastDot > max * 0.6) return cut.slice(0, lastDot + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

function extractAttachableItems(toolName, result) {
  if (!result || result.error) return [];

  // Tuyến/tour: gắn các điểm dừng (đã chuẩn hoá toạ độ) lên bản đồ.
  if (toolName === 'get_tour_detail') {
    const pts = Array.isArray(result.stop_points) ? result.stop_points : [];
    return pts
      .filter((p) => p && p.lat != null && p.lng != null)
      .map((p) => ({
        id: p.id,
        type: 'spot',
        name: p.name || '(không tên)',
        slug: p.slug || null,
        lat: Number(p.lat),
        lng: Number(p.lng),
        image_url: null,
        rating_avg: null,
        rating_count: null,
        is_featured: false,
      }));
  }

  const SPOT_TOOLS = new Set(['search_spots', 'get_spot_detail', 'get_random_spot', 'search_nearby_services']);
  const FESTIVAL_TOOLS = new Set(['search_festivals']);

  let type;
  if (SPOT_TOOLS.has(toolName)) type = 'spot';
  else if (FESTIVAL_TOOLS.has(toolName)) type = 'festival';
  else return [];

  // get_spot_detail / get_random_spot trả result.item (full info), search_* trả result.items (summary)
  const isDetail = toolName === 'get_spot_detail' || toolName === 'get_random_spot';
  const arr = Array.isArray(result.items)
    ? result.items
    : (result.item ? [result.item] : []);

  return arr
    .filter(it => it && it.lat != null && it.lng != null)
    .map(it => {
      const card = {
        id: it.id,
        type,
        name: it.name_vi || it.name_en || it.name || '(không tên)',
        slug: it.slug || null,
        lat: Number(it.lat),
        lng: Number(it.lng),
        image_url: it.cover_image_url || it.primary_image || null,
        rating_avg: it.rating_avg ?? null,
        rating_count: it.rating_count ?? null,
        is_featured: !!it.is_featured,
      };

      if (type === 'spot') {
        if (it.address_vi) card.address = it.address_vi;
        if (it.ticket_price_adult != null) card.ticket_price_adult = it.ticket_price_adult;
        if (it.has_vr_360) card.has_vr_360 = true;
        if (it.has_audio_guide) card.has_audio_guide = true;

        // Detail card: thêm thông tin đầy đủ cho FE render rich card
        if (isDetail) {
          if (it.description_vi) card.description = truncateText(it.description_vi, 400);
          if (it.opening_hours) card.opening_hours = it.opening_hours;
          if (it.ticket_price_child != null) card.ticket_price_child = it.ticket_price_child;
          if (it.phone) card.phone = it.phone;
          if (it.website) card.website = it.website;
        }
      } else if (type === 'festival') {
        if (it.start_date) card.start_date = it.start_date;
        if (it.end_date) card.end_date = it.end_date;
        if (it.location_name) card.location_name = it.location_name;
      }
      return card;
    });
}

async function callTool(name, args, ctx = {}) {
  const handler = HANDLERS[name];
  if (!handler) return { result: { error: `Unknown tool: ${name}` } };
  try {
    const result = await handler(args || {}, ctx);
    // navigate_map và get_tour_detail (draw_route) trả map_action trực tiếp.
    const mapAction = result?.map_action || null;
    const attachItems = extractAttachableItems(name, result);
    return { result, mapAction, attachItems };
  } catch (err) {
    return { result: { error: err.message || 'Tool execution failed' } };
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  getToolDefinitions,
  callTool,
  extractAttachableItems,
};
