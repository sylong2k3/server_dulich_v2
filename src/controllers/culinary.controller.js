const CulinaryService = require('../services/culinary.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class CulinaryController {
  static getAll = asyncHandler(async (req, res) => OK(res, 'Danh sách ẩm thực', await CulinaryService.getAll(req.query)));
  static getById = asyncHandler(async (req, res) => OK(res, 'Chi tiết món ẩm thực', await CulinaryService.getById(req.params.id, req.query)));
  static getCategories = asyncHandler(async (req, res) => OK(res, 'Danh mục ẩm thực', await CulinaryService.getCategories()));
  static create = asyncHandler(async (req, res) => CREATED(res, 'Thêm món ẩm thực thành công', await CulinaryService.create(req.body)));
  static update = asyncHandler(async (req, res) => OK(res, 'Cập nhật ẩm thực thành công', await CulinaryService.update(req.params.id, req.body)));
  static delete = asyncHandler(async (req, res) => { await CulinaryService.delete(req.params.id); return OK(res, 'Xóa món ẩm thực thành công'); });
}

module.exports = CulinaryController;
