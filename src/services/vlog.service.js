const VlogRepository = require('../models/repositories/vlog.repository');
const NotificationService = require('./notification.service');
const { Api404Error, Api403Error } = require('../core/error.response');

const ADMIN_CODES = ['system_admin'];

const isAdmin = (user) => ADMIN_CODES.includes(String(user?.role?.code || '').toLowerCase());

class VlogService {
    static async getAll(query) {
        const { page = 1, limit = 12, search, platform, user_id, sortBy, sortOrder } = query;
        const { rows, total } = await VlogRepository.findAll({ page, limit, search, platform, user_id, sortBy, sortOrder });
        return {
            items: rows.map(({ total_count, ...item }) => item),
            pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    static async getAllAdmin(query) {
        const { page = 1, limit = 12, search, status, user_id, sortBy, sortOrder } = query;
        const { rows, total } = await VlogRepository.findAllAdmin({ page, limit, search, status, user_id, sortBy, sortOrder });
        return {
            items: rows.map(({ total_count, ...item }) => item),
            pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    static async getById(id) {
        const item = await VlogRepository.findById(id);
        if (!item) throw new Api404Error('Không tìm thấy bài vlog');
        if (item.status !== 'published') throw new Api404Error('Bài vlog không tồn tại hoặc chưa được duyệt');
        await VlogRepository.incrementViewCount(id);
        return item;
    }

    static async getByIdAdmin(id) {
        const item = await VlogRepository.findById(id);
        if (!item) throw new Api404Error('Không tìm thấy bài vlog');
        return item;
    }

    // NV-43: Tạo vlog — status=pending
    static async create(data, userId) {
        return VlogRepository.create({ ...data, user_id: userId });
    }

    static async update(id, data, userId, user) {
        const existing = await VlogRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy bài vlog');
        if (!isAdmin(user) && existing.user_id !== userId) throw new Api403Error('Không có quyền sửa bài vlog này');

        const nextData = { ...data };
        // Nếu tác giả chỉnh sửa bài đã từng duyệt/từ chối, bài quay lại hàng chờ kiểm duyệt.
        if (!isAdmin(user) && existing.status !== 'pending') {
            nextData.status = 'pending';
            nextData.moderated_by = null;
            nextData.moderated_at = null;
            nextData.rejection_note = null;
        }

        const updated = await VlogRepository.update(id, nextData);
        if (!updated) throw new Api404Error('Không tìm thấy bài vlog');
        return updated;
    }

    static async delete(id, userId, user) {
        const existing = await VlogRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy bài vlog');
        if (!isAdmin(user) && existing.user_id !== userId) throw new Api403Error('Không có quyền xóa bài vlog này');
        await VlogRepository.delete(id);
    }

    // NV-44: Kiểm duyệt — chỉ admin
    static async moderate(id, { status, rejection_note }, adminId) {
        const existing = await VlogRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy bài vlog');

        if (!['pending', 'published', 'rejected'].includes(existing.status)) {
            throw new Api403Error('Không thể kiểm duyệt bài vlog ở trạng thái này');
        }

        const updated = await VlogRepository.moderate(id, {
            status,
            moderated_by: adminId,
            rejection_note,
        });

        // Thông báo tác giả
        if (existing.user_id) {
            const isPublished = status === 'published';
            NotificationService.createNotification({
                user_id: existing.user_id,
                title: isPublished ? 'Bài vlog đã được duyệt' : 'Bài vlog bị từ chối',
                body: isPublished
                    ? `"${existing.title}" đã được phê duyệt và hiển thị công khai.`
                    : `"${existing.title}" bị từ chối. Lý do: ${rejection_note || 'Không có lý do'}`,
                type: isPublished ? 'vlog_approved' : 'vlog_rejected',
                reference_id: id,
                reference_type: 'vlog',
            }, { broadcastChannel: false, broadcastUser: true }).catch(() => { });
        }

        return updated;
    }

    // NV-45: Like idempotent
    static async addLike(id, userId) {
        const existing = await VlogRepository.findById(id);
        if (!existing || existing.status !== 'published') throw new Api404Error('Không tìm thấy bài vlog');
        return VlogRepository.addLike(userId, id);
    }

    static async removeLike(id, userId) {
        const existing = await VlogRepository.findById(id);
        if (!existing || existing.status !== 'published') throw new Api404Error('Không tìm thấy bài vlog');
        return VlogRepository.removeLike(userId, id);
    }

    // ==================== NV-45: COMMENTS ====================

    static async getComments(vlogId, query) {
        const vlog = await VlogRepository.findById(vlogId);
        if (!vlog || vlog.status !== 'published') throw new Api404Error('Không tìm thấy bài vlog');
        const { page = 1, limit = 20 } = query;
        const { rows, total } = await VlogRepository.findCommentsByVlogId(vlogId, { page, limit });
        return {
            items: rows,
            pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    static async createComment(vlogId, data, userId) {
        const vlog = await VlogRepository.findById(vlogId);
        if (!vlog || vlog.status !== 'published') throw new Api404Error('Không tìm thấy bài vlog');

        if (data.parent_id) {
            const parentComment = await VlogRepository.findCommentById(data.parent_id);
            if (!parentComment || parentComment.vlog_id !== vlogId) {
                throw new Api404Error('Không tìm thấy bình luận cha');
            }
        }

        return VlogRepository.createComment({ vlog_id: vlogId, user_id: userId, ...data });
    }

    static async deleteComment(vlogId, commentId, userId, user) {
        const comment = await VlogRepository.findCommentById(commentId);
        if (!comment || comment.vlog_id !== vlogId) throw new Api404Error('Không tìm thấy bình luận');
        if (!isAdmin(user) && comment.user_id !== userId) throw new Api403Error('Không có quyền xóa bình luận này');
        return VlogRepository.deleteComment(commentId, vlogId);
    }

    // ==================== NV-45: SAVE ====================

    static async addSave(vlogId, userId) {
        const vlog = await VlogRepository.findById(vlogId);
        if (!vlog || vlog.status !== 'published') throw new Api404Error('Không tìm thấy bài vlog');
        return VlogRepository.addSave(userId, vlogId);
    }

    static async removeSave(vlogId, userId) {
        const vlog = await VlogRepository.findById(vlogId);
        if (!vlog || vlog.status !== 'published') throw new Api404Error('Không tìm thấy bài vlog');
        return VlogRepository.removeSave(userId, vlogId);
    }

    static async getSavedVlogs(userId, query) {
        const { page = 1, limit = 12 } = query;
        const { rows, total } = await VlogRepository.getSavedByUser(userId, { page, limit });
        return {
            items: rows.map(({ total_count, ...item }) => item),
            pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}

module.exports = VlogService;
