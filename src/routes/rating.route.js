const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/rating.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
    idParamSchema,
    createRatingSchema,
    updateRatingSchema,
    addReplySchema,
    updateStatusSchema,
    getRatingsQuerySchema,
} = require('../middlewares/validators/rating.validation');

// Public — xem đánh giá
// ROUTE: GET /business/my - Truy vấn đánh giá. Xử lý bởi RatingController.getManagedRatings. Truy cập: yêu cầu đăng nhập, cần quyền ratings:read.
router.get('/business/my', authenticateToken, checkPermission('ratings', 'read'), validateQuery(getRatingsQuerySchema), RatingController.getManagedRatings);

// ROUTE: GET / - Truy vấn đánh giá. Xử lý bởi RatingController.getRatings. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/', optionalAuth, validateQuery(getRatingsQuerySchema), RatingController.getRatings);

// Tourist — tạo đánh giá
// ROUTE: POST / - Tạo mới đánh giá. Xử lý bởi RatingController.createRating. Truy cập: yêu cầu đăng nhập.
router.post('/', authenticateToken, validateBody(createRatingSchema), RatingController.createRating);

// Tourist (own) — sửa đánh giá
// ROUTE: PATCH /:id - Cập nhật đánh giá. Xử lý bởi RatingController.updateRating. Truy cập: yêu cầu đăng nhập.
router.patch('/:id', authenticateToken, validateParams(idParamSchema), validateBody(updateRatingSchema), RatingController.updateRating);

// Tourist (own) hoặc Admin — xóa
// ROUTE: DELETE /:id - Xóa đánh giá. Xử lý bởi RatingController.deleteRating. Truy cập: yêu cầu đăng nhập.
router.delete('/:id', authenticateToken, validateParams(idParamSchema), RatingController.deleteRating);

// Business/Operator — phản hồi đánh giá (NV-24)
// ROUTE: POST /:id/reply - Tạo mới đánh giá. Xử lý bởi RatingController.addReply. Truy cập: yêu cầu đăng nhập, cần quyền ratings:update.
router.post('/:id/reply', authenticateToken, checkPermission('ratings', 'update'), validateParams(idParamSchema), validateBody(addReplySchema), RatingController.addReply);

// Authenticated — đánh dấu hữu ích
// ROUTE: POST /:id/helpful - Đánh dấu trạng thái đánh giá. Xử lý bởi RatingController.markHelpful. Truy cập: yêu cầu đăng nhập.
router.post('/:id/helpful', authenticateToken, validateParams(idParamSchema), RatingController.markHelpful);

// Admin — kiểm duyệt
// ROUTE: PATCH /:id/status - Cập nhật đánh giá. Xử lý bởi RatingController.updateStatus. Truy cập: yêu cầu đăng nhập, cần quyền ratings:delete.
router.patch('/:id/status', authenticateToken, checkPermission('ratings', 'delete'), validateParams(idParamSchema), validateBody(updateStatusSchema), RatingController.updateStatus);

module.exports = router;
