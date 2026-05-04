const ratingService = require('../services/rating.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class RatingController {
  static getRatings = asyncHandler(async (req, res) => {
    const result = await ratingService.getRatings({ ...req.query, status: 'published' });
    return OK(res, 'Lấy danh sách đánh giá thành công', result);
  });

  static createRating = asyncHandler(async (req, res) => {
    const data = { ...req.body, user_id: req.user.id };
    const rating = await ratingService.createRating(data);
    return CREATED(res, 'Tạo đánh giá thành công', { rating });
  });

  static getManagedRatings = asyncHandler(async (req, res) => {
    const result = await ratingService.getManagedRatings(req.user.id, req.query, req.user);
    return OK(res, 'Lấy danh sách quản lý đánh giá thành công', result);
  });

  static updateRating = asyncHandler(async (req, res) => {
    const rating = await ratingService.updateRating(req.params.id, req.body, req.user.id);
    return OK(res, 'Cập nhật đánh giá thành công', { rating });
  });

  static deleteRating = asyncHandler(async (req, res) => {
    await ratingService.deleteRating(req.params.id, req.user.id, req.user);
    return OK(res, 'Xóa đánh giá thành công', {});
  });

  static addReply = asyncHandler(async (req, res) => {
    const rating = await ratingService.addReply(req.params.id, req.body.reply_text, req.user.id, req.user);
    return OK(res, 'Phản hồi đánh giá thành công', { rating });
  });

  static markHelpful = asyncHandler(async (req, res) => {
    const count = await ratingService.incrementHelpful(req.params.id);
    return OK(res, 'Đánh dấu hữu ích thành công', { helpful_count: count });
  });

  static updateStatus = asyncHandler(async (req, res) => {
    const rating = await ratingService.updateStatus(req.params.id, req.body.status, req.user);
    return OK(res, 'Cập nhật trạng thái đánh giá thành công', { rating });
  });
}

module.exports = RatingController;
