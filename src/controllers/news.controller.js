const NewsService = require('../services/news.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

const ADMIN_CODES = ['system_admin'];
const isAdmin = (user) => ADMIN_CODES.includes(String(user?.role?.code || '').toLowerCase());

class NewsController {
  // ---- News ----
  static getAll = asyncHandler(async (req, res) => {
    const result = await NewsService.getAll(req.query);
    return OK(res, 'Danh sách tin tức', result);
  });

  static getBySlug = asyncHandler(async (req, res) => {
    const result = await NewsService.getBySlug(req.params.slug);
    return OK(res, 'Chi tiết tin tức', result);
  });

  static create = asyncHandler(async (req, res) => {
    const result = await NewsService.create(req.body, req.user.id);
    return CREATED(res, 'Tạo tin tức thành công', result);
  });

  static update = asyncHandler(async (req, res) => {
    const result = await NewsService.update(req.params.id, req.body, req.user);
    return OK(res, 'Cập nhật tin tức thành công', result);
  });

  static delete = asyncHandler(async (req, res) => {
    await NewsService.delete(req.params.id);
    return OK(res, 'Xóa tin tức thành công');
  });

  // ---- NV-46: Admin endpoints ----
  static getAllAdmin = asyncHandler(async (req, res) => {
    const result = await NewsService.getAllAdmin(req.query);
    return OK(res, 'Danh sách tin tức (admin)', result);
  });

  static getByIdAdmin = asyncHandler(async (req, res) => {
    const result = await NewsService.getByIdAdmin(req.params.id);
    return OK(res, 'Chi tiết tin tức (admin)', result);
  });

  static setPublishStatus = asyncHandler(async (req, res) => {
    const { is_published } = req.body;
    const result = await NewsService.setPublishStatus(req.params.id, is_published);
    return OK(res, is_published ? 'Đã xuất bản tin tức' : 'Đã gỡ xuất bản tin tức', result);
  });

  // ---- Comments ----
  static getComments = asyncHandler(async (req, res) => {
    const result = await NewsService.getComments(req.params.id, req.query);
    return OK(res, 'Danh sách bình luận', result);
  });

  static createComment = asyncHandler(async (req, res) => {
    const result = await NewsService.createComment(req.params.id, req.body, req.user.id);
    return CREATED(res, 'Gửi bình luận thành công', result);
  });

  static updateComment = asyncHandler(async (req, res) => {
    const result = await NewsService.updateComment(req.params.commentId, req.body, req.user.id, isAdmin(req.user));
    return OK(res, 'Cập nhật bình luận thành công', result);
  });

  static deleteComment = asyncHandler(async (req, res) => {
    await NewsService.deleteComment(req.params.commentId, req.user.id, isAdmin(req.user));
    return OK(res, 'Xóa bình luận thành công');
  });

  static approveComment = asyncHandler(async (req, res) => {
    const is_approved = req.body?.is_approved !== false;
    const result = await NewsService.approveComment(req.params.id, req.params.commentId, is_approved);
    const message = is_approved ? 'Duyệt bình luận thành công' : 'Bỏ duyệt bình luận thành công';
    return OK(res, message, result);
  });
}

module.exports = NewsController;
