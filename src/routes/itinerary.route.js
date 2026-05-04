const express = require('express');
const router = express.Router();
const ItineraryController = require('../controllers/itinerary.controller');
const { authenticateToken, optionalAuth } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
    idParamSchema,
    dayIdParamSchema,
    stopIdParamSchema,
    itineraryQuerySchema,
    createItinerarySchema,
    updateItinerarySchema,
    createDaySchema,
    updateDaySchema,
    createStopSchema,
    updateStopSchema,
    aiGenerateSchema,
} = require('../middlewares/validators/itinerary.validation');

// ==================== NV-29: PUBLIC SHARE ====================
// ROUTE: GET /shared/:token - Truy vấn lịch trình du lịch. Xử lý bởi ItineraryController.getByShareToken. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/shared/:token', ItineraryController.getByShareToken);

// ==================== NV-28: AI GENERATE ====================
// ROUTE: POST /ai-generate - Tạo/Gửi lịch trình du lịch. Xử lý bởi ItineraryController.aiGenerate. Truy cập: yêu cầu đăng nhập.
router.post('/ai-generate', authenticateToken, validateBody(aiGenerateSchema), ItineraryController.aiGenerate);

// ==================== MY ITINERARIES ====================
// ROUTE: GET / - Lấy toàn bộ danh sách cho quản trị lịch trình du lịch. Xử lý bởi ItineraryController.getAll. Truy cập: yêu cầu đăng nhập.
router.get('/', authenticateToken, validateQuery(itineraryQuerySchema), ItineraryController.getAll);
// ROUTE: POST / - Tạo mới lịch trình du lịch. Xử lý bởi ItineraryController.create. Truy cập: yêu cầu đăng nhập.
router.post('/', authenticateToken, validateBody(createItinerarySchema), ItineraryController.create);

// ROUTE: GET /:id - Lấy chi tiết theo ID lịch trình du lịch. Xử lý bởi ItineraryController.getById. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/:id', optionalAuth, validateParams(idParamSchema), ItineraryController.getById);
// ROUTE: PATCH /:id - Cập nhật lịch trình du lịch. Xử lý bởi ItineraryController.update. Truy cập: yêu cầu đăng nhập.
router.patch('/:id', authenticateToken, validateParams(idParamSchema), validateBody(updateItinerarySchema), ItineraryController.update);
// ROUTE: DELETE /:id - Xóa lịch trình du lịch. Xử lý bởi ItineraryController.delete. Truy cập: yêu cầu đăng nhập.
router.delete('/:id', authenticateToken, validateParams(idParamSchema), ItineraryController.delete);

// NV-29: Share / Unshare / PDF
// ROUTE: POST /:id/share - Tạo/Gửi lịch trình du lịch. Xử lý bởi ItineraryController.share. Truy cập: yêu cầu đăng nhập.
router.post('/:id/share', authenticateToken, validateParams(idParamSchema), ItineraryController.share);
// ROUTE: DELETE /:id/share - Xóa/Vô hiệu hóa lịch trình du lịch. Xử lý bởi ItineraryController.unshare. Truy cập: yêu cầu đăng nhập.
router.delete('/:id/share', authenticateToken, validateParams(idParamSchema), ItineraryController.unshare);
// ROUTE: GET /:id/export/pdf - Xuất dữ liệu/báo cáo lịch trình du lịch. Xử lý bởi ItineraryController.exportPdf. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/:id/export/pdf', optionalAuth, validateParams(idParamSchema), ItineraryController.exportPdf);

// ==================== DAYS ====================
// ROUTE: GET /:id/days - Truy vấn lịch trình du lịch. Xử lý bởi ItineraryController.getDays. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/:id/days', optionalAuth, validateParams(idParamSchema), ItineraryController.getDays);
// ROUTE: POST /:id/days - Tạo mới lịch trình du lịch. Xử lý bởi ItineraryController.addDay. Truy cập: yêu cầu đăng nhập.
router.post('/:id/days', authenticateToken, validateParams(idParamSchema), validateBody(createDaySchema), ItineraryController.addDay);
// ROUTE: PATCH /:id/days/:dayId - Cập nhật lịch trình du lịch. Xử lý bởi ItineraryController.updateDay. Truy cập: yêu cầu đăng nhập.
router.patch('/:id/days/:dayId', authenticateToken, validateParams(dayIdParamSchema), validateBody(updateDaySchema), ItineraryController.updateDay);
// ROUTE: DELETE /:id/days/:dayId - Xóa lịch trình du lịch. Xử lý bởi ItineraryController.deleteDay. Truy cập: yêu cầu đăng nhập.
router.delete('/:id/days/:dayId', authenticateToken, validateParams(dayIdParamSchema), ItineraryController.deleteDay);

// ==================== STOPS ====================
// ROUTE: POST /:id/days/:dayId/stops - Tạo mới lịch trình du lịch. Xử lý bởi ItineraryController.addStop. Truy cập: yêu cầu đăng nhập.
router.post('/:id/days/:dayId/stops', authenticateToken, validateParams(dayIdParamSchema), validateBody(createStopSchema), ItineraryController.addStop);
// ROUTE: PATCH /:id/stops/:stopId - Cập nhật lịch trình du lịch. Xử lý bởi ItineraryController.updateStop. Truy cập: yêu cầu đăng nhập.
router.patch('/:id/stops/:stopId', authenticateToken, validateParams(stopIdParamSchema), validateBody(updateStopSchema), ItineraryController.updateStop);
// ROUTE: DELETE /:id/stops/:stopId - Xóa lịch trình du lịch. Xử lý bởi ItineraryController.deleteStop. Truy cập: yêu cầu đăng nhập.
router.delete('/:id/stops/:stopId', authenticateToken, validateParams(stopIdParamSchema), ItineraryController.deleteStop);

module.exports = router;
