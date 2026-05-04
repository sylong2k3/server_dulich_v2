const express = require('express');
const router = express.Router();
const FestivalController = require('../controllers/festival.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middlewares/auth.middleware');
const { uuidParamSchema } = require('../middlewares/validators/common/id-param.schema');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { festivalQuerySchema, calendarQuerySchema, createFestivalSchema, updateFestivalSchema } = require('../middlewares/validators/festival.validation');

// NV-36: Calendar endpoint — lịch lễ hội theo khoảng ngày
// ROUTE: GET /calendar - Truy vấn lễ hội. Xử lý bởi FestivalController.getCalendar. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/calendar', validateQuery(calendarQuerySchema), FestivalController.getCalendar);
// ROUTE: GET /types - Truy vấn lễ hội. Xử lý bởi FestivalController.getTypes. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/types', FestivalController.getTypes);
// ROUTE: GET / - Lấy danh sách lễ hội public. Xử lý bởi FestivalController.getAll. Truy cập: optional auth; khách chỉ thấy is_published=true.
router.get('/', optionalAuth, validateQuery(festivalQuerySchema), FestivalController.getAll);
// ROUTE: GET /:id - Lấy chi tiết theo ID lễ hội. Xử lý bởi FestivalController.getById. Truy cập: optional auth; khách chỉ thấy is_published=true.
router.get('/:id', optionalAuth, validateParams(uuidParamSchema), FestivalController.getById);

// ROUTE: POST / - Tạo mới lễ hội. Xử lý bởi FestivalController.create. Truy cập: yêu cầu đăng nhập, cần quyền festivals:create.
router.post('/', authenticateToken, checkPermission('festivals', 'create'), validateBody(createFestivalSchema), FestivalController.create);
// ROUTE: PATCH /:id - Cập nhật lễ hội. Xử lý bởi FestivalController.update. Truy cập: yêu cầu đăng nhập, cần quyền festivals:update.
router.patch('/:id', authenticateToken, checkPermission('festivals', 'update'), validateParams(uuidParamSchema), validateBody(updateFestivalSchema), FestivalController.update);
// ROUTE: DELETE /:id - Xóa lễ hội. Xử lý bởi FestivalController.delete. Truy cập: yêu cầu đăng nhập, cần quyền festivals:delete.
router.delete('/:id', authenticateToken, checkPermission('festivals', 'delete'), validateParams(uuidParamSchema), FestivalController.delete);

module.exports = router;
