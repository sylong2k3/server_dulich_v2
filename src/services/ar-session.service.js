const ArSessionRepository = require('../models/repositories/ar-session.repository');
const SpotRepository = require('../models/repositories/spot.repository');
const { Api404Error, Api403Error } = require('../core/error.response');

/**
 * Role có quyền xem tất cả session (không bị giới hạn ownership).
 * Phải có analytics:read — được kiểm tra tại route layer, ở đây chỉ check code.
 */
const ANALYTICS_ROLES = new Set([
    'system_admin', 'ministry_manager', 'department_manager',
]);

class ArSessionService {
    async record(data, userId) {
        if (data.spot_id) {
            const exists = await SpotRepository.existsById(data.spot_id, true);
            if (!exists) throw new Api404Error('Điểm du lịch không tồn tại');
        }
        const session = await ArSessionRepository.create({ ...data, user_id: userId });
        return session;
    }

    async getMyHistory(userId, queryParams) {
        return ArSessionRepository.getByUser(userId, queryParams);
    }

    async getBySpot(spotId, queryParams) {
        const exists = await SpotRepository.existsById(spotId);
        if (!exists) throw new Api404Error('Điểm du lịch không tồn tại');
        return ArSessionRepository.getBySpot(spotId, queryParams);
    }

    async getStats(spotId = null) {
        if (spotId) {
            const exists = await SpotRepository.existsById(spotId);
            if (!exists) throw new Api404Error('Điểm du lịch không tồn tại');
        }
        return ArSessionRepository.getStats(spotId);
    }

    /**
     * Xem chi tiết 1 phiên AR.
     * - User thường: chỉ xem session của chính mình.
     * - Admin / manager (ANALYTICS_ROLES): xem được tất cả.
     *
     * @param {string} id      - UUID của session
     * @param {object} caller  - req.user
     */
    async getById(id, caller) {
        const session = await ArSessionRepository.findById(id);
        if (!session) throw new Api404Error('AR session không tồn tại');

        const callerCode = String(caller?.role?.code || '').toLowerCase();
        const isPrivileged = ANALYTICS_ROLES.has(callerCode);

        if (!isPrivileged && String(session.user_id) !== String(caller?.id)) {
            throw new Api403Error('Bạn không có quyền xem phiên AR này');
        }

        return session;
    }
}

module.exports = new ArSessionService();
