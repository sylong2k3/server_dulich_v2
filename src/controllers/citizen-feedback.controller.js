const CitizenFeedbackService = require('../services/citizen-feedback.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class CitizenFeedbackController {
  // Public — chỉ thấy đã được duyệt
  static getPublic = asyncHandler(async (req, res) => OK(res, 'Danh sách phản ánh', await CitizenFeedbackService.getPublic(req.query)));

  // Admin — thấy tất cả
  static getAll = asyncHandler(async (req, res) => OK(res, 'Danh sách phản ánh (admin)', await CitizenFeedbackService.getAll(req.query)));

  static getById = asyncHandler(async (req, res) => OK(res, 'Chi tiết phản ánh', await CitizenFeedbackService.getById(req.params.id, {
    userId: req.user?.id,
    roleCode: req.user?.role?.code,
  })));

  static getMy = asyncHandler(async (req, res) => OK(res, 'Danh sách phản ánh của tôi', await CitizenFeedbackService.getMy(req.user.id, req.query)));

  static create = asyncHandler(async (req, res) => {
    const result = await CitizenFeedbackService.create(req.body, req.user.id);
    return CREATED(res, 'Gửi phản ánh thành công', result);
  });

  static update = asyncHandler(async (req, res) => {
    const isAdmin = req.user?.role?.code === 'system_admin';
    const result = await CitizenFeedbackService.update(req.params.id, req.body, req.user.id, isAdmin);
    return OK(res, 'Cập nhật phản ánh thành công', result);
  });

  static updateStatus = asyncHandler(async (req, res) => {
    const result = await CitizenFeedbackService.updateStatus(req.params.id, req.body);
    return OK(res, 'Cập nhật trạng thái thành công', result);
  });

  static updateModerationStatus = asyncHandler(async (req, res) => {
    const result = await CitizenFeedbackService.updateModerationStatus(req.params.id, req.body);
    return OK(res, 'Cập nhật kiểm duyệt thành công', result);
  });

  static delete = asyncHandler(async (req, res) => {
    await CitizenFeedbackService.delete(req.params.id);
    return OK(res, 'Xóa phản ánh thành công');
  });
}

module.exports = CitizenFeedbackController;
