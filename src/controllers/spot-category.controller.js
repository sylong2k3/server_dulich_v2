const SpotCategoryService = require('../services/spot-category.service');
const { OK, CREATED } = require('../core/success.response');
const asyncHandler = require('../helpers/async-handler');

class SpotCategoryController {
  // GET /spot-categories
  static getAll = asyncHandler(async (req, res) => {
    const result = await SpotCategoryService.getAll(req.query);
    return OK(res, 'Danh sách danh mục điểm du lịch', result);
  });

  // GET /spot-categories/tree
  static getTree = asyncHandler(async (req, res) => {
    const result = await SpotCategoryService.getTree(true);
    return OK(res, 'Cây danh mục điểm du lịch', result);
  });

  // GET /spot-categories/:id
  static getById = asyncHandler(async (req, res) => {
    const result = await SpotCategoryService.getById(parseInt(req.params.id));
    return OK(res, 'Chi tiết danh mục điểm du lịch', result);
  });

  // POST /spot-categories
  static create = asyncHandler(async (req, res) => {
    const result = await SpotCategoryService.create(req.body);
    return CREATED(res, 'Tạo danh mục điểm du lịch thành công', result);
  });

  // PUT /spot-categories/:id
  static update = asyncHandler(async (req, res) => {
    const result = await SpotCategoryService.update(parseInt(req.params.id), req.body);
    return OK(res, 'Cập nhật danh mục điểm du lịch thành công', result);
  });

  // DELETE /spot-categories/:id
  static delete = asyncHandler(async (req, res) => {
    const result = await SpotCategoryService.delete(parseInt(req.params.id));
    return OK(res, 'Xóa danh mục điểm du lịch thành công', result);
  });

  // PATCH /spot-categories/:id/toggle
  static toggle = asyncHandler(async (req, res) => {
    const result = await SpotCategoryService.toggle(parseInt(req.params.id));
    return OK(res, result.message, result);
  });
}

module.exports = SpotCategoryController;
