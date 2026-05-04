const { query, getClient } = require('../../configs/database');

class ItineraryRepository {
    // ==================== ITINERARIES ====================

    static async findAllByUser(userId, options = {}) {
        const { page = 1, limit = 10, status, sortBy = 'updated_at', sortOrder = 'DESC' } = options;
        const offset = (page - 1) * limit;
        const values = [userId];
        const conditions = ['it.user_id = $1'];
        let idx = 2;

        if (status) {
            conditions.push(`it.status = $${idx++}`);
            values.push(status);
        }

        const allowed = ['created_at', 'updated_at', 'start_date', 'title'];
        const col = allowed.includes(sortBy) ? sortBy : 'updated_at';
        const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const sql = `
            SELECT it.id, it.title, it.description, it.start_date, it.end_date,
                   it.total_days, it.budget_vnd, it.is_public, it.share_token,
                   it.total_distance_km, it.est_travel_time_min,
                   it.status, it.ai_generated, it.pdf_export_url,
                   it.created_at, it.updated_at,
                   COUNT(*) OVER() AS total_count
            FROM itineraries it
            WHERE ${conditions.join(' AND ')}
            ORDER BY it.${col} ${dir}
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        values.push(limit, offset);
        const { rows } = await query(sql, values);
        const total = rows.length ? Number(rows[0].total_count) : 0;
        return { rows: rows.map(({ total_count, ...r }) => r), total };
    }

    static async findById(id) {
        const sql = `
            SELECT it.*,
                   u.full_name AS user_name,
                   u.avatar_url AS user_avatar
            FROM itineraries it
            JOIN users u ON u.id = it.user_id
            WHERE it.id = $1
        `;
        const { rows } = await query(sql, [id]);
        return rows[0] || null;
    }

    static async findByShareToken(token) {
        const sql = `
            SELECT it.*,
                   u.full_name AS user_name
            FROM itineraries it
            JOIN users u ON u.id = it.user_id
            WHERE it.share_token = $1 AND it.is_public = TRUE
        `;
        const { rows } = await query(sql, [token]);
        return rows[0] || null;
    }

    static async create(data) {
        const sql = `
            INSERT INTO itineraries
                (user_id, title, description, start_date, end_date, budget_vnd,
                 is_public, status, ai_generated, ai_prompt)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *
        `;
        const { rows } = await query(sql, [
            data.user_id,
            data.title,
            data.description || null,
            data.start_date || null,
            data.end_date || null,
            data.budget_vnd || null,
            data.is_public ?? false,
            data.status || 'draft',
            data.ai_generated ?? false,
            data.ai_prompt || null,
        ]);
        return rows[0];
    }

    static async update(id, fields = {}) {
        const allowed = ['title', 'description', 'start_date', 'end_date', 'budget_vnd',
            'is_public', 'status', 'share_token', 'total_distance_km',
            'est_travel_time_min', 'pdf_export_url'];
        const sets = [];
        const values = [];
        let idx = 1;

        for (const key of allowed) {
            if (fields[key] !== undefined) {
                sets.push(`${key} = $${idx++}`);
                values.push(fields[key]);
            }
        }
        if (!sets.length) return this.findById(id);

        sets.push('updated_at = NOW()');
        values.push(id);
        const { rows } = await query(
            `UPDATE itineraries SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return rows[0] || null;
    }

    static async delete(id) {
        const { rows } = await query('DELETE FROM itineraries WHERE id = $1 RETURNING id', [id]);
        return rows[0] || null;
    }

    // ==================== DAYS ====================

    static async getDays(itineraryId) {
        const sql = `
            SELECT d.*,
                   json_agg(
                       json_build_object(
                           'id', s.id,
                           'spot_id', s.spot_id,
                           'business_id', s.business_id,
                           'custom_name', s.custom_name,
                           'sort_order', s.sort_order,
                           'planned_arrival', s.planned_arrival,
                           'planned_duration_min', s.planned_duration_min,
                           'notes', s.notes,
                           'is_completed', s.is_completed,
                           'spot_name', ts.name_vi,
                           'geom', ST_AsGeoJSON(COALESCE(s.custom_geom, ts.geom))::json
                       ) ORDER BY s.sort_order
                   ) FILTER (WHERE s.id IS NOT NULL) AS stops
            FROM itinerary_days d
            LEFT JOIN itinerary_stops s ON s.day_id = d.id
            LEFT JOIN tourism_spots ts ON ts.id = s.spot_id
            WHERE d.itinerary_id = $1
            GROUP BY d.id
            ORDER BY d.day_number
        `;
        const { rows } = await query(sql, [itineraryId]);
        return rows;
    }

