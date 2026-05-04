const express = require('express');
const router = express.Router();
const ArSessionController = require('../controllers/ar-session.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
    recordArSessionSchema,
    arSessionQuerySchema,
    spotIdParamSchema,
} = require('../middlewares/validators/ar-session.validation');

// Record a new AR session (authenticated users)
// ROUTE: POST / - Tạo/Gửi phiên trải nghiệm AR. Xử lý bởi ArSessionController.record. Truy cập: yêu cầu đăng nhập.
router.post('/', authenticateToken, validateBody(recordArSessionSchema), ArSessionController.record);

// Get current user's AR history
// ROUTE: GET /my - Lấy thông tin thuộc về tài khoản đang đăng nhập phiên trải nghiệm AR. Xử lý bởi ArSessionController.getMyHistory. Truy cập: yêu cầu đăng nhập.
router.get('/my', authenticateToken, validateQuery(arSessionQuerySchema), ArSessionController.getMyHistory);

// Admin: stats overview (optionally filtered by spot_id via query)
// ROUTE: GET /stats - Lấy số liệu thống kê phiên trải nghiệm AR. Xử lý bởi ArSessionController.getStats. Truy cập: yêu cầu đăng nhập, cần quyền analytics:read.
router.get('/stats', authenticateToken, checkPermission('analytics', 'read'), ArSessionController.getStats);

// Get AR sessions for a specific spot (admin/staff)
// ROUTE: GET /spots/:spotId - Truy vấn phiên trải nghiệm AR. Xử lý bởi ArSessionController.getBySpot. Truy cập: yêu cầu đăng nhập, cần quyền analytics:read.
router.get('/spots/:spotId', authenticateToken, checkPermission('analytics', 'read'), validateParams(spotIdParamSchema), validateQuery(arSessionQuerySchema), ArSessionController.getBySpot );

// Get single session detail
// ROUTE: GET /:id - Lấy chi tiết theo ID phiên trải nghiệm AR. Xử lý bởi ArSessionController.getById. Truy cập: yêu cầu đăng nhập.
router.get('/:id', authenticateToken, ArSessionController.getById);

module.exports = router;
