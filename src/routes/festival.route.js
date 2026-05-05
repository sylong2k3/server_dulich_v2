const express = require('express');
const router = express.Router();
const FestivalController = require('../controllers/festival.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middlewares/auth.middleware');
const { uuidParamSchema } = require('../middlewares/validators/common/id-param.schema');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { festivalQuerySchema, festivalAdminQuerySchema, calendarQuerySchema, createFestivalSchema, updateFestivalSchema } = require('../middlewares/validators/festival.validation');

// ==================== ADMIN — phải đặt trước /:id để tránh conflict ====================
// ROUTE: GET /admin - Danh sách lễ hội cho admin (không cache, thấy cả draft).
router.get('/admin', authenticateToken, checkPermission('festivals', 'read'), validateQuery(festivalAdminQuerySchema), FestivalController.getAdminAll);
// ROUTE: GET /admin/:id - Chi tiết lễ hội cho admin (không cache).
router.get('/admin/:id', authenticateToken, checkPermission('festivals', 'read'), validateParams(uuidParamSchema), FestivalController.getAdminById);

// ==================== PUBLIC ====================
// ROUTE: GET /calendar - Lịch lễ hội theo khoảng ngày.
router.get('/calendar', validateQuery(calendarQuerySchema), FestivalController.getCalendar);
// ROUTE: GET /types - Danh sách loại lễ hội.
router.get('/types', FestivalController.getTypes);
// ROUTE: GET / - Lấy danh sách lễ hội public (chỉ is_published=true, có cache).
router.get('/', validateQuery(festivalQuerySchema), FestivalController.getAll);
// ROUTE: GET /:id - Chi tiết lễ hội public (chỉ is_published=true, có cache).
router.get('/:id', validateParams(uuidParamSchema), FestivalController.getById);

// ==================== MUTATIONS ====================
// ROUTE: POST / - Tạo mới lễ hội.
router.post('/', authenticateToken, checkPermission('festivals', 'create'), validateBody(createFestivalSchema), FestivalController.create);
// ROUTE: PATCH /:id - Cập nhật lễ hội.
router.patch('/:id', authenticateToken, checkPermission('festivals', 'update'), validateParams(uuidParamSchema), validateBody(updateFestivalSchema), FestivalController.update);
// ROUTE: DELETE /:id - Xóa lễ hội.
router.delete('/:id', authenticateToken, checkPermission('festivals', 'delete'), validateParams(uuidParamSchema), FestivalController.delete);

module.exports = router;
