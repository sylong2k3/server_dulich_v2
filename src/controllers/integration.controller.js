const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');
const IntegrationService = require('../services/integration.service');

class IntegrationController {
  static list = asyncHandler(async (req, res) => {
    const result = await IntegrationService.list(req.query);
    return OK(res, 'Danh sách tích hợp bên thứ 3', result);
  });

  static getById = asyncHandler(async (req, res) => {
    const result = await IntegrationService.getById(req.params.id);
    return OK(res, 'Chi tiết tích hợp', result);
  });

  static create = asyncHandler(async (req, res) => {
    const result = await IntegrationService.create(req.body);
    return CREATED(res, 'Tạo tích hợp thành công', result);
  });

  static update = asyncHandler(async (req, res) => {
    const result = await IntegrationService.update(req.params.id, req.body);
    return OK(res, 'Cập nhật tích hợp thành công', result);
  });

  static delete = asyncHandler(async (req, res) => {
    await IntegrationService.delete(req.params.id);
    return OK(res, 'Xóa tích hợp thành công');
  });

  static triggerSync = asyncHandler(async (req, res) => {
    const result = await IntegrationService.triggerSync(req.params.id, req.user?.id || 'system');
    return OK(res, 'Đồng bộ tích hợp thành công', result);
  });

  static getLogs = asyncHandler(async (req, res) => {
    const result = await IntegrationService.getLogs(req.params.id, req.query);
    return OK(res, 'Nhật ký đồng bộ', result);
  });
}

module.exports = IntegrationController;
