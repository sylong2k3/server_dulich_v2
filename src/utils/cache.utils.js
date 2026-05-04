const NodeCache = require('node-cache');

// TTL mặc định: 5 phút, kiểm tra xóa mỗi 2 phút
const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 120,
  useClones: false, // tối ưu hiệu năng
});

// ─── Cache stampede prevention ──────────────────────────────────────
// Prevents multiple concurrent requests from hitting the DB for the same key
const inflightRequests = new Map();

/**
 * Cache wrapper: lấy từ cache nếu có, nếu không thì gọi fn và cache kết quả
 * Bao gồm stampede protection: chỉ 1 request thực sự gọi DB, các request khác chờ
 * @param {string} key - Cache key
 * @param {Function} fn - Async function trả về data cần cache
 * @param {number} ttl - Time-to-live (giây), mặc định 300
 */
const cacheOrFetch = async (key, fn, ttl = 300) => {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // Stampede protection: nếu đã có request đang lấy dữ liệu cho key này, chờ nó
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const promise = fn()
    .then((data) => {
      cache.set(key, data, ttl);
      return data;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, promise);
  return promise;
};

/**
 * Xóa cache theo prefix (pattern)
 */
const invalidateByPrefix = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length > 0) {
    cache.del(keys);
  }
};

/**
 * Xóa cache theo key chính xác
 */
const invalidateKey = (key) => {
  cache.del(key);
};

/**
 * Thống kê cache — dùng cho health check / monitoring
 */
const getCacheStats = () => {
  const stats = cache.getStats();
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits + stats.misses > 0
      ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
      : 0,
    inflight: inflightRequests.size,
  };
};

module.exports = {
  cache,
  cacheOrFetch,
  invalidateByPrefix,
  invalidateKey,
  getCacheStats,
};
