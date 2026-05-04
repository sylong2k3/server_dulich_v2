const { query } = require('../../configs/database');
const { create, updateById } = require('../../utils/database');
const {
  dWithinSQL,
  distanceSQL,
  bboxFilterSQL,
  asGeoJSON,
  extractCoords,
} = require('../../utils/geo.utils');

class SpotRepository {
  static tableName = 'tourism_spots';

  /**
   * Danh sách điểm du lịch với filter + pagination
   */
  static async getAllSpots(options = {}) {
    const {
      page = 1,
      limit = 20,
      category_ids,
      province_code,
      district_id,
      status = 'active',
      is_featured,
      rating_min,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      capacity = false,
    } = options;

    const values = [];
    let paramCount = 1;
    let whereClause = 'WHERE 1=1';

    if (status) {
      whereClause += ` AND ts.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (category_ids !== undefined && category_ids !== null) {
      const ids = (Array.isArray(category_ids) ? category_ids : [category_ids]).map(Number);
      whereClause += ` AND ts.category_id = ANY($${paramCount}::int[])`;
      values.push(ids);
      paramCount++;
    }

    if (province_code) {
      whereClause += ` AND ts.province_code = $${paramCount}`;
      values.push(province_code);
      paramCount++;
    }

    if (district_id) {
      whereClause += ` AND ts.district_id = $${paramCount}`;
      values.push(Number(district_id));
      paramCount++;
    }

    if (is_featured !== undefined) {
      whereClause += ` AND ts.is_featured = $${paramCount}`;
      values.push(is_featured === 'true' || is_featured === true);
      paramCount++;
    }

    if (rating_min) {
      whereClause += ` AND ts.rating_avg >= $${paramCount}`;
      values.push(Number(rating_min));
      paramCount++;
    }

    // Full-text search (TSVECTOR)
    if (search) {
      whereClause += ` AND (
        ts.search_vector @@ plainto_tsquery('simple', $${paramCount})
        OR ts.name_vi ILIKE $${paramCount + 1}
        OR ts.name_en ILIKE $${paramCount + 1}
      )`;
      values.push(search, `%${search}%`);
      paramCount += 2;
    }

    const allowedSort = ['created_at', 'name_vi', 'rating_avg', 'rating_count'];
    const safeSort = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : 'DESC';

    const offset = (page - 1) * limit;

    const capacitySelect = capacity
      ? `,
        cap.visitor_count  AS current_visitor_count,
        cap.capacity_pct   AS current_capacity_pct,
        cap.status         AS capacity_status,
        cap.recorded_at    AS capacity_recorded_at,
        ts.alert_threshold_pct`
      : '';

    const capacityJoin = capacity
      ? `LEFT JOIN LATERAL (
          SELECT visitor_count, capacity_pct, status, recorded_at
          FROM capacity_logs
          WHERE spot_id = ts.id
          ORDER BY recorded_at DESC
          LIMIT 1
        ) cap ON true`
      : '';

    const sql = `
      SELECT ts.id, ts.slug, ts.name_vi, ts.name_en,
        ts.description_vi, ts.address_vi,
        ts.rating_avg, ts.rating_count,
        ts.is_featured, ts.status,
        ts.ticket_price_adult, ts.ticket_price_child, ts.ticket_currency,
        ts.opening_hours, ts.phone, ts.website,
        ts.has_vr_360, ts.has_ar_support, ts.has_audio_guide,
        ts.max_capacity,
        ${asGeoJSON('ts.geom')},
        ts.category_id,
        sc.name_vi AS category_name,
        sc.parent_id AS category_parent_id,
        scp.name_vi AS category_parent_name,
        p.name AS province_name,
        cm.name AS commune_name,
        (SELECT url FROM spot_media sm WHERE sm.spot_id = ts.id AND sm.is_primary = true LIMIT 1) AS primary_image,
        COUNT(*) OVER() AS total_count
        ${capacitySelect}
      FROM ${this.tableName} ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      LEFT JOIN spot_categories scp ON sc.parent_id = scp.id
      LEFT JOIN vn_units.provinces p ON ts.province_code = p.code
      LEFT JOIN vn_units.wards cm ON ts.ward_code = cm.code
      ${capacityJoin}
      ${whereClause}
      ORDER BY ts.${safeSort} ${safeOrder}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(limit, offset);

    const { rows } = await query(sql, values);
    const totalCount = rows.length ? Number(rows[0].total_count) : 0;

    return {
      spots: rows.map((r) => {
        const { total_count, ...spot } = r;
        return spot;
      }),
      totalCount,
    };
  }

  /**
   * Tìm spots trong bán kính (nearby)
   */
  static async findNearby(lat, lng, radiusKm = 10, limit = 50) {
    const radiusM = radiusKm * 1000;
    const sql = `
      SELECT ts.id, ts.slug, ts.name_vi, ts.name_en,
        ts.rating_avg, ts.rating_count, ts.is_featured, ts.status,
        ts.ticket_price_adult, ts.ticket_currency,
        ${extractCoords('ts.geom')},
        ${distanceSQL('ts.geom', 1, 2)} AS distance_m,
        sc.name_vi AS category_name, sc.color_hex AS category_color, sc.icon_url AS category_icon,
        p.name AS province_name,
        (SELECT url FROM spot_media sm WHERE sm.spot_id = ts.id AND sm.is_primary = true LIMIT 1) AS primary_image
      FROM ${this.tableName} ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      LEFT JOIN vn_units.provinces p ON ts.province_code = p.code
      WHERE ts.status = 'active'
        AND ${dWithinSQL('ts.geom', 1, 2, 3)}
      ORDER BY distance_m ASC
      LIMIT $4
    `;
    const { rows } = await query(sql, [lng, lat, radiusM, limit]);
    return rows;
  }

  /**
   * Tìm spots trong bbox
   */
  static async findByBbox(minLng, minLat, maxLng, maxLat, limit = 500) {
    const sql = `
      SELECT ts.id, ts.slug, ts.name_vi,
        ts.rating_avg, ts.is_featured, ts.status,
        ${extractCoords('ts.geom')},
        ${asGeoJSON('ts.geom')},
        sc.name_vi AS category_name, sc.code AS category_code,
        sc.color_hex AS category_color, sc.icon_url AS category_icon
      FROM ${this.tableName} ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      WHERE ts.status = 'active'
        AND ${bboxFilterSQL('ts.geom', 1, 2, 3, 4)}
      LIMIT $5
    `;
    const { rows } = await query(sql, [minLng, minLat, maxLng, maxLat, limit]);
    return rows;
  }

  /**
   * GeoJSON FeatureCollection cho map
   */
  static async getGeoJSON(options = {}) {
    const { category_id, province_code } = options;
    const values = [];
    let paramCount = 1;
    let whereClause = "WHERE ts.status = 'active'";

    if (category_id) {
      whereClause += ` AND ts.category_id = $${paramCount}`;
      values.push(Number(category_id));
      paramCount++;
    }

    if (province_code) {
      whereClause += ` AND ts.province_code = $${paramCount}`;
      values.push(province_code);
      paramCount++;
    }

    const sql = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
          json_build_object(
            'type', 'Feature',
            'id', ts.id,
            'geometry', ST_AsGeoJSON(ts.geom)::json,
            'properties', json_build_object(
              'id', ts.id,
              'slug', ts.slug,
              'name_vi', ts.name_vi,
              'category_code', sc.code,
              'category_name', sc.name_vi,
              'category_color', sc.color_hex,
              'category_icon', sc.icon_url,
              'rating_avg', ts.rating_avg,
              'is_featured', ts.is_featured
            )
          )
        ), '[]'::json)
      ) AS geojson
      FROM ${this.tableName} ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      ${whereClause}
    `;
    const { rows } = await query(sql, values);
    return rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
  }

  /**
   * Spots nổi bật
   */
  static async getFeaturedSpots(limit = 12, categoryIds) {
    const params = [limit];
    let categoryFilter = '';
    if (categoryIds !== undefined && categoryIds !== null) {
      const ids = (Array.isArray(categoryIds) ? categoryIds : [categoryIds]).map(Number);
      params.push(ids);
      categoryFilter = `AND ts.category_id = ANY($${params.length}::int[])`;
    }
    const sql = `
      SELECT ts.id, ts.slug, ts.name_vi, ts.name_en,
        ts.description_vi, ts.rating_avg, ts.rating_count,
        ts.ticket_price_adult, ts.ticket_currency,
        ${extractCoords('ts.geom')},
        sc.name_vi AS category_name, sc.color_hex AS category_color,
        p.name AS province_name,
        (SELECT url FROM spot_media sm WHERE sm.spot_id = ts.id AND sm.is_primary = true LIMIT 1) AS primary_image
      FROM ${this.tableName} ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      LEFT JOIN vn_units.provinces p ON ts.province_code = p.code
      WHERE ts.status = 'active' AND ts.is_featured = true ${categoryFilter}
      ORDER BY ts.rating_avg DESC NULLS LAST
      LIMIT $1
    `;
    const { rows } = await query(sql, params);
    return rows;
  }

  /**
   * Chi tiết spot theo slug — đầy đủ: capacity, rating, media, business
   */
  static async findBySlug(slug) {
    const sql = `
      SELECT ts.*,
        ${extractCoords('ts.geom')},
        ${asGeoJSON('ts.geom')},
        sc.name_vi  AS category_name,  sc.code       AS category_code,
        sc.color_hex AS category_color, sc.icon_url   AS category_icon,
        p.name      AS province_name,  p.code        AS province_code,
        c.name      AS commune_name,

        -- Sức chứa hiện tại (bản ghi mới nhất)
        cap.visitor_count     AS current_visitor_count,
        cap.capacity_pct      AS current_capacity_pct,
        cap.recorded_at       AS capacity_recorded_at,

        -- Ảnh chính
        (SELECT url FROM spot_media sm
         WHERE sm.spot_id = ts.id AND sm.is_primary = true
         LIMIT 1) AS primary_image,

        -- Danh sách dịch vụ & doanh nghiệp liên quan (JSON array)
        (SELECT json_agg(json_build_object(
            'business_id',   b.id,
            'business_name', b.business_name,
            'service_id',    sv.id,
            'service_name',  sv.service_name_vi,
            'service_type',  sv.category,
            'price_from',    sv.price_from,
            'booking_url',   sv.booking_url
          ))
         FROM services sv
         JOIN businesses b ON b.id = sv.business_id
         WHERE sv.spot_id = ts.id AND b.status = 'approved'
        ) AS related_services

      FROM ${this.tableName} ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      LEFT JOIN vn_units.provinces p ON ts.province_code = p.code
      LEFT JOIN vn_units.wards c ON ts.ward_code = c.code
      LEFT JOIN LATERAL (
        SELECT visitor_count, capacity_pct, recorded_at
        FROM capacity_logs
        WHERE spot_id = ts.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) cap ON true
      WHERE ts.slug = $1
    `;
    const { rows } = await query(sql, [slug]);
    return rows[0] || null;
  }

  /**
   * Tính lại rating_avg + rating_count từ bảng ratings → cập nhật vào tourism_spots
   */
  static async updateRatingStats(spotId) {
    const sql = `
      UPDATE ${this.tableName}
      SET
        rating_avg   = (
          SELECT ROUND(AVG(stars)::numeric, 1)
          FROM ratings
          WHERE spot_id = $1
        ),
        rating_count = (
          SELECT COUNT(*) FROM ratings WHERE spot_id = $1
        ),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, rating_avg, rating_count
    `;
    const { rows } = await query(sql, [spotId]);
    return rows[0] || null;
  }

  /**
   * Tìm theo ID
   */
  static async findById(id) {
    const sql = `
      SELECT ts.*,
        ${extractCoords('ts.geom')},
        ${asGeoJSON('ts.geom')},
        sc.name_vi AS category_name,
        p.name AS province_name,
        cm.name AS commune_name
      FROM ${this.tableName} ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      LEFT JOIN vn_units.provinces p ON ts.province_code = p.code
      LEFT JOIN vn_units.wards cm ON ts.ward_code = cm.code
      WHERE ts.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Tạo spot mới
   */
  static async createSpot(data) {
    const {
      category_id, province_code, ward_code,
      name_vi, name_en, slug, description_vi, description_en,
      address_vi, address_en, longitude, latitude, altitude_m,
      opening_hours, ticket_price_adult, ticket_price_child, ticket_currency,
      phone, email, website, max_capacity, alert_threshold_pct,
      has_vr_360, has_ar_support, has_audio_guide, qr_code_url,
      status, is_featured, created_by,
    } = data;

    const sql = `
      INSERT INTO ${this.tableName} (
        category_id, province_code, ward_code,
        name_vi, name_en, slug, description_vi, description_en,
        address_vi, address_en, geom, altitude_m,
        opening_hours, ticket_price_adult, ticket_price_child, ticket_currency,
        phone, email, website, max_capacity, alert_threshold_pct,
        has_vr_360, has_ar_support, has_audio_guide, qr_code_url,
        status, is_featured, created_by
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8,
        $9, $10, ST_SetSRID(ST_MakePoint($11, $12), 4326), $13,
        $14::jsonb, $15, $16, $17,
        $18, $19, $20, $21, $22,
        $23, $24, $25, $26,
        $27, $28, $29
      ) RETURNING id
    `;
    const values = [
      category_id, province_code, ward_code,
      name_vi, name_en, slug, description_vi, description_en,
      address_vi, address_en, longitude, latitude, altitude_m,
      opening_hours ? JSON.stringify(opening_hours) : null,
      ticket_price_adult, ticket_price_child, ticket_currency || 'VND',
      phone, email, website, max_capacity, alert_threshold_pct || 80,
      has_vr_360 || false, has_ar_support || false, has_audio_guide || false, qr_code_url,
      status || 'active', is_featured || false, created_by,
    ];

    const { rows } = await query(sql, values);
    return this.findById(rows[0].id);
  }

  /**
   * Cập nhật spot
   */
  static async updateSpot(id, data) {
    const updates = { ...data };
    delete updates.id;
    delete updates.geom;
    delete updates.search_vector;
    delete updates.created_at;
    delete updates.created_by;

    // Xử lý cập nhật vị trí nếu có
    if (data.longitude !== undefined && data.latitude !== undefined) {
      await query(
        `UPDATE ${this.tableName} SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        [data.longitude, data.latitude, id]
      );
      delete updates.longitude;
      delete updates.latitude;
    }

    // Xử lý opening_hours JSONB
    if (updates.opening_hours && typeof updates.opening_hours === 'object') {
      updates.opening_hours = JSON.stringify(updates.opening_hours);
    }

    if (Object.keys(updates).length > 0) {
      await updateById(this.tableName, id, updates);
    }

    return this.findById(id);
  }

  /**
   * Xóa spot (soft delete)
   */
  static async softDelete(id) {
    const sql = `UPDATE ${this.tableName} SET status = 'archived' WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows.length > 0;
  }

  /**
   * Toggle featured
   */
  static async toggleFeatured(id) {
    const sql = `
      UPDATE ${this.tableName}
      SET is_featured = NOT is_featured
      WHERE id = $1
      RETURNING id, is_featured
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Kiểm tra slug đã tồn tại
   */
  static async existsBySlug(slug, excludeId = null) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE slug = $1`;
    const values = [slug];
    if (excludeId) {
      sql += ' AND id != $2';
      values.push(excludeId);
    }
    const { rows } = await query(sql, values);
    return parseInt(rows[0].count) > 0;
  }

  /**
   * Kiểm tra spot có tồn tại theo ID
   */
  static async existsById(id, isActive = false) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = $1`;
    const values = [id];
    if (isActive) {
      sql += " AND status = 'active'";
    }
    const { rows } = await query(sql, values);
    return parseInt(rows[0].count) > 0;
  }

  // ==================== SPOT MEDIA ====================

  static async getSpotMedia(spotId, mediaType = null) {
    let sql = `
      SELECT id, spot_id, media_type, url, thumbnail_url,
        title_vi, title_en, duration_sec, file_size_kb, resolution,
        is_primary, sort_order, language, created_at
      FROM spot_media
      WHERE spot_id = $1
    `;
    const values = [spotId];

    if (mediaType) {
      sql += ' AND media_type = $2';
      values.push(mediaType);
    }

    sql += ' ORDER BY sort_order ASC, created_at DESC';

    const { rows } = await query(sql, values);
    return rows;
  }

  static async getAudioGuide(spotId, language = null) {
    const values = [spotId];
    let sql = `
      SELECT id, spot_id, media_type, url, thumbnail_url,
        title_vi, title_en, duration_sec, file_size_kb,
        is_primary, sort_order, language, created_at
      FROM spot_media
      WHERE spot_id = $1 AND media_type = 'audio'
    `;
    if (language) {
      sql += ` AND (language = $2 OR language IS NULL)`;
      values.push(language);
    }
    sql += ' ORDER BY CASE WHEN language IS NOT NULL THEN 0 ELSE 1 END, sort_order ASC';
    const { rows } = await query(sql, values);
    return rows;
  }

  static async addSpotMedia(data) {
    const sql = `
      INSERT INTO spot_media (spot_id, media_type, url, thumbnail_url, title_vi, title_en,
        duration_sec, file_size_kb, resolution, is_primary, sort_order, language)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.spot_id, data.media_type, data.url, data.thumbnail_url,
      data.title_vi, data.title_en, data.duration_sec, data.file_size_kb,
      data.resolution, data.is_primary || false, data.sort_order || 0, data.language,
    ]);
    return rows[0];
  }

  static async deleteSpotMedia(mediaId) {
    const sql = 'DELETE FROM spot_media WHERE id = $1 RETURNING url, media_type';
    const { rows } = await query(sql, [mediaId]);
    return rows[0] || null;
  }

  static async findMediaById(mediaId) {
    const sql = 'SELECT * FROM spot_media WHERE id = $1';
    const { rows } = await query(sql, [mediaId]);
    return rows[0] || null;
  }

  // Đặt ảnh chính: bỏ is_primary các media khác, set is_primary cho mediaId
  static async setPrimaryMedia(spotId, mediaId) {
    await query(
      'UPDATE spot_media SET is_primary = false WHERE spot_id = $1',
      [spotId]
    );
    const { rows } = await query(
      'UPDATE spot_media SET is_primary = true WHERE id = $1 AND spot_id = $2 RETURNING *',
      [mediaId, spotId]
    );
    return rows[0] || null;
  }

  // Cập nhật sort_order + metadata cho một media
  static async updateMediaMeta(mediaId, data) {
    const allowed = ['title_vi', 'title_en', 'sort_order', 'language', 'is_primary'];
    const fields = Object.entries(data)
      .filter(([k, v]) => allowed.includes(k) && v !== undefined);
    if (!fields.length) return null;
    const sets = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [mediaId, ...fields.map(([, v]) => v)];
    const { rows } = await query(
      `UPDATE spot_media SET ${sets} WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0] || null;
  }
}

module.exports = SpotRepository;
