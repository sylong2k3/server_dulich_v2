const TourRepository = require('../models/repositories/tour.repository');
const { Api404Error, Api409Error, Api403Error } = require('../core/error.response');
const { formatPagination } = require('../utils/responseFormatter');
const FKValidator = require('../utils/fk-validator');

class TourService {
    // ==================== TOUR PACKAGES ====================

    async getAll(query = {}, viewer = {}) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
        const status = this._canManage(viewer?.user) ? query.status : 'published';
        const { rows, total } = await TourRepository.findAll({ ...query, status, page, limit });
        const result = formatPagination(rows.map(({ total_count, ...r }) => r), total, page, limit);
        return { tours: result.data, pagination: result.pagination };
    }

    async getById(id, viewer = {}) {
        const tour = await TourRepository.findById(id);
        if (!tour || (tour.status !== 'published' && !this._canManage(viewer?.user))) throw new Api404Error('Không tìm thấy tour');
        return tour;
    }

    async getBySlug(slug, viewer = {}) {
        const tour = await TourRepository.findBySlug(slug);
        if (!tour || (tour.status !== 'published' && !this._canManage(viewer?.user))) throw new Api404Error('Không tìm thấy tour');
        return tour;
    }

    async create(data, user) {
        // Kiểm tra FK tồn tại (trả lỗi 400 rõ ràng thay vì 500 từ DB)
        await FKValidator.all([
            FKValidator.business(data.business_id, 'approved'),
            FKValidator.province(data.province_code),
        ]);

        if (await TourRepository.slugExists(data.slug)) {
            throw new Api409Error('Slug tour đã tồn tại');
        }

        // Gắn business_id từ user nếu không truyền vào và user là doanh nghiệp
        const business_id = data.business_id || null;
        const tour = await TourRepository.create({ ...data, business_id });

        if (data.status === 'published') {
            await TourRepository.update(tour.id, { published_at: new Date().toISOString() });
        }

        return TourRepository.findById(tour.id);
    }

    async update(id, data, user) {
        const existing = await TourRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy tour');

        await this._checkOwnerOrAdmin(existing, user);

        // Kiểm tra FK tồn tại nếu có thay đổi
        await FKValidator.all([
            FKValidator.business(data.business_id, 'approved'),
            FKValidator.province(data.province_code),
        ]);

        if (data.slug && data.slug !== existing.slug) {
            if (await TourRepository.slugExists(data.slug, id)) {
                throw new Api409Error('Slug tour đã tồn tại');
            }
        }

        // Ghi published_at khi publish lần đầu
        if (data.status === 'published' && existing.status !== 'published') {
            data.published_at = new Date().toISOString();
        }

        const updated = await TourRepository.update(id, data);
        if (!updated) throw new Api404Error('Không tìm thấy tour');
        return TourRepository.findById(id);
    }

    async delete(id, user) {
        const existing = await TourRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy tour');

        await this._checkOwnerOrAdmin(existing, user);
        return TourRepository.delete(id);
    }

    // ==================== STOPS ====================

    async getStops(tourId) {
        const tour = await TourRepository.findById(tourId);
        if (!tour) throw new Api404Error('Không tìm thấy tour');
        return TourRepository.getStopsByTourId(tourId);
    }

    async addStop(tourId, data, user) {
        const existing = await TourRepository.findById(tourId);
        if (!existing) throw new Api404Error('Không tìm thấy tour');
        await this._checkOwnerOrAdmin(existing, user);

        // Kiểm tra FK tồn tại cho stop
        await FKValidator.all([
            FKValidator.spot(data.spot_id),
            FKValidator.business(data.business_id, 'approved'),
        ]);

        return TourRepository.createStop({ ...data, tour_package_id: tourId });
    }

    async updateStop(tourId, stopId, data, user) {
        const tour = await TourRepository.findById(tourId);
        if (!tour) throw new Api404Error('Không tìm thấy tour');
        await this._checkOwnerOrAdmin(tour, user);

        const stop = await TourRepository.findStopById(stopId);
        if (!stop || stop.tour_package_id !== tourId) throw new Api404Error('Không tìm thấy điểm dừng');

        const updated = await TourRepository.updateStop(stopId, data);
        if (!updated) throw new Api404Error('Không tìm thấy điểm dừng');
        return updated;
    }

    async deleteStop(tourId, stopId, user) {
        const tour = await TourRepository.findById(tourId);
        if (!tour) throw new Api404Error('Không tìm thấy tour');
        await this._checkOwnerOrAdmin(tour, user);

        const stop = await TourRepository.findStopById(stopId);
        if (!stop || stop.tour_package_id !== tourId) throw new Api404Error('Không tìm thấy điểm dừng');

        return TourRepository.deleteStop(stopId);
    }

    // ==================== HELPERS ====================

    // Các role bypass kiểm tra quyền sở hữu tour
    static #BYPASS_ROLES = new Set(['system_admin', 'department_manager']);

    _checkOwnerOrAdmin(tour, user) {
        const roleCode = String(user?.role?.code || '').toLowerCase();

        // system_admin / department_manager bypass toàn bộ
        if (TourService.#BYPASS_ROLES.has(roleCode)) return;

        // Tour phải gắn với một business
        if (!tour.business_id) {
            throw new Api403Error('Tour không gắn với doanh nghiệp — không thể xác định quyền sở hữu');
        }

        // User phải có business_id và phải khớp với business của tour
        if (!user?.business_id) {
            throw new Api403Error('Tài khoản của bạn chưa liên kết với doanh nghiệp');
        }

        if (tour.business_id !== user.business_id) {
            throw new Api403Error('Bạn không có quyền chỉnh sửa tour của doanh nghiệp khác');
        }
    }

    _canManage(user) {
        return Boolean(user?.hasPermission?.('tours', 'update') || user?.hasPermission?.('tours', 'delete'));
    }
}

module.exports = new TourService();
