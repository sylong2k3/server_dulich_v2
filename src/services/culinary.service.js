const CulinaryRepository = require('../models/repositories/culinary.repository');
const { Api404Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { normalizeLang } = require('../utils/i18n.utils');

const CULINARY_CACHE_TTL = 60;

class CulinaryService {
  static async getAll(query) {
    const { page = 1, limit = 12, search, category, is_speciality, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    const cacheKey = `culinary:list:${lang}:${JSON.stringify({ page, limit, search, category, is_speciality, sortBy, sortOrder })}`;
    const { rows, total } = await cacheOrFetch(
      cacheKey,
      () => CulinaryRepository.findAll({ page, limit, search, category, is_speciality, sortBy, sortOrder, lang }),
      CULINARY_CACHE_TTL,
    );
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id, query = {}) {
    const lang = normalizeLang(query.lang);
    return cacheOrFetch(`culinary:id:${id}:${lang}`, async () => {
      const item = await CulinaryRepository.findById(id, lang);
      if (!item) throw new Api404Error('Không tìm thấy món ẩm thực');
      return item;
    }, CULINARY_CACHE_TTL);
  }

  static async create(data) {
    await FKValidator.province(data.province_code);
    const created = await CulinaryRepository.create(data);
    invalidateByPrefix('culinary:');
    return created;
  }

  static async update(id, data) {
    const existing = await CulinaryRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy món ẩm thực');

    await FKValidator.province(data.province_code);

    const updated = await CulinaryRepository.update(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy món ẩm thực');
    invalidateByPrefix('culinary:');
    return updated;
  }

  static async delete(id) {
    const existing = await CulinaryRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy món ẩm thực');
    await CulinaryRepository.delete(id);
    invalidateByPrefix('culinary:');
  }

  static async getCategories() {
    return cacheOrFetch('culinary:categories', () => CulinaryRepository.getCategories(), CULINARY_CACHE_TTL);
  }
}

module.exports = CulinaryService;
