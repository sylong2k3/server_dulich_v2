const NewsRepository = require('../models/repositories/news.repository');
const { Api404Error, Api409Error, Api403Error } = require('../core/error.response');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');

const NEWS_CACHE_TTL_SECONDS = 60;

// Các role được chỉnh sửa bất kỳ bài viết nào (biên tập toàn hệ thống)
const NEWS_BYPASS_ROLES = new Set(['system_admin', 'so_vhtt']);

const generateSlug = (title) =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 200);

class NewsService {
  // ---- News ----

  static async getAll(query) {
    const { page = 1, limit = 10, search, is_featured, tag, sortBy, sortOrder } = query;
    const cacheKey = `news:list:${JSON.stringify({ page, limit, search, is_featured, tag, sortBy, sortOrder })}`;
    const { rows, total } = await cacheOrFetch(
      cacheKey,
      () => NewsRepository.findAll({
      page, limit, search, is_published: true, is_featured, tag, sortBy, sortOrder,
      }),
      NEWS_CACHE_TTL_SECONDS,
    );
    return {
      items: rows.map(r => { const { total_count, ...item } = r; return item; }),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // NV-46: Admin xem tất cả bài (kể cả chưa published)
  static async getAllAdmin(query) {
    const { page = 1, limit = 10, search, is_published, is_featured, tag, sortBy, sortOrder } = query;
    const { rows, total } = await NewsRepository.findAll({
      page, limit, search, is_published, is_featured, tag, sortBy, sortOrder,
    });
    return {
      items: rows.map(r => { const { total_count, ...item } = r; return item; }),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getByIdAdmin(id) {
    const news = await NewsRepository.findById(id);
    if (!news) throw new Api404Error('Không tìm thấy tin tức');
    return news;
  }

  // NV-46: Admin bật/tắt trạng thái xuất bản
  static async setPublishStatus(id, is_published) {
    const existing = await NewsRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy tin tức');
    const data = { is_published };
    if (is_published) {
      // Bật xuất bản: set published_at nếu chưa có
      if (!existing.published_at) {
        data.published_at = new Date().toISOString();
      }
    } else {
      // Tắt xuất bản: xóa published_at
      data.published_at = null;
    }
    const updated = await NewsRepository.update(id, data);
    invalidateByPrefix('news:');
    return updated;
  }

  static async getBySlug(slug) {
    const news = await NewsRepository.findBySlug(slug);
    if (!news) throw new Api404Error('Không tìm thấy tin tức');
    if (!news.is_published) throw new Api404Error('Không tìm thấy tin tức');
    await NewsRepository.incrementViewCount(news.id);
    return news;
  }

  static async create(data, userId) {
    let slug = data.slug || generateSlug(data.title);
    if (await NewsRepository.slugExists(slug)) {
      slug = `${slug}-${Date.now()}`;
    }
    // Auto-set published_at on create if is_published=true
    if (data.is_published && !data.published_at) {
      data.published_at = new Date().toISOString();
    }
    const created = await NewsRepository.create({ ...data, slug, author_id: userId });
    invalidateByPrefix('news:');
    return created;
  }

  static async update(id, data, user) {
    const existing = await NewsRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy tin tức');

    // Kiểm tra quyền sở hữu: system_admin / so_vhtt bypass (editorial workflow)
    // Các role khác chỉ được sửa bài của chính mình
    const roleCode = String(user?.role?.code || '').toLowerCase();
    if (!NEWS_BYPASS_ROLES.has(roleCode)) {
      if (!existing.author_id || existing.author_id !== user?.id) {
        throw new Api403Error('Bạn không có quyền chỉnh sửa bài viết này');
      }
    }

    if (data.slug && data.slug !== existing.slug) {
      if (await NewsRepository.slugExists(data.slug, id)) {
        throw new Api409Error('Slug đã tồn tại');
      }
    }

    // NV-46: Tự động set published_at khi chuyển sang published lần đầu
    if (data.is_published === true && !existing.is_published && !data.published_at) {
      data.published_at = new Date().toISOString();
    }

    const updated = await NewsRepository.update(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy tin tức');
    invalidateByPrefix('news:');
    return updated;
  }

  static async delete(id) {
    const existing = await NewsRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy tin tức');
    await NewsRepository.delete(id);
    invalidateByPrefix('news:');
  }

  // ---- Comments ----

  static async getComments(newsId, query) {
    const news = await NewsRepository.findById(newsId);
    if (!news) throw new Api404Error('Không tìm thấy tin tức');
    const { page = 1, limit = 20 } = query;
    const { rows, total } = await NewsRepository.findCommentsByNewsId(newsId, { page, limit });
    return {
      items: rows.map(r => { const { total_count, ...item } = r; return item; }),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async createComment(newsId, data, userId) {
    const news = await NewsRepository.findById(newsId);
    if (!news) throw new Api404Error('Không tìm thấy tin tức');

    if (data.parent_comment_id) {
      const parentComment = await NewsRepository.findCommentById(data.parent_comment_id);
      if (!parentComment || parentComment.news_id !== newsId) {
        throw new Api404Error('Không tìm thấy bình luận cha');
      }
    }

    return NewsRepository.createComment({ ...data, news_id: newsId, user_id: userId || null });
  }

  static async updateComment(commentId, data, userId, isAdmin) {
    const comment = await NewsRepository.findCommentById(commentId);
    if (!comment) throw new Api404Error('Không tìm thấy bình luận');
    if (!isAdmin && comment.user_id !== userId) throw new Api403Error('Không có quyền sửa bình luận này');
    return NewsRepository.updateComment(commentId, data);
  }

  static async deleteComment(commentId, userId, isAdmin) {
    const comment = await NewsRepository.findCommentById(commentId);
    if (!comment) throw new Api404Error('Không tìm thấy bình luận');
    if (!isAdmin && comment.user_id !== userId) throw new Api403Error('Không có quyền xóa bình luận này');
    await NewsRepository.deleteComment(commentId);
  }

  // NV-47: Admin duyệt/bỏ duyệt bình luận
  static async approveComment(newsId, commentId, isApproved = true) {
    const comment = await NewsRepository.findCommentById(commentId);
    if (!comment) throw new Api404Error('Không tìm thấy bình luận');
    if (comment.news_id !== newsId) throw new Api404Error('Không tìm thấy bình luận');
    return NewsRepository.setCommentApproval(commentId, isApproved);
  }
}

module.exports = NewsService;
