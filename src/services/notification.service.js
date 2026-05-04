const NotificationRepository = require("../models/repositories/notification.repository");
const UserRepository = require("../models/repositories/user.repository");
const { notifyChannel, notifyUser } = require("../realtime/websocket.server");
const { formatPagination } = require("../utils/responseFormatter");
const { Api400Error, Api404Error } = require("../core/error.response");

const resolveNotificationEvent = (type) => {
  if (type === "alert_forest" || type === "cron_alert")
    return "notification:alert_forest";
  if (type === "info_forest" || type === "cron_info")
    return "notification:info_forest";
  if (typeof type === "string" && type.startsWith("feedback"))
    return "notification:feedback";
  return "notification:new";
};

const normalizeNotificationPayload = (data = {}) => {
  const titleVi =
    typeof data.title_vi === "string" && data.title_vi.trim()
      ? data.title_vi.trim()
      : typeof data.title === "string" && data.title.trim()
        ? data.title.trim()
        : null;

  const bodyVi =
    typeof data.body_vi === "string"
      ? data.body_vi
      : typeof data.body === "string"
        ? data.body
        : null;

  return {
    ...data,
    title_vi: titleVi,
    body_vi: bodyVi,
  };
};

class NotificationService {
  async createNotification(data = {}, options = {}) {
    const { broadcastChannel = true, broadcastUser = true } = options;
    const payloadData = normalizeNotificationPayload(data);
    if (!payloadData.delivery_status && !payloadData.user_id) {
      payloadData.delivery_status = "sent";
    }
    const notification = await NotificationRepository.create(payloadData);

    const payload = notification.toJSON();
    const eventName = resolveNotificationEvent(payload.type);
    if (broadcastChannel) {
      notifyChannel("notifications", eventName, payload);
    }

    if (broadcastUser && notification.user_id) {
      notifyUser(notification.user_id, eventName, payload);
    }

    return notification;
  }

