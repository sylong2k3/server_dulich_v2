const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbot.controller');
const { authenticateToken, optionalAuth } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
  createSessionSchema,
  sessionIdParamSchema,
  sendMessageSchema,
  paginationQuerySchema,
} = require('../middlewares/validators/chatbot.validation');

// NV-50: Chatbot hỗ trợ tìm kiếm (khách du lịch, dùng optionalAuth)
// NV-51: Chatbot phân tích thống kê (nhà quản lý, dùng authenticateToken)

// ROUTE: POST /sessions - Tạo mới chatbot AI. Xử lý bởi ChatbotController.createSession. Truy cập: cho phép đăng nhập tùy chọn.
router.post('/sessions', optionalAuth, validateBody(createSessionSchema), ChatbotController.createSession );

// ROUTE: GET /sessions - Truy vấn chatbot AI. Xử lý bởi ChatbotController.getSessions. Truy cập: yêu cầu đăng nhập.
router.get('/sessions', authenticateToken, validateQuery(paginationQuerySchema), ChatbotController.getSessions );

// ROUTE: GET /sessions/:sessionId - Truy vấn chatbot AI. Xử lý bởi ChatbotController.getMessages. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/sessions/:sessionId', optionalAuth, validateParams(sessionIdParamSchema), validateQuery(paginationQuerySchema), ChatbotController.getMessages );

// ROUTE: POST /sessions/:sessionId/messages - Gửi dữ liệu/thông báo chatbot AI. Xử lý bởi ChatbotController.sendMessage. Truy cập: cho phép đăng nhập tùy chọn.
router.post('/sessions/:sessionId/messages', optionalAuth, validateParams(sessionIdParamSchema), validateBody(sendMessageSchema), ChatbotController.sendMessage );

// ROUTE: DELETE /sessions/:sessionId - Xóa chatbot AI. Xử lý bởi ChatbotController.deleteSession. Truy cập: yêu cầu đăng nhập.
router.delete('/sessions/:sessionId', authenticateToken, validateParams(sessionIdParamSchema), ChatbotController.deleteSession );

module.exports = router;
