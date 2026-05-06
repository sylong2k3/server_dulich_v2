const db = require('../../configs/database');
const { normalizeLang, localizedSQL, localizedValueSQL } = require('../../utils/i18n.utils');

class FestivalRepository {
    static async findAll({ page = 1, limit = 12, search, festival_type, upcoming, is_published = true, province_code, sortBy = 'start_date', sortOrder = 'ASC', lang: rawLang = 'vi' }) {
        const lang = normalizeLang(rawLang);
        const offset = (page - 1) * limit;
        const params = [];
        const conditions = [];
        let idx = 1;

        if (is_published !== undefined) { conditions.push(`f.is_published = $${idx++}`); params.push(is_published); }
        if (festival_type) { conditions.push(`f.festival_type = $${idx++}`); params.push(festival_type); }
        if (province_code) { conditions.push(`f.province_code = $${idx++}`); params.push(province_code); }
        if (upcoming) { conditions.push(`f.end_date >= NOW()`); }
        if (search) {
            conditions.push(`(f.name_vi ILIKE $${idx} OR f.name_en ILIKE $${idx} OR f.description_vi ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const allowed = ['start_date', 'end_date', 'created_at'];
        let orderClause;
        if (sortBy === 'name' || sortBy === 'name_vi') {
            orderClause = `${localizedValueSQL(lang, 'f.name_vi', 'f.name_en')} ${sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
        } else {
            const col = allowed.includes(sortBy) ? sortBy : 'start_date';
            const dir = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            orderClause = `f.${col} ${dir}`;
        }

        const sql = `
            SELECT f.id,
                   ${localizedSQL(lang, 'f.name_vi', 'f.name_en', 'name')},
                   f.festival_type, f.description_vi AS description,
                   f.start_date, f.end_date, f.cover_image_url, f.location_name,
                   f.is_recurring, f.recurrence_rule, f.website,
                   f.province_code, f.spot_id, f.is_published, f.created_at,
                   ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
                   ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'spot_name')},
                   ST_X(COALESCE(ts.geom::geometry, ST_GeomFromText('POINT(0 0)', 4326))) AS lng,
                   ST_Y(COALESCE(ts.geom::geometry, ST_GeomFromText('POINT(0 0)', 4326))) AS lat,
                   COUNT(*) OVER() AS total_count
            FROM festivals f
            LEFT JOIN vn_units.provinces p ON f.province_code = p.code
            LEFT JOIN tourism_spots ts ON f.spot_id = ts.id
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
            ORDER BY ${orderClause}
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        params.push(limit, offset);
        const result = await db.query(sql, params);
        return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
    }

    static async findById(id, rawLang = 'vi') {
        const lang = normalizeLang(rawLang);
        const sql = `
            SELECT f.id,
                   ${localizedSQL(lang, 'f.name_vi', 'f.name_en', 'name')},
                   f.festival_type, f.description_vi AS description,
                   f.start_date, f.end_date, f.cover_image_url, f.location_name,
                   f.is_recurring, f.recurrence_rule, f.website,
                   f.province_code, f.spot_id, f.is_published,
                   f.created_at, f.updated_at,
                   ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
                   ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'spot_name')},
                   ST_X(COALESCE(ts.geom::geometry, ST_GeomFromText('POINT(0 0)', 4326))) AS lng,
                   ST_Y(COALESCE(ts.geom::geometry, ST_GeomFromText('POINT(0 0)', 4326))) AS lat
            FROM festivals f
            LEFT JOIN vn_units.provinces p ON f.province_code = p.code
            LEFT JOIN tourism_spots ts ON f.spot_id = ts.id
            WHERE f.id = $1
        `;
        const result = await db.query(sql, [id]);
        return result.rows[0] || null;
    }

    static async getCalendar({ from, to, province_code, festival_type, lang: rawLang = 'vi' }) {
        const lang = normalizeLang(rawLang);
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
            SELECT f.id,
                   ${localizedSQL(lang, 'f.name_vi', 'f.name_en', 'name')},
                   f.festival_type, f.start_date, f.end_date,
                   f.cover_image_url, f.location_name, f.is_recurring, f.recurrence_rule,
                   f.province_code, f.spot_id,
                   ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
                   ST_X(COALESCE(ts.geom::geometry, ST_GeomFromText('POINT(0 0)', 4326))) AS lng,
                   ST_Y(COALESCE(ts.geom::geometry, ST_GeomFromText('POINT(0 0)', 4326))) AS lat
            FROM festivals f
            LEFT JOIN vn_units.provinces p ON f.province_code = p.code
            LEFT JOIN tourism_spots ts ON f.spot_id = ts.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY f.start_date ASC
        `;
        const result = await db.query(sql, params);
        return result.rows;
    }

    static async create(data) {
        const sql = `
            INSERT INTO festivals (
                name_vi, name_en, festival_type, description_vi,
                start_date, end_date, is_recurring, recurrence_rule,
                cover_image_url, website, location_name,
                province_code, spot_id, is_published
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14
            ) RETURNING *
        `;
        const values = [
            data.name_vi,
            data.name_en || null,
            data.festival_type || null,
            data.description_vi || null,
            data.start_date,
            data.end_date || null,
            data.is_recurring ?? false,
            data.recurrence_rule || null,
            data.cover_image_url || null,
            data.website || null,
            data.location_name || null,
            data.province_code || null,
            data.spot_id || null,
            data.is_published ?? false,
        ];
        const result = await db.query(sql, values);
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
