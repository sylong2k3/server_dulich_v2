const ChatbotRepository = require('../models/repositories/chatbot.repository');
const { getOpenAIClient, MissingOpenAIKeyError } = require('../configs/openai');
const { getToolDefinitions, callTool } = require('./chatbot.tools');
const { Api404Error, Api403Error, Api400Error } = require('../core/error.response');

const HISTORY_LIMIT = 10;
const MAX_TOOL_ITERATIONS = 6;
const OPENAI_MODEL = process.env.OPENAI_CHATBOT_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPTS = {
  manager: [
    'Bạn là trợ lý phân tích thống kê du lịch Ninh Bình cho nhà quản lý.',
    'Gọi tool để lấy số liệu thật trước khi nhận định. Trả lời tiếng Việt, có cấu trúc:',
    '**Tóm tắt** (1 câu) → **Số liệu** (bullet) → **Nhận định** (1-2 câu) → **Đề xuất** (bullet).',
    'Nếu tool fail: nói rõ "không lấy được số liệu", không bịa số.',
  ].join(' '),

  tourist: [
    'Bạn là hướng dẫn viên du lịch ảo Ninh Bình — am hiểu, súc tích, tiếng Việt.',
    '',
    'TOOL — chỉ gọi khi CẦN data thật:',
    '• 1 ĐIỂM cụ thể có tên ("Tràng An", "Bái Đính"): gọi get_spot_detail(slug) trước; nếu fail thì search_spots(keyword) lấy id rồi get_spot_detail(id).',
    '• DANH SÁCH/GẦN ĐÂY ("top điểm", "gần Hoa Lư"): search_spots.',
    '• LỄ HỘI → search_festivals. MÓN ĂN → search_culinary. SẢN PHẨM OCOP → search_ocop_products. TIN TỨC → search_news. LỊCH TRÌNH → suggest_itinerary. KHOẢNG CÁCH → get_route_between.',
    '• KHÔNG gọi navigate_map sau search_spots/get_spot_detail/search_festivals — UI tự render thẻ "Bay tới". Chỉ gọi navigate_map khi user yêu cầu thao tác bản đồ rõ ràng (vd "zoom vào toạ độ X,Y").',
    '• KHÔNG gọi tool cho chào hỏi, cảm ơn, câu hỏi kiến thức chung — trả lời trực tiếp.',
    '',
    'TRẢ LỜI:',
    '• Chitchat/lời chào: 1-2 câu thân thiện.',
    '• Sau get_spot_detail: 2-4 đoạn về lịch sử + trải nghiệm + mẹo, dùng **đậm** cho điểm nhấn. Bỏ qua các đoạn không có thông tin.',
    '• Sau search_spots (danh sách): giới thiệu mỗi điểm 1-2 câu, không bullet metadata.',
    '• KHÔNG lặp lại địa chỉ chi tiết, giá vé, giờ mở, số điện thoại, website, toạ độ — UI đã có card riêng. Chỉ nói thoáng kiểu "mở cửa cả ngày", "giá vé phải chăng".',
    '• Nếu tool fail/empty: dùng kiến thức của bạn, không xin lỗi quá nhiều.',
    '• Kết thúc 1 câu mời click "Bay tới" CHỈ KHI có dữ liệu địa điểm.',
  ].join('\n'),
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Kiểm tra quyền truy cập session.
 * - Session có user_id → chỉ chủ sở hữu mới được vào.
 * - Session anonymous (user_id null) → so khớp anon_id lưu trong context với
 *   header x-anonymous-id mà controller truyền vào.
 *
 * Trả về session (đã bao gồm context parsed); throw 403/404 nếu fail.
 */
function assertSessionAccess(session, { userId, anonymousId }) {
  if (!session) throw new Api404Error('Không tìm thấy phiên chat');

  if (session.user_id) {
    if (!userId || session.user_id !== userId) {
      throw new Api403Error('Không có quyền truy cập phiên chat này');
    }
    return session;
  }

  // Anonymous session
  const ctx = session.context || {};
  const expectedAnon = ctx.anon_id || null;
  if (expectedAnon && expectedAnon !== anonymousId) {
    throw new Api403Error('Không có quyền truy cập phiên chat này');
  }
  // Backward-compat: session cũ (chưa có anon_id) — cho phép truy cập, nhưng nếu
  // client cung cấp anon_id thì lưu lại để khoá lần sau.
  return session;
}

// ─── OpenAI conversation loop ────────────────────────────────────────────────

/**
 * Gọi OpenAI với function-calling, lặp tối đa MAX_TOOL_ITERATIONS lần.
 * Trả về { content, mapActions, tokenUsage, toolCallTrace }.
 */
async function runChatCompletion({ openaiMessages, tools, ctx }) {
  const client = getOpenAIClient();
  const mapActions = [];
  const toolCallTrace = [];
  // Dedupe các địa điểm được trả về từ nhiều tool call (Map giữ entry cuối — fields đầy đủ nhất)
  const attachedById = new Map();
  let tokenUsage = null;

  let response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: openaiMessages,
    tools,
    tool_choice: tools.length ? 'auto' : 'none',
    max_tokens: 1000,
  });
  tokenUsage = mergeUsage(tokenUsage, response.usage);

  let assistantMessage = pickAssistant(response);

  const finalize = (content) => {
    if (attachedById.size > 0) {
      mapActions.push({
        action: 'attach_items',
        items: Array.from(attachedById.values()),
      });
    }
    return { content, mapActions, tokenUsage, toolCallTrace };
  };

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return finalize(assistantMessage.content || '');
    }

    openaiMessages.push(assistantMessage);

    const toolResults = await Promise.all(
      assistantMessage.tool_calls.map(async (tc) => {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); }
        catch { args = {}; }

        const { result, mapAction, attachItems } = await callTool(tc.function.name, args, ctx);
        if (mapAction) mapActions.push(mapAction);
        if (Array.isArray(attachItems)) {
          for (const it of attachItems) {
            if (it && it.id) attachedById.set(it.id, it);
          }
        }

        toolCallTrace.push({
          name: tc.function.name,
          args,
          ok: !result?.error,
        });

        return {
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result ?? {}),
        };
      })
    );
    openaiMessages.push(...toolResults);

    response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: openaiMessages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1000,
    });
    tokenUsage = mergeUsage(tokenUsage, response.usage);
    assistantMessage = pickAssistant(response);
  }

  // Hết iteration mà model vẫn đòi gọi tool — ép kết thúc, trả nội dung hiện có.
  return finalize(
    assistantMessage.content ||
      'Tôi đã thử nhiều bước nhưng chưa hoàn tất truy vấn. Vui lòng thử lại hoặc thu hẹp câu hỏi.'
  );
}

