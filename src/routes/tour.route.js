const express = require('express');
const router = express.Router();
const TourController = require('../controllers/tour.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
    idParamSchema,
    stopIdParamSchema,
    tourQuerySchema,
    createTourSchema,
    updateTourSchema,
    createStopSchema,
    updateStopSchema,
} = require('../middlewares/validators/tour.validation');

// ==================== PUBLIC ====================
// ROUTE: GET / - Lấy toàn bộ danh sách cho quản trị tour du lịch. Xử lý bởi TourController.getAll. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/', optionalAuth, validateQuery(tourQuerySchema), TourController.getAll);
// ROUTE: GET /slug/:slug - Truy vấn tour du lịch. Xử lý bởi TourController.getBySlug. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/slug/:slug', optionalAuth, TourController.getBySlug);
// ROUTE: GET /:id - Lấy chi tiết theo ID tour du lịch. Xử lý bởi TourController.getById. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id', optionalAuth, validateParams(idParamSchema), TourController.getById);
// ROUTE: GET /:id/stops - Truy vấn tour du lịch. Xử lý bởi TourController.getStops. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/stops', optionalAuth, validateParams(idParamSchema), TourController.getStops);

// ==================== BUSINESS / ADMIN ====================
// ROUTE: POST / - Tạo mới tour du lịch. Xử lý bởi TourController.create. Truy cập: yêu cầu đăng nhập, cần quyền tours:create.
router.post('/', authenticateToken, checkPermission('tours', 'create'), validateBody(createTourSchema), TourController.create );

// ROUTE: PATCH /:id - Cập nhật tour du lịch. Xử lý bởi TourController.update. Truy cập: yêu cầu đăng nhập, cần quyền tours:update.
router.patch('/:id', authenticateToken, checkPermission('tours', 'update'), validateParams(idParamSchema), validateBody(updateTourSchema), TourController.update );

// ROUTE: DELETE /:id - Xóa tour du lịch. Xử lý bởi TourController.delete. Truy cập: yêu cầu đăng nhập, cần quyền tours:delete.
router.delete('/:id', authenticateToken, checkPermission('tours', 'delete'), validateParams(idParamSchema), TourController.delete );

// ==================== STOPS ====================
// ROUTE: POST /:id/stops - Tạo mới tour du lịch. Xử lý bởi TourController.addStop. Truy cập: yêu cầu đăng nhập, cần quyền tours:update.
router.post('/:id/stops', authenticateToken, checkPermission('tours', 'update'), validateParams(idParamSchema), validateBody(createStopSchema), TourController.addStop );

// ROUTE: PATCH /:id/stops/:stopId - Cập nhật tour du lịch. Xử lý bởi TourController.updateStop. Truy cập: yêu cầu đăng nhập, cần quyền tours:update.
router.patch('/:id/stops/:stopId', authenticateToken, checkPermission('tours', 'update'), validateParams(stopIdParamSchema), validateBody(updateStopSchema), TourController.updateStop );

// ROUTE: DELETE /:id/stops/:stopId - Xóa tour du lịch. Xử lý bởi TourController.deleteStop. Truy cập: yêu cầu đăng nhập, cần quyền tours:update.
router.delete('/:id/stops/:stopId', authenticateToken, checkPermission('tours', 'update'), validateParams(stopIdParamSchema), TourController.deleteStop );

module.exports = router;
