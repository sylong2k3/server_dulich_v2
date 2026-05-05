const VoucherRepository = require('../models/repositories/voucher.repository');
const BusinessRepository = require('../models/repositories/business.repository');
const { Api400Error, Api403Error, Api404Error, Api409Error } = require('../core/error.response');

class VoucherService {
    async _assertOwner(businessId, userId) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');
        if (business.owner_id !== userId) throw new Api403Error('Bạn không có quyền quản lý voucher của doanh nghiệp này');
        if (business.status !== 'approved') throw new Api403Error('Doanh nghiệp chưa được phê duyệt');
        return business;
    }

    async getByBusiness(businessId, userId, queryParams) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');
        if (business.owner_id !== userId) throw new Api403Error('Bạn không có quyền xem voucher của doanh nghiệp này');

        const { rows, total } = await VoucherRepository.findByBusinessId(businessId, queryParams);
        return {
            items: rows.map(({ total_count, ...v }) => v),
            pagination: {
                page: +queryParams.page || 1,
                limit: +queryParams.limit || 20,
                total,
                totalPages: Math.ceil(total / (queryParams.limit || 20)),
            },
        };
    }

    /**
     * Admin: xem voucher của tất cả doanh nghiệp — KHÔNG cache.
     * Dùng cho dashboard quản lý cấp tỉnh/bộ.
     */
    async getAdminAll(queryParams = {}) {
        const page = +queryParams.page || 1;
        const limit = +queryParams.limit || 20;
        const { rows, total } = await VoucherRepository.findAllAdmin({ ...queryParams, page, limit });
        return {
            items: rows.map(({ total_count, ...v }) => v),
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Admin: chi tiết một voucher bất kỳ — KHÔNG cache, không cần là owner.
     */
    async getAdminById(voucherId) {
        const voucher = await VoucherRepository.findById(voucherId);
        if (!voucher) throw new Api404Error('Không tìm thấy voucher');
        return voucher;
    }

    async create(businessId, data, userId) {
        await this._assertOwner(businessId, userId);
        try {
            const voucher = await VoucherRepository.create({ ...data, business_id: businessId });
            return voucher;
        } catch (err) {
            if (err?.code === '23505') throw new Api409Error('Mã voucher đã tồn tại');
            throw err;
        }
    }

    async update(businessId, voucherId, data, userId) {
        await this._assertOwner(businessId, userId);
        const voucher = await VoucherRepository.findById(voucherId);
        if (!voucher || voucher.business_id !== businessId) throw new Api404Error('Không tìm thấy voucher');

        const updated = await VoucherRepository.update(voucherId, data);
        if (!updated) throw new Api400Error('Không có thay đổi nào được thực hiện');
        return updated;
    }

    async deactivate(businessId, voucherId, userId) {
        await this._assertOwner(businessId, userId);
        const voucher = await VoucherRepository.findById(voucherId);
        if (!voucher || voucher.business_id !== businessId) throw new Api404Error('Không tìm thấy voucher');

        return VoucherRepository.deactivate(voucherId);
    }

    // NV-41: Geo-targeted nearby vouchers
    async getNearby(lng, lat, radiusM) {
        return VoucherRepository.findNearby(lng, lat, radiusM);
    }

    // NV-41: Validate voucher + geofence check
    async validate(code, { lng, lat, order_value } = {}) {
        const voucher = await VoucherRepository.findByCode(code);
        if (!voucher) throw new Api404Error('Voucher không tồn tại hoặc đã bị vô hiệu');

        const now = new Date();
        if (voucher.valid_from && new Date(voucher.valid_from) > now) {
            throw new Api400Error('Voucher chưa có hiệu lực');
        }
        if (voucher.valid_until && new Date(voucher.valid_until) < now) {
            throw new Api400Error('Voucher đã hết hạn');
        }
        if (voucher.max_uses != null && voucher.used_count >= voucher.max_uses) {
            throw new Api400Error('Voucher đã đạt giới hạn sử dụng');
        }
        if (order_value != null && voucher.min_order_value != null && order_value < voucher.min_order_value) {
            throw new Api400Error(`Đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString('vi-VN')} VNĐ để áp dụng voucher`);
        }

        // Kiểm tra geofence nếu voucher có địa lý
        if (voucher.geo_target_geom && voucher.geo_radius_m) {
            if (lng == null || lat == null) {
                throw new Api400Error('Vui lòng cung cấp vị trí để xác thực voucher địa lý');
            }
            const within = await VoucherRepository.checkGeofence(
                voucher.geo_target_geom, voucher.geo_radius_m, lng, lat,
            );
            if (!within) {
                throw new Api400Error('Bạn không trong phạm vi áp dụng voucher này');
            }
        }

        const discount = voucher.discount_type === 'percentage'
            ? { type: 'percentage', value: voucher.discount_value, display: `${voucher.discount_value}%` }
            : { type: 'fixed', value: voucher.discount_value, display: `${Number(voucher.discount_value).toLocaleString('vi-VN')} VNĐ` };

        return {
            valid: true,
            voucher: {
                id: voucher.id,
                code: voucher.code,
                title_vi: voucher.title_vi,
                business_name: voucher.business_name,
                discount,
                valid_until: voucher.valid_until,
            },
        };
    }
}

module.exports = new VoucherService();
