const crypto = require('crypto');
const ItineraryRepository = require('../models/repositories/itinerary.repository');
const { Api404Error, Api403Error } = require('../core/error.response');
const { formatPagination } = require('../utils/responseFormatter');
const { buildItineraryPdf } = require('../utils/itinerary-pdf');
const FKValidator = require('../utils/fk-validator');

class ItineraryService {
    // ==================== ITINERARIES ====================

    async getAll(userId, query = {}) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
        const { rows, total } = await ItineraryRepository.findAllByUser(userId, { ...query, page, limit });
        const result = formatPagination(rows, total, page, limit);
        return { itineraries: result.data, pagination: result.pagination };
    }

    async getById(id, userId) {
        const itinerary = await ItineraryRepository.findById(id);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');
        if (!itinerary.is_public) this._assertOwner(itinerary, userId);
        const days = await ItineraryRepository.getDays(id);
        return { ...itinerary, days };
    }

    async create(data, userId) {
        const itinerary = await ItineraryRepository.create({ ...data, user_id: userId });

        // Nếu public ngay từ đầu, tạo share_token
        if (data.is_public) {
            const token = crypto.randomBytes(16).toString('hex');
            await ItineraryRepository.update(itinerary.id, { share_token: token });
        }

        return ItineraryRepository.findById(itinerary.id);
    }

    async update(id, data, userId) {
        const existing = await ItineraryRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(existing, userId);

        // Bật public → sinh share_token nếu chưa có
        if (data.is_public === true && !existing.share_token) {
            data.share_token = crypto.randomBytes(16).toString('hex');
        }
        // Tắt public → xóa share_token
        if (data.is_public === false) {
            data.share_token = null;
        }

        await ItineraryRepository.update(id, data);

        // Tính lại tổng khoảng cách sau mỗi lần cập nhật
        const totalKm = await ItineraryRepository.calcTotalDistance(id);
        if (totalKm !== null) {
            await ItineraryRepository.update(id, { total_distance_km: totalKm });
        }

        return this.getById(id, userId);
    }

    async delete(id, userId) {
        const existing = await ItineraryRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(existing, userId);
        return ItineraryRepository.delete(id);
    }

    // ==================== DAYS ====================

    async getDays(id, userId) {
        const itinerary = await ItineraryRepository.findById(id);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');
        if (!itinerary.is_public) this._assertOwner(itinerary, userId);
        return ItineraryRepository.getDays(id);
    }

    async addDay(itineraryId, data, userId) {
        const itinerary = await ItineraryRepository.findById(itineraryId);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(itinerary, userId);
        return ItineraryRepository.createDay({ ...data, itinerary_id: itineraryId });
    }

    async updateDay(itineraryId, dayId, data, userId) {
        const itinerary = await ItineraryRepository.findById(itineraryId);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(itinerary, userId);

        const day = await ItineraryRepository.findDayById(dayId);
        if (!day || day.itinerary_id !== itineraryId) throw new Api404Error('Không tìm thấy ngày lịch trình');

        const updated = await ItineraryRepository.updateDay(dayId, data);
        if (!updated) throw new Api404Error('Không tìm thấy ngày lịch trình');
        return updated;
    }

    async deleteDay(itineraryId, dayId, userId) {
        const itinerary = await ItineraryRepository.findById(itineraryId);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(itinerary, userId);

        const day = await ItineraryRepository.findDayById(dayId);
        if (!day || day.itinerary_id !== itineraryId) throw new Api404Error('Không tìm thấy ngày lịch trình');
        return ItineraryRepository.deleteDay(dayId);
    }

    // ==================== STOPS ====================

    async addStop(itineraryId, dayId, data, userId) {
        const itinerary = await ItineraryRepository.findById(itineraryId);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(itinerary, userId);

        const day = await ItineraryRepository.findDayById(dayId);
        if (!day || day.itinerary_id !== itineraryId) throw new Api404Error('Không tìm thấy ngày lịch trình');

        // Kiểm tra FK: spot_id phải tồn tại nếu được cung cấp
        await FKValidator.spot(data.spot_id);

        const stop = await ItineraryRepository.createStop({ ...data, day_id: dayId });

        // Cập nhật tổng khoảng cách
        const totalKm = await ItineraryRepository.calcTotalDistance(itineraryId);
        if (totalKm !== null) {
            await ItineraryRepository.update(itineraryId, { total_distance_km: totalKm });
        }

        return stop;
    }

    async updateStop(itineraryId, stopId, data, userId) {
        const itinerary = await ItineraryRepository.findById(itineraryId);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(itinerary, userId);

        const stop = await ItineraryRepository.findStopById(stopId);
        if (!stop) throw new Api404Error('Không tìm thấy điểm dừng');

        // Xác nhận stop thuộc itinerary này
        const day = await ItineraryRepository.findDayById(stop.day_id);
        if (!day || day.itinerary_id !== itineraryId) throw new Api404Error('Không tìm thấy điểm dừng');

        // Kiểm tra FK: spot_id nếu có thay đổi
        await FKValidator.spot(data.spot_id);

        const updated = await ItineraryRepository.updateStop(stopId, data);
        if (!updated) throw new Api404Error('Không tìm thấy điểm dừng');

        // Cập nhật tổng khoảng cách
        const totalKm = await ItineraryRepository.calcTotalDistance(itineraryId);
        if (totalKm !== null) {
            await ItineraryRepository.update(itineraryId, { total_distance_km: totalKm });
        }

        return updated;
    }

    async deleteStop(itineraryId, stopId, userId) {
        const itinerary = await ItineraryRepository.findById(itineraryId);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(itinerary, userId);

        const stop = await ItineraryRepository.findStopById(stopId);
        if (!stop) throw new Api404Error('Không tìm thấy điểm dừng');

        const day = await ItineraryRepository.findDayById(stop.day_id);
        if (!day || day.itinerary_id !== itineraryId) throw new Api404Error('Không tìm thấy điểm dừng');

        return ItineraryRepository.deleteStop(stopId);
    }

    // ==================== NV-29: SHARE & PDF ====================

    async share(id, userId) {
        const existing = await ItineraryRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(existing, userId);

        const token = existing.share_token || crypto.randomBytes(16).toString('hex');
        await ItineraryRepository.update(id, { is_public: true, share_token: token });

        return { share_token: token, share_url: `/itineraries/shared/${token}` };
    }

    async unshare(id, userId) {
        const existing = await ItineraryRepository.findById(id);
        if (!existing) throw new Api404Error('Không tìm thấy lịch trình');
        this._assertOwner(existing, userId);
        await ItineraryRepository.update(id, { is_public: false, share_token: null });
        return { message: 'Đã tắt chia sẻ lịch trình' };
    }

    async getByShareToken(token) {
        const itinerary = await ItineraryRepository.findByShareToken(token);
        if (!itinerary) throw new Api404Error('Lịch trình không tồn tại hoặc chưa được chia sẻ');
        const days = await ItineraryRepository.getDays(itinerary.id);
        return { ...itinerary, days };
    }

    async exportPdf(id, userId) {
        const itinerary = await ItineraryRepository.findById(id);
        if (!itinerary) throw new Api404Error('Không tìm thấy lịch trình');

        // Cho phép xem PDF nếu là owner hoặc lịch trình public
        if (!itinerary.is_public) this._assertOwner(itinerary, userId);

        const days = await ItineraryRepository.getDays(id);
        return buildItineraryPdf({ ...itinerary, days });
    }

    // ==================== HELPERS ====================

    _assertOwner(itinerary, userId) {
        if (itinerary.user_id !== userId) {
            throw new Api403Error('Bạn không có quyền truy cập lịch trình này');
        }
    }
}

module.exports = new ItineraryService();