  async dispatchNotification(data = {}) {
    const payload = normalizeNotificationPayload(data);
    if (!payload.type) {
      throw new Api400Error("Loại thông báo là bắt buộc");
    }

    if (!payload.title_vi) {
      throw new Api400Error("Tiêu đề thông báo là bắt buộc");
    }

    const hasUserTarget = Boolean(payload.user_id);
    const safeRoleIds = (Array.isArray(payload.role_ids) ? payload.role_ids : [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const hasRoleTarget = safeRoleIds.length > 0;
    const hasBroadcastAll = payload.send_all === true;
    const hasGeoTarget =
      payload.target_lng !== null && payload.target_lng !== undefined &&
      payload.target_lat !== null && payload.target_lat !== undefined;

    if (!hasUserTarget && !hasRoleTarget && !hasBroadcastAll && !hasGeoTarget) {
      throw new Api400Error("Cần ít nhất một đối tượng nhận thông báo");
    }

    if (hasBroadcastAll) {
      const result = await this.createNotificationForAllUsers(payload);
      return { mode: "all", total: result.total };
    }

    if (hasRoleTarget) {
      const result = await this.createNotificationForRoleIds(payload, safeRoleIds);
      return { mode: "roles", total: result.total };
    }

    if (hasUserTarget) {
      const notification = await this.createNotification(payload, {
        broadcastChannel: false,
        broadcastUser: true,
      });
      return { mode: "user", total: 1, notification: notification.toJSON() };
    }

    const notification = await this.createNotification(
      {
        ...payload,
        user_id: null,
      },
      {
        broadcastChannel: true,
        broadcastUser: false,
      },
    );
    return { mode: "geo", total: 1, notification: notification.toJSON() };
  }

  /**
   * CRIT-03 FIX: Thay thế N+1 INSERT bằng single bulk INSERT sử dụng UNNEST
   *
   * BEFORE: Promise.all(userIds.map(id => this.createNotification({ user_id: id })))
   *   → 1000 users = 1000 INSERT queries + 1000 WebSocket broadcasts
   *
   * AFTER: Single INSERT ... SELECT unnest($1::uuid[]) + batched WS broadcasts
   *   → 1 INSERT query + chunked WS broadcasts
   *
   * Performance: 10-100x faster for mass notifications
   */
  async createNotificationForAllUsers(data = {}) {
    const users = await UserRepository.getAllActiveUserIds();
    const userIds = users
      .map((u) => (typeof u.id === "string" ? u.id.trim() : String(u.id || "").trim()))
      .filter(Boolean);

    if (!userIds.length) {
      return { total: 0 };
    }

    // Bulk insert — 1 query thay vì N queries
    const normalizedData = normalizeNotificationPayload(data);
    await NotificationRepository.bulkCreateForUsers(userIds, normalizedData);

    // Broadcast WebSocket theo batch để không làm nghẽn event loop
    const eventName = resolveNotificationEvent(normalizedData.type);
    const broadcastPayload = {
      type: normalizedData.type,
      title_vi: normalizedData.title_vi,
      body_vi: normalizedData.body_vi,
      data: normalizedData.data || null,
    };

    const WS_BATCH_SIZE = 100;
    for (let i = 0; i < userIds.length; i += WS_BATCH_SIZE) {
      const batch = userIds.slice(i, i + WS_BATCH_SIZE);
      for (const userId of batch) {
        notifyUser(userId, eventName, broadcastPayload);
      }
      // Nhường event loop cho các request khác giữa các batch
      if (i + WS_BATCH_SIZE < userIds.length) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return { total: userIds.length };
  }

  /**
   * CRIT-03 FIX: Tương tự, thay thế N+1 cho role-targeted notifications
   */
  async createNotificationForRoleIds(data = {}, roleIds = []) {
    const safeRoleIds = roleIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (!safeRoleIds.length) {
      return { total: 0 };
    }

    // Lấy tất cả users thuộc các role cùng lúc thay vì N query riêng
    const usersByRole = await UserRepository.getUsersByRoleIds(safeRoleIds);

    const userIds = [
      ...new Set(
        usersByRole
          .map((user) => (typeof user?.id === "string" ? user.id.trim() : String(user?.id || "").trim()))
          .filter(Boolean),
      ),
    ];

    if (!userIds.length) {
      return { total: 0 };
    }

    // Bulk insert — 1 query
    const normalizedData = normalizeNotificationPayload({
      ...data,
      target_roles: safeRoleIds,
    });
    await NotificationRepository.bulkCreateForUsers(userIds, normalizedData);

    // Broadcast WebSocket theo batch
    const eventName = resolveNotificationEvent(normalizedData.type);
    const broadcastPayload = {
      type: normalizedData.type,
      title_vi: normalizedData.title_vi,
      body_vi: normalizedData.body_vi,
      data: normalizedData.data || null,
    };

    const WS_BATCH_SIZE = 100;
    for (let i = 0; i < userIds.length; i += WS_BATCH_SIZE) {
      const batch = userIds.slice(i, i + WS_BATCH_SIZE);
      for (const userId of batch) {
        notifyUser(userId, eventName, broadcastPayload);
      }
      if (i + WS_BATCH_SIZE < userIds.length) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return { total: userIds.length };
  }

  async getNotifications(options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 10);

    const { notifications, totalCount } = await NotificationRepository.findAll({
      page,
      limit,
      user_id: options.user_id,
      unread_only: options.unread_only,
      type: options.type,
      delivery_status: options.delivery_status,
    });

    const result = formatPagination(
      notifications.map((item) => item.toJSON()),
      totalCount,
      page,
      limit,
    );
    const unreadCount = options.user_id
      ? await NotificationRepository.countUnreadByUser(options.user_id)
      : 0;
    return {
      notifications: result.data,
      pagination: result.pagination,
      unread_count: unreadCount,
    };
  }

  async markAsRead(id, userId = null) {
    const notification = await NotificationRepository.markAsRead(id, userId);
    if (!notification) {
      throw new Api404Error("Thông báo không tồn tại");
    }

    return notification;
  }

  async getUnreadCount(userId) {
    return NotificationRepository.countUnreadByUser(userId);
  }

  async markAllAsRead(userId) {
    return NotificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id, userId) {
    const deleted = await NotificationRepository.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new Api404Error("Thông báo không tồn tại");
    }
    return deleted;
  }

  async deleteAllNotifications(userId) {
    return NotificationRepository.deleteAllByUser(userId);
  }
}

module.exports = new NotificationService();
