const itineraryService = require('../services/itinerary.service');
const itineraryAiService = require('../services/itinerary-ai.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class ItineraryController {
    // ==================== ITINERARIES ====================

    static getAll = asyncHandler(async (req, res) => {
        const result = await itineraryService.getAll(req.user.id, req.query);
        return OK(res, 'Danh sách lịch trình', result);
    });

    static getById = asyncHandler(async (req, res) => {
        const itinerary = await itineraryService.getById(req.params.id, req.user?.id);
        return OK(res, 'Chi tiết lịch trình', { itinerary });
    });

    static create = asyncHandler(async (req, res) => {
        const itinerary = await itineraryService.create(req.body, req.user.id);
        return CREATED(res, 'Tạo lịch trình thành công', { itinerary });
    });

    static update = asyncHandler(async (req, res) => {
        const itinerary = await itineraryService.update(req.params.id, req.body, req.user.id);
        return OK(res, 'Cập nhật lịch trình thành công', { itinerary });
    });

    static delete = asyncHandler(async (req, res) => {
        await itineraryService.delete(req.params.id, req.user.id);
        return OK(res, 'Xóa lịch trình thành công');
    });

    // ==================== NV-28: AI GENERATE ====================

    static aiGenerate = asyncHandler(async (req, res) => {
        const itinerary = await itineraryAiService.generate(req.body, req.user.id);
        return CREATED(res, 'Tạo lịch trình AI thành công', { itinerary });
    });

    // ==================== NV-29: SHARE & PDF ====================

    static share = asyncHandler(async (req, res) => {
        const result = await itineraryService.share(req.params.id, req.user.id);
        return OK(res, 'Đã bật chia sẻ lịch trình', result);
    });

    static unshare = asyncHandler(async (req, res) => {
        const result = await itineraryService.unshare(req.params.id, req.user.id);
        return OK(res, 'Đã tắt chia sẻ lịch trình', result);
    });

    static getByShareToken = asyncHandler(async (req, res) => {
        const itinerary = await itineraryService.getByShareToken(req.params.token);
        return OK(res, 'Lịch trình được chia sẻ', { itinerary });
    });

    static exportPdf = asyncHandler(async (req, res) => {
        const buffer = await itineraryService.exportPdf(req.params.id, req.user?.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="itinerary-${req.params.id}.pdf"`);
        res.end(buffer);
    });

    // ==================== DAYS ====================

    static getDays = asyncHandler(async (req, res) => {
        const days = await itineraryService.getDays(req.params.id, req.user?.id);
        return OK(res, 'Danh sách ngày', { days });
    });

    static addDay = asyncHandler(async (req, res) => {
        const day = await itineraryService.addDay(req.params.id, req.body, req.user.id);
        return CREATED(res, 'Thêm ngày thành công', { day });
    });

    static updateDay = asyncHandler(async (req, res) => {
        const day = await itineraryService.updateDay(req.params.id, Number(req.params.dayId), req.body, req.user.id);
        return OK(res, 'Cập nhật ngày thành công', { day });
    });

    static deleteDay = asyncHandler(async (req, res) => {
        await itineraryService.deleteDay(req.params.id, Number(req.params.dayId), req.user.id);
        return OK(res, 'Xóa ngày thành công');
    });

    // ==================== STOPS ====================

    static addStop = asyncHandler(async (req, res) => {
        const stop = await itineraryService.addStop(req.params.id, Number(req.params.dayId), req.body, req.user.id);
        return CREATED(res, 'Thêm điểm dừng thành công', { stop });
    });

    static updateStop = asyncHandler(async (req, res) => {
        const stop = await itineraryService.updateStop(req.params.id, req.params.stopId, req.body, req.user.id);
        return OK(res, 'Cập nhật điểm dừng thành công', { stop });
    });

    static deleteStop = asyncHandler(async (req, res) => {
        await itineraryService.deleteStop(req.params.id, req.params.stopId, req.user.id);
        return OK(res, 'Xóa điểm dừng thành công');
    });
}

module.exports = ItineraryController;
