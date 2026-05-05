/* eslint-disable no-console */
/**
 * Test đa dạng: ĐỊA ĐIỂM (spots) + TOUR (itinerary, route) + OCOP (sản phẩm).
 *
 * Mock toàn bộ services domain — DB chưa migrate.
 * Cần OPENAI_API_KEY trong .env.
 */

const Module = require('module');
const origRequire = Module.prototype.require;

// ─── Mock data ─────────────────────────────────────────────────────────────
const SPOTS_DB = [
  { id: 'spot-1', slug: 'trang-an', name_vi: 'Khu danh thắng Tràng An', name_en: 'Trang An Landscape',
    lat: 20.2547, lng: 105.911, address_vi: 'Hoa Lư, Ninh Bình',
    rating_avg: 4.8, rating_count: 1200, is_featured: true, has_vr_360: true, has_audio_guide: true,
    ticket_price_adult: 250000, ticket_price_child: 120000, primary_image: 'https://i/trang-an.jpg',
    description_vi: 'Quần thể danh thắng Tràng An là Di sản Văn hóa và Thiên nhiên Thế giới được UNESCO công nhận năm 2014, di sản hỗn hợp đầu tiên của Việt Nam. Nổi tiếng với hang động đá vôi, sông uốn lượn, cánh đồng lúa.',
    opening_hours: { mon: '07:00-17:00' }, phone: '0229 3 622 333', website: 'https://trangan.com.vn',
  },
  { id: 'spot-2', slug: 'tam-coc', name_vi: 'Tam Cốc - Bích Động', lat: 20.213, lng: 105.937,
    address_vi: 'Hoa Lư, Ninh Bình', rating_avg: 4.7, rating_count: 950, is_featured: true,
    ticket_price_adult: 195000, primary_image: 'https://i/tam-coc.jpg',
    description_vi: 'Tam Cốc - Bích Động được mệnh danh "vịnh Hạ Long trên cạn", nổi tiếng với 3 hang động xuyên qua núi đá vôi và những thuyền nan đưa du khách dọc sông Ngô Đồng.',
  },
  { id: 'spot-3', slug: 'bai-dinh', name_vi: 'Chùa Bái Đính', lat: 20.265, lng: 105.875,
    address_vi: 'Gia Sinh, Gia Viễn, Ninh Bình', rating_avg: 4.6, rating_count: 800,
    ticket_price_adult: 0, primary_image: 'https://i/bai-dinh.jpg',
    description_vi: 'Chùa Bái Đính là quần thể chùa lớn nhất Đông Nam Á, gồm chùa cổ và chùa mới với nhiều kỷ lục: tượng Phật bằng đồng dát vàng lớn nhất, hành lang La Hán dài nhất.',
  },
  { id: 'spot-4', slug: 'hoa-lu', name_vi: 'Cố đô Hoa Lư', lat: 20.281, lng: 105.898,
    address_vi: 'Trường Yên, Hoa Lư, Ninh Bình', rating_avg: 4.5, rating_count: 600,
    ticket_price_adult: 20000,
    description_vi: 'Cố đô Hoa Lư từng là kinh đô của 3 triều đại Đinh, Tiền Lê và đầu thời Lý (968-1010). Nay còn đền thờ vua Đinh, vua Lê.',
  },
];

const OCOP_DB = [
  { id: 'ocop-1', name_vi: 'Cơm cháy Ninh Bình', category: 'Thực phẩm', star_rating: 4,
    certified_at: '2023-05-15', business_id: 'biz-1', cover_image_url: 'https://i/com-chay.jpg' },
  { id: 'ocop-2', name_vi: 'Rượu Kim Sơn', category: 'Đồ uống', star_rating: 5,
    certified_at: '2022-11-20', business_id: 'biz-2', cover_image_url: 'https://i/ruou-kim-son.jpg' },
  { id: 'ocop-3', name_vi: 'Thêu ren Văn Lâm', category: 'Thủ công mỹ nghệ', star_rating: 4,
    certified_at: '2023-01-10', business_id: 'biz-3', cover_image_url: 'https://i/theu-ren.jpg' },
  { id: 'ocop-4', name_vi: 'Mắm tép Gia Viễn', category: 'Thực phẩm', star_rating: 3,
    certified_at: '2024-03-05', business_id: 'biz-4' },
  { id: 'ocop-5', name_vi: 'Trà sen Hồ Đồng Thái', category: 'Đồ uống', star_rating: 5,
    certified_at: '2023-08-12', business_id: 'biz-5', cover_image_url: 'https://i/tra-sen.jpg' },
];

