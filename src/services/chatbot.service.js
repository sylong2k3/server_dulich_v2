const ChatbotRepository = require('../models/repositories/chatbot.repository');
const UserRepository = require('../models/repositories/user.repository');
const { getOpenAIClient, MissingOpenAIKeyError } = require('../configs/openai');
const { getToolDefinitions, callTool } = require('./chatbot.tools');
const { Api404Error, Api403Error, Api400Error } = require('../core/error.response');
const TaskQueue = require('../utils/task-queue');

const HISTORY_LIMIT = 10;
const MAX_TOOL_ITERATIONS = 6;
const OPENAI_MODEL = process.env.OPENAI_CHATBOT_MODEL || 'gpt-4o-mini';
const ANONYMOUS_MESSAGE_LIMIT = Number(process.env.CHATBOT_ANONYMOUS_LIMIT) || 10;

const CONCURRENCY_LIMIT = Number(process.env.CHATBOT_CONCURRENCY_LIMIT) || 3;
const QUEUE_TIMEOUT = Number(process.env.CHATBOT_QUEUE_TIMEOUT_MS) || 20000;
const chatbotQueue = new TaskQueue(CONCURRENCY_LIMIT, QUEUE_TIMEOUT);
const DEFAULT_FLY_TO_ZOOM = 15;
const DEFAULT_MAP_PADDING = 80;
const NDVI_LSTM_REGION_IMAGES = [
  { label: 'Cúc Phương', url: '/uploads/images/cucphuong.jfif', keywords: ['cuc phuong', 'cucphuong'] },
  { label: 'Hoa Lư', url: '/uploads/images/hoalu.jfif', keywords: ['hoa lu', 'hoalu'] },
  { label: 'Xuân Thủy', url: '/uploads/images/xuanthuy.jfif', keywords: ['xuan thuy', 'xuanthuy'] },
];

