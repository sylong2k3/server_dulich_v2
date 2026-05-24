const db = require('../../configs/database');
const { normalizeLang, localizedSQL, localizedValueSQL } = require('../../utils/i18n.utils');

class OcopRepository {
    static async findAll({ page = 1, limit = 12, search, category, star_rating, province_code, business_id, spot_id, by_distance, radius_km, is_active, sortBy = 'created_at', sortOrder = 'DESC', lang: rawLang = 'vi' }) {
        const lang = normalizeLang(rawLang);
        const offset = (page - 1) * limit;
        const params = [];
        const conditions = [];
        let idx = 1;

        if (is_active !== undefined) { conditions.push(`o.is_active = $${idx++}`); params.push(is_active); }
        if (category) { conditions.push(`o.category = $${idx++}`); params.push(category); }
        if (star_rating) { conditions.push(`o.star_rating = $${idx++}`); params.push(star_rating); }
        if (province_code) { conditions.push(`o.province_code = $${idx++}`); params.push(province_code); }
        if (business_id) { conditions.push(`o.business_id = $${idx++}`); params.push(business_id); }
        if (spot_id) {
            if (by_distance) {
                const rad = parseFloat(radius_km) || 10;
                conditions.push(`o.geom IS NOT NULL AND ST_DWithin(o.geom::geography, (SELECT geom FROM tourism_spots WHERE id = $${idx++})::geography, $${idx++} * 1000)`);
                params.push(spot_id, rad);
            } else {
                conditions.push(`o.spot_id = $${idx++}`);
                params.push(spot_id);
            }
        }
        if (search) {
            conditions.push(`(o.name_vi ILIKE $${idx} OR o.name_en ILIKE $${idx} OR o.description_vi ILIKE $${idx} OR o.producer_name ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const allowed = ['star_rating', 'price_vnd', 'created_at'];
        let orderClause;
        if (sortBy === 'name' || sortBy === 'name_vi') {
            orderClause = `${localizedValueSQL(lang, 'o.name_vi', 'o.name_en')} ${sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
        } else {
            const col = allowed.includes(sortBy) ? sortBy : 'created_at';
            const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            orderClause = `o.${col} ${dir}`;
        }

        const sql = `
            SELECT o.id,
                   ${localizedSQL(lang, 'o.name_vi', 'o.name_en', 'name')},
                   o.category, o.description_vi AS description,
                   o.star_rating, o.certification_no, o.price_vnd, o.unit,
                   o.cover_image_url, o.media_urls, o.shop_url,
                   o.producer_name, o.province_code, o.business_id, o.spot_id,
                   o.is_active, o.created_at,
                   ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
                   b.business_name,
                   s.name_vi AS spot_name,
                   ST_X(o.geom::geometry) AS lng, ST_Y(o.geom::geometry) AS lat,
                   COUNT(*) OVER() AS total_count
            FROM ocop_products o
            LEFT JOIN vn_units.provinces p ON o.province_code = p.code
            LEFT JOIN businesses b ON o.business_id = b.id
            LEFT JOIN tourism_spots s ON o.spot_id = s.id
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
            SELECT o.id,
                   ${localizedSQL(lang, 'o.name_vi', 'o.name_en', 'name')},
                   o.category, o.description_vi AS description,
                   o.star_rating, o.certification_no, o.certified_at,
                   o.price_vnd, o.unit, o.cover_image_url, o.media_urls, o.shop_url,
                   o.producer_name, o.province_code, o.business_id, o.spot_id,
                   o.is_active, o.created_at, o.updated_at,
                   ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
                   b.business_name,
                   s.name_vi AS spot_name,
                   ST_X(o.geom::geometry) AS lng, ST_Y(o.geom::geometry) AS lat
            FROM ocop_products o
            LEFT JOIN vn_units.provinces p ON o.province_code = p.code
            LEFT JOIN businesses b ON o.business_id = b.id
            LEFT JOIN tourism_spots s ON o.spot_id = s.id
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
                producer_name, province_code, business_id, spot_id, is_active
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                ${hasGeom ? `ST_SetSRID(ST_MakePoint($13, $14), 4326),` : ''}
                $${hasGeom ? 15 : 13}, $${hasGeom ? 16 : 14}, $${hasGeom ? 17 : 15}, $${hasGeom ? 18 : 16}, $${hasGeom ? 19 : 17}
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
            data.spot_id || null,
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
            'producer_name', 'province_code', 'business_id', 'spot_id', 'is_active',
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

    static async getOcopGeoJSON({ page = 1, limit = 50 } = {}) {
        const offset = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
        const safeLimit = Math.min(100, Math.max(1, Number(limit)));
        const sql = `
          SELECT 
            o.id, 
            o.name_vi, 
            o.star_rating, 
            o.cover_image_url,
            o.producer_name,
            o.price_vnd,
            ts.id AS spot_id,
            ts.name_vi AS spot_name,
            ST_AsGeoJSON(ts.geom)::json AS geometry,
            COUNT(*) OVER() AS total_count
          FROM ocop_products o
          INNER JOIN tourism_spots ts ON o.spot_id = ts.id
          WHERE o.is_active = true AND ts.status = 'active' AND ts.geom IS NOT NULL
          ORDER BY o.name_vi
          LIMIT $1 OFFSET $2
        `;
        const result = await db.query(sql, [safeLimit, offset]);
        const rows = result.rows;
        
        const total = rows.length ? Number(rows[0].total_count) : 0;
        const features = rows.map(({ total_count, geometry, ...props }) => ({
          type: 'Feature',
          geometry: geometry || null,
          properties: props,
        }));

        return {
          type: 'FeatureCollection',
          name: 'ocop_products',
          totalFeatures: total,
          features,
        };
    }
}

module.exports = OcopRepository;
