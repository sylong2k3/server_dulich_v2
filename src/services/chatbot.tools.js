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
const MapMeasureService = require('./map-measure.service');

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
  const [lng, lat] = pickLngLat(s) || [null, null];
  return {
    id: s.id,
    slug: s.slug,
    name_vi: s.name_vi,
    name_en: s.name_en,
    category: s.category_name || s.category || null,
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

// ─── Tool definitions (gửi cho OpenAI) ────────────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_spots',
      description: 'Tìm điểm du lịch ở Ninh Bình theo từ khoá, danh mục, hoặc gần một vị trí. Sau khi gọi tool này nên gọi navigate_map(fit_bounds) với map_hint.bounds để hiển thị tất cả lên bản đồ.',
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
      name: 'suggest_itinerary',
      description: 'Sinh lịch trình du lịch nhiều ngày bằng AI. CHỈ GỌI khi user muốn lịch trình cụ thể (1-14 ngày).',
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
      description: 'Tính khoảng cách đường thẳng giữa các điểm theo thứ tự. Dùng để vẽ route trên bản đồ. Coordinates dạng [[lng,lat],...].',
      parameters: {
        type: 'object',
        required: ['coordinates'],
        properties: {
          coordinates: {
            type: 'array',
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
      description: 'Điều khiển bản đồ ở UI client. LUÔN gọi sau search_* để hiển thị kết quả trực quan. Nhiều điểm → fit_bounds; 1 điểm → pan + show_popup.',
      parameters: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['pan', 'zoom', 'highlight', 'add_marker', 'fit_bounds', 'draw_route', 'clear_markers', 'show_popup', 'filter_layer'],
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
        rows = rows.filter(s =>
          (s.name_vi || '').toLowerCase().includes(kw) ||
          (s.name_en || '').toLowerCase().includes(kw)
        );
      }
    } else {
      const { spots } = await SpotService.getAllSpots({
        page: 1,
        limit,
        search: keyword,
        category_ids: category_id,
        province_code,
        rating_min,
        is_featured,
        sortBy: rating_min ? 'rating_avg' : 'created_at',
        sortOrder: 'DESC',
      });
      rows = spots;
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
    const spot = id
      ? await SpotService.getSpotById(id)
      : await SpotService.getSpotBySlug(slug);
    const trimmed = trimSpot(spot);
    return {
      item: {
        ...trimmed,
        description_vi: spot.description_vi,
        address_vi: spot.address_vi,
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
              CASE WHEN s.max_capacity > 0 AND c.visitor_count >= s.max_capacity
                   THEN true ELSE false END AS is_overloaded
       FROM tourism_spots s
       LEFT JOIN LATERAL (
         SELECT visitor_count, capacity_pct, status, recorded_at
         FROM capacity_logs WHERE spot_id = s.id
         ORDER BY recorded_at DESC LIMIT 1
       ) c ON true
       WHERE s.id = $1`,
      [spot_id]
    );
    return rows[0] || { error: 'Không tìm thấy điểm du lịch' };
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
    if (!userId) {
      return { error: 'Tính năng tạo lịch trình yêu cầu đăng nhập.' };
    }
    const itinerary = await ItineraryAiService.generate(
      { num_days, preferences, budget_vnd, start_location, language: 'vi' },
      userId
    );
    return {
      item: {
        id: itinerary.id, title: itinerary.title, description: itinerary.description,
        total_days: itinerary.total_days, total_distance_km: itinerary.total_distance_km,
        days: (itinerary.days || []).map(d => ({
          day_number: d.day_number, title: d.title,
          stops_count: Array.isArray(d.stops) ? d.stops.length : undefined,
        })),
      },
    };
  },

  async get_route_between(args) {
    const { coordinates, unit = 'km' } = args;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return { error: 'Cần ít nhất 2 toạ độ' };
    }
    const distance = await MapMeasureService.measureDistance(coordinates, unit);
    const asRows = coordinates.map(([lng, lat]) => ({ lng, lat }));
    return {
      distance,
      coordinates,
      map_hint: {
        coordinates,
        bounds: computeBounds(asRows),
        suggested_action: 'draw_route',
      },
    };
  },

  async get_statistics_summary(args) {
    const { province_code } = args || {};
    const params = province_code ? [province_code] : [];
    const where = province_code ? 'AND province_code = $1' : '';
    const [spotsRes, businessesRes, festivalsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM tourism_spots WHERE status='active' ${where}`, params),
      pool.query(`SELECT COUNT(*)::int AS n FROM businesses WHERE status='approved' ${where}`, params),
      pool.query(`SELECT COUNT(*)::int AS n FROM festivals WHERE end_date >= CURRENT_DATE ${province_code ? 'AND province_code = $1' : ''}`, params),
    ]);
    return {
      active_spots: spotsRes.rows[0].n,
      approved_businesses: businessesRes.rows[0].n,
      upcoming_festivals: festivalsRes.rows[0].n,
      province_code: province_code || null,
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
async function callTool(name, args, ctx = {}) {
  const handler = HANDLERS[name];
  if (!handler) return { result: { error: `Unknown tool: ${name}` } };
  try {
    const result = await handler(args || {}, ctx);
    const mapAction = name === 'navigate_map' && result?.map_action ? result.map_action : null;
    return { result, mapAction };
  } catch (err) {
    return { result: { error: err.message || 'Tool execution failed' } };
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  getToolDefinitions,
  callTool,
};
