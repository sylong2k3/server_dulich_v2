const express = require('express');
const router = express.Router();
const CapacityController = require('../controllers/capacity.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
    spotIdParamSchema,
    tourIdParamSchema,
    logCapacitySchema,
    spotCapacitySettingsSchema,
    alertConfigSchema,
    historyQuerySchema,
    statsQuerySchema,
    alternativesQuerySchema,
    adminCapacityQuerySchema,
} = require('../middlewares/validators/capacity.validation');

// Public
// ROUTE: GET /current - Truy vấn sức chứa và mật độ khách. Xử lý bởi CapacityController.getCurrentAll. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/current', CapacityController.getCurrentAll);
// ROUTE: GET /current/geojson - Truy vấn sức chứa và mật độ khách. Xử lý bởi CapacityController.getCurrentGeoJSON. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/current/geojson', CapacityController.getCurrentGeoJSON);
// ROUTE: GET /tours/:tourId/current - Tổng hợp tải trọng hiện tại của tuyến du lịch từ các điểm dừng.
router.get('/tours/:tourId/current', validateParams(tourIdParamSchema), CapacityController.getCurrentByTour);
// ROUTE: GET /stream -> handler
router.get('/stream', CapacityController.streamCapacity); // SSE — no auth for public map

// Protected — đọc lịch sử & quản trị tải trọng
// ROUTE: GET /admin - Danh sách sức chứa phân trang và phân quyền quản trị. Xử lý bởi CapacityController.getAdminAll.
router.get('/admin', authenticateToken, checkPermission('capacity', 'read'), validateQuery(adminCapacityQuerySchema), CapacityController.getAdminAll);
// ROUTE: GET /spots/:spotId/history - Truy vấn sức chứa và mật độ khách. Xử lý bởi CapacityController.getHistory. Truy cập: yêu cầu đăng nhập.
router.get('/spots/:spotId/history', authenticateToken, validateParams(spotIdParamSchema), validateQuery(historyQuerySchema), CapacityController.getHistory);
// ROUTE: GET /spots/:spotId/stats - Lấy số liệu thống kê sức chứa và mật độ khách. Xử lý bởi CapacityController.getStats. Truy cập: yêu cầu đăng nhập, cần quyền capacity:read.
router.get('/spots/:spotId/stats', authenticateToken, checkPermission('capacity', 'read'), validateParams(spotIdParamSchema), validateQuery(statsQuerySchema), CapacityController.getStats);

// NV-20: Gợi ý điểm thay thế khi quá tải
// ROUTE: GET /spots/:spotId/alternatives - Truy vấn sức chứa và mật độ khách. Xử lý bởi CapacityController.getSuggestedAlternatives. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/spots/:spotId/alternatives', validateParams(spotIdParamSchema), validateQuery(alternativesQuerySchema), CapacityController.getSuggestedAlternatives);

// Protected — ghi nhận tải (Operator) — NV-17
// ROUTE: POST /spots/:spotId/log - Tạo/Gửi sức chứa và mật độ khách. Xử lý bởi CapacityController.logCapacity. Truy cập: yêu cầu đăng nhập, cần quyền capacity:create.
router.post('/spots/:spotId/log', authenticateToken, checkPermission('capacity', 'create'), validateParams(spotIdParamSchema), validateBody(logCapacitySchema), CapacityController.logCapacity );

// ROUTE: PATCH /spots/:spotId/settings - Cấu hình sức chứa tối đa. Xử lý bởi CapacityController.updateSpotSettings. Truy cập: yêu cầu đăng nhập, cần quyền capacity:create.
router.patch('/spots/:spotId/settings', authenticateToken, checkPermission('capacity', 'create'), validateParams(spotIdParamSchema), validateBody(spotCapacitySettingsSchema), CapacityController.updateSpotSettings);

// Admin — cấu hình cảnh báo
// ROUTE: GET /configs - Truy vấn sức chứa và mật độ khách. Xử lý bởi CapacityController.getAlertConfigs. Truy cập: yêu cầu đăng nhập, cần quyền capacity:read.
router.get('/configs', authenticateToken, checkPermission('capacity', 'read'), CapacityController.getAlertConfigs);
// ROUTE: POST /configs - Tạo/Gửi sức chứa và mật độ khách. Xử lý bởi CapacityController.upsertAlertConfig. Truy cập: yêu cầu đăng nhập, cần quyền capacity:create.
router.post('/configs', authenticateToken, checkPermission('capacity', 'create'), validateBody(alertConfigSchema), CapacityController.upsertAlertConfig);

module.exports = router;
