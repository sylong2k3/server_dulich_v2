const OcopService = require('../services/ocop.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class OcopController {
  // ==================== PUBLIC ====================
  static getAll = asyncHandler(async (req, res) => OK(res, 'Danh sách sản phẩm OCOP', await OcopService.getAll(req.query, { user: req.user })));
  static getById = asyncHandler(async (req, res) => OK(res, 'Chi tiết sản phẩm OCOP', await OcopService.getById(req.params.id, { user: req.user }, req.query)));
  static getCategories = asyncHandler(async (req, res) => OK(res, 'Danh mục OCOP', await OcopService.getCategories()));
  
  static getOcopGeoJSON = asyncHandler(async (req, res) => OK(res, 'Lấy GeoJSON sản phẩm OCOP thành công', await OcopService.getOcopGeoJSON(req.query)));

  // ==================== OWNER ====================
  static getMy = asyncHandler(async (req, res) => OK(res, 'Sản phẩm OCOP của tôi', await OcopService.getMy(req.query, req.user)));

  // ==================== ADMIN — không cache ====================
  static getAdminAll = asyncHandler(async (req, res) => OK(res, 'Danh sách sản phẩm OCOP (admin)', await OcopService.getAdminAll(req.query)));
  static getAdminById = asyncHandler(async (req, res) => OK(res, 'Chi tiết sản phẩm OCOP (admin)', await OcopService.getAdminById(req.params.id, req.query)));

  // ==================== MUTATIONS ====================
  static create = asyncHandler(async (req, res) => CREATED(res, 'Thêm sản phẩm OCOP thành công', await OcopService.create(req.body)));
  static update = asyncHandler(async (req, res) => OK(res, 'Cập nhật sản phẩm OCOP thành công', await OcopService.update(req.params.id, req.body)));
  static delete = asyncHandler(async (req, res) => { await OcopService.delete(req.params.id); return OK(res, 'Xóa sản phẩm OCOP thành công'); });
}

module.exports = OcopController;