const SYSTEM_PROMPTS = {
  manager: [
    'Bạn là trợ lý phân tích thống kê du lịch Ninh Bình cho nhà quản lý.',
    'Gọi tool để lấy số liệu thật trước khi nhận định. Trả lời tiếng Việt, có cấu trúc:',
    '**Tóm tắt** (1 câu) → **Số liệu** (bullet) → **Nhận định** (1-2 câu) → **Đề xuất** (bullet).',
    'Nếu tool fail hoặc trả empty: nói rõ "chưa có số liệu trong hệ thống", KHÔNG bịa số, KHÔNG suy đoán giá trị cụ thể.',
  ].join(' '),

  tourist: [
    'Bạn là hướng dẫn viên du lịch ảo Ninh Bình — am hiểu, súc tích.',
    '',
    'TOOL — chỉ gọi khi CẦN data thật:',
    '• 1 ĐIỂM cụ thể có tên ("Tràng An", "Bái Đính"): gọi get_spot_detail(slug) trước; nếu fail thì search_spots(keyword) lấy id rồi get_spot_detail(id).',
    '• NGẪU NHIÊN ("gợi ý ngẫu nhiên", "bất kỳ", "tuỳ bạn", "random", "không biết đi đâu"): gọi get_random_spot, KHÔNG dùng search_spots với keyword "ngẫu nhiên".',
    '• DANH SÁCH/GẦN ĐÂY ("top điểm", "gần Hoa Lư"): search_spots. Khi user nói "nổi bật/đẹp nhất/top": truyền is_featured=true hoặc rating_min=4.',
    '• LỄ HỘI → search_festivals. MÓN ĂN → search_culinary. SẢN PHẨM OCOP → search_ocop_products. TIN TỨC → search_news. LỊCH TRÌNH → suggest_itinerary.',
    '• KHOẢNG CÁCH giữa các điểm có tên (vd "Tràng An đến Bái Đính"): get_route_between với points=[{slug|name}], KHÔNG tự đoán toạ độ.',
    '• Server tự đính kèm map_actions để UI điều hướng bản đồ khi tool trả về toạ độ. Không nhắc, không mời, không hướng dẫn người dùng bấm nút hoặc thao tác bản đồ trong nội dung trả lời. Chỉ gọi navigate_map khi user yêu cầu rõ ràng (vd "zoom vào toạ độ X,Y").',
    '• KHÔNG gọi tool cho chào hỏi, cảm ơn, câu hỏi kiến thức chung — trả lời trực tiếp.',
    '',
    'TRẢ LỜI:',
    '• Trả lời theo NGÔN NGỮ user dùng trong tin nhắn (Việt ↔ Anh). Không tự ép tiếng Việt nếu user hỏi bằng tiếng Anh.',
    '• Chitchat/lời chào: 1-2 câu thân thiện.',
    '• Sau get_spot_detail: 2-4 đoạn về lịch sử + trải nghiệm + mẹo, dùng **đậm** cho điểm nhấn. Bỏ qua đoạn không có thông tin.',
    '• Sau search_spots (danh sách): giới thiệu mỗi điểm 1-2 câu, không bullet metadata.',
    '• KHÔNG lặp lại địa chỉ chi tiết, giá vé, giờ mở, số điện thoại, website, toạ độ — UI đã có card riêng. Chỉ nói thoáng kiểu "mở cửa cả ngày", "giá vé phải chăng".',
    '• Khi tool trả empty/error: nói thẳng "hiện chưa có dữ liệu trong hệ thống", có thể gợi ý chung 1 câu, TUYỆT ĐỐI KHÔNG nêu tên sản phẩm/điểm/lễ hội cụ thể như thể đó là kết quả từ DB.',
    '• Không kết thúc bằng câu mời thao tác bản đồ; chỉ trả lời nội dung du lịch.',
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
      const attachedItems = Array.from(attachedById.values());
      mapActions.push({
        action: 'attach_items',
        items: attachedItems,
      });
      mapActions.push(...buildAutoMapActions(attachedItems));
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

function isFiniteCoord(value) {
  return Number.isFinite(Number(value));
}

function buildBounds(items) {
  const points = items
    .filter((it) => isFiniteCoord(it.lng) && isFiniteCoord(it.lat))
    .map((it) => [Number(it.lng), Number(it.lat)]);
  if (!points.length) return null;

  let minLng = points[0][0];
  let maxLng = points[0][0];
  let minLat = points[0][1];
  let maxLat = points[0][1];

  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return [[minLng, minLat], [maxLng, maxLat]];
}

function buildAutoMapActions(items) {
  const validItems = items.filter((it) => isFiniteCoord(it.lng) && isFiniteCoord(it.lat));
  if (!validItems.length) return [];

  if (validItems.length === 1) {
    const item = validItems[0];
    return [{
      action: 'fly_to',
      center: [Number(item.lng), Number(item.lat)],
      zoom: DEFAULT_FLY_TO_ZOOM,
      item_id: item.id,
      item_type: item.type,
      label: item.name || item.location_name || null,
    }];
  }

  const bounds = buildBounds(validItems);
  if (!bounds) return [];

  return [{
    action: 'fit_bounds',
    bounds,
    padding: DEFAULT_MAP_PADDING,
    item_ids: validItems.map((it) => it.id).filter(Boolean),
    item_types: [...new Set(validItems.map((it) => it.type).filter(Boolean))],
  }];
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function isNdviForecastQuestion(userMessage) {
  const text = normalizeSearchText(userMessage);
  const mentionsNdvi = /\bndvi\b/.test(text) || text.includes('chi so thuc vat') || text.includes('lstm');
  if (!mentionsNdvi) return false;

  const mentionsStatistics =
    text.includes('thong ke') ||
    text.includes('chi so') ||
    text.includes('10 nam') ||
    text.includes('muoi nam');
  const mentionsForecast =
    text.includes('du bao') ||
    text.includes('ngan han') ||
    text.includes('lstm');
  const mentionsRegion = findNdviRegionImages(userMessage).length > 0;

  return mentionsRegion || (mentionsStatistics && mentionsForecast);
}

function findNdviRegionImages(userMessage) {
  const text = normalizeSearchText(userMessage);
  return NDVI_LSTM_REGION_IMAGES.filter((image) =>
    image.keywords.some((keyword) => text.includes(keyword))
  );
}

function buildNdviForecastResponse(userMessage) {
  const images = findNdviRegionImages(userMessage);
  if (!images.length) {
    return [
      'Hệ thống có ảnh dự báo NDVI bằng mô hình LSTM cho 3 khu vực ở Ninh Bình.',
      'Bạn muốn xem khu vực nào trong các lựa chọn sau:',
      '',
      `- **Cúc Phương** — vườn quốc gia, rừng nguyên sinh.`,
      `- **Hoa Lư** — vùng đá vôi karst quanh cố đô.`,
      `- **Xuân Thủy** — vùng ngập nước cửa sông Hồng.`,
      '',
      'Nhập tên khu vực để mình hiển thị ảnh.',
    ].join('\n');
  }

  const heading = images.length === 1
    ? `Dưới đây là ảnh dự báo NDVI LSTM khu vực **${images[0].label}**:`
    : `Dưới đây là ảnh dự báo NDVI LSTM ${images.length} khu vực bạn hỏi:`;

  return [
    heading,
    '',
    ...images.map((image) => `![NDVI LSTM - ${image.label}](${image.url})`),
  ].join('\n');
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ChatbotService {
  static async createSession({ userId, anonymousId }, { session_type = 'tourist', language = 'vi' } = {}) {
    if (!userId && !anonymousId) {
      throw new Api400Error(
        'Phiên ẩn danh cần header "x-anonymous-id" (UUID v4). Hãy đăng nhập hoặc tạo client id.'
      );
    }

    if (session_type === 'manager') {
      if (!userId) {
        throw new Api403Error(
          'Yêu cầu xác thực để tạo phiên chat quản lý.',
          ['AUTH_REQUIRED']
        );
      }

      const user = await UserRepository.findUserById(userId);
      if (!user) {
        throw new Api403Error('Người dùng không tồn tại', ['USER_NOT_FOUND']);
      }

      const roleCode = String(user.role?.code || '').trim().toLowerCase();
      const allowedRoles = ['system_admin', 'ministry_manager', 'department_manager'];
      const hasManagerRole = allowedRoles.includes(roleCode);
      const hasPermission =
        (typeof user.hasPermission === 'function') &&
        (user.hasPermission('analytics', 'read') || user.hasPermission('governance', 'read'));

      if (!hasManagerRole && !hasPermission) {
        throw new Api403Error(
          'Quyền truy cập bị từ chối. Chỉ quản trị viên hoặc nhà quản lý mới có thể tạo phiên chat này.',
          ['INSUFFICIENT_PERMISSIONS']
        );
      }
    }

    const context = userId ? null : { anon_id: anonymousId };
    return ChatbotRepository.createSession({
      user_id: userId || null,
      session_type,
      language,
      context,
    });
  }

  /**
   * Danh sách phiên của actor: nếu có userId → query theo user_id; nếu chỉ có
   * anonymousId → query theo context.anon_id. Không có cả 2 → throw 400.
   */
  static async listSessions({ userId, anonymousId }, query) {
    if (!userId && !anonymousId) {
      throw new Api400Error(
        'Cần đăng nhập hoặc gửi header "x-anonymous-id" (UUID v4) để lấy danh sách phiên.'
      );
    }
    const { page = 1, limit = 20 } = query;
    const { rows, total } = userId
      ? await ChatbotRepository.getUserSessions(userId, { page, limit })
      : await ChatbotRepository.getAnonymousSessions(anonymousId, { page, limit });
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

    // Quota cho anonymous: chặn ngay khi vượt, KHÔNG lưu tin nhắn user mới.
    if (!actor.userId && actor.anonymousId) {
      const used = await ChatbotRepository.countAnonymousUserMessages(actor.anonymousId);
      if (used >= ANONYMOUS_MESSAGE_LIMIT) {
        throw new Api403Error(
          `Bạn đã dùng hết ${ANONYMOUS_MESSAGE_LIMIT} câu hỏi miễn phí. Vui lòng đăng nhập để tiếp tục trò chuyện.`,
          ['ANONYMOUS_QUOTA_EXCEEDED']
        );
      }
    }

    const startedAt = Date.now();

    // Lưu tin nhắn user trước
    await ChatbotRepository.saveMessage({
      session_id: sessionId,
      role: 'user',
      content: userMessage,
    });

    if (isNdviForecastQuestion(userMessage)) {
      const content = buildNdviForecastResponse(userMessage);
      const saved = await ChatbotRepository.saveMessage({
        session_id: sessionId,
        role: 'assistant',
        content,
        latency_ms: Date.now() - startedAt,
      });

      return { message: saved, map_actions: [] };
    }

    // Lấy N tin nhắn GẦN NHẤT (bao gồm tin vừa lưu) làm context
    const history = await ChatbotRepository.getRecentMessages(sessionId, HISTORY_LIMIT);
    const messages = history.map((m) => ({ role: m.role, content: m.content }));

    const basePrompt = SYSTEM_PROMPTS[session.session_type] || SYSTEM_PROMPTS.tourist;
    const langDirective = session.language === 'en'
      ? 'LANGUAGE: Always respond in English, regardless of the language of the user message. Translate Vietnamese place names but keep the original (e.g. "Tràng An (Trang An)").'
      : 'LANGUAGE: Mặc định trả lời tiếng Việt. Nếu user gõ bằng tiếng Anh thì trả lời tiếng Anh.';
    const systemPrompt = `${basePrompt}\n\n${langDirective}`;
    const tools = getToolDefinitions(session.session_type);
    const openaiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    try {
      const { content, mapActions, tokenUsage, toolCallTrace } = await chatbotQueue.run(() =>
        runChatCompletion({
          openaiMessages,
          tools,
          ctx: { userId: actor.userId || null, sessionType: session.session_type },
        })
      );

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
      const errMsg = err.code === 'QUEUE_TIMEOUT'
        ? err.message
        : 'Xin lỗi, có lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau ít phút.';
      try {
        await ChatbotRepository.saveMessage({
          session_id: sessionId,
          role: 'assistant',
          content: errMsg,
          latency_ms: Date.now() - startedAt,
        });
      } catch (_) { /* swallow secondary write error */ }

      if (err.code === 'QUEUE_TIMEOUT') {
        throw new Api400Error(err.message);
      }
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
