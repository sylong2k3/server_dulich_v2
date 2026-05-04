const tourService = require('../services/tour.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class TourController {
    // ==================== TOUR PACKAGES ====================

    static getAll = asyncHandler(async (req, res) => {
        const result = await tourService.getAll(req.query, { user: req.user });
        return OK(res, 'Danh sách tour', result);
    });

    static getById = asyncHandler(async (req, res) => {
        const tour = await tourService.getById(req.params.id, { user: req.user });
        return OK(res, 'Chi tiết tour', { tour });
    });

    static getBySlug = asyncHandler(async (req, res) => {
        const tour = await tourService.getBySlug(req.params.slug, { user: req.user });
        return OK(res, 'Chi tiết tour', { tour });
    });

    static create = asyncHandler(async (req, res) => {
        const tour = await tourService.create(req.body, req.user);
        return CREATED(res, 'Tạo tour thành công', { tour });
    });

    static update = asyncHandler(async (req, res) => {
        const tour = await tourService.update(req.params.id, req.body, req.user);
        return OK(res, 'Cập nhật tour thành công', { tour });
    });

    static delete = asyncHandler(async (req, res) => {
        await tourService.delete(req.params.id, req.user);
        return OK(res, 'Xóa tour thành công');
    });

    // ==================== STOPS ====================

    static getStops = asyncHandler(async (req, res) => {
        const stops = await tourService.getStops(req.params.id);
        return OK(res, 'Danh sách điểm dừng', { stops });
    });

    static addStop = asyncHandler(async (req, res) => {
        const stop = await tourService.addStop(req.params.id, req.body, req.user);
        return CREATED(res, 'Thêm điểm dừng thành công', { stop });
    });

    static updateStop = asyncHandler(async (req, res) => {
        const stop = await tourService.updateStop(req.params.id, req.params.stopId, req.body, req.user);
        return OK(res, 'Cập nhật điểm dừng thành công', { stop });
    });

    static deleteStop = asyncHandler(async (req, res) => {
        await tourService.deleteStop(req.params.id, req.params.stopId, req.user);
        return OK(res, 'Xóa điểm dừng thành công');
    });
}

module.exports = TourController;
