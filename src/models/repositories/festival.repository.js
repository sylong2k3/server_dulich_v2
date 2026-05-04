const db = require('../../configs/database');

class FestivalRepository {
    static async findAll({ page = 1, limit = 12, search, festival_type, upcoming, is_published = true, sortBy = 'start_date', sortOrder = 'ASC' }) {
        const offset = (page - 1) * limit;
        const params = [];
        const conditions = [];
        let idx = 1;

        if (is_published !== undefined) { conditions.push(`f.is_published = $${idx++}`); params.push(is_published); }
        if (festival_type) { conditions.push(`f.festival_type = $${idx++}`); params.push(festival_type); }
        if (upcoming) { conditions.push(`f.end_date >= NOW()`); }
        if (search) {
            conditions.push(`(f.name_vi ILIKE $${idx} OR f.name_en ILIKE $${idx} OR f.description_vi ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const allowed = ['name_vi', 'start_date', 'end_date', 'created_at'];
        const col = allowed.includes(sortBy) ? sortBy : 'start_date';
        const dir = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const sql = `
            SELECT f.id, f.name_vi, f.name_en, f.festival_type, f.description_vi,
                   f.start_date, f.end_date, f.cover_image_url, f.location_name,
                   f.is_recurring, f.recurrence_rule, f.website,
                   f.province_code, f.spot_id, f.is_published, f.created_at,
                   ST_X(f.geom::geometry) AS lng, ST_Y(f.geom::geometry) AS lat,
                   COUNT(*) OVER() AS total_count
            FROM festivals f
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
            ORDER BY f.${col} ${dir}
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        params.push(limit, offset);
        const result = await db.query(sql, params);
        return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
    }

    static async findById(id) {
        const sql = `
            SELECT f.*,
                ST_X(f.geom::geometry) AS lng, ST_Y(f.geom::geometry) AS lat
            FROM festivals f
            WHERE f.id = $1
        `;
        const result = await db.query(sql, [id]);
        return result.rows[0] || null;
    }

    static async getCalendar({ from, to, province_code, festival_type }) {
        const params = [from, to];
        const conditions = [
            'f.is_published = true',
            'f.start_date <= $2',
            '(f.end_date >= $1 OR f.start_date >= $1)',
        ];
        let idx = 3;

        if (province_code) { conditions.push(`f.province_code = $${idx++}`); params.push(province_code); }
        if (festival_type) { conditions.push(`f.festival_type = $${idx++}`); params.push(festival_type); }

        const sql = `
            SELECT f.id, f.name_vi, f.name_en, f.festival_type, f.start_date, f.end_date,
                   f.cover_image_url, f.location_name, f.is_recurring, f.recurrence_rule,
                   f.province_code, f.spot_id,
                   ST_X(f.geom::geometry) AS lng, ST_Y(f.geom::geometry) AS lat
            FROM festivals f
            WHERE ${conditions.join(' AND ')}
            ORDER BY f.start_date ASC
        `;
        const result = await db.query(sql, params);
        return result.rows;
    }

    static async create(data) {
        const hasGeom = data.lng != null && data.lat != null;
        const sql = `
            INSERT INTO festivals (
                name_vi, name_en, festival_type, description_vi,
                start_date, end_date, is_recurring, recurrence_rule,
                ${hasGeom ? 'geom,' : ''}
                cover_image_url, website, location_name,
                province_code, spot_id, is_published
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                ${hasGeom ? `ST_SetSRID(ST_MakePoint($9, $10), 4326),` : ''}
                $${hasGeom ? 11 : 9}, $${hasGeom ? 12 : 10}, $${hasGeom ? 13 : 11},
                $${hasGeom ? 14 : 12}, $${hasGeom ? 15 : 13}, $${hasGeom ? 16 : 14}
            ) RETURNING *
        `;
        const base = [
            data.name_vi,
            data.name_en || null,
            data.festival_type || null,
            data.description_vi || null,
            data.start_date,
            data.end_date || null,
            data.is_recurring ?? false,
            data.recurrence_rule || null,
        ];
        const geomValues = hasGeom ? [data.lng, data.lat] : [];
        const rest = [
            data.cover_image_url || null,
            data.website || null,
            data.location_name || null,
            data.province_code || null,
            data.spot_id || null,
            data.is_published ?? false,
        ];
        const result = await db.query(sql, [...base, ...geomValues, ...rest]);
        return result.rows[0];
    }

    static async update(id, fields) {
        const allowed = [
            'name_vi', 'name_en', 'festival_type', 'description_vi',
            'start_date', 'end_date', 'is_recurring', 'recurrence_rule',
            'cover_image_url', 'website', 'location_name',
            'province_code', 'spot_id', 'is_published',
        ];
        const sets = []; const params = []; let idx = 1;
        for (const key of allowed) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
        }
        if (fields.lng != null && fields.lat != null) {
            sets.push(`geom = ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)`);
            params.push(fields.lng, fields.lat);
        }
        if (!sets.length) return null;
        sets.push('updated_at = NOW()');
        params.push(id);
        const result = await db.query(
            `UPDATE festivals SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM festivals WHERE id = $1 RETURNING id', [id]);
        return result.rows[0] || null;
    }

    static async getTypes() {
        const result = await db.query('SELECT DISTINCT festival_type FROM festivals WHERE festival_type IS NOT NULL ORDER BY festival_type');
        return result.rows.map(r => r.festival_type);
    }
}

module.exports = FestivalRepository;
