const CitizenFeedbackRepository = require('../models/repositories/citizen-feedback.repository');
const { Api404Error, Api403Error } = require('../core/error.response');
const NotificationService = require('./notification.service');
const { query } = require('../configs/database');

class CitizenFeedbackService {
  static async getAll(query) {
    const { page = 1, limit = 10, search, status, moderation_status, priority, user_id, start_date, end_date, sortBy, sortOrder } = query;
    const { rows, total } = await CitizenFeedbackRepository.findAll({ page, limit, search, status, moderation_status, priority, user_id, start_date, end_date, sortBy, sortOrder });
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Người dùng chỉ thấy phản ánh đã được duyệt hoặc của chính mình
  static async getPublic(query) {
    return CitizenFeedbackService.getAll({ ...query, moderation_status: 'approved' });
  }

  static async getMy(userId, query) {
    return CitizenFeedbackService.getAll({ ...query, user_id: userId });
  }

  static async getById(id, viewer = {}) {
    const item = await CitizenFeedbackRepository.findById(id);
    if (!item) throw new Api404Error('Không tìm thấy phản ánh');

    const viewerId = viewer.userId || null;
    const viewerRole = viewer.roleCode || null;
    const isOwner = viewerId && item.user_id === viewerId;
    const canModerate = ['system_admin', 'ministry_manager', 'department_manager'].includes(viewerRole);

    if (item.moderation_status !== 'approved' && !isOwner && !canModerate) {
      throw new Api404Error('Không tìm thấy phản ánh');
    }

    return item;
  }

  static async create(data, userId) {
    const feedback = await CitizenFeedbackRepository.create({ ...data, user_id: userId || null });

    // NV-25: Thông báo tới Sở VHTTDL (các role có quyền feedbacks:read)
    CitizenFeedbackService._notifyAdminRoles(feedback).catch(() => {});

    return feedback;
  }

  static async _notifyAdminRoles(feedback) {
    // Lấy role IDs có quyền feedbacks:read
    const { rows } = await query(`
      SELECT DISTINCT rp.role_id
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE p.resource = 'feedbacks' AND p.action = 'read'
    `);
    const roleIds = rows.map((r) => r.role_id);

    const priorityLabel = { low: 'Thấp', normal: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' };
    await NotificationService.createNotification({
      target_roles: roleIds.length ? roleIds : null,
      type: 'feedback_new',
      title_vi: `📩 Phản ánh mới: ${feedback.title}`,
      body_vi: `Mức độ: ${priorityLabel[feedback.priority] || feedback.priority}. ${feedback.location_text ? 'Vị trí: ' + feedback.location_text : ''}`,
      data: { feedback_id: feedback.id, priority: feedback.priority },
      triggered_by: 'citizen_feedback',
    }, { broadcastUser: false });
  }

  static async update(id, data, userId, isAdmin) {
    const existing = await CitizenFeedbackRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy phản ánh');
    // Chỉ cho sửa khi còn pending và là chủ sở hữu
    if (!isAdmin) {
      if (existing.user_id !== userId) throw new Api403Error('Không có quyền sửa phản ánh này');
      if (existing.status !== 'pending') throw new Api403Error('Không thể sửa phản ánh đã được xử lý');
    }
    const updated = await CitizenFeedbackRepository.update(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy phản ánh');
    return updated;
  }

  static async updateStatus(id, data) {
    const existing = await CitizenFeedbackRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy phản ánh');
    const updated = await CitizenFeedbackRepository.updateStatus(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy phản ánh');

    // NV-26: Thông báo người phản ánh khi trạng thái thay đổi
    if (existing.user_id && data.status && data.status !== existing.status) {
      CitizenFeedbackService._notifySubmitter(existing.user_id, updated, data.admin_response).catch(() => {});
    }

    return updated;
  }

  static async _notifySubmitter(userId, feedback, adminResponse) {
    const statusLabel = {
      in_progress: 'đang được xử lý',
      resolved: 'đã được giải quyết',
      closed: 'đã đóng',
    };
    const label = statusLabel[feedback.status];
    if (!label) return;

    await NotificationService.createNotification({
      user_id: userId,
      type: 'feedback_status_updated',
      title_vi: `📋 Phản ánh của bạn ${label}`,
      body_vi: adminResponse
        ? `Phản hồi: ${adminResponse}`
        : `Phản ánh "${feedback.title}" ${label}.`,
      data: { feedback_id: feedback.id, status: feedback.status },
      triggered_by: 'citizen_feedback',
    }, { broadcastChannel: false });
  }

  static async updateModerationStatus(id, data) {
    const existing = await CitizenFeedbackRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy phản ánh');
    const updated = await CitizenFeedbackRepository.updateModerationStatus(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy phản ánh');
    return updated;
  }

  static async delete(id) {
    const existing = await CitizenFeedbackRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy phản ánh');
    await CitizenFeedbackRepository.delete(id);
  }
}

module.exports = CitizenFeedbackService;
