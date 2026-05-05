const { Pool } = require('pg');
require('dotenv').config();

// ─── Pool Configuration ─────────────────────────────────────────────
// CRIT-04: Increased pool from max:10 → max:25 to prevent connection starvation
// HIGH-10: Added statement_timeout to kill runaway queries
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
    max: parseInt(process.env.DB_POOL_MAX, 10) || 25,
    idleTimeoutMillis: 30000,
    // 10s: đủ để absorb burst khi cache cold-start. 3s quá ngắn khi pool bận.
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS, 10) || 10000,
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT, 10) || 30000,
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT, 10) || 30000,
    // Đặt search_path ngay khi PostgreSQL khởi tạo session.
    // Tránh pool.on('connect') gọi client.query() bất đồng bộ rồi request query
    // dùng cùng client trước khi SET hoàn tất, gây DeprecationWarning trong pg.
    options: '-c search_path=public,auth,vn_units',
});

// ─── Pool Error Handling ────────────────────────────────────────────
pool.on('error', (err) => {
    console.error('[DB Pool] Unexpected error on idle client:', err.message);
});

// ─── Slow Query Logging (HIGH-11) ───────────────────────────────────
const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.DB_SLOW_QUERY_MS, 10) || 500;

const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        if (duration > SLOW_QUERY_THRESHOLD_MS) {
            // Regex chỉ chạy khi query chậm — tránh tốn CPU trên hot path
            const shortSql = text.replace(/\s+/g, ' ').substring(0, 200);
            console.warn(
                `[SLOW QUERY] ${duration}ms | rows=${res.rowCount} | ${shortSql}`
            );
        }

        return res;
    } catch (err) {
        const duration = Date.now() - start;
        const shortSql = text.replace(/\s+/g, ' ').substring(0, 150);
        console.error(
            `[DB ERROR] ${duration}ms | ${err.message} | ${shortSql}`
        );
        throw err;
    }
};

const getClient = async () => {
    return await pool.connect();
};

// ─── Pool Health Monitoring (MED-08) ────────────────────────────────
const POOL_MONITOR_INTERVAL_MS = parseInt(process.env.DB_POOL_MONITOR_MS, 10) || 30000;
let poolMonitorId = null;

const startPoolMonitor = () => {
    if (poolMonitorId) return;

    poolMonitorId = setInterval(() => {
        const { totalCount, idleCount, waitingCount } = pool;
        const activeCount = totalCount - idleCount;

        // Luôn log warning nếu có request đang chờ connection
        if (waitingCount > 0) {
            console.warn(
                `[DB Pool PRESSURE] waiting=${waitingCount} active=${activeCount} idle=${idleCount} total=${totalCount}/${pool.options.max}`
            );
        }

        // Log warning nếu pool sử dụng > 80%
        if (totalCount > 0 && activeCount / pool.options.max > 0.8) {
            console.warn(
                `[DB Pool HIGH USAGE] ${Math.round((activeCount / pool.options.max) * 100)}% | active=${activeCount} max=${pool.options.max}`
            );
        }
    }, POOL_MONITOR_INTERVAL_MS);

    // Không block process exit
    if (typeof poolMonitorId.unref === 'function') {
        poolMonitorId.unref();
    }
};

const stopPoolMonitor = () => {
    if (poolMonitorId) {
        clearInterval(poolMonitorId);
        poolMonitorId = null;
    }
};

// Auto-start pool monitor
startPoolMonitor();

module.exports = {
    pool,
    query,
    getClient,
    startPoolMonitor,
    stopPoolMonitor,
};