    static async findDayById(dayId) {
        const { rows } = await query('SELECT * FROM itinerary_days WHERE id = $1', [dayId]);
        return rows[0] || null;
    }

    static async createDay(data) {
        const sql = `
            INSERT INTO itinerary_days (itinerary_id, day_number, title, date_actual, notes)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *
        `;
        const { rows } = await query(sql, [
            data.itinerary_id,
            data.day_number,
            data.title || null,
            data.date_actual || null,
            data.notes || null,
        ]);
        return rows[0];
    }

    static async updateDay(dayId, fields = {}) {
        const allowed = ['day_number', 'title', 'date_actual', 'notes'];
        const sets = [];
        const values = [];
        let idx = 1;
        for (const key of allowed) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); values.push(fields[key]); }
        }
        if (!sets.length) return this.findDayById(dayId);
        values.push(dayId);
        const { rows } = await query(
            `UPDATE itinerary_days SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return rows[0] || null;
    }

    static async deleteDay(dayId) {
        const { rows } = await query('DELETE FROM itinerary_days WHERE id = $1 RETURNING id', [dayId]);
        return rows[0] || null;
    }

    // ==================== STOPS ====================

    static async findStopById(stopId) {
        const { rows } = await query('SELECT * FROM itinerary_stops WHERE id = $1', [stopId]);
        return rows[0] || null;
    }

    static async createStop(data) {
        const hasCustomGeom = data.lng != null && data.lat != null;
        const geomExpr = hasCustomGeom
            ? `ST_SetSRID(ST_MakePoint($9, $10), 4326)`
            : 'NULL';

        const sql = `
            INSERT INTO itinerary_stops
                (day_id, spot_id, business_id, custom_name, sort_order,
                 planned_arrival, planned_duration_min, notes, custom_geom)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,${geomExpr})
            RETURNING *
        `;
        const params = [
            data.day_id,
            data.spot_id || null,
            data.business_id || null,
            data.custom_name || null,
            data.sort_order,
            data.planned_arrival || null,
            data.planned_duration_min || null,
            data.notes || null,
        ];
        if (hasCustomGeom) params.push(data.lng, data.lat);
        const { rows } = await query(sql, params);
        return rows[0];
    }

    static async updateStop(stopId, fields = {}) {
        const allowed = ['spot_id', 'business_id', 'custom_name', 'sort_order',
            'planned_arrival', 'planned_duration_min', 'notes', 'is_completed'];
        const sets = [];
        const values = [];
        let idx = 1;
        for (const key of allowed) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); values.push(fields[key]); }
        }
        if (fields.lng != null && fields.lat != null) {
            sets.push(`custom_geom = ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)`);
            values.push(fields.lng, fields.lat);
        }
        if (fields.is_completed === true) {
            sets.push(`completed_at = NOW()`);
        }
        if (!sets.length) return this.findStopById(stopId);
        values.push(stopId);
        const { rows } = await query(
            `UPDATE itinerary_stops SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return rows[0] || null;
    }

    static async deleteStop(stopId) {
        const { rows } = await query('DELETE FROM itinerary_stops WHERE id = $1 RETURNING id', [stopId]);
        return rows[0] || null;
    }

    // ==================== DISTANCE CALCULATION ====================

    /**
     * Tính tổng khoảng cách lộ trình dựa trên geom các điểm dừng.
     */
    static async calcTotalDistance(itineraryId) {
        const sql = `
            SELECT ROUND(
                SUM(
                    ST_Distance(
                        COALESCE(s.custom_geom, ts.geom)::geography,
                        LEAD(COALESCE(s.custom_geom, ts.geom)) OVER (
                            PARTITION BY d.itinerary_id ORDER BY d.day_number, s.sort_order
                        )::geography
                    ) / 1000
                )::numeric, 2
            ) AS total_km
            FROM itinerary_days d
            JOIN itinerary_stops s ON s.day_id = d.id
            LEFT JOIN tourism_spots ts ON ts.id = s.spot_id
            WHERE d.itinerary_id = $1
              AND COALESCE(s.custom_geom, ts.geom) IS NOT NULL
        `;
        const { rows } = await query(sql, [itineraryId]);
        return rows[0]?.total_km ? Number(rows[0].total_km) : null;
    }
}

module.exports = ItineraryRepository;
