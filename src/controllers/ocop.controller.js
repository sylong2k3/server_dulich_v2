const OcopService = require('../services/ocop.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class OcopController {
  static getAll = asyncHandler(async (req, res) => OK(res, 'Danh sách sản phẩm OCOP', await OcopService.getAll(req.query, { user: req.user })));
  static getById = asyncHandler(async (req, res) => OK(res, 'Chi tiết sản phẩm OCOP', await OcopService.getById(req.params.id, { user: req.user })));
  static getCategories = asyncHandler(async (req, res) => OK(res, 'Danh mục OCOP', await OcopService.getCategories()));
  static create = asyncHandler(async (req, res) => CREATED(res, 'Thêm sản phẩm OCOP thành công', await OcopService.create(req.body)));
  static update = asyncHandler(async (req, res) => OK(res, 'Cập nhật sản phẩm OCOP thành công', await OcopService.update(req.params.id, req.body)));
  static delete = asyncHandler(async (req, res) => { await OcopService.delete(req.params.id); return OK(res, 'Xóa sản phẩm OCOP thành công'); });
}

module.exports = OcopController;
