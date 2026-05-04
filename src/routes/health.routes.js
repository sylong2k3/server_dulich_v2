const { Router } = require('express');
const { pool } = require('../configs/database');
const { getCacheStats } = require('../utils/cache.utils');
const { getAllBreakersStatus } = require('../utils/circuit-breaker');

const router = Router();

const HEALTH_CHECK_TOKEN = process.env.HEALTH_CHECK_TOKEN || '';
const CACHE_KEY_WARNING_THRESHOLD = parseInt(process.env.CACHE_KEY_WARNING_THRESHOLD, 10) || 5000;
const HEAP_USED_WARNING_MB = parseInt(process.env.HEAP_USED_WARNING_MB, 10) || 512;

const requireHealthToken = (req, res, next) => {
  if (!HEALTH_CHECK_TOKEN) return next();

  const authHeader = req.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';
  const headerToken = req.get('x-health-token') || '';

  if (bearerToken === HEALTH_CHECK_TOKEN || headerToken === HEALTH_CHECK_TOKEN) {
    return next();
  }

  return res.status(401).json({
    status: 'error',
    message: 'Unauthorized health check access',
  });
};

/**
 * MED-08: Health check endpoint with production observability
 *
 * GET /health
 *
 * Returns:
 *   - DB pool utilization (total, idle, active, waiting connections)
 *   - Cache hit rates and key counts
 *   - Circuit breaker states for external services
 *   - Memory usage
 *   - Warnings for quick load-test diagnosis
 */
// ROUTE: GET / -> handler
router.get('/', requireHealthToken, async (_req, res) => { const dbHealthy = await checkDatabaseHealth(); const memUsage = process.memoryUsage(); const cacheStats = getCacheStats(); const poolStats = getPoolStats(); const memoryStats = getMemoryStats(memUsage); const warnings = getHealthWarnings({ dbHealthy, poolStats, cacheStats, memoryStats }); const status = { status: dbHealthy && warnings.critical.length === 0 ? 'healthy' : 'degraded', worker_id: process.env.CLUSTER_WORKER_ID ?? 'standalone', pid: process.pid, uptime_seconds: Math.floor(process.uptime()), timestamp: new Date().toISOString(), database: { healthy: dbHealthy, pool: poolStats, }, cache: cacheStats, circuit_breakers: getAllBreakersStatus(), memory: memoryStats, warnings, }; const httpStatus = dbHealthy ? 200 : 503; res.status(httpStatus).json(status); });

function getPoolStats() {
  const active = pool.totalCount - pool.idleCount;
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    active,
    waiting: pool.waitingCount,
    max: pool.options.max,
    utilization_pct: pool.options.max > 0
      ? Math.round((active / pool.options.max) * 100)
      : 0,
  };
}

function getMemoryStats(memUsage) {
  return {
    rss_mb: Math.round(memUsage.rss / 1024 / 1024),
    heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
    heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
    external_mb: Math.round(memUsage.external / 1024 / 1024),
  };
}

function getHealthWarnings({ dbHealthy, poolStats, cacheStats, memoryStats }) {
  const warning = [];
  const critical = [];

  if (!dbHealthy) {
    critical.push('Database health check failed');
  }

  if (poolStats.waiting > 0) {
    critical.push(`DB pool has ${poolStats.waiting} requests waiting for a connection`);
  }

  if (poolStats.utilization_pct >= 80) {
    warning.push(`DB pool utilization is high: ${poolStats.utilization_pct}%`);
  }

  if (cacheStats.keys >= CACHE_KEY_WARNING_THRESHOLD) {
    warning.push(`Cache key count is high: ${cacheStats.keys}`);
  }

  if (cacheStats.hits + cacheStats.misses >= 100 && cacheStats.hitRate < 50) {
    warning.push(`Cache hit rate is low: ${cacheStats.hitRate}%`);
  }

  if (memoryStats.heap_used_mb >= HEAP_USED_WARNING_MB) {
    warning.push(`Node heap usage is high: ${memoryStats.heap_used_mb}MB`);
  }

  if (cacheStats.inflight > 100) {
    warning.push(`Many cache fetches are currently in-flight: ${cacheStats.inflight}`);
  }

  return { warning, critical };
}

async function checkDatabaseHealth() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

module.exports = router;
