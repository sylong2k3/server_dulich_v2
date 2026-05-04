const { CREATED, OK } = require('../core/success.response');
const OfflineService = require('../services/offline.service');
const asyncHandler = require('../helpers/async-handler');

class OfflineController {
    static requestDownload = asyncHandler(async (req, res) => {
        const result = await OfflineService.requestDownload(req.user.id, req.body);
        return CREATED(res, 'Yêu cầu tải bản đồ offline thành công', result);
    });

    static getDownloads = asyncHandler(async (req, res) => {
        const result = await OfflineService.getUserDownloads(req.user.id);
        return OK(res, 'Danh sách bản đồ offline đã tải', { downloads: result });
    });

    // FIX #4: Xem chi tiết 1 bản đồ đã tải
    static getDownloadById = asyncHandler(async (req, res) => {
        const result = await OfflineService.getDownloadById(req.params.id, req.user.id);
        return OK(res, 'Chi tiết bản đồ offline', { download: result });
    });

    // FIX #4: Xóa 1 bản đồ đã tải
    static deleteDownload = asyncHandler(async (req, res) => {
        await OfflineService.deleteDownload(req.params.id, req.user.id);
        return OK(res, 'Đã xóa bản đồ offline', {});
    });
}

module.exports = OfflineController;