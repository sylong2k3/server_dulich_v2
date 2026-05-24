const OcopRepository = require('../models/repositories/ocop.repository');
const { Api404Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { normalizeLang } = require('../utils/i18n.utils');

const OCOP_CACHE_TTL = 60;

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
   */
  static async getAdminAll(query) {
    const { page = 1, limit = 20, search, category, star_rating, province_code, spot_id, by_distance, radius_km, is_active, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    const { rows, total } = await OcopRepository.findAll({
      page, limit, search, category, star_rating, province_code, spot_id, by_distance, radius_km, is_active, sortBy, sortOrder, lang,
    });
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

  // Admin detail — KHÔNG cache, thấy mọi trạng thái.
  static async getAdminById(id, query = {}) {
    const lang = normalizeLang(query.lang);
    const item = await OcopRepository.findById(id, lang);
    if (!item) throw new Api404Error('Không tìm thấy sản phẩm OCOP');
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

  static async create(data) {
    await FKValidator.all([
      FKValidator.business(data.business_id, 'approved'),
      FKValidator.province(data.province_code),
      FKValidator.spot(data.spot_id),
    ]);
    const created = await OcopRepository.create(data);
    invalidateByPrefix('ocop:');
    return created;
  }

  static async update(id, data) {
    const existing = await OcopRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy sản phẩm OCOP');

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

  static async delete(id) {
    const existing = await OcopRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy sản phẩm OCOP');
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
}

module.exports = OcopService;
