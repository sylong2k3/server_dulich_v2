const express = require('express');
const router = express.Router();
const CitizenFeedbackController = require('../controllers/citizen-feedback.controller');
const { authenticateToken, checkPermission, optionalAuth } = require('../middlewares/auth.middleware');
const { validateBody, validateQuery, validateParams } = require('../middlewares/validation');
const {
  createFeedbackSchema,
  updateFeedbackSchema,
  updateStatusSchema,
  updateModerationStatusSchema,
  getFeedbacksQuerySchema,
  idParamSchema,
} = require('../middlewares/validators/citizen-feedback.validation');

// ==================== PUBLIC ====================
// ROUTE: GET / - Lấy danh sách công khai phản ánh của người dân/du khách. Xử lý bởi CitizenFeedbackController.getPublic. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/', validateQuery(getFeedbacksQuerySchema), CitizenFeedbackController.getPublic);
// ROUTE: GET /me - Lấy danh sách phản ánh của tài khoản đang đăng nhập. Xử lý bởi CitizenFeedbackController.getMy. Truy cập: yêu cầu đăng nhập.
router.get('/me', authenticateToken, validateQuery(getFeedbacksQuerySchema), CitizenFeedbackController.getMy);

// ==================== ADMIN / SỞ ====================
// ROUTE: GET /admin/all - Lấy toàn bộ danh sách cho quản trị phản ánh của người dân/du khách. Xử lý bởi CitizenFeedbackController.getAll. Truy cập: yêu cầu đăng nhập, cần quyền feedbacks:read.
router.get('/admin/all', authenticateToken, checkPermission('feedbacks', 'read'), validateQuery(getFeedbacksQuerySchema), CitizenFeedbackController.getAll);

// ROUTE: GET /:id - Lấy chi tiết theo ID phản ánh của người dân/du khách. Xử lý bởi CitizenFeedbackController.getById. Truy cập: cho phép đăng nhập tùy chọn, khách chỉ xem phản ánh đã được duyệt.
router.get('/:id', optionalAuth, validateParams(idParamSchema), CitizenFeedbackController.getById);
// ROUTE: POST / - Tạo mới phản ánh của người dân/du khách. Xử lý bởi CitizenFeedbackController.create. Truy cập: yêu cầu đăng nhập.
router.post('/', authenticateToken, validateBody(createFeedbackSchema), CitizenFeedbackController.create);

// ==================== AUTHENTICATED USERS ====================
// ROUTE: PUT /:id - Cập nhật phản ánh của người dân/du khách. Xử lý bởi CitizenFeedbackController.update. Truy cập: yêu cầu đăng nhập.
router.put('/:id', authenticateToken, validateParams(idParamSchema), validateBody(updateFeedbackSchema), CitizenFeedbackController.update);
// ROUTE: PATCH /:id/status - Cập nhật phản ánh của người dân/du khách. Xử lý bởi CitizenFeedbackController.updateStatus. Truy cập: yêu cầu đăng nhập, cần quyền feedbacks:update.
router.patch('/:id/status', authenticateToken, checkPermission('feedbacks', 'update'), validateParams(idParamSchema), validateBody(updateStatusSchema), CitizenFeedbackController.updateStatus);
// ROUTE: PATCH /:id/moderation - Cập nhật phản ánh của người dân/du khách. Xử lý bởi CitizenFeedbackController.updateModerationStatus. Truy cập: yêu cầu đăng nhập, cần quyền feedbacks:update.
router.patch('/:id/moderation', authenticateToken, checkPermission('feedbacks', 'update'), validateParams(idParamSchema), validateBody(updateModerationStatusSchema), CitizenFeedbackController.updateModerationStatus);
// ROUTE: DELETE /:id - Xóa phản ánh của người dân/du khách. Xử lý bởi CitizenFeedbackController.delete. Truy cập: yêu cầu đăng nhập, cần quyền feedbacks:delete.
router.delete('/:id', authenticateToken, checkPermission('feedbacks', 'delete'), validateParams(idParamSchema), CitizenFeedbackController.delete);

module.exports = router;
