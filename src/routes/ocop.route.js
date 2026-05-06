const express = require('express');
const router = express.Router();
const OcopController = require('../controllers/ocop.controller');
const { authenticateToken, checkPermission, optionalAuth, requireRole } = require('../middlewares/auth.middleware');
const { uuidParamSchema } = require('../middlewares/validators/common/id-param.schema');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { ocopQuerySchema, ocopAdminQuerySchema, createOcopSchema, updateOcopSchema } = require('../middlewares/validators/ocop.validation');

// ==================== ADMIN — phải đặt trước /:id để tránh conflict ====================
// ROUTE: GET /admin - Danh sách sản phẩm OCOP cho admin (không cache, thấy cả is_active=false).
router.get(
  '/admin',
  authenticateToken,
  requireRole(['system_admin', 'ministry_manager', 'department_manager']),
  checkPermission('ocop', 'read'),
  validateQuery(ocopAdminQuerySchema),
  OcopController.getAdminAll
);
// ROUTE: GET /admin/:id - Chi tiết sản phẩm OCOP cho admin (không cache).
router.get(
  '/admin/:id',
  authenticateToken,
  requireRole(['system_admin', 'ministry_manager', 'department_manager']),
  checkPermission('ocop', 'read'),
  validateParams(uuidParamSchema),
  OcopController.getAdminById
);

// ==================== PUBLIC ====================
// ROUTE: GET / - Lấy danh sách sản phẩm OCOP public. Xử lý bởi OcopController.getAll. Truy cập: optional auth; khách chỉ thấy is_active=true.
router.get('/', optionalAuth, validateQuery(ocopQuerySchema), OcopController.getAll);
// ROUTE: GET /categories - Truy vấn danh mục OCOP.
router.get('/categories', OcopController.getCategories);
// ROUTE: GET /me - Danh sách sản phẩm OCOP của doanh nghiệp tôi (phải đặt trước /:id).
router.get('/me', authenticateToken, validateQuery(ocopQuerySchema), OcopController.getMy);
// ROUTE: GET /:id - Lấy chi tiết theo ID sản phẩm OCOP. Truy cập: optional auth; khách chỉ thấy is_active=true.
router.get('/:id', optionalAuth, validateParams(uuidParamSchema), OcopController.getById);

// ROUTE: POST / - Tạo mới sản phẩm OCOP. Xử lý bởi OcopController.create. Truy cập: yêu cầu đăng nhập, cần quyền ocop:create.
router.post('/', authenticateToken, checkPermission('ocop', 'create'), validateBody(createOcopSchema), OcopController.create);
// ROUTE: PATCH /:id - Cập nhật sản phẩm OCOP. Xử lý bởi OcopController.update. Truy cập: yêu cầu đăng nhập, cần quyền ocop:update.
router.patch('/:id', authenticateToken, checkPermission('ocop', 'update'), validateParams(uuidParamSchema), validateBody(updateOcopSchema), OcopController.update);
// ROUTE: DELETE /:id - Xóa sản phẩm OCOP. Xử lý bởi OcopController.delete. Truy cập: yêu cầu đăng nhập, cần quyền ocop:delete.
router.delete('/:id', authenticateToken, checkPermission('ocop', 'delete'), validateParams(uuidParamSchema), OcopController.delete);

module.exports = router;
