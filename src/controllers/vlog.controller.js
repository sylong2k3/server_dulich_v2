const VlogService = require('../services/vlog.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class VlogController {
    static getAll = asyncHandler(async (req, res) =>
        OK(res, 'Danh sách vlog', await VlogService.getAll(req.query)));

    static getAllAdmin = asyncHandler(async (req, res) =>
        OK(res, 'Danh sách vlog (admin)', await VlogService.getAllAdmin(req.query)));

    static getById = asyncHandler(async (req, res) =>
        OK(res, 'Chi tiết vlog', await VlogService.getById(req.params.id)));

    static getByIdAdmin = asyncHandler(async (req, res) =>
        OK(res, 'Chi tiết vlog (admin)', await VlogService.getByIdAdmin(req.params.id)));

    // NV-43: Đăng vlog — status=pending
    static create = asyncHandler(async (req, res) => {
        const result = await VlogService.create(req.body, req.user.id);
        return CREATED(res, 'Tạo bài vlog thành công, đang chờ kiểm duyệt', result);
    });

    static update = asyncHandler(async (req, res) => {
        const result = await VlogService.update(req.params.id, req.body, req.user.id, req.user);
        return OK(res, 'Cập nhật vlog thành công', result);
    });

    static delete = asyncHandler(async (req, res) => {
        await VlogService.delete(req.params.id, req.user.id, req.user);
        return OK(res, 'Xóa vlog thành công');
    });

    // NV-44: Kiểm duyệt vlog
    static moderate = asyncHandler(async (req, res) => {
        const result = await VlogService.moderate(req.params.id, req.body, req.user.id);
        return OK(res, `Vlog đã ${req.body.status === 'published' ? 'được duyệt' : 'bị từ chối'}`, result);
    });

    // NV-45: Like idempotent
    static addLike = asyncHandler(async (req, res) => {
        const result = await VlogService.addLike(req.params.id, req.user.id);
        return OK(res, 'Đã thích bài vlog', result);
    });

    static removeLike = asyncHandler(async (req, res) => {
        const result = await VlogService.removeLike(req.params.id, req.user.id);
        return OK(res, 'Đã bỏ thích bài vlog', result);
    });

    // NV-45: Comments
    static getComments = asyncHandler(async (req, res) =>
        OK(res, 'Bình luận vlog', await VlogService.getComments(req.params.id, req.query)));

    static createComment = asyncHandler(async (req, res) => {
        const comment = await VlogService.createComment(req.params.id, req.body, req.user.id);
        return CREATED(res, 'Bình luận thành công', { comment });
    });

    static deleteComment = asyncHandler(async (req, res) => {
        await VlogService.deleteComment(req.params.id, req.params.commentId, req.user.id, req.user);
        return OK(res, 'Đã xóa bình luận');
    });

    // NV-45: Save idempotent
    static addSave = asyncHandler(async (req, res) => {
        const result = await VlogService.addSave(req.params.id, req.user.id);
        return OK(res, 'Đã lưu bài vlog', result);
    });

    static removeSave = asyncHandler(async (req, res) => {
        const result = await VlogService.removeSave(req.params.id, req.user.id);
        return OK(res, 'Đã bỏ lưu bài vlog', result);
    });

    static getSavedVlogs = asyncHandler(async (req, res) =>
        OK(res, 'Vlog đã lưu', await VlogService.getSavedVlogs(req.user.id, req.query)));
}

module.exports = VlogController;