const CULINARY_DB = [
  { id: 'cul-1', name_vi: 'Cơm cháy', category: 'Đặc sản', is_speciality: true, rating_avg: 4.7, cover_image_url: 'https://i/cc.jpg' },
  { id: 'cul-2', name_vi: 'Dê núi Trường Yên', category: 'Đặc sản', is_speciality: true, rating_avg: 4.8, cover_image_url: 'https://i/de.jpg' },
  { id: 'cul-3', name_vi: 'Miến lươn Ninh Bình', category: 'Đặc sản', is_speciality: true, rating_avg: 4.6 },
];

// ─── Service mocks ─────────────────────────────────────────────────────────
Module.prototype.require = function (id) {
  if (id === './spot.service' || id.endsWith('/spot.service')) {
    return {
      getAllSpots: async ({ search, limit = 8, is_featured } = {}) => {
        let rows = SPOTS_DB;
        if (search) {
          const kw = String(search).toLowerCase();
          rows = rows.filter(s => s.name_vi.toLowerCase().includes(kw) || s.slug.includes(kw));
        }
        if (is_featured) rows = rows.filter(s => s.is_featured);
        return { spots: rows.slice(0, limit) };
      },
      getNearbySpots: async (lat, lng, radius_km, limit = 5) => {
        // Trả tất cả spot, giả định trong radius
        return SPOTS_DB.slice(0, limit).map(s => ({ ...s, distance_m: Math.random() * radius_km * 1000 }));
      },
      getSpotById: async (id) => SPOTS_DB.find(s => s.id === id) || null,
      getSpotBySlug: async (slug) => SPOTS_DB.find(s => s.slug === slug) || null,
    };
  }

  if (id === './ocop.service' || id.endsWith('/ocop.service')) {
    return {
      getAll: async ({ search, category, star_rating, limit = 8 } = {}) => {
        let rows = OCOP_DB;
        if (search) rows = rows.filter(o => o.name_vi.toLowerCase().includes(String(search).toLowerCase()));
        if (category) rows = rows.filter(o => o.category === category);
        if (star_rating) rows = rows.filter(o => o.star_rating === Number(star_rating));
        return { items: rows.slice(0, limit) };
      },
    };
  }

  if (id === './culinary.service' || id.endsWith('/culinary.service')) {
    return {
      getAll: async ({ limit = 8 } = {}) => ({ items: CULINARY_DB.slice(0, limit) }),
    };
  }

  if (id === './festival.service' || id.endsWith('/festival.service')) {
    return {
      getAll: async () => ({ items: [
        { id: 'fes-1', name_vi: 'Lễ hội Hoa Lư', festival_type: 'truyền thống',
          start_date: '2026-04-10', end_date: '2026-04-12',
          lat: 20.281, lng: 105.898, location_name: 'Cố đô Hoa Lư', spot_id: 'spot-4',
          cover_image_url: 'https://i/le-hoi-hoa-lu.jpg' },
        { id: 'fes-2', name_vi: 'Lễ hội Tràng An', festival_type: 'tâm linh',
          start_date: '2026-03-18', end_date: '2026-03-20',
          lat: 20.2547, lng: 105.911, location_name: 'Khu danh thắng Tràng An', spot_id: 'spot-1' },
      ] }),
    };
  }

  if (id === './news.service' || id.endsWith('/news.service')) {
    return { getAll: async () => ({ items: [] }) };
  }
  if (id === './vlog.service' || id.endsWith('/vlog.service')) {
    return { getAll: async () => ({ items: [] }) };
  }

  if (id === './itinerary-ai.service' || id.endsWith('/itinerary-ai.service')) {
    return {
      generate: async ({ num_days, preferences = [], budget_vnd, start_location }, userId) => ({
        id: 'iti-' + Date.now(),
        title: `Lịch trình ${num_days} ngày khám phá Ninh Bình`,
        description: `Hành trình ${num_days} ngày từ ${start_location || 'Hà Nội'} với ngân sách ${budget_vnd ? Number(budget_vnd).toLocaleString() + 'đ' : 'linh hoạt'}.`,
        total_days: num_days,
        total_distance_km: 85 + num_days * 20,
        days: Array.from({ length: num_days }, (_, i) => ({
          day_number: i + 1,
          title: ['Tràng An & Hoa Lư', 'Tam Cốc & Bích Động', 'Bái Đính & về'][i] || `Ngày ${i + 1}`,
          stops: [{ name: 'Stop A' }, { name: 'Stop B' }, { name: 'Stop C' }],
        })),
      }),
    };
  }

  if (id === './map-measure.service' || id.endsWith('/map-measure.service')) {
    return {
      measureDistance: async (coords, unit) => {
        // Tính tổng khoảng cách Haversine giữa các điểm liên tiếp
        const R = 6371;
        let total = 0;
        for (let i = 1; i < coords.length; i++) {
          const [lng1, lat1] = coords[i - 1], [lng2, lat2] = coords[i];
          const dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        return { value: unit === 'm' ? Math.round(total * 1000) : Number(total.toFixed(2)), unit };
      },
    };
  }

  return origRequire.apply(this, arguments);
};

require('dotenv').config();
if (!process.env.OPENAI_API_KEY) { console.error('Cần OPENAI_API_KEY'); process.exit(1); }

const { pool } = require('./src/configs/database');
const ChatbotService = require('./src/services/chatbot.service');

const ANON = '11111111-1111-4111-8111-111111111111';
const FAKE_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// ─── Scenarios ─────────────────────────────────────────────────────────────
const SCENARIOS = [
  // ── ĐỊA ĐIỂM ──
  { group: 'ĐỊA ĐIỂM', label: '1. SPOT cụ thể',
    q: 'Tràng An có gì đặc biệt mà du khách nên biết?',
    expect: { tool: 'get_spot_detail', card: 'spot' } },

  { group: 'ĐỊA ĐIỂM', label: '2. SPOT khác (Bái Đính)',
    q: 'Cho tôi biết về chùa Bái Đính',
    expect: { tool: 'get_spot_detail', card: 'spot' } },

  { group: 'ĐỊA ĐIỂM', label: '3. DANH SÁCH featured',
    q: 'Top 3 điểm tham quan nổi bật nhất ở Ninh Bình là gì?',
    expect: { tool: 'search_spots', minCards: 2 } },

  { group: 'ĐỊA ĐIỂM', label: '4. NEARBY (geo)',
    q: 'Có điểm nào hay gần toạ độ 20.25, 105.91 trong vòng 10km không?',
    expect: { tool: 'search_spots', card: 'spot' } },

  // ── TOUR / ITINERARY ──
  { group: 'TOUR', label: '5. ITINERARY 3 ngày',
    q: 'Lên giúp tôi lịch trình 3 ngày 2 đêm khám phá Ninh Bình, ngân sách 5 triệu, xuất phát Hà Nội',
    actor: { userId: FAKE_USER_ID, anonymousId: ANON },
    expect: { tool: 'suggest_itinerary' } },

  { group: 'TOUR', label: '6. ROUTE giữa 2 điểm',
    q: 'Từ Tràng An (105.911, 20.2547) đến Tam Cốc (105.937, 20.213) bao xa?',
    expect: { tool: 'get_route_between' } },

  { group: 'TOUR', label: '7. TOUR 1 NGÀY (combo)',
    q: 'Tôi đi Ninh Bình 1 ngày, nên đi đâu và ăn gì?',
    expect: { atLeastOneTool: ['search_spots', 'search_culinary'] } },

  // ── OCOP ──
  { group: 'OCOP', label: '8. OCOP nổi bật',
    q: 'Sản phẩm OCOP nào nổi tiếng ở Ninh Bình?',
    expect: { tool: 'search_ocop_products' } },

  { group: 'OCOP', label: '9. OCOP 5 sao',
    q: 'Có sản phẩm OCOP 5 sao nào không?',
    expect: { tool: 'search_ocop_products' } },

  { group: 'OCOP', label: '10. QUÀ TẶNG (OCOP gợi ý)',
    q: 'Tôi muốn mua đặc sản về làm quà cho người thân, gợi ý vài món được không?',
    expect: { atLeastOneTool: ['search_ocop_products', 'search_culinary'] } },

  // ── MIXED / ADVANCED ──
  { group: 'MIXED', label: '11. SPOT + ẨM THỰC + OCOP',
    q: 'Đi Tam Cốc 1 ngày: nên đi đâu, ăn món gì, mua gì về?',
    expect: { atLeastOneTool: ['search_spots', 'search_culinary', 'search_ocop_products', 'get_spot_detail'] } },

  { group: 'MIXED', label: '12. LỄ HỘI tại spot',
    q: 'Sắp tới Tràng An có lễ hội gì không?',
    expect: { tool: 'search_festivals' } },
];

// ─── Run ───────────────────────────────────────────────────────────────────
(async () => {
  const sess = await ChatbotService.createSession(
    { anonymousId: ANON },
    { session_type: 'tourist', language: 'vi' }
  );

  const results = [];
  let pass = 0, fail = 0;
  let tot = { tokens: 0, in: 0, out: 0, time: 0, tools: 0 };

  let curGroup = null;
  for (const sc of SCENARIOS) {
    if (sc.group !== curGroup) {
      curGroup = sc.group;
      console.log('\n' + '═'.repeat(80));
      console.log(`  ${curGroup}`);
      console.log('═'.repeat(80));
    }

    console.log(`\n• ${sc.label}`);
    console.log(`  Q: "${sc.q}"`);

    const actor = sc.actor || { anonymousId: ANON };
    const t0 = Date.now();
    let r;
    try {
      r = await ChatbotService.sendMessage(sess.id, actor, sc.q);
    } catch (e) {
      console.log(`  ❌ ERROR: ${e.message}`);
      fail++;
      continue;
    }
    const dt = Date.now() - t0;
    const m = r.message;
    const toolNames = (m.tool_calls || []).map(tc => tc.name);
    const attach = r.map_actions?.find(a => a.action === 'attach_items');
    tot.in += m.token_usage?.prompt_tokens || 0;
    tot.out += m.token_usage?.completion_tokens || 0;
    tot.tokens += m.token_usage?.total_tokens || 0;
    tot.time += dt;
    tot.tools += toolNames.length;

    console.log(`  ⏱ ${dt}ms · 💰 ${m.token_usage?.total_tokens || 0} tokens · 🔧 [${toolNames.join(', ') || 'none'}]`);
    if (attach) console.log(`  🗺  ${attach.items.length} card(s): ${attach.items.map(i => `${i.name}[${i.type}]`).join(', ')}`);
    const text = (m.content || '').replace(/\n+/g, ' ');
    console.log(`  A: ${text.slice(0, 200)}${text.length > 200 ? '…' : ''}`);

    // Assertions
    let ok = true;
    if (sc.expect.tool) {
      if (!toolNames.includes(sc.expect.tool)) {
        console.log(`  ✗ thiếu tool ${sc.expect.tool}`); ok = false;
      } else console.log(`  ✓ gọi ${sc.expect.tool}`);
    }
    if (sc.expect.atLeastOneTool) {
      if (!sc.expect.atLeastOneTool.some(t => toolNames.includes(t))) {
        console.log(`  ✗ không có tool nào trong [${sc.expect.atLeastOneTool.join(',')}]`); ok = false;
      } else console.log(`  ✓ gọi ít nhất 1 trong [${sc.expect.atLeastOneTool.join(',')}]`);
    }
    if (sc.expect.card) {
      if (!attach || !attach.items.some(i => i.type === sc.expect.card)) {
        console.log(`  ✗ thiếu card type=${sc.expect.card}`); ok = false;
      } else console.log(`  ✓ có card type=${sc.expect.card}`);
    }
    if (sc.expect.minCards != null) {
      if (!attach || attach.items.length < sc.expect.minCards) {
        console.log(`  ✗ ít hơn ${sc.expect.minCards} cards (got ${attach?.items?.length || 0})`); ok = false;
      } else console.log(`  ✓ có ≥ ${sc.expect.minCards} cards`);
    }
    ok ? pass++ : fail++;
    results.push({ ...sc, dt, tokens: m.token_usage?.total_tokens || 0, toolNames, cardCount: attach?.items?.length || 0, ok });
  }

  console.log('\n' + '═'.repeat(80));
  console.log('  TỔNG KẾT');
  console.log('═'.repeat(80));
  console.log(`  Scenarios:    ${pass}/${SCENARIOS.length} pass`);
  console.log(`  Tổng tokens:  ${tot.tokens.toLocaleString()} (in=${tot.in.toLocaleString()}, out=${tot.out.toLocaleString()})`);
  console.log(`  Wall time:    ${(tot.time / 1000).toFixed(1)}s · avg ${(tot.time / SCENARIOS.length / 1000).toFixed(1)}s/câu`);
  console.log(`  Tool calls:   ${tot.tools} (avg ${(tot.tools / SCENARIOS.length).toFixed(1)}/câu)`);
  console.log(`  Cost:         ~$${((tot.in * 0.15 + tot.out * 0.6) / 1e6).toFixed(4)}`);

  // Per-group breakdown
  console.log('\n  Theo nhóm:');
  for (const g of ['ĐỊA ĐIỂM', 'TOUR', 'OCOP', 'MIXED']) {
    const gr = results.filter(r => r.group === g);
    const okCnt = gr.filter(r => r.ok).length;
    const avgTok = Math.round(gr.reduce((s, r) => s + r.tokens, 0) / gr.length);
    const avgT = Math.round(gr.reduce((s, r) => s + r.dt, 0) / gr.length);
    console.log(`    ${g.padEnd(10)} ${okCnt}/${gr.length} pass · ${avgTok} tok/câu · ${avgT}ms/câu`);
  }

  await pool.query('DELETE FROM ai_chat_sessions WHERE id = $1', [sess.id]);
  await pool.end();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
