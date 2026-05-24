const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbot.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
  createSessionSchema,
  sessionIdParamSchema,
  sendMessageSchema,
  paginationQuerySchema,
} = require('../middlewares/validators/chatbot.validation');

// NV-50: Chatbot hỗ trợ tìm kiếm (khách du lịch)
// NV-51: Chatbot phân tích thống kê (nhà quản lý)
// Tất cả endpoint chấp nhận cả user đã đăng nhập (JWT) lẫn anonymous (header x-anonymous-id).
// Quyền truy cập session được kiểm tra ở service: user_id phải khớp HOẶC anon_id trong context phải khớp.

// ROUTE: POST /sessions - Tạo mới phiên chatbot. Truy cập: optional auth.
router.post('/sessions', optionalAuth, validateBody(createSessionSchema), ChatbotController.createSession );

// ROUTE: GET /sessions - Danh sách phiên chat của actor (user hoặc anonymous). Truy cập: optional auth.
router.get('/sessions', optionalAuth, validateQuery(paginationQuerySchema), ChatbotController.getSessions );

// ROUTE: GET /sessions/:sessionId - Tin nhắn trong phiên. Truy cập: optional auth.
router.get('/sessions/:sessionId', optionalAuth, validateParams(sessionIdParamSchema), validateQuery(paginationQuerySchema), ChatbotController.getMessages );

// ROUTE: POST /sessions/:sessionId/messages - Gửi tin nhắn. Truy cập: optional auth.
router.post('/sessions/:sessionId/messages', optionalAuth, validateParams(sessionIdParamSchema), validateBody(sendMessageSchema), ChatbotController.sendMessage );

// ROUTE: DELETE /sessions/:sessionId - Xóa phiên chat. Truy cập: optional auth.
router.delete('/sessions/:sessionId', optionalAuth, validateParams(sessionIdParamSchema), ChatbotController.deleteSession );

module.exports = router;
