const OcopRepository = require('../models/repositories/ocop.repository');
const BusinessRepository = require('../models/repositories/business.repository');
const { Api404Error, Api400Error, Api403Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { normalizeLang } = require('../utils/i18n.utils');
const db = require('../configs/database');

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
    const effectiveQuery = await OcopService._applyListScope({
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
    await OcopService._assertCanView(item, viewer?.user);
    return item;
  }

  static async getMy(query, user) {
    const businessIds = await OcopService._getOwnedBusinessIds(user);
    const spotIds = await OcopService._getOwnedSpotIds(user);
    if (!businessIds.length && !spotIds.length) {
      throw new Api403Error('Tài khoản chưa liên kết doanh nghiệp hoặc điểm du lịch');
    }

    const { page = 1, limit = 12, search, category, star_rating, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    const { rows, total } = await OcopRepository.findAll({
      page, limit, search, category, star_rating,
      business_ids: businessIds,
      spot_ids: spotIds,
      sortBy, sortOrder, lang,
    });
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async create(data, user) {
    await OcopService._assertCanUseBusinessForMutation(data, user);

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

    await OcopService._assertOwnerOrAdmin(existing, user);
    await OcopService._assertCanUseBusinessForMutation(data, user, { allowMissingBusinessId: true });

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
    await OcopService._assertOwnerOrAdmin(existing, user);
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

  static async _applyListScope(options = {}, user) {
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

    // travel_company / service_provider / spot_operator — chỉ thấy OCOP của doanh nghiệp mình hoặc điểm du lịch của mình
    if (OWNER_ROLES.has(roleCode)) {
      const businessIds = await OcopService._getOwnedBusinessIds(user);
      const spotIds = await OcopService._getOwnedSpotIds(user);
      if (!businessIds.length && !spotIds.length) {
        throw new Api403Error('Tài khoản chưa liên kết doanh nghiệp hoặc điểm du lịch');
      }
      scoped.business_ids = businessIds;
      scoped.spot_ids = spotIds;
      return scoped;
    }

    // Fallback: chỉ thấy sản phẩm active
    scoped.is_active = true;
    return scoped;
  }

  static async _assertCanView(item, user) {
    const roleCode = OcopService._roleCode(user);
    if (GLOBAL_ROLES.has(roleCode)) return;
    if (DEPARTMENT_ROLES.has(roleCode)) {
      const provinceCode = OcopService._resolveProvinceCode(user);
      if (provinceCode && item.province_code !== provinceCode) {
        throw new Api403Error('Sản phẩm OCOP không thuộc tỉnh bạn quản lý');
      }
      return;
    }
    if (OWNER_ROLES.has(roleCode)) {
      const businessIds = await OcopService._getOwnedBusinessIds(user);
      const spotIds = await OcopService._getOwnedSpotIds(user);
      const isOwnerByBusiness = item.business_id && businessIds.includes(item.business_id);
      const isOwnerBySpot = item.spot_id && spotIds.includes(item.spot_id);
      if (!isOwnerByBusiness && !isOwnerBySpot) {
        throw new Api403Error('Bạn không có quyền xem sản phẩm OCOP này');
      }
      return;
    }
  }

  static async _assertOwnerOrAdmin(item, user) {
    const roleCode = OcopService._roleCode(user);
    if (GLOBAL_ROLES.has(roleCode) || DEPARTMENT_ROLES.has(roleCode)) return;

    const businessIds = await OcopService._getOwnedBusinessIds(user);
    const spotIds = await OcopService._getOwnedSpotIds(user);
    if (!businessIds.length && !spotIds.length) {
      throw new Api403Error('Tài khoản chưa liên kết doanh nghiệp hoặc điểm du lịch');
    }

    const isOwnerByBusiness = item.business_id && businessIds.includes(item.business_id);
    const isOwnerBySpot = item.spot_id && spotIds.includes(item.spot_id);
    if (!isOwnerByBusiness && !isOwnerBySpot) {
      throw new Api403Error('Bạn không có quyền chỉnh sửa sản phẩm OCOP này');
    }
  }

  static async _assertCanUseBusinessForMutation(data = {}, user, { allowMissingBusinessId = false } = {}) {
    const roleCode = OcopService._roleCode(user);
    if (GLOBAL_ROLES.has(roleCode) || DEPARTMENT_ROLES.has(roleCode)) return;

    if (data.business_id === undefined && allowMissingBusinessId) return;

    const businessIds = await OcopService._getOwnedBusinessIds(user);
    const spotIds = await OcopService._getOwnedSpotIds(user);
    if (!businessIds.length && !spotIds.length) {
      throw new Api403Error('Tài khoản chưa liên kết doanh nghiệp hoặc điểm du lịch');
    }

    if (!data.business_id) {
      // Auto-assign nếu có duy nhất 1 business approved
      const businesses = await BusinessRepository.findByOwnerId(user?.id);
      const approvedBusinesses = businesses.filter((business) => business.status === 'approved');
      if (approvedBusinesses.length === 1) {
        data.business_id = approvedBusinesses[0].id;
      } else {
        throw new Api400Error('Sản phẩm OCOP bắt buộc phải có doanh nghiệp (business_id)');
      }
    }

    // Nếu truyền business_id, kiểm tra xem user có sở hữu business này hay không,
    // HOẶC nếu user sở hữu spot_id đang được truyền vào OCOP thì họ cũng được phép
    if (data.business_id) {
      const isOwnerByBusiness = businessIds.includes(data.business_id);
      const isOwnerBySpot = data.spot_id && spotIds.includes(data.spot_id);
      if (!isOwnerByBusiness && !isOwnerBySpot) {
        throw new Api403Error('Bạn không có quyền sử dụng doanh nghiệp hoặc điểm du lịch này cho sản phẩm OCOP');
      }
    }
  }

  static async _getOwnedBusinessIds(user) {
    if (!user?.id) return [];
    const businesses = await BusinessRepository.findByOwnerId(user.id);
    return businesses.map((business) => business.id);
  }

  static async _getOwnedSpotIds(user) {
    if (!user?.id) return [];
    const { rows } = await db.query(
      "SELECT id FROM tourism_spots WHERE created_by = $1 AND status != 'deleted'",
      [user.id]
    );
    return rows.map((spot) => spot.id);
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
