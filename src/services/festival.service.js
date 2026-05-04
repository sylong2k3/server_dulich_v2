const FestivalRepository = require('../models/repositories/festival.repository');
const { Api404Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');

const FESTIVAL_CACHE_TTL_SECONDS = 60;

class FestivalService {
  static async getAll(query, viewer = {}) {
    const { page = 1, limit = 12, search, festival_type, upcoming, is_published, sortBy, sortOrder } = query;
    const canManage = FestivalService.canManage(viewer);
    const effectiveIsPublished = canManage ? is_published : true;
    const cacheKey = `festivals:list:${JSON.stringify({ page, limit, search, festival_type, upcoming, is_published: effectiveIsPublished, sortBy, sortOrder })}`;
    const { rows, total } = await cacheOrFetch(
      cacheKey,
      () => FestivalRepository.findAll({ page, limit, search, festival_type, upcoming: upcoming === 'true' || upcoming === true, is_published: effectiveIsPublished, sortBy, sortOrder }),
      FESTIVAL_CACHE_TTL_SECONDS,
    );
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id, viewer = {}) {
    const item = await FestivalRepository.findById(id);
    if (!item || (item.is_published === false && !FestivalService.canManage(viewer))) {
      throw new Api404Error('Không tìm thấy lễ hội');
    }
    return item;
  }

  static async create(data) {
    // Kiểm tra FK tồn tại (province_code, spot_id)
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

    // Kiểm tra FK tồn tại nếu có thay đổi
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
    const cacheKey = `festivals:calendar:${JSON.stringify(query)}`;
    return cacheOrFetch(cacheKey, () => FestivalRepository.getCalendar(query), FESTIVAL_CACHE_TTL_SECONDS);
  }

  static async getTypes() {
    return cacheOrFetch('festivals:types', () => FestivalRepository.getTypes(), FESTIVAL_CACHE_TTL_SECONDS);
  }

  static canManage(viewer = {}) {
    return Boolean(viewer.user?.hasPermission?.('festivals', 'update') || viewer.user?.hasPermission?.('festivals', 'delete'));
  }
}

module.exports = FestivalService;
