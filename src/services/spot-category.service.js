const SpotCategoryRepository = require('../models/repositories/spot-category.repository');
const {
  Api404Error,
  Api400Error,
  Api409Error,
} = require('../core/error.response');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');

const SPOT_CATEGORY_CACHE_TTL_SECONDS = 60;

class SpotCategoryService {
  // ─── Danh sách ──────────────────────────────────────────────────────────────

  static async getAll(query) {
    const { page = 1, limit = 50, search, parent_id, is_active, sortBy, sortOrder } = query;

    const cacheKey = `spot-categories:list:${JSON.stringify({ page, limit, search, parent_id, is_active, sortBy, sortOrder })}`;
    const { rows, total } = await cacheOrFetch(
      cacheKey,
      () => SpotCategoryRepository.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      parent_id: parent_id !== undefined ? (parent_id === 'null' ? null : parseInt(parent_id)) : undefined,
      is_active,
      sortBy,
      sortOrder,
      }),
      SPOT_CATEGORY_CACHE_TTL_SECONDS,
    );

    return {
      items: rows.map(r => ({ ...r, spot_count: parseInt(r.spot_count || 0) })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Dạng cây ────────────────────────────────────────────────────────────────

  static async getTree(onlyActive = true) {
    return cacheOrFetch(
      `spot-categories:tree:${onlyActive}`,
      () => SpotCategoryRepository.findTree(onlyActive),
      SPOT_CATEGORY_CACHE_TTL_SECONDS,
    );
  }

  // ─── Chi tiết ────────────────────────────────────────────────────────────────

  static async getById(id, { onlyActive = false } = {}) {
    const category = await SpotCategoryRepository.findById(id, { onlyActive });
    if (!category) throw new Api404Error(`Không tìm thấy danh mục điểm du lịch với id = ${id}`);
    return { ...category, spot_count: parseInt(category.spot_count || 0) };
  }

  // ─── Tạo mới ─────────────────────────────────────────────────────────────────

  static async create(body) {
    const { code, name_vi, name_en, parent_id, icon_url, color_hex, sort_order, is_active } = body;

    // Kiểm tra code trùng
    const codeExists = await SpotCategoryRepository.existsByCode(code);
    if (codeExists) {
      throw new Api409Error(`Code "${code}" đã tồn tại. Vui lòng chọn code khác.`);
    }

    // Kiểm tra parent hợp lệ
    if (parent_id) {
      const parent = await SpotCategoryRepository.findById(parent_id);
      if (!parent) {
        throw new Api400Error(`Danh mục cha với id = ${parent_id} không tồn tại.`);
      }
      // Chỉ cho 1 cấp parent (không cho nest quá sâu)
      if (parent.parent_id) {
        throw new Api400Error('Hệ thống chỉ hỗ trợ tối đa 2 cấp danh mục (cha - con). Danh mục cha đã là con của danh mục khác.');
      }
    }

    const data = { code, name_vi };
    if (name_en  !== undefined) data.name_en   = name_en;
    if (parent_id!== undefined) data.parent_id  = parent_id;
    if (icon_url !== undefined) data.icon_url   = icon_url;
    if (color_hex!== undefined) data.color_hex  = color_hex;
    if (sort_order!== undefined) data.sort_order = sort_order;
    if (is_active !== undefined) data.is_active  = is_active;

    const created = await SpotCategoryRepository.create(data);
    invalidateByPrefix('spot-categories:');
    return created;
  }

  // ─── Cập nhật ────────────────────────────────────────────────────────────────

  static async update(id, body) {
    const existing = await SpotCategoryRepository.findById(id);
    if (!existing) throw new Api404Error(`Không tìm thấy danh mục điểm du lịch với id = ${id}`);

    const { code, parent_id } = body;

    // Kiểm tra code trùng (trừ chính nó)
    if (code && code !== existing.code) {
      const codeExists = await SpotCategoryRepository.existsByCode(code, id);
      if (codeExists) {
        throw new Api409Error(`Code "${code}" đã tồn tại. Vui lòng chọn code khác.`);
      }
    }

    // Kiểm tra parent hợp lệ
    if (parent_id !== undefined && parent_id !== null) {
      if (parent_id === id) {
        throw new Api400Error('Danh mục không thể là cha của chính nó.');
      }
      const parent = await SpotCategoryRepository.findById(parent_id);
      if (!parent) {
        throw new Api400Error(`Danh mục cha với id = ${parent_id} không tồn tại.`);
      }
      if (parent.parent_id) {
        throw new Api400Error('Hệ thống chỉ hỗ trợ tối đa 2 cấp danh mục (cha - con). Danh mục cha đã là con của danh mục khác.');
      }
    }

    const updated = await SpotCategoryRepository.update(id, body);
    if (!updated) throw new Api404Error(`Không tìm thấy danh mục điểm du lịch với id = ${id}`);
    invalidateByPrefix('spot-categories:');
    return updated;
  }

  // ─── Xóa ─────────────────────────────────────────────────────────────────────

  static async delete(id) {
    const existing = await SpotCategoryRepository.findById(id);
    if (!existing) throw new Api404Error(`Không tìm thấy danh mục điểm du lịch với id = ${id}`);

    // Không xóa nếu còn spots đang dùng
    const spotCount = await SpotCategoryRepository.countSpots(id);
    if (spotCount > 0) {
      throw new Api400Error(
        `Không thể xóa danh mục "${existing.name_vi}" vì đang có ${spotCount} điểm du lịch sử dụng. Hãy chuyển điểm sang danh mục khác trước.`
      );
    }

    // Không xóa nếu còn danh mục con
    const childCount = await SpotCategoryRepository.countChildren(id);
    if (childCount > 0) {
      throw new Api400Error(
        `Không thể xóa danh mục "${existing.name_vi}" vì đang có ${childCount} danh mục con. Hãy xóa hoặc chuyển danh mục con trước.`
      );
    }

    await SpotCategoryRepository.delete(id);
    invalidateByPrefix('spot-categories:');
    return { id, deleted: true };
  }

  // ─── Toggle is_active ─────────────────────────────────────────────────────────

  static async toggle(id) {
    const existing = await SpotCategoryRepository.findById(id);
    if (!existing) throw new Api404Error(`Không tìm thấy danh mục điểm du lịch với id = ${id}`);

    const updated = await SpotCategoryRepository.toggle(id);
    invalidateByPrefix('spot-categories:');
    return {
      ...updated,
      message: updated.is_active
        ? `Đã bật danh mục "${updated.name_vi}"`
        : `Đã tắt danh mục "${updated.name_vi}"`,
    };
  }
}

module.exports = SpotCategoryService;
