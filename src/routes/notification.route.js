const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateQuery, validateParams } = require('../middlewares/validation');
const { queryNotificationSchema, createNotificationSchema } = require('../middlewares/validators/notification.validation');
const { idParamSchema } = require('../middlewares/validators/common/id-param.schema');

// NV-48: Quản trị viên gửi thông báo đẩy
// ROUTE: POST / - Tạo mới thông báo. Xử lý bởi notificationController.createNotification. Truy cập: yêu cầu đăng nhập, cần quyền notifications:create.
router.post('/', authenticateToken, checkPermission('notifications', 'create'), validateBody(createNotificationSchema), notificationController.createNotification );

// NV-49: Lấy thông báo của tôi
// ROUTE: GET /me - Lấy thông tin thuộc về tài khoản đang đăng nhập thông báo. Xử lý bởi notificationController.getMyNotifications. Truy cập: yêu cầu đăng nhập.
router.get('/me', authenticateToken, validateQuery(queryNotificationSchema), notificationController.getMyNotifications);

// NV-49: Số thông báo chưa đọc (badge count) — PHẢI đặt trước /:id/read
// ROUTE: GET /unread-count - Truy vấn thông báo. Xử lý bởi notificationController.getUnreadCount. Truy cập: yêu cầu đăng nhập.
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

// NV-49: Đánh dấu tất cả đã đọc — PHẢI đặt trước /:id/read để tránh bị match /:id = 'read-all'
// ROUTE: PATCH /read-all - Đánh dấu trạng thái thông báo. Xử lý bởi notificationController.markAllAsRead. Truy cập: yêu cầu đăng nhập.
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead);

// NV-49: Đánh dấu 1 thông báo đã đọc
// ROUTE: PATCH /:id/read - Đánh dấu trạng thái thông báo. Xử lý bởi notificationController.markAsRead. Truy cập: yêu cầu đăng nhập.
router.patch('/:id/read', authenticateToken, validateParams(idParamSchema), notificationController.markAsRead);

// Xóa 1 thông báo
// ROUTE: DELETE /:id - Xóa thông báo. Xử lý bởi notificationController.deleteNotification. Truy cập: yêu cầu đăng nhập.
router.delete('/:id', authenticateToken, validateParams(idParamSchema), notificationController.deleteNotification);

// Xóa tất cả thông báo của tôi
// ROUTE: DELETE / - Xóa thông báo. Xử lý bởi notificationController.deleteAllNotifications. Truy cập: yêu cầu đăng nhập.
router.delete('/', authenticateToken, notificationController.deleteAllNotifications);

module.exports = router;
