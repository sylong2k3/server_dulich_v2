const express = require('express');
const router = express.Router();
const VlogController = require('../controllers/vlog.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { idParamSchema } = require('../middlewares/validators/common/id-param.schema');
const {
    vlogQuerySchema,
    savedVlogQuerySchema,
    vlogCommentsQuerySchema,
    adminVlogQuerySchema,
    createVlogSchema,
    updateVlogSchema,
    moderateVlogSchema,
    createVlogCommentSchema,
    vlogCommentParamSchema,
} = require('../middlewares/validators/vlog.validation');

// ==================== PUBLIC ====================
// ROUTE: GET / - Lấy toàn bộ danh sách cho quản trị vlog du lịch. Xử lý bởi VlogController.getAll. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/', validateQuery(vlogQuerySchema), VlogController.getAll);
// ROUTE: GET /:id/comments - Truy vấn vlog du lịch. Xử lý bởi VlogController.getComments. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/comments', validateParams(idParamSchema), validateQuery(vlogCommentsQuerySchema), VlogController.getComments);
// ROUTE: GET /:id - Lấy chi tiết theo ID vlog du lịch. Xử lý bởi VlogController.getById. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id', validateParams(idParamSchema), VlogController.getById);

// ==================== ADMIN ====================
// ROUTE: GET /admin/all - Truy vấn vlog du lịch. Xử lý bởi VlogController.getAllAdmin. Truy cập: yêu cầu đăng nhập, cần quyền vlogs:read.
router.get('/admin/all', authenticateToken, checkPermission('vlogs', 'read'), validateQuery(adminVlogQuerySchema), VlogController.getAllAdmin);
// ROUTE: GET /admin/:id - Truy vấn vlog du lịch. Xử lý bởi VlogController.getByIdAdmin. Truy cập: yêu cầu đăng nhập, cần quyền vlogs:read.
router.get('/admin/:id', authenticateToken, checkPermission('vlogs', 'read'), validateParams(idParamSchema), VlogController.getByIdAdmin);

// NV-44: Kiểm duyệt
// ROUTE: PATCH /admin/:id/moderate - Kiểm duyệt vlog du lịch. Xử lý bởi VlogController.moderate. Truy cập: yêu cầu đăng nhập, cần quyền vlogs:update.
router.patch('/admin/:id/moderate', authenticateToken, checkPermission('vlogs', 'update'), validateParams(idParamSchema), validateBody(moderateVlogSchema), VlogController.moderate );

// ==================== AUTHENTICATED USERS ====================

// NV-45: Like idempotent — PUT để thích, DELETE để bỏ thích
// ROUTE: PUT /:id/like - Tạo mới vlog du lịch. Xử lý bởi VlogController.addLike. Truy cập: yêu cầu đăng nhập.
router.put('/:id/like', authenticateToken, validateParams(idParamSchema), VlogController.addLike);
// ROUTE: DELETE /:id/like - Xóa vlog du lịch. Xử lý bởi VlogController.removeLike. Truy cập: yêu cầu đăng nhập.
router.delete('/:id/like', authenticateToken, validateParams(idParamSchema), VlogController.removeLike);

// NV-45: Save idempotent — PUT để lưu, DELETE để bỏ lưu
// ROUTE: GET /user/saved - Truy vấn vlog du lịch. Xử lý bởi VlogController.getSavedVlogs. Truy cập: yêu cầu đăng nhập.
router.get('/user/saved', authenticateToken, validateQuery(savedVlogQuerySchema), VlogController.getSavedVlogs);
// ROUTE: PUT /:id/save - Tạo mới vlog du lịch. Xử lý bởi VlogController.addSave. Truy cập: yêu cầu đăng nhập.
router.put('/:id/save', authenticateToken, validateParams(idParamSchema), VlogController.addSave);
// ROUTE: DELETE /:id/save - Xóa vlog du lịch. Xử lý bởi VlogController.removeSave. Truy cập: yêu cầu đăng nhập.
router.delete('/:id/save', authenticateToken, validateParams(idParamSchema), VlogController.removeSave);

// NV-45: Comments
// ROUTE: POST /:id/comments - Tạo mới vlog du lịch. Xử lý bởi VlogController.createComment. Truy cập: yêu cầu đăng nhập.
router.post('/:id/comments', authenticateToken, validateParams(idParamSchema), validateBody(createVlogCommentSchema), VlogController.createComment);
// ROUTE: DELETE /:id/comments/:commentId - Xóa vlog du lịch. Xử lý bởi VlogController.deleteComment. Truy cập: yêu cầu đăng nhập.
router.delete('/:id/comments/:commentId', authenticateToken, validateParams(vlogCommentParamSchema), VlogController.deleteComment);

// NV-43: Tạo vlog — upload ảnh/video lưu local
// ROUTE: POST / - Tạo mới vlog du lịch. Xử lý bởi VlogController.create. Truy cập: yêu cầu đăng nhập.
router.post('/', authenticateToken, upload.fields([ { name: 'cover_image_url', maxCount: 1 }, { name: 'media_urls', maxCount: 10 }, ]), upload.process(), validateBody(createVlogSchema), VlogController.create );

// ROUTE: PATCH /:id - Cập nhật vlog du lịch. Xử lý bởi VlogController.update. Truy cập: yêu cầu đăng nhập.
router.patch('/:id', authenticateToken, validateParams(idParamSchema), upload.fields([ { name: 'cover_image_url', maxCount: 1 }, { name: 'media_urls', maxCount: 10 }, ]), upload.process(), validateBody(updateVlogSchema), VlogController.update );

// ROUTE: DELETE /:id - Xóa vlog du lịch. Xử lý bởi VlogController.delete. Truy cập: yêu cầu đăng nhập.
router.delete('/:id', authenticateToken, validateParams(idParamSchema), VlogController.delete);

module.exports = router;
