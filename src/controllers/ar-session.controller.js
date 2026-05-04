const arSessionService = require('../services/ar-session.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class ArSessionController {
    static record = asyncHandler(async (req, res) => {
        const session = await arSessionService.record(req.body, req.user.id);
        return CREATED(res, 'Ghi nhận phiên AR thành công', { session });
    });

    static getMyHistory = asyncHandler(async (req, res) => {
        const result = await arSessionService.getMyHistory(req.user.id, req.query);
        return OK(res, 'Lịch sử AR của bạn', result);
    });

    static getById = asyncHandler(async (req, res) => {
        const session = await arSessionService.getById(req.params.id, req.user);
        return OK(res, 'Chi tiết phiên AR', { session });
    });

    static getBySpot = asyncHandler(async (req, res) => {
        const result = await arSessionService.getBySpot(req.params.spotId, req.query);
        return OK(res, 'Phiên AR tại điểm du lịch', result);
    });

    static getStats = asyncHandler(async (req, res) => {
        const stats = await arSessionService.getStats(req.query.spot_id || null);
        return OK(res, 'Thống kê AR', { stats });
    });
}

module.exports = ArSessionController;
