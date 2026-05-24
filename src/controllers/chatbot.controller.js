const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');
const ChatbotService = require('../services/chatbot.service');
const AuthMiddleware = require('../middlewares/auth.middleware');

/** Lấy actor cho mọi request: { userId } khi đã đăng nhập, ngược lại { anonymousId }. */
function actorFrom(req) {
  return AuthMiddleware.resolveAuthActor(req);
}

class ChatbotController {
  // NV-50/51: Tạo phiên chat mới
  static createSession = asyncHandler(async (req, res) => {
    const result = await ChatbotService.createSession(actorFrom(req), req.body);
    return CREATED(res, 'Phiên chat được tạo', result);
  });

  // Danh sách phiên chat của actor (đã login hoặc anonymous theo x-anonymous-id)
  static getSessions = asyncHandler(async (req, res) => {
    const result = await ChatbotService.listSessions(actorFrom(req), req.query);
    return OK(res, 'Danh sách phiên chat', result);
  });

  // Lấy tin nhắn trong phiên
  static getMessages = asyncHandler(async (req, res) => {
    const result = await ChatbotService.getMessages(req.params.sessionId, actorFrom(req), req.query);
    return OK(res, 'Tin nhắn trong phiên chat', result);
  });

  // NV-50/51: Gửi tin nhắn, nhận trả lời AI
  static sendMessage = asyncHandler(async (req, res) => {
    const result = await ChatbotService.sendMessage(
      req.params.sessionId,
      actorFrom(req),
      req.body.message
    );
    return OK(res, 'Tin nhắn đã được xử lý', result);
  });

  // Xóa phiên chat
  static deleteSession = asyncHandler(async (req, res) => {
    await ChatbotService.deleteSession(req.params.sessionId, actorFrom(req));
    return OK(res, 'Phiên chat đã được xóa');
  });
}

module.exports = ChatbotController;
