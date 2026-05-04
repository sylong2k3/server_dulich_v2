const { CREATED, OK } = require('../core/success.response');
const GpsService = require('../services/gps.service');
const asyncHandler = require('../helpers/async-handler');

class GpsController {
    static startTrack = asyncHandler(async (req, res) => {
        const result = await GpsService.startTrack(req.user.id, req.body);
        return CREATED(res, "Bắt đầu theo dõi lộ trình GPS", result);
    });

    static endTrack = asyncHandler(async (req, res) => {
        const { trackId } = req.params;
        const result = await GpsService.endTrack(req.user.id, trackId, req.body);
        return OK(res, "Kết thúc lộ trình GPS", result);
    });

    static syncPoints = asyncHandler(async (req, res) => {
        const { trackId } = req.params;
        const result = await GpsService.syncPoints(req.user.id, trackId, req.body);
        return OK(res, "Đồng bộ điểm GPS thành công", result);
    });
}

module.exports = GpsController;