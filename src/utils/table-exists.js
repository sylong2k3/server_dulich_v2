const { query } = require('../configs/database');

const cache = new Map();
const warnedMissing = new Set();
const CACHE_TTL_MS = parseInt(process.env.DB_TABLE_EXISTS_CACHE_MS, 10) || 60000;

const shouldLogMissingTableWarnings = () => {
    const rawValue = process.env.DB_LOG_MISSING_TABLE_WARNINGS;
    if (rawValue === undefined || rawValue === null || rawValue === '') {
        return false;
    }

    return ['1', 'true', 'yes', 'on'].includes(String(rawValue).trim().toLowerCase());
};

const clearCacheEntry = (tableName) => {
    cache.delete(tableName);
};

const tableExists = async (tableName) => {
    const now = Date.now();
    const cached = cache.get(tableName);

    if (cached && now - cached.checkedAt < CACHE_TTL_MS) {
        return cached.exists;
    }

    const { rows } = await query('SELECT to_regclass($1) AS relation_name', [tableName]);
    const exists = Boolean(rows[0] && rows[0].relation_name);

    cache.set(tableName, {
        exists,
        checkedAt: now,
    });

    if (exists) {
        for (const warningKey of warnedMissing) {
            if (warningKey.endsWith(`|${tableName}`)) {
                warnedMissing.delete(warningKey);
            }
        }
    }

    return exists;
};

const warnMissingTableOnce = (context, tableName) => {
    if (!shouldLogMissingTableWarnings()) return;

    const key = `${context}|${tableName}`;
    if (warnedMissing.has(key)) return;

    warnedMissing.add(key);
    console.warn(
        `[DB] Skipping ${context}: relation "${tableName}" does not exist. Run DB migrations to enable this feature.`,
    );
};

module.exports = {
    tableExists,
    warnMissingTableOnce,
    clearCacheEntry,
};
