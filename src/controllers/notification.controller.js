const asyncHandler = require('../helpers/async-handler');
const { OK } = require('../core/success.response');
const notificationService = require('../services/notification.service');

class NotificationController {
  // NV-48: Quản trị viên gửi thông báo đẩy
  static createNotification = asyncHandler(async (req, res) => {
    const result = await notificationService.dispatchNotification({
      ...req.body,
      triggered_by: req.user?.id || 'system',
    });

    return OK(res, 'Gửi thông báo thành công', result);
  });

  // Lấy thông báo của chính mình
  static getMyNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await notificationService.getNotifications({
      ...req.query,
      user_id: userId,
      unread_only: req.query.unread_only === true,
    });

    return OK(res, 'Lấy danh sách thông báo thành công', result);
  });

  // Đánh dấu 1 thông báo đã đọc
  static markAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(req.params.id, userId);

    return OK(res, 'Đã đánh dấu thông báo đã đọc', { notification: notification.toJSON() });
  });

  // NV-49: Số thông báo chưa đọc (badge)
  static getUnreadCount = asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    return OK(res, 'Số thông báo chưa đọc', { unread_count: count });
  });

  // Đánh dấu tất cả thông báo đã đọc
  static markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const count = await notificationService.markAllAsRead(userId);

    return OK(res, 'Đã đánh dấu tất cả thông báo đã đọc', { updated_count: count });
  });

  // Xóa 1 thông báo
  static deleteNotification = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await notificationService.deleteNotification(req.params.id, userId);

    return OK(res, 'Xóa thông báo thành công', null);
  });

  // Xóa tất cả thông báo của mình
  static deleteAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const count = await notificationService.deleteAllNotifications(userId);

    return OK(res, 'Xóa tất cả thông báo thành công', { deleted_count: count });
  });
}

module.exports = NotificationController;
