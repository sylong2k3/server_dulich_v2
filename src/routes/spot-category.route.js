const express = require('express');
const router = express.Router();

const SpotCategoryController = require('../controllers/spot-category.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
  categoryQuerySchema,
  categoryTreeQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
} = require('../middlewares/validators/spot-category.validation');

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /spot-categories/tree         — dạng cây (dùng cho dropdown / bản đồ)
// ROUTE: GET /tree - Truy vấn danh mục điểm du lịch. Xử lý bởi SpotCategoryController.getTree. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/tree', validateQuery(categoryTreeQuerySchema), SpotCategoryController.getTree);

// ─── Protected (Admin) ────────────────────────────────────────────────────────
// ROUTE: GET / - Lấy toàn bộ danh sách cho quản trị danh mục điểm du lịch. Xử lý bởi SpotCategoryController.getAll. Truy cập: yêu cầu đăng nhập, cần quyền spot_categories:read.
router.get('/', authenticateToken, checkPermission('spot_categories', 'read'), validateQuery(categoryQuerySchema), SpotCategoryController.getAll);

// GET /spot-categories/:id          — chi tiết
// ROUTE: GET /:id - Lấy chi tiết theo ID danh mục điểm du lịch. Xử lý bởi SpotCategoryController.getById. Truy cập: yêu cầu đăng nhập, cần quyền spot_categories:read.
router.get('/:id', authenticateToken, checkPermission('spot_categories', 'read'), validateParams(idParamSchema), SpotCategoryController.getById);

// POST /spot-categories
// ROUTE: POST / - Tạo mới danh mục điểm du lịch. Xử lý bởi SpotCategoryController.create. Truy cập: yêu cầu đăng nhập, cần quyền spot_categories:create.
router.post('/', authenticateToken, checkPermission('spot_categories', 'create'), validateBody(createCategorySchema), SpotCategoryController.create);

// PUT /spot-categories/:id
// ROUTE: PUT /:id - Cập nhật danh mục điểm du lịch. Xử lý bởi SpotCategoryController.update. Truy cập: yêu cầu đăng nhập, cần quyền spot_categories:update.
router.put('/:id', authenticateToken, checkPermission('spot_categories', 'update'), validateParams(idParamSchema), validateBody(updateCategorySchema), SpotCategoryController.update);

// PATCH /spot-categories/:id/toggle — bật/tắt is_active
// ROUTE: PATCH /:id/toggle - Cập nhật một phần danh mục điểm du lịch. Xử lý bởi SpotCategoryController.toggle. Truy cập: yêu cầu đăng nhập, cần quyền spot_categories:update.
router.patch('/:id/toggle', authenticateToken, checkPermission('spot_categories', 'update'), validateParams(idParamSchema), SpotCategoryController.toggle);

// DELETE /spot-categories/:id
// ROUTE: DELETE /:id - Xóa danh mục điểm du lịch. Xử lý bởi SpotCategoryController.delete. Truy cập: yêu cầu đăng nhập, cần quyền spot_categories:delete.
router.delete('/:id', authenticateToken, checkPermission('spot_categories', 'delete'), validateParams(idParamSchema), SpotCategoryController.delete);

module.exports = router;
