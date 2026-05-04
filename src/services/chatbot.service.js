const ChatbotRepository = require('../models/repositories/chatbot.repository');
const { pool } = require('../configs/database');
const { getOpenAIClient } = require('../configs/openai');
const { Api404Error, Api403Error } = require('../core/error.response');

// ─── Function definitions for OpenAI function calling ────────────────────────

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_spots',
      description: 'Tìm kiếm điểm du lịch gần vị trí hoặc theo từ khóa',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Từ khóa tìm kiếm tên điểm du lịch' },
          lat: { type: 'number', description: 'Vĩ độ vị trí người dùng' },
          lng: { type: 'number', description: 'Kinh độ vị trí người dùng' },
          radius_km: { type: 'number', description: 'Bán kính tìm kiếm (km)', default: 10 },
          limit: { type: 'integer', default: 5 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spot_capacity',
      description: 'Kiểm tra sức chứa hiện tại và cảnh báo quá tải của điểm du lịch',
      parameters: {
        type: 'object',
        required: ['spot_id'],
        properties: {
          spot_id: { type: 'string', description: 'UUID của điểm du lịch' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_statistics_summary',
      description: 'Lấy thống kê tổng hợp: số khách, điểm du lịch hoạt động, doanh nghiệp mới',
      parameters: {
        type: 'object',
        properties: {
          from_date: { type: 'string', description: 'Ngày bắt đầu (YYYY-MM-DD)' },
          to_date: { type: 'string', description: 'Ngày kết thúc (YYYY-MM-DD)' },
          province_code: { type: 'integer', description: 'ID tỉnh thành (tùy chọn)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_map',
      description: 'Điều khiển bản đồ: pan đến vị trí, highlight marker, thêm marker',
      parameters: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', enum: ['pan', 'highlight', 'add_marker', 'zoom'] },
          lat: { type: 'number' },
          lng: { type: 'number' },
          zoom: { type: 'integer' },
          spot_ids: { type: 'array', items: { type: 'string' }, description: 'IDs điểm du lịch cần highlight' },
          label: { type: 'string' },
        },
      },
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

async function callTool(name, args) {
  switch (name) {
    case 'search_spots': {
      const { keyword, lat, lng, radius_km = 10, limit = 5 } = args;
      let query = `SELECT ts.id, ts.name_vi, ts.name_en, sc.name_vi AS spot_type,
                          ST_X(geom) AS lng, ST_Y(geom) AS lat,
                          ts.description_vi, (ts.status = 'active') AS is_active
                   FROM tourism_spots ts
                   LEFT JOIN spot_categories sc ON sc.id = ts.category_id
                   WHERE ts.status = 'active'`;
      const params = [];
      let idx = 1;

      if (keyword) {
        query += ` AND (ts.name_vi ILIKE $${idx} OR ts.name_en ILIKE $${idx})`;
        params.push(`%${keyword}%`);
        idx++;
      }
      if (lat != null && lng != null) {
        query += ` AND ST_DWithin(ts.geom::geography, ST_SetSRID(ST_MakePoint($${idx}, $${idx + 1}), 4326)::geography, $${idx + 2})`;
        params.push(lng, lat, radius_km * 1000);
        idx += 3;
      }
      query += ` LIMIT $${idx}`;
      params.push(limit);

      const { rows } = await pool.query(query, params);
      return rows;
    }

    case 'get_spot_capacity': {
      const { spot_id } = args;
      const { rows } = await pool.query(
        `SELECT s.id, s.name_vi, s.max_capacity,
                c.visitor_count AS current_occupancy,
                c.capacity_pct AS occupancy_pct,
                c.status AS capacity_status,
                c.recorded_at,
                CASE WHEN s.max_capacity > 0 AND c.visitor_count >= s.max_capacity
                     THEN true ELSE false END AS is_overloaded
         FROM tourism_spots s
         LEFT JOIN LATERAL (
           SELECT visitor_count, capacity_pct, status, recorded_at
           FROM capacity_logs
           WHERE spot_id = s.id
           ORDER BY recorded_at DESC LIMIT 1
         ) c ON true
         WHERE s.id = $1`,
        [spot_id]
      );
      return rows[0] || { error: 'Không tìm thấy điểm du lịch' };
    }

    case 'get_statistics_summary': {
      const { from_date, to_date, province_code } = args;
      const conditions = [];
      const params = [];
      let idx = 1;

      if (province_code) {
        conditions.push(`province_code = $${idx++}`);
        params.push(province_code);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const [spotsRes, businessesRes] = await Promise.all([
        pool.query(`SELECT COUNT(*) AS active_spots FROM tourism_spots WHERE status = 'active' ${province_code ? 'AND province_code = $1' : ''}`, province_code ? [province_code] : []),
        pool.query(`SELECT COUNT(*) AS new_businesses FROM businesses WHERE status = 'approved' ${province_code ? 'AND province_code = $1' : ''}`, province_code ? [province_code] : []),
      ]);

      return {
        active_spots: parseInt(spotsRes.rows[0].active_spots),
        new_businesses: parseInt(businessesRes.rows[0].new_businesses),
        period: { from_date, to_date },
      };
    }

    case 'navigate_map': {
      // Return as map action — no DB call needed
      return { map_action: args };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ChatbotService {
  static async createSession(userId, { session_type = 'tourist', language = 'vi' } = {}) {
    return ChatbotRepository.createSession({ user_id: userId, session_type, language });
  }

  static async getUserSessions(userId, query) {
    const { page = 1, limit = 20 } = query;
    const { rows, total } = await ChatbotRepository.getUserSessions(userId, { page, limit });
    return {
      items: rows,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getMessages(sessionId, userId, query) {
    const session = await ChatbotRepository.findSession(sessionId);
    if (!session) throw new Api404Error('Không tìm thấy phiên chat');
    if (session.user_id && session.user_id !== userId) throw new Api403Error('Không có quyền truy cập phiên chat này');

    const { page = 1, limit = 50 } = query;
    const { rows, total } = await ChatbotRepository.getMessages(sessionId, { page, limit });
    return {
      session,
      items: rows,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async sendMessage(sessionId, userId, userMessage) {
    const session = await ChatbotRepository.findSession(sessionId);
    if (!session) throw new Api404Error('Không tìm thấy phiên chat');
    if (session.user_id && session.user_id !== userId) throw new Api403Error('Không có quyền truy cập phiên chat này');

    // Save user message
    await ChatbotRepository.saveMessage({ session_id: sessionId, role: 'user', content: userMessage });

    // Get recent history (last 10 messages)
    const { rows: history } = await ChatbotRepository.getMessages(sessionId, { page: 1, limit: 10 });
    const messages = history.map(m => ({ role: m.role, content: m.content }));

    const systemPrompt = session.session_type === 'manager'
      ? 'Bạn là trợ lý AI phân tích thống kê du lịch Ninh Bình. Hỗ trợ nhà quản lý phân tích xu hướng, cảnh báo quá tải, và báo cáo tình hình khu bảo tồn. Trả lời bằng tiếng Việt.'
      : 'Bạn là trợ lý AI hỗ trợ khách du lịch tìm kiếm thông tin về Ninh Bình: điểm tham quan, ẩm thực, lễ hội, dịch vụ. Có thể điều khiển bản đồ để highlight điểm tham quan. Trả lời bằng tiếng Việt.';

    let openaiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    try {
      const client = getOpenAIClient();
      let response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        tools: TOOLS,
        tool_choice: 'auto',
        max_tokens: 1000,
      });

      let assistantMessage = response.choices[0].message;
      const mapActions = [];
      let tokenUsage = response.usage;

      // Handle function calling loop
      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        openaiMessages.push(assistantMessage);

        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (tc) => {
            const args = JSON.parse(tc.function.arguments);
            const result = await callTool(tc.function.name, args);

            if (tc.function.name === 'navigate_map' && result.map_action) {
              mapActions.push(result.map_action);
            }

            return {
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            };
          })
        );

        openaiMessages.push(...toolResults);

        response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          tools: TOOLS,
          tool_choice: 'auto',
          max_tokens: 1000,
        });

        assistantMessage = response.choices[0].message;
        if (response.usage) {
          tokenUsage = {
            prompt_tokens: (tokenUsage?.prompt_tokens || 0) + response.usage.prompt_tokens,
            completion_tokens: (tokenUsage?.completion_tokens || 0) + response.usage.completion_tokens,
            total_tokens: (tokenUsage?.total_tokens || 0) + response.usage.total_tokens,
          };
        }
      }

      const content = assistantMessage.content || '';
      const saved = await ChatbotRepository.saveMessage({
        session_id: sessionId,
        role: 'assistant',
        content,
        map_actions: mapActions.length ? mapActions : null,
        token_usage: tokenUsage,
      });

      return { message: saved, map_actions: mapActions };
    } catch (err) {
      // Graceful degradation if OpenAI is unavailable
      if (err.message && err.message.includes('OPENAI_API_KEY')) {
        const fallback = 'Tính năng chatbot AI chưa được cấu hình. Vui lòng liên hệ quản trị viên để kích hoạt OPENAI_API_KEY.';
        const saved = await ChatbotRepository.saveMessage({
          session_id: sessionId,
          role: 'assistant',
          content: fallback,
        });
        return { message: saved, map_actions: [] };
      }
      throw err;
    }
  }

  static async deleteSession(sessionId, userId) {
    const session = await ChatbotRepository.findSession(sessionId);
    if (!session) throw new Api404Error('Không tìm thấy phiên chat');
    if (session.user_id && session.user_id !== userId) throw new Api403Error('Không có quyền xóa phiên chat này');
    await ChatbotRepository.deleteSession(sessionId);
  }
}

module.exports = ChatbotService;
