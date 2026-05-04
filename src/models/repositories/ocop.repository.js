const db = require('../../configs/database');

class OcopRepository {
    static async findAll({ page = 1, limit = 12, search, category, star_rating, province_code, is_active, sortBy = 'created_at', sortOrder = 'DESC' }) {
        const offset = (page - 1) * limit;
        const params = [];
        const conditions = [];
        let idx = 1;

        if (is_active !== undefined) { conditions.push(`o.is_active = $${idx++}`); params.push(is_active); }
        if (category) { conditions.push(`o.category = $${idx++}`); params.push(category); }
        if (star_rating) { conditions.push(`o.star_rating = $${idx++}`); params.push(star_rating); }
        if (province_code) { conditions.push(`o.province_code = $${idx++}`); params.push(province_code); }
        if (search) {
            conditions.push(`(o.name_vi ILIKE $${idx} OR o.name_en ILIKE $${idx} OR o.description_vi ILIKE $${idx} OR o.producer_name ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const allowed = ['name_vi', 'star_rating', 'price_vnd', 'created_at'];
        const col = allowed.includes(sortBy) ? sortBy : 'created_at';
        const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const sql = `
            SELECT o.id, o.name_vi, o.name_en, o.category, o.description_vi,
                   o.star_rating, o.certification_no, o.price_vnd, o.unit,
                   o.cover_image_url, o.media_urls, o.shop_url,
                   o.producer_name, o.province_code, o.business_id,
                   o.is_active, o.created_at,
                   ST_X(o.geom::geometry) AS lng, ST_Y(o.geom::geometry) AS lat,
                   COUNT(*) OVER() AS total_count
            FROM ocop_products o
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
            ORDER BY o.${col} ${dir}
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        params.push(limit, offset);
        const result = await db.query(sql, params);
        return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
    }

    static async findById(id) {
        const sql = `
            SELECT o.*,
                ST_X(o.geom::geometry) AS lng, ST_Y(o.geom::geometry) AS lat
            FROM ocop_products o
            WHERE o.id = $1
        `;
        const result = await db.query(sql, [id]);
        return result.rows[0] || null;
    }

    static async create(data) {
        const hasGeom = data.lng != null && data.lat != null;
        const sql = `
            INSERT INTO ocop_products (
                name_vi, name_en, category, description_vi,
                star_rating, certification_no, certified_at,
                cover_image_url, media_urls, price_vnd, unit, shop_url,
                ${hasGeom ? 'geom,' : ''}
                producer_name, province_code, business_id, is_active
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                ${hasGeom ? `ST_SetSRID(ST_MakePoint($13, $14), 4326),` : ''}
                $${hasGeom ? 15 : 13}, $${hasGeom ? 16 : 14}, $${hasGeom ? 17 : 15}, $${hasGeom ? 18 : 16}
            ) RETURNING *
        `;
        const base = [
            data.name_vi,
            data.name_en || null,
            data.category || null,
            data.description_vi || null,
            data.star_rating,
            data.certification_no || null,
            data.certified_at || null,
            data.cover_image_url || null,
            data.media_urls || null,
            data.price_vnd || null,
            data.unit || null,
            data.shop_url || null,
        ];
        const geomValues = hasGeom ? [data.lng, data.lat] : [];
        const rest = [
            data.producer_name || null,
            data.province_code,
            data.business_id || null,
            data.is_active ?? true,
        ];
        const result = await db.query(sql, [...base, ...geomValues, ...rest]);
        return result.rows[0];
    }

    static async update(id, fields) {
        const allowed = [
            'name_vi', 'name_en', 'category', 'description_vi',
            'star_rating', 'certification_no', 'certified_at',
            'cover_image_url', 'media_urls', 'price_vnd', 'unit', 'shop_url',
            'producer_name', 'province_code', 'business_id', 'is_active',
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
            `UPDATE ocop_products SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        const result = await db.query('UPDATE ocop_products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id', [id]);
        return result.rows[0] || null;
    }

    static async getCategories() {
        const result = await db.query('SELECT DISTINCT category FROM ocop_products WHERE category IS NOT NULL ORDER BY category');
        return result.rows.map(r => r.category);
    }
}

module.exports = OcopRepository;
