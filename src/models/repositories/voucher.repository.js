const { query } = require('../../configs/database');

class VoucherRepository {
    static async findByBusinessId(businessId, { page = 1, limit = 20, is_active } = {}) {
        const offset = (page - 1) * limit;
        const conditions = ['v.business_id = $1'];
        const params = [businessId];
        let idx = 2;

        if (is_active !== undefined) { conditions.push(`v.is_active = $${idx++}`); params.push(is_active); }

        const sql = `
            SELECT v.*,
                ST_X(v.geo_target_geom::geometry) AS geo_lng,
                ST_Y(v.geo_target_geom::geometry) AS geo_lat,
                COUNT(*) OVER() AS total_count
            FROM vouchers v
            WHERE ${conditions.join(' AND ')}
            ORDER BY v.created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `;
        params.push(limit, offset);
        const { rows } = await query(sql, params);
        return { rows, total: parseInt(rows[0]?.total_count || 0) };
    }

    /**
     * Admin: list voucher của TẤT CẢ doanh nghiệp — không filter theo owner.
     * Filter mở rộng: business_id, is_active, expired (đã hết hạn), search code/title.
     */
    static async findAllAdmin({ page = 1, limit = 20, business_id, is_active, expired, search } = {}) {
        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
        let idx = 1;

        if (business_id) { conditions.push(`v.business_id = $${idx++}`); params.push(business_id); }
        if (is_active !== undefined) { conditions.push(`v.is_active = $${idx++}`); params.push(is_active); }
        if (expired === true) { conditions.push(`v.valid_until < NOW()`); }
        else if (expired === false) { conditions.push(`(v.valid_until IS NULL OR v.valid_until >= NOW())`); }
        if (search) {
            conditions.push(`(v.code ILIKE $${idx} OR v.title_vi ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `
            SELECT v.*,
                ST_X(v.geo_target_geom::geometry) AS geo_lng,
                ST_Y(v.geo_target_geom::geometry) AS geo_lat,
                b.business_name,
                COUNT(*) OVER() AS total_count
            FROM vouchers v
            JOIN businesses b ON b.id = v.business_id
            ${where}
            ORDER BY v.created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `;
        params.push(limit, offset);
        const { rows } = await query(sql, params);
        return { rows, total: parseInt(rows[0]?.total_count || 0) };
    }

    static async findById(id) {
        const sql = `
            SELECT v.*,
                ST_X(v.geo_target_geom::geometry) AS geo_lng,
                ST_Y(v.geo_target_geom::geometry) AS geo_lat,
                b.business_name, b.owner_id
            FROM vouchers v
            JOIN businesses b ON b.id = v.business_id
            WHERE v.id = $1
        `;
        const { rows } = await query(sql, [id]);
        return rows[0] || null;
    }

    static async findByCode(code) {
        const sql = `
            SELECT v.*,
                ST_X(v.geo_target_geom::geometry) AS geo_lng,
                ST_Y(v.geo_target_geom::geometry) AS geo_lat,
                b.business_name
            FROM vouchers v
            JOIN businesses b ON b.id = v.business_id
            WHERE v.code = $1 AND v.is_active = TRUE
        `;
        const { rows } = await query(sql, [code.toUpperCase()]);
        return rows[0] || null;
    }

    static async findNearby(lng, lat, radiusM) {
        const sql = `
            SELECT v.id, v.code, v.title_vi, v.discount_type, v.discount_value,
                v.min_order_value, v.valid_from, v.valid_until,
                b.business_name,
                ST_X(v.geo_target_geom::geometry) AS geo_lng,
                ST_Y(v.geo_target_geom::geometry) AS geo_lat,
                v.geo_radius_m,
                ROUND(ST_Distance(v.geo_target_geom::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)) AS distance_m
            FROM vouchers v
            JOIN businesses b ON b.id = v.business_id
            WHERE v.is_active = TRUE
              AND v.valid_until >= NOW()
              AND (v.max_uses IS NULL OR v.used_count < v.max_uses)
              AND (
                v.geo_target_geom IS NULL
                OR ST_DWithin(v.geo_target_geom::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)
              )
            ORDER BY distance_m ASC NULLS LAST
            LIMIT 50
        `;
        const { rows } = await query(sql, [lng, lat, radiusM]);
        return rows;
    }

    static async create(data) {
        const hasGeom = data.lng != null && data.lat != null;
        const sql = `
            INSERT INTO vouchers (
                business_id, code, title_vi, description_vi,
                discount_type, discount_value, min_order_value,
                max_uses, valid_from, valid_until,
                ${hasGeom ? 'geo_target_geom, geo_radius_m,' : ''}
                is_active
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                ${hasGeom ? `ST_SetSRID(ST_MakePoint($11,$12),4326), $13,` : ''}
                $${hasGeom ? 14 : 11}
            ) RETURNING *
        `;
        const base = [
            data.business_id, data.code.toUpperCase(), data.title_vi, data.description_vi || null,
            data.discount_type, data.discount_value,
            data.min_order_value || null, data.max_uses || null,
            data.valid_from, data.valid_until,
        ];
        const geomValues = hasGeom ? [data.lng, data.lat, data.geo_radius_m] : [];
        const { rows } = await query(sql, [...base, ...geomValues, data.is_active ?? true]);
        return rows[0];
    }

    static async update(id, fields) {
        const allowed = ['title_vi', 'description_vi', 'discount_value', 'min_order_value', 'max_uses', 'valid_from', 'valid_until', 'geo_radius_m', 'is_active'];
        const sets = []; const params = []; let idx = 1;
        for (const key of allowed) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
        }
        if (fields.lng != null && fields.lat != null) {
            sets.push(`geo_target_geom = ST_SetSRID(ST_MakePoint($${idx++},$${idx++}),4326)`);
            params.push(fields.lng, fields.lat);
        } else if (fields.lng === null && fields.lat === null) {
            sets.push(`geo_target_geom = NULL`);
        }
        if (!sets.length) return null;
        params.push(id);
        const { rows } = await query(
            `UPDATE vouchers SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
        );
        return rows[0] || null;
    }

    static async incrementUsedCount(id) {
        const { rows } = await query(
            `UPDATE vouchers SET used_count = used_count + 1 WHERE id = $1 RETURNING id, used_count`,
            [id]
        );
        return rows[0] || null;
    }

    static async deactivate(id) {
        const { rows } = await query(
            `UPDATE vouchers SET is_active = FALSE WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }

    // Kiểm tra geofence: trả true nếu toạ độ (lng, lat) nằm trong vùng geo của voucher
    static async checkGeofence(geoTargetGeom, geoRadiusM, lng, lat) {
        const { rows } = await query(
            `SELECT ST_DWithin(
                ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
                $3::geography,
                $4
            ) AS within`,
            [lng, lat, geoTargetGeom, geoRadiusM],
        );
        return rows[0]?.within === true;
    }
}

module.exports = VoucherRepository;
