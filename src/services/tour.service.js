const TourRepository = require('../models/repositories/tour.repository');
const { Api404Error, Api409Error, Api403Error } = require('../core/error.response');
const { formatPagination } = require('../utils/responseFormatter');
const FKValidator = require('../utils/fk-validator');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { normalizeLang } = require('../utils/i18n.utils');

const TOUR_CACHE_TTL = 60;

class TourService {
    // ==================== TOUR PACKAGES ====================

    // Public list — chỉ trả tour đã published, có cache 60s.
    async getAll(query = {}, viewer = {}) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
        const lang = normalizeLang(query.lang);
        // Normalize cache key — chỉ dùng các filter ảnh hưởng đến kết quả
        const cacheKey = [
            'tours:list',
            lang,
            `p${page}`,
            `l${limit}`,
            query.province_code || 'all',
            query.business_id || 'any',
            query.is_featured ?? '',
            query.duration_days || '',
            query.price_min || '',
            query.price_max || '',
            query.search || '',
            query.sortBy || 'created_at',
            query.sortOrder || 'DESC',
        ].join(':');
        const { rows, total } = await cacheOrFetch(
            cacheKey,
            () => TourRepository.findAll({ ...query, status: 'published', page, limit, lang }),
            TOUR_CACHE_TTL,
        );
        const result = formatPagination(rows.map(({ total_count, ...r }) => r), total, page, limit);
        return { tours: result.data, pagination: result.pagination };
    }

    /**
     * Admin list — KHÔNG cache: admin cần thấy thay đổi ngay sau CRUD,
     * traffic thấp, filter mở rộng (status/business_id/province_code).
     */
    async getAdminAll(query = {}) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
        const lang = normalizeLang(query.lang);
        const { rows, total } = await TourRepository.findAll({ ...query, page, limit, lang });
        const result = formatPagination(rows.map(({ total_count, ...r }) => r), total, page, limit);
        return { tours: result.data, pagination: result.pagination };
    }

    async getById(id, viewer = {}, query = {}) {
        const lang = normalizeLang(query.lang);
        const canManage = this._canManage(viewer?.user);
        const cacheKey = `tours:id:${id}:${lang}:${canManage ? 'manage' : 'public'}`;
        return cacheOrFetch(cacheKey, async () => {
            const tour = await TourRepository.findById(id, lang);
            if (!tour || (tour.status !== 'published' && !canManage)) throw new Api404Error('Không tìm thấy tour');
            return tour;
        }, TOUR_CACHE_TTL);
    }

    // Admin detail — KHÔNG cache, thấy mọi trạng thái.
    async getAdminById(id, query = {}) {
        const lang = normalizeLang(query.lang);
        const tour = await TourRepository.findById(id, lang);
        if (!tour) throw new Api404Error('Không tìm thấy tour');
        return tour;
    }

    async getBySlug(slug, viewer = {}, query = {}) {
        const lang = normalizeLang(query.lang);
        const canManage = this._canManage(viewer?.user);
        const cacheKey = `tours:slug:${slug}:${lang}:${canManage ? 'manage' : 'public'}`;
        return cacheOrFetch(cacheKey, async () => {
            const tour = await TourRepository.findBySlug(slug, lang);
            if (!tour || (tour.status !== 'published' && !canManage)) throw new Api404Error('Không tìm thấy tour');
            return tour;
        }, TOUR_CACHE_TTL);
    }

    async create(data, user) {
        await FKValidator.all([
            FKValidator.business(data.business_id, 'approved'),
            FKValidator.province(data.province_code),
        ]);

        if (await TourRepository.slugExists(data.slug)) {
            throw new Api409Error('Slug tour đã tồn tại');
        }

        const business_id = data.business_id || null;
        const tour = await TourRepository.create({ ...data, business_id });

        if (data.status === 'published') {
            await TourRepository.update(tour.id, { published_at: new Date().toISOString() });
        }

        invalidateByPrefix('tours:');
        return TourRepository.findById(tour.id);
    }

    async update(id, data, user) {
        const existing = await TourRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy tour');

        await this._checkOwnerOrAdmin(existing, user);

        await FKValidator.all([
            FKValidator.business(data.business_id, 'approved'),
            FKValidator.province(data.province_code),
        ]);

        if (data.slug && data.slug !== existing.slug) {
            if (await TourRepository.slugExists(data.slug, id)) {
                throw new Api409Error('Slug tour đã tồn tại');
            }
        }

        if (data.status === 'published' && existing.status !== 'published') {
            data.published_at = new Date().toISOString();
        }

        const updated = await TourRepository.update(id, data);
        if (!updated) throw new Api404Error('Không tìm thấy tour');
        invalidateByPrefix('tours:');
        return TourRepository.findById(id);
    }

    async delete(id, user) {
        const existing = await TourRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy tour');

        await this._checkOwnerOrAdmin(existing, user);
        const result = await TourRepository.delete(id);
        invalidateByPrefix('tours:');
        return result;
    }

    // ==================== STOPS ====================

    async getStops(tourId, query = {}) {
        const tour = await TourRepository.findById(tourId);
        if (!tour) throw new Api404Error('Không tìm thấy tour');
        const lang = normalizeLang(query.lang);
        return TourRepository.getStopsByTourId(tourId, lang);
    }

    async addStop(tourId, data, user) {
        const existing = await TourRepository.findById(tourId);
        if (!existing) throw new Api404Error('Không tìm thấy tour');
        await this._checkOwnerOrAdmin(existing, user);

        await FKValidator.all([
            FKValidator.spot(data.spot_id),
            FKValidator.business(data.business_id, 'approved'),
        ]);

        const result = await TourRepository.createStop({ ...data, tour_package_id: tourId });
        invalidateByPrefix('tours:');
        return result;
    }

    async updateStop(tourId, stopId, data, user) {
        const tour = await TourRepository.findById(tourId);
        if (!tour) throw new Api404Error('Không tìm thấy tour');
        await this._checkOwnerOrAdmin(tour, user);

        const stop = await TourRepository.findStopById(stopId);
        if (!stop || stop.tour_package_id !== tourId) throw new Api404Error('Không tìm thấy điểm dừng');

        const updated = await TourRepository.updateStop(stopId, data);
        if (!updated) throw new Api404Error('Không tìm thấy điểm dừng');
        invalidateByPrefix('tours:');
        return updated;
    }

    async deleteStop(tourId, stopId, user) {
        const tour = await TourRepository.findById(tourId);
        if (!tour) throw new Api404Error('Không tìm thấy tour');
        await this._checkOwnerOrAdmin(tour, user);

        const stop = await TourRepository.findStopById(stopId);
        if (!stop || stop.tour_package_id !== tourId) throw new Api404Error('Không tìm thấy điểm dừng');

        const result = await TourRepository.deleteStop(stopId);
        invalidateByPrefix('tours:');
        return result;
    }

    // ==================== HELPERS ====================

    static #BYPASS_ROLES = new Set(['system_admin', 'department_manager']);

    _checkOwnerOrAdmin(tour, user) {
        const roleCode = String(user?.role?.code || '').toLowerCase();

        if (TourService.#BYPASS_ROLES.has(roleCode)) return;

        if (!tour.business_id) {
            throw new Api403Error('Tour không gắn với doanh nghiệp — không thể xác định quyền sở hữu');
        }

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
