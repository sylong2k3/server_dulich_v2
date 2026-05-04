const vrHotspotService = require('../services/vr-hotspot.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class VrHotspotController {
    static getVrHotspots = asyncHandler(async (req, res) => {
        const hotspots = await vrHotspotService.getVrHotspots(req.params.id, req.params.mediaId);
        return OK(res, 'Lấy danh sách VR hotspot thành công', { hotspots });
    });

    static createVrHotspot = asyncHandler(async (req, res) => {
        const hotspot = await vrHotspotService.createVrHotspot(req.params.id, req.params.mediaId, req.body);
        return CREATED(res, 'Tạo VR hotspot thành công', { hotspot });
    });

    static updateVrHotspot = asyncHandler(async (req, res) => {
        const hotspot = await vrHotspotService.updateVrHotspot(
            req.params.id,
            req.params.mediaId,
            req.params.hotspotId,
            req.body
        );
        return OK(res, 'Cập nhật VR hotspot thành công', { hotspot });
    });

    static deleteVrHotspot = asyncHandler(async (req, res) => {
        await vrHotspotService.deleteVrHotspot(req.params.id, req.params.mediaId, req.params.hotspotId);
        return OK(res, 'Xóa VR hotspot thành công', {});
    });
}

module.exports = VrHotspotController;
