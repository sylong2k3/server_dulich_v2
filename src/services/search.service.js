const SearchRepository = require('../models/repositories/search.repository');
const { Api400Error } = require('../core/error.response');
const { cacheOrFetch } = require('../utils/cache.utils');

const VALID_TYPES = ['spots', 'businesses', 'vlogs', 'cuisine', 'festivals', 'ocop', 'users'];
const SEARCH_CACHE_TTL_SECONDS = 60;

class SearchService {
  static async search(query) {
    const { q, types } = query;
    if (!q || q.trim().length === 0) throw new Api400Error('Từ khóa tìm kiếm không được để trống');
    if (q.trim().length > 200) throw new Api400Error('Từ khóa tìm kiếm không được vượt quá 200 ký tự');

    // Lọc types hợp lệ
    let searchTypes = null;
    if (types) {
      const requested = types.split(',').map(t => t.trim().toLowerCase());
      searchTypes = requested.filter(t => VALID_TYPES.includes(t));
      if (searchTypes.length === 0) throw new Api400Error(`Loại tìm kiếm không hợp lệ. Hợp lệ: ${VALID_TYPES.join(', ')}`);
    }

    const normalizedQuery = q.trim();
    const cacheKey = `search:all:${normalizedQuery.toLowerCase()}:${searchTypes ? searchTypes.join(',') : 'all'}`;
    const results = await cacheOrFetch(
      cacheKey,
      () => SearchRepository.searchAll(normalizedQuery, searchTypes),
      SEARCH_CACHE_TTL_SECONDS,
    );

    // Tổng số kết quả
    const totalCount = Object.values(results).reduce((sum, r) => sum + r.items.length, 0);

    return { query: normalizedQuery, totalCount, results };
  }

  static async searchByType(type, query) {
    const { q } = query;
    if (!VALID_TYPES.includes(type)) throw new Api400Error(`Loại tìm kiếm không hợp lệ. Hợp lệ: ${VALID_TYPES.join(', ')}`);
    if (!q || q.trim().length === 0) throw new Api400Error('Từ khóa tìm kiếm không được để trống');

    const normalizedQuery = q.trim();
    const cacheKey = `search:type:${type}:${normalizedQuery.toLowerCase()}`;
    const items = await cacheOrFetch(
      cacheKey,
      () => SearchRepository.search(type, { search: normalizedQuery }),
      SEARCH_CACHE_TTL_SECONDS,
    );
    const config = SearchRepository.getConfig(type);
    return { type, label: config.label, query: normalizedQuery, items };
  }

  static getAvailableTypes() {
    return SearchRepository.getAvailableTypes();
  }
}

module.exports = SearchService;
