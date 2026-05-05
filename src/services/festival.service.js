const FestivalRepository = require('../models/repositories/festival.repository');
const { Api404Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { normalizeLang } = require('../utils/i18n.utils');

const FESTIVAL_CACHE_TTL_SECONDS = 60;

class FestivalService {
  /**
   * Public list — chỉ trả lễ hội đã publish, có cache 60s.
   */
  static async getAll(query) {
    const { page = 1, limit = 12, search, festival_type, upcoming, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    // Normalize cache key — chỉ dùng các filter ảnh hưởng đến kết quả
    const cacheKey = [
      'festivals:list',
      lang,
      `p${page}`,
      `l${limit}`,
      festival_type || 'all',
      upcoming ? 'upcoming' : 'all',
      search || '',
      sortBy || 'start_date',
      sortOrder || 'ASC',
    ].join(':');
    const { rows, total } = await cacheOrFetch(
      cacheKey,
      () => FestivalRepository.findAll({ page, limit, search, festival_type, upcoming: upcoming === 'true' || upcoming === true, is_published: true, sortBy, sortOrder, lang }),
      FESTIVAL_CACHE_TTL_SECONDS,
    );
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin list — KHÔNG cache, xem được cả draft (is_published=false), filter mở rộng.
   */
  static async getAdminAll(query) {
    const { page = 1, limit = 20, search, festival_type, upcoming, is_published, province_code, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    const { rows, total } = await FestivalRepository.findAll({
      page, limit, search, festival_type,
      upcoming: upcoming === 'true' || upcoming === true,
      is_published, province_code,
      sortBy, sortOrder, lang,
    });
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Public detail — cache 60s, ẩn lễ hội chưa publish.
   */
  static async getById(id, query = {}) {
    const lang = normalizeLang(query.lang);
    const cacheKey = `festivals:id:${id}:${lang}`;
    return cacheOrFetch(cacheKey, async () => {
      const item = await FestivalRepository.findById(id, lang);
      if (!item || item.is_published === false) {
        throw new Api404Error('Không tìm thấy lễ hội');
      }
      return item;
    }, FESTIVAL_CACHE_TTL_SECONDS);
  }

  /**
   * Admin detail — KHÔNG cache, thấy mọi trạng thái.
   */
  static async getAdminById(id, query = {}) {
    const lang = normalizeLang(query.lang);
    const item = await FestivalRepository.findById(id, lang);
    if (!item) throw new Api404Error('Không tìm thấy lễ hội');
    return item;
  }

  static async create(data) {
    await FKValidator.all([
      FKValidator.province(data.province_code),
      FKValidator.spot(data.spot_id),
    ]);
    const created = await FestivalRepository.create(data);
    invalidateByPrefix('festivals:');
    return created;
  }

  static async update(id, data) {
    const existing = await FestivalRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy lễ hội');

    await FKValidator.all([
      FKValidator.province(data.province_code),
      FKValidator.spot(data.spot_id),
    ]);

    const updated = await FestivalRepository.update(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy lễ hội');
    invalidateByPrefix('festivals:');
    return updated;
  }

  static async delete(id) {
    const existing = await FestivalRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy lễ hội');
    await FestivalRepository.delete(id);
    invalidateByPrefix('festivals:');
  }

  static async getCalendar(query) {
    const lang = normalizeLang(query.lang);
    const cacheKey = `festivals:calendar:${lang}:${JSON.stringify({ from: query.from, to: query.to, province_code: query.province_code, festival_type: query.festival_type })}`;
    return cacheOrFetch(cacheKey, () => FestivalRepository.getCalendar({ ...query, lang }), FESTIVAL_CACHE_TTL_SECONDS);
  }

  static async getTypes() {
    return cacheOrFetch('festivals:types', () => FestivalRepository.getTypes(), FESTIVAL_CACHE_TTL_SECONDS);
  }

  static canManage(viewer = {}) {
    return Boolean(viewer.user?.hasPermission?.('festivals', 'update') || viewer.user?.hasPermission?.('festivals', 'delete'));
  }
}

module.exports = FestivalService;
