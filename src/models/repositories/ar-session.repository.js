const { query } = require('../../configs/database');

class ArSessionRepository {
    static async create(data) {
        const hasGeom = data.lng != null && data.lat != null;
        const sql = `
            INSERT INTO ar_sessions (
                user_id, spot_id, ar_type,
                ${hasGeom ? 'geom_start,' : ''}
                duration_sec, qr_scanned, spots_viewed, device_os, app_version
            ) VALUES (
                $1, $2, $3,
                ${hasGeom ? `ST_SetSRID(ST_MakePoint($4, $5), 4326),` : ''}
                $${hasGeom ? 6 : 4}, $${hasGeom ? 7 : 5}, $${hasGeom ? 8 : 6}, $${hasGeom ? 9 : 7}, $${hasGeom ? 10 : 8}
            ) RETURNING *
        `;
        const values = hasGeom
            ? [data.user_id || null, data.spot_id || null, data.ar_type || null,
               data.lng, data.lat,
               data.duration_sec || null, data.qr_scanned || false,
               data.spots_viewed || null, data.device_os || null, data.app_version || null]
            : [data.user_id || null, data.spot_id || null, data.ar_type || null,
               data.duration_sec || null, data.qr_scanned || false,
               data.spots_viewed || null, data.device_os || null, data.app_version || null];
        const { rows } = await query(sql, values);
        return rows[0];
    }

    static async findById(id) {
        const sql = `
            SELECT s.*,
                ST_X(s.geom_start::geometry) AS lng,
                ST_Y(s.geom_start::geometry) AS lat,
                u.full_name AS user_name,
                ts.name_vi AS spot_name
            FROM ar_sessions s
            LEFT JOIN users u ON u.id = s.user_id
            LEFT JOIN tourism_spots ts ON ts.id = s.spot_id
            WHERE s.id = $1
        `;
        const { rows } = await query(sql, [id]);
        return rows[0] || null;
    }

    static async getByUser(userId, { page = 1, limit = 20, spot_id } = {}) {
        const offset = (page - 1) * limit;
        const conditions = ['s.user_id = $1'];
        const values = [userId];
        let idx = 2;

        if (spot_id) {
            conditions.push(`s.spot_id = $${idx++}`);
            values.push(spot_id);
        }

        const where = conditions.join(' AND ');
        const sql = `
            SELECT s.id, s.spot_id, s.ar_type, s.started_at, s.duration_sec,
                s.qr_scanned, s.spots_viewed, s.device_os, s.app_version,
                ts.name_vi AS spot_name,
                COUNT(*) OVER() AS total_count
            FROM ar_sessions s
            LEFT JOIN tourism_spots ts ON ts.id = s.spot_id
            WHERE ${where}
            ORDER BY s.started_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `;
        values.push(limit, offset);
        const { rows } = await query(sql, values);
        const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
        return {
            items: rows.map(({ total_count, ...r }) => r),
            pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
        };
    }

    static async getBySpot(spotId, { page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;
        const sql = `
            SELECT s.id, s.user_id, s.ar_type, s.started_at, s.duration_sec,
                s.qr_scanned, s.device_os, s.app_version,
                u.full_name AS user_name,
                COUNT(*) OVER() AS total_count
            FROM ar_sessions s
            LEFT JOIN users u ON u.id = s.user_id
            WHERE s.spot_id = $1
            ORDER BY s.started_at DESC
            LIMIT $2 OFFSET $3
        `;
        const { rows } = await query(sql, [spotId, limit, offset]);
        const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
        return {
            items: rows.map(({ total_count, ...r }) => r),
            pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
        };
    }

    static async getStats(spotId = null) {
        const condition = spotId ? 'WHERE spot_id = $1' : '';
        const values = spotId ? [spotId] : [];

        // Tổng quan toàn bộ
        const summarySql = `
            SELECT
                COUNT(*)                                         AS total_sessions,
                COUNT(DISTINCT user_id)                          AS unique_users,
                ROUND(AVG(duration_sec))                         AS avg_duration_sec,
                COUNT(*) FILTER (WHERE qr_scanned = TRUE)        AS qr_scanned_count
            FROM ar_sessions
            ${condition}
        `;
        const { rows: summaryRows } = await query(summarySql, values);

        // Breakdown theo loại AR
        const byTypeSql = `
            SELECT
                ar_type,
                COUNT(*) AS type_count
            FROM ar_sessions
            ${condition}
            GROUP BY ar_type
            ORDER BY type_count DESC
        `;
        const { rows: byTypeRows } = await query(byTypeSql, values);

        return {
            summary: summaryRows[0],
            by_type: byTypeRows,
        };
    }
}

module.exports = ArSessionRepository;
