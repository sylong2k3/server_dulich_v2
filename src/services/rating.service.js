const RatingRepository = require('../models/repositories/rating.repository');
const { Api404Error, Api400Error, Api409Error, Api403Error } = require('../core/error.response');
const { formatPagination } = require('../utils/responseFormatter');
const { query } = require('../configs/database');
const FKValidator = require('../utils/fk-validator');
const BusinessRepository = require('../models/repositories/business.repository');

class RatingService {
  async getRatings(options = {}, config = {}) {
    const { requireTarget = true } = config;
    if (requireTarget && !options.spot_id && !options.business_id) {
      throw new Api400Error('Cần cung cấp spot_id hoặc business_id');
    }
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 20));
    const { ratings, totalCount } = await RatingRepository.getRatings({ ...options, page, limit });
    const result = formatPagination(ratings, totalCount, page, limit);
    return { ratings: result.data, pagination: result.pagination };
  }

  async getManagedRatings(userId, options = {}, user = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 20));

    // Admin/Sở VH-TT&DL xem tất cả trạng thái (pending, published, hidden) để duyệt
    // Doanh nghiệp chỉ xem được đánh giá đã duyệt (published)
    const isModerator = this._canModerate(user);
    const queryOptions = {
      ...options,
      status: isModerator ? (options.status || null) : 'published',
      page,
      limit,
    };

    if (isModerator) {
      const { ratings, totalCount } = await RatingRepository.getRatings(queryOptions);
      const result = formatPagination(ratings, totalCount, page, limit);
      return { ratings: result.data, pagination: result.pagination };
    }

    if (options.business_id) {
      const business = await BusinessRepository.findById(options.business_id);
      if (!business || business.owner_id !== userId) {
        throw new Api403Error('Bạn không có quyền xem đánh giá này');
      }

      const { ratings, totalCount } = await RatingRepository.getRatings(queryOptions);
      const result = formatPagination(ratings, totalCount, page, limit);
      return { ratings: result.data, pagination: result.pagination };
    }

    const businesses = await BusinessRepository.findByOwnerId(userId);
    const businessIds = businesses.map((business) => business.id);
    if (!businessIds.length) {
      const result = formatPagination([], 0, page, limit);
      return { ratings: result.data, pagination: result.pagination };
    }

    const { ratings, totalCount } = await RatingRepository.getRatings({
      ...queryOptions,
      business_ids: businessIds,
    });
    const result = formatPagination(ratings, totalCount, page, limit);
    return { ratings: result.data, pagination: result.pagination };
  }

  async createRating(data) {
    // Kiểm tra constraint: phải có spot_id XOR business_id
    if ((!data.spot_id && !data.business_id) || (data.spot_id && data.business_id)) {
      throw new Api400Error('Phải đánh giá spot hoặc business (không được cả hai)');
    }

    // Kiểm tra FK tồn tại (trả lỗi 400 rõ ràng thay vì 500 từ DB)
    await FKValidator.all([
      FKValidator.spot(data.spot_id),
      FKValidator.business(data.business_id),
    ]);

    // Kiểm tra trùng
    const hasRated = await RatingRepository.hasUserRated(data.user_id, data.spot_id, data.business_id);
    if (hasRated) {
      throw new Api409Error('Bạn đã đánh giá rồi. Hãy sửa đánh giá hiện có.');
    }

    return RatingRepository.createRating(data);
  }

  async updateRating(id, data, userId) {
    const rating = await RatingRepository.findById(id);
    if (!rating) throw new Api404Error('Đánh giá không tồn tại');
    if (rating.user_id !== userId) throw new Api403Error('Bạn chỉ có thể sửa đánh giá của mình');
    return RatingRepository.updateRating(id, data);
  }

  async deleteRating(id, userId, user = {}) {
    const rating = await RatingRepository.findById(id);
    if (!rating) throw new Api404Error('Đánh giá không tồn tại');
    if (!this._canModerate(user) && rating.user_id !== userId) {
      throw new Api403Error('Bạn chỉ có thể xóa đánh giá của mình');
    }
    return RatingRepository.deleteRating(id);
  }

  async addReply(id, replyText, replyBy, user) {
    const rating = await RatingRepository.findById(id);
    if (!rating) throw new Api404Error('Đánh giá không tồn tại');

    const isModerator = this._canModerate(user);

    // Doanh nghiệp chỉ được trả lời khi đánh giá đã được duyệt (published)
    // Admin/Sở VH-TT&DL có thể trả lời ở mọi trạng thái
    if (!isModerator && rating.status !== 'published') {
      throw new Api403Error('Chỉ có thể phản hồi đánh giá đã được duyệt');
    }

    if (rating.business_id) {
      // NV-24: rating gắn với business → chỉ owner của business hoặc admin phản hồi
      const { rows } = await query(
        'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2',
        [rating.business_id, replyBy]
      );
      if (!rows.length && !isModerator) {
        throw new Api403Error('Chỉ chủ doanh nghiệp mới có thể phản hồi đánh giá này');
      }
    } else if (rating.spot_id) {
      // rating gắn với điểm du lịch → chỉ Sở VH-TT&DL hoặc Admin được phản hồi chính thức
      if (!isModerator) {
        throw new Api403Error('Chỉ quản trị viên hoặc Sở VH-TT&DL mới có thể phản hồi đánh giá điểm du lịch');
      }
    } else {
      // Không xác định được đối tượng đánh giá
      if (!isModerator) {
        throw new Api403Error('Không thể xác định quyền phản hồi đánh giá này');
      }
    }

    return RatingRepository.addReply(id, replyText, replyBy);
  }

  async incrementHelpful(id) {
    const rating = await RatingRepository.findById(id);
    if (!rating) throw new Api404Error('Đánh giá không tồn tại');
    return RatingRepository.incrementHelpful(id);
  }

  async updateStatus(id, status, user = {}) {
    if (!this._canModerate(user)) {
      throw new Api403Error('Bạn không có quyền kiểm duyệt đánh giá');
    }
    const rating = await RatingRepository.findById(id);
    if (!rating) throw new Api404Error('Đánh giá không tồn tại');
    return RatingRepository.updateStatus(id, status);
  }

  _canModerate(user = {}) {
    const roleCode = String(user?.role?.code || '').toLowerCase();
    return roleCode === 'system_admin' || roleCode === 'department_manager';
  }
}

module.exports = new RatingService();