function pickAssistant(response) {
  const msg = response?.choices?.[0]?.message;
  if (!msg) {
    return { role: 'assistant', content: 'Không nhận được phản hồi từ mô hình AI.' };
  }
  return msg;
}

function mergeUsage(prev, next) {
  if (!next) return prev;
  if (!prev) return { ...next };
  return {
    prompt_tokens: (prev.prompt_tokens || 0) + (next.prompt_tokens || 0),
    completion_tokens: (prev.completion_tokens || 0) + (next.completion_tokens || 0),
    total_tokens: (prev.total_tokens || 0) + (next.total_tokens || 0),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ChatbotService {
  static async createSession({ userId, anonymousId }, { session_type = 'tourist', language = 'vi' } = {}) {
    if (!userId && !anonymousId) {
      throw new Api400Error(
        'Phiên ẩn danh cần header "x-anonymous-id" (UUID v4). Hãy đăng nhập hoặc tạo client id.'
      );
    }
    const context = userId ? null : { anon_id: anonymousId };
    return ChatbotRepository.createSession({
      user_id: userId || null,
      session_type,
      language,
      context,
    });
  }

  static async getUserSessions(userId, query) {
    const { page = 1, limit = 20 } = query;
    const { rows, total } = await ChatbotRepository.getUserSessions(userId, { page, limit });
    return {
      items: rows,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getMessages(sessionId, actor, query) {
    const session = await ChatbotRepository.findSession(sessionId);
    assertSessionAccess(session, actor);

    const { page = 1, limit = 50 } = query;
    const { rows, total } = await ChatbotRepository.getMessages(sessionId, { page, limit });
    return {
      session,
      items: rows,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async sendMessage(sessionId, actor, userMessage) {
    const session = await ChatbotRepository.findSession(sessionId);
    assertSessionAccess(session, actor);

    const startedAt = Date.now();

    // Lưu tin nhắn user trước
    await ChatbotRepository.saveMessage({
      session_id: sessionId,
      role: 'user',
      content: userMessage,
    });

    // Lấy N tin nhắn GẦN NHẤT (bao gồm tin vừa lưu) làm context
    const history = await ChatbotRepository.getRecentMessages(sessionId, HISTORY_LIMIT);
    const messages = history.map((m) => ({ role: m.role, content: m.content }));

    const systemPrompt = SYSTEM_PROMPTS[session.session_type] || SYSTEM_PROMPTS.tourist;
    const tools = getToolDefinitions(session.session_type);
    const openaiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    try {
      const { content, mapActions, tokenUsage, toolCallTrace } = await runChatCompletion({
        openaiMessages,
        tools,
        ctx: { userId: actor.userId || null, sessionType: session.session_type },
      });

      const saved = await ChatbotRepository.saveMessage({
        session_id: sessionId,
        role: 'assistant',
        content,
        map_actions: mapActions.length ? mapActions : null,
        token_usage: tokenUsage,
        tool_calls: toolCallTrace.length ? toolCallTrace : null,
        latency_ms: Date.now() - startedAt,
      });

      return { message: saved, map_actions: mapActions };
    } catch (err) {
      // Lỗi cấu hình API key → fallback friendly message
      if (err instanceof MissingOpenAIKeyError) {
        const saved = await ChatbotRepository.saveMessage({
          session_id: sessionId,
          role: 'assistant',
          content:
            'Tính năng chatbot AI chưa được cấu hình. Vui lòng liên hệ quản trị viên để kích hoạt OPENAI_API_KEY.',
          latency_ms: Date.now() - startedAt,
        });
        return { message: saved, map_actions: [] };
      }

      // Các lỗi runtime khác (network, rate limit, model error…) — vẫn lưu lại
      // 1 tin nhắn assistant để UI không bị "mồ côi" tin nhắn user.
      const errMsg =
        'Xin lỗi, có lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau ít phút.';
      try {
        await ChatbotRepository.saveMessage({
          session_id: sessionId,
          role: 'assistant',
          content: errMsg,
          latency_ms: Date.now() - startedAt,
        });
      } catch (_) { /* swallow secondary write error */ }
      throw err;
    }
  }

  static async deleteSession(sessionId, actor) {
    const session = await ChatbotRepository.findSession(sessionId);
    assertSessionAccess(session, actor);
    await ChatbotRepository.deleteSession(sessionId);
  }
}

module.exports = ChatbotService;
