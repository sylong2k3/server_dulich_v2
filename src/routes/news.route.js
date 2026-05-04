const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/news.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateQuery, validateParams } = require('../middlewares/validation');
const {
    createNewsSchema,
    updateNewsSchema,
    queryNewsSchema,
    queryNewsCommentsSchema,
    createCommentSchema,
    updateCommentSchema,
    newsIdParamSchema,
    newsCommentParamSchema,
    publishStatusSchema,
    approvalStatusSchema,
} = require('../middlewares/validators/news.validation');

// ==================== NV-46: ADMIN endpoints — TRƯỚC /:slug để tránh conflict ====================
// ROUTE: GET /admin/all - Truy vấn tin tức. Xử lý bởi NewsController.getAllAdmin. Truy cập: yêu cầu đăng nhập, cần quyền news:read.
router.get('/admin/all', authenticateToken, checkPermission('news', 'read'), validateQuery(queryNewsSchema), NewsController.getAllAdmin );

// ROUTE: GET /admin/:id - Truy vấn tin tức. Xử lý bởi NewsController.getByIdAdmin. Truy cập: yêu cầu đăng nhập, cần quyền news:read.
router.get('/admin/:id', authenticateToken, checkPermission('news', 'read'), validateParams(newsIdParamSchema), NewsController.getByIdAdmin );

// ROUTE: PATCH /admin/:id/publish - Thiết lập tin tức. Xử lý bởi NewsController.setPublishStatus. Truy cập: yêu cầu đăng nhập, cần quyền news:update.
router.patch('/admin/:id/publish', authenticateToken, checkPermission('news', 'update'), validateParams(newsIdParamSchema), validateBody(publishStatusSchema), NewsController.setPublishStatus );

// ==================== PUBLIC ====================
// ROUTE: GET / - Lấy toàn bộ danh sách cho quản trị tin tức. Xử lý bởi NewsController.getAll. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/', validateQuery(queryNewsSchema), NewsController.getAll);
// ROUTE: GET /:id/comments - Truy vấn tin tức. Xử lý bởi NewsController.getComments. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/comments', validateParams(newsIdParamSchema), validateQuery(queryNewsCommentsSchema), NewsController.getComments);
// ROUTE: GET /:slug - Truy vấn tin tức. Xử lý bởi NewsController.getBySlug. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:slug', NewsController.getBySlug);

// ==================== PROTECTED ====================
// ROUTE: POST / - Tạo mới tin tức. Xử lý bởi NewsController.create. Truy cập: yêu cầu đăng nhập, cần quyền news:create.
router.post('/', authenticateToken, checkPermission('news', 'create'), validateBody(createNewsSchema), NewsController.create);
// ROUTE: PATCH /:id - Cập nhật tin tức. Xử lý bởi NewsController.update. Truy cập: yêu cầu đăng nhập, cần quyền news:update.
router.patch('/:id', authenticateToken, checkPermission('news', 'update'), validateParams(newsIdParamSchema), validateBody(updateNewsSchema), NewsController.update);
// ROUTE: DELETE /:id - Xóa tin tức. Xử lý bởi NewsController.delete. Truy cập: yêu cầu đăng nhập, cần quyền news:delete.
router.delete('/:id', authenticateToken, checkPermission('news', 'delete'), validateParams(newsIdParamSchema), NewsController.delete);

// NV-47: Bình luận tin tức
// ROUTE: POST /:id/comments - Tạo mới tin tức. Xử lý bởi NewsController.createComment. Truy cập: yêu cầu đăng nhập.
router.post('/:id/comments', authenticateToken, validateParams(newsIdParamSchema), validateBody(createCommentSchema), NewsController.createComment);
// ROUTE: PATCH /:id/comments/:commentId - Cập nhật tin tức. Xử lý bởi NewsController.updateComment. Truy cập: yêu cầu đăng nhập.
router.patch('/:id/comments/:commentId', authenticateToken, validateParams(newsCommentParamSchema), validateBody(updateCommentSchema), NewsController.updateComment);
// ROUTE: DELETE /:id/comments/:commentId - Xóa tin tức. Xử lý bởi NewsController.deleteComment. Truy cập: yêu cầu đăng nhập.
router.delete('/:id/comments/:commentId', authenticateToken, validateParams(newsCommentParamSchema), NewsController.deleteComment);

// NV-47: Duyệt/bỏ duyệt bình luận (admin/biên tập)
// ROUTE: PATCH /:id/comments/:commentId/approval - Phê duyệt tin tức. Xử lý bởi NewsController.approveComment. Truy cập: yêu cầu đăng nhập, cần quyền news:update.
router.patch('/:id/comments/:commentId/approval', authenticateToken, checkPermission('news', 'update'), validateParams(newsCommentParamSchema), validateBody(approvalStatusSchema), NewsController.approveComment );

module.exports = router;
