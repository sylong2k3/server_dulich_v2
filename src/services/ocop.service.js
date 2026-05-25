const OcopRepository = require('../models/repositories/ocop.repository');
const { Api404Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { normalizeLang } = require('../utils/i18n.utils');

const OCOP_CACHE_TTL = 60;

// Các role được bypass ownership check (quản lý nội dung toàn hệ thống)
const GLOBAL_ROLES = new Set(['system_admin', 'ministry_manager']);
const DEPARTMENT_ROLES = new Set(['department_manager']);
const OWNER_ROLES = new Set(['travel_company', 'service_provider', 'spot_operator']);

class OcopService {
  // Public list — chỉ trả sản phẩm is_active=true, có cache 60s.
  static async getAll(query, viewer = {}) {
    const { page = 1, limit = 12, search, category, star_rating, province_code, spot_id, by_distance, radius_km, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    // Normalize cache key — chỉ dùng các filter ảnh hưởng đến kết quả
    const cacheKey = [
      'ocop:list',
      lang,
      `p${page}`,
      `l${limit}`,
      province_code || 'all',
      category || 'all',
      star_rating || '',
      search || '',
      spot_id || 'all',
      by_distance ? 'dist' : 'direct',
      radius_km || '10',
      sortBy || 'created_at',
      sortOrder || 'DESC',
    ].join(':');
    const { rows, total } = await cacheOrFetch(
      cacheKey,
      () => OcopRepository.findAll({ page, limit, search, category, star_rating, province_code, spot_id, by_distance, radius_km, is_active: true, sortBy, sortOrder, lang }),
      OCOP_CACHE_TTL,
    );
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin list — KHÔNG cache: admin cần thấy thay đổi ngay sau CRUD,
   * traffic thấp, filter mở rộng (is_active, province_code).
   * Áp dụng RBAC scoping theo role của viewer.
   */
  static async getAdminAll(query, viewer = {}) {
    const { page = 1, limit = 20, search, category, star_rating, province_code, spot_id, by_distance, radius_km, is_active, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    const effectiveQuery = OcopService._applyListScope({
      page, limit, search, category, star_rating, province_code, spot_id, by_distance, radius_km, is_active, sortBy, sortOrder, lang,
    }, viewer?.user);
    const { rows, total } = await OcopRepository.findAll(effectiveQuery);
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id, viewer = {}, query = {}) {
    const lang = normalizeLang(query.lang);
    const canManage = OcopService.canManage(viewer);
    const cacheKey = `ocop:id:${id}:${lang}:${canManage ? 'manage' : 'public'}`;
    return cacheOrFetch(cacheKey, async () => {
      const item = await OcopRepository.findById(id, lang);
      if (!item || (item.is_active === false && !canManage)) {
        throw new Api404Error('Không tìm thấy sản phẩm OCOP');
      }
      return item;
    }, OCOP_CACHE_TTL);
  }

  // Admin detail — KHÔNG cache, thấy mọi trạng thái, nhưng scoped theo role.
  static async getAdminById(id, viewer = {}, query = {}) {
    const lang = normalizeLang(query.lang);
    const item = await OcopRepository.findById(id, lang);
    if (!item) throw new Api404Error('Không tìm thấy sản phẩm OCOP');
    OcopService._assertCanView(item, viewer?.user);
    return item;
  }

  static async getMy(query, user) {
    if (!user?.business_id) throw new (require('../core/error.response').Api400Error)('Tài khoản chưa liên kết doanh nghiệp');
    const { page = 1, limit = 12, search, category, star_rating, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    const { rows, total } = await OcopRepository.findAll({
      page, limit, search, category, star_rating,
      business_id: user.business_id,
      sortBy, sortOrder, lang,
    });
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async create(data, user) {
    // Nếu là owner role, tự động gán business_id của user
    if (user && !data.business_id && user.business_id) {
      data.business_id = user.business_id;
    }
    await FKValidator.all([
      FKValidator.business(data.business_id, 'approved'),
      FKValidator.province(data.province_code),
      FKValidator.spot(data.spot_id),
    ]);
    const created = await OcopRepository.create(data);
    invalidateByPrefix('ocop:');
    return created;
  }

  static async update(id, data, user) {
    const existing = await OcopRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy sản phẩm OCOP');

    OcopService._assertOwnerOrAdmin(existing, user);

    await FKValidator.all([
      FKValidator.business(data.business_id, 'approved'),
      FKValidator.province(data.province_code),
      FKValidator.spot(data.spot_id),
    ]);

    const updated = await OcopRepository.update(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy sản phẩm OCOP');
    invalidateByPrefix('ocop:');
    return updated;
  }

  static async delete(id, user) {
    const existing = await OcopRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy sản phẩm OCOP');
    OcopService._assertOwnerOrAdmin(existing, user);
    await OcopRepository.delete(id);
    invalidateByPrefix('ocop:');
  }

  static async getCategories() {
    return cacheOrFetch('ocop:categories', () => OcopRepository.getCategories(), OCOP_CACHE_TTL);
  }

  static async getOcopGeoJSON(query) {
    return OcopRepository.getOcopGeoJSON(query);
  }

  static canManage(viewer = {}) {
    return Boolean(viewer.user?.hasPermission?.('ocop', 'update') || viewer.user?.hasPermission?.('ocop', 'delete'));
  }

  // ==================== RBAC SCOPING ====================

  static _applyListScope(options = {}, user) {
    const roleCode = OcopService._roleCode(user);
    const scoped = { ...options };

    // system_admin / ministry_manager — thấy tất cả
    if (GLOBAL_ROLES.has(roleCode)) return scoped;

    // department_manager — chỉ thấy OCOP trong tỉnh mình quản lý
    if (DEPARTMENT_ROLES.has(roleCode)) {
      const provinceCode = OcopService._resolveProvinceCode(user, scoped);
      if (provinceCode) scoped.province_code = provinceCode;
      return scoped;
    }

    // travel_company / service_provider / spot_operator — chỉ thấy OCOP của doanh nghiệp mình
    if (OWNER_ROLES.has(roleCode)) {
      scoped.business_id = user?.business_id;
      return scoped;
    }

    // Fallback: chỉ thấy sản phẩm active
    scoped.is_active = true;
    return scoped;
  }

  static _assertCanView(item, user) {
    const roleCode = OcopService._roleCode(user);
    if (GLOBAL_ROLES.has(roleCode)) return;
    if (DEPARTMENT_ROLES.has(roleCode)) {
      const provinceCode = OcopService._resolveProvinceCode(user);
      if (provinceCode && item.province_code !== provinceCode) {
        throw new (require('../core/error.response').Api403Error)('Sản phẩm OCOP không thuộc tỉnh bạn quản lý');
      }
      return;
    }
    if (OWNER_ROLES.has(roleCode)) {
      if (item.business_id && item.business_id !== user?.business_id) {
        throw new (require('../core/error.response').Api403Error)('Bạn không có quyền xem sản phẩm OCOP của doanh nghiệp khác');
      }
      return;
    }
  }

  static _assertOwnerOrAdmin(item, user) {
    const roleCode = OcopService._roleCode(user);
    if (GLOBAL_ROLES.has(roleCode) || DEPARTMENT_ROLES.has(roleCode)) return;
    if (!user?.business_id) {
      throw new (require('../core/error.response').Api403Error)('Tài khoản chưa liên kết doanh nghiệp');
    }
    if (item.business_id && item.business_id !== user.business_id) {
      throw new (require('../core/error.response').Api403Error)('Bạn không có quyền chỉnh sửa sản phẩm OCOP của doanh nghiệp khác');
    }
  }

  static _roleCode(user) {
    return String(user?.role?.code || '').trim().toLowerCase();
  }

  static _resolveProvinceCode(user, options = {}) {
    return user?.province_code
      || user?.province?.code
      || user?.department?.province_code
      || user?.profile?.province_code
      || options?.province_code
      || null;
  }
}

module.exports = OcopService;
