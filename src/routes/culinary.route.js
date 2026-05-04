const express = require('express');
const router = express.Router();
const CulinaryController = require('../controllers/culinary.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { uuidParamSchema } = require('../middlewares/validators/common/id-param.schema');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { culinaryQuerySchema, createCulinarySchema, updateCulinarySchema } = require('../middlewares/validators/culinary.validation');

// ROUTE: GET / - Lấy danh sách ẩm thực public. Xử lý bởi CulinaryController.getAll. Truy cập: công khai.
router.get('/', validateQuery(culinaryQuerySchema), CulinaryController.getAll);
// ROUTE: GET /categories - Truy vấn ẩm thực. Xử lý bởi CulinaryController.getCategories. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/categories', CulinaryController.getCategories);
// ROUTE: GET /:id - Lấy chi tiết theo ID ẩm thực. Xử lý bởi CulinaryController.getById. Truy cập: công khai.
router.get('/:id', validateParams(uuidParamSchema), CulinaryController.getById);

// ROUTE: POST / - Tạo mới ẩm thực. Xử lý bởi CulinaryController.create. Truy cập: yêu cầu đăng nhập, cần quyền culinary:create.
router.post('/', authenticateToken, checkPermission('culinary', 'create'), validateBody(createCulinarySchema), CulinaryController.create);
// ROUTE: PATCH /:id - Cập nhật ẩm thực. Xử lý bởi CulinaryController.update. Truy cập: yêu cầu đăng nhập, cần quyền culinary:update.
router.patch('/:id', authenticateToken, checkPermission('culinary', 'update'), validateParams(uuidParamSchema), validateBody(updateCulinarySchema), CulinaryController.update);
// ROUTE: DELETE /:id - Xóa ẩm thực. Xử lý bởi CulinaryController.delete. Truy cập: yêu cầu đăng nhập, cần quyền culinary:delete.
router.delete('/:id', authenticateToken, checkPermission('culinary', 'delete'), validateParams(uuidParamSchema), CulinaryController.delete);

module.exports = router;
