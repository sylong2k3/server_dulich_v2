const FestivalService = require('../services/festival.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class FestivalController {
    // ==================== PUBLIC ====================
    static getAll = asyncHandler(async (req, res) => OK(res, 'Danh sách lễ hội', await FestivalService.getAll(req.query)));
    static getCalendar = asyncHandler(async (req, res) => OK(res, 'Lịch lễ hội', { events: await FestivalService.getCalendar(req.query) }));
    static getById = asyncHandler(async (req, res) => OK(res, 'Chi tiết lễ hội', await FestivalService.getById(req.params.id, req.query)));
    static getTypes = asyncHandler(async (req, res) => OK(res, 'Loại lễ hội', await FestivalService.getTypes()));

    // ==================== ADMIN — không cache ====================
    static getAdminAll = asyncHandler(async (req, res) => OK(res, 'Danh sách lễ hội (admin)', await FestivalService.getAdminAll(req.query)));
    static getAdminById = asyncHandler(async (req, res) => OK(res, 'Chi tiết lễ hội (admin)', await FestivalService.getAdminById(req.params.id, req.query)));

    // ==================== MUTATIONS ====================
    static create = asyncHandler(async (req, res) => CREATED(res, 'Thêm lễ hội thành công', await FestivalService.create(req.body)));
    static update = asyncHandler(async (req, res) => OK(res, 'Cập nhật lễ hội thành công', await FestivalService.update(req.params.id, req.body)));
    static delete = asyncHandler(async (req, res) => { await FestivalService.delete(req.params.id); return OK(res, 'Xóa lễ hội thành công'); });
}

module.exports = FestivalController;
