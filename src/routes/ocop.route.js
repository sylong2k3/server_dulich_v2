const express = require('express');
const router = express.Router();
const OcopController = require('../controllers/ocop.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middlewares/auth.middleware');
const { uuidParamSchema } = require('../middlewares/validators/common/id-param.schema');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { ocopQuerySchema, createOcopSchema, updateOcopSchema } = require('../middlewares/validators/ocop.validation');

// ROUTE: GET / - Lấy danh sách sản phẩm OCOP public. Xử lý bởi OcopController.getAll. Truy cập: optional auth; khách chỉ thấy is_active=true.
router.get('/', optionalAuth, validateQuery(ocopQuerySchema), OcopController.getAll);
// ROUTE: GET /categories - Truy vấn sản phẩm OCOP. Xử lý bởi OcopController.getCategories. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/categories', OcopController.getCategories);
// ROUTE: GET /:id - Lấy chi tiết theo ID sản phẩm OCOP. Xử lý bởi OcopController.getById. Truy cập: optional auth; khách chỉ thấy is_active=true.
router.get('/:id', optionalAuth, validateParams(uuidParamSchema), OcopController.getById);

// ROUTE: POST / - Tạo mới sản phẩm OCOP. Xử lý bởi OcopController.create. Truy cập: yêu cầu đăng nhập, cần quyền ocop:create.
router.post('/', authenticateToken, checkPermission('ocop', 'create'), validateBody(createOcopSchema), OcopController.create);
// ROUTE: PATCH /:id - Cập nhật sản phẩm OCOP. Xử lý bởi OcopController.update. Truy cập: yêu cầu đăng nhập, cần quyền ocop:update.
router.patch('/:id', authenticateToken, checkPermission('ocop', 'update'), validateParams(uuidParamSchema), validateBody(updateOcopSchema), OcopController.update);
// ROUTE: DELETE /:id - Xóa sản phẩm OCOP. Xử lý bởi OcopController.delete. Truy cập: yêu cầu đăng nhập, cần quyền ocop:delete.
router.delete('/:id', authenticateToken, checkPermission('ocop', 'delete'), validateParams(uuidParamSchema), OcopController.delete);

module.exports = router;
