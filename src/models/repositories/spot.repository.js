const { query } = require('../../configs/database');
const { create, updateById } = require('../../utils/database');
const {
  dWithinSQL,
  distanceSQL,
  bboxFilterSQL,
  asGeoJSON,
  extractCoords,
} = require('../../utils/geo.utils');
const { normalizeLang, localizedSQL, localizedValueSQL } = require('../../utils/i18n.utils');


class SpotRepository {
  static tableName = 'tourism_spots';

  /**
   * Danh sÃ¡ch Ä‘iá»ƒm du lá»‹ch vá»›i filter + pagination
   */
  static async getAllSpots(options = {}) {
    const {
      page = 1,
      limit = 20,
      category_id,
      parent_category_id,
      province_code,
      status = 'active',
      is_featured,
      rating_min,
      search,
      sortBy,
      sortOrder = 'DESC',
      capacity = false,
      lat,
      lng,
      radius_km = 10,
      created_by,
      lang: rawLang = 'vi',
      exclude_parent_category_id,
    } = options;
    const lang = normalizeLang(rawLang);

    const values = [];
    let paramCount = 1;
    let whereClause = 'WHERE 1=1';

    if (status) {
      whereClause += ` AND ts.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (category_id !== undefined && category_id !== null) {
      whereClause += ` AND ts.category_id = $${paramCount}`;
      values.push(Number(category_id));
      paramCount++;
    }

    if (parent_category_id !== undefined && parent_category_id !== null) {
      whereClause += ` AND (sc.parent_id = $${paramCount} OR ts.category_id = $${paramCount})`;
      values.push(Number(parent_category_id));
      paramCount++;
    }

    if (exclude_parent_category_id !== undefined && exclude_parent_category_id !== null) {
      whereClause += ` AND NOT EXISTS (
        SELECT 1 FROM spot_categories exc_sc
        WHERE exc_sc.id = ts.category_id AND exc_sc.parent_id = $${paramCount}
      )`;
      values.push(Number(exclude_parent_category_id));
      paramCount++;
    }

    if (province_code) {
      whereClause += ` AND ts.province_code = $${paramCount}`;
      values.push(province_code);
      paramCount++;
    }

    if (created_by) {
      whereClause += ` AND ts.created_by = $${paramCount}`;
      values.push(created_by);
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
        OR ts.slug ILIKE $${paramCount + 1}
      )`;
      values.push(search, `%${search}%`);
      paramCount += 2;
    }

    const hasNearbyFilter = lat !== undefined && lat !== null && lng !== undefined && lng !== null;
    let distanceSelect = '';
    if (hasNearbyFilter) {
      const lngParam = paramCount;
      const latParam = paramCount + 1;
      const radiusParam = paramCount + 2;
      whereClause += ` AND ${dWithinSQL('ts.geom', lngParam, latParam, radiusParam)}`;
      distanceSelect = `, ${distanceSQL('ts.geom', lngParam, latParam)} AS distance_m`;
      values.push(Number(lng), Number(lat), Number(radius_km) * 1000);
      paramCount += 3;
    }

    const allowedSort = ['created_at', 'rating_avg', 'rating_count'];
    const safeSort = hasNearbyFilter && sortBy === 'distance_m'
      ? 'distance_m'
      : sortBy === 'name' || sortBy === 'name_vi'
        ? 'name'
      : allowedSort.includes(sortBy)
        ? sortBy
        : hasNearbyFilter && !sortBy
          ? 'distance_m'
          : 'created_at';
    const safeOrder = hasNearbyFilter && safeSort === 'distance_m' && !sortBy
      ? 'ASC'
      : ['ASC', 'DESC'].includes(String(sortOrder).toUpperCase())
        ? String(sortOrder).toUpperCase()
        : 'DESC';
    const orderBy = safeSort === 'distance_m'
      ? `distance_m ${safeOrder}`
      : safeSort === 'name'
        ? `${localizedValueSQL(lang, 'ts.name_vi', 'ts.name_en')} ${safeOrder}`
      : `ts.${safeSort} ${safeOrder}`;

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
      SELECT ts.id, ts.slug,
        ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'name')},
        ${localizedSQL(lang, 'ts.description_vi', 'ts.description_en', 'description')},
        ${localizedSQL(lang, 'ts.address_vi', 'ts.address_en', 'address')},
        ts.rating_avg, ts.rating_count,
        ts.is_featured, ts.status,
        ts.ticket_price_adult, ts.ticket_price_child, ts.ticket_currency,
        ts.opening_hours, ts.phone, ts.website,
        ts.has_vr_360, ts.has_ar_support, ts.has_audio_guide,
        ts.max_capacity,
        ${asGeoJSON('ts.geom')}
        ${distanceSelect},
        ts.category_id,
        ${localizedSQL(lang, 'sc.name_vi', 'sc.name_en', 'category_name')},
        sc.parent_id AS category_parent_id,
        sc.icon_url AS category_icon,
        ${localizedSQL(lang, 'scp.name_vi', 'scp.name_en', 'category_parent_name')},
        ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
        ${localizedSQL(lang, 'cm.name', 'cm.name_en', 'commune_name')},
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
      ORDER BY ${orderBy}
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
   * TÃ¬m spots trong bÃ¡n kÃ­nh (nearby)
   */
  static async findNearby(lat, lng, radiusKm = 10, limit = 50, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const radiusM = radiusKm * 1000;
    const sql = `
      SELECT ts.id, ts.slug,
        ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'name')},
        ts.rating_avg, ts.rating_count, ts.is_featured, ts.status,
        ts.ticket_price_adult, ts.ticket_currency,
        ${extractCoords('ts.geom')},
        ${distanceSQL('ts.geom', 1, 2)} AS distance_m,
        ${localizedSQL(lang, 'sc.name_vi', 'sc.name_en', 'category_name')},
        sc.color_hex AS category_color, sc.icon_url AS category_icon,
        ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
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
   * TÃ¬m spots trong bbox
   */
  static async findByBbox(minLng, minLat, maxLng, maxLat, limit = 500, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const sql = `
      SELECT ts.id, ts.slug,
        ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'name')},
        ts.rating_avg, ts.is_featured, ts.status,
        ${extractCoords('ts.geom')},
        ${asGeoJSON('ts.geom')},
        ${localizedSQL(lang, 'sc.name_vi', 'sc.name_en', 'category_name')},
        sc.code AS category_code,
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
    const { category_id, province_code, lang: rawLang = 'vi' } = options;
    const lang = normalizeLang(rawLang);
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
              'name', ${localizedValueSQL(lang, 'ts.name_vi', 'ts.name_en')},
              'category_code', sc.code,
              'category_name', ${localizedValueSQL(lang, 'sc.name_vi', 'sc.name_en')},
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
   * Spots ná»•i báº­t
   */
  static async getFeaturedSpots(limit = 12, categoryId, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const params = [limit];
    let categoryFilter = '';
    if (categoryId !== undefined && categoryId !== null) {
      params.push(Number(categoryId));
      categoryFilter = `AND ts.category_id = $${params.length}`;
    }
    const sql = `
      SELECT ts.id, ts.slug,
        ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'name')},
        ${localizedSQL(lang, 'ts.description_vi', 'ts.description_en', 'description')},
        ts.rating_avg, ts.rating_count,
        ts.ticket_price_adult, ts.ticket_currency,
        ${extractCoords('ts.geom')},
        ${localizedSQL(lang, 'sc.name_vi', 'sc.name_en', 'category_name')},
        sc.color_hex AS category_color,
        ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
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
   * Chi tiáº¿t spot theo slug â€” Ä‘áº§y Ä‘á»§: capacity, rating, media, business
   */
  static async findBySlug(slug, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const sql = `
      SELECT ts.id, ts.category_id, ts.province_code, ts.ward_code, ts.slug,
        ts.altitude_m, ts.opening_hours,
        ts.ticket_price_adult, ts.ticket_price_child, ts.ticket_currency,
        ts.phone, ts.email, ts.website,
        ts.max_capacity, ts.alert_threshold_pct,
        ts.rating_avg, ts.rating_count,
        ts.has_vr_360, ts.has_ar_support, ts.has_audio_guide,
        ts.qr_code_url, ts.status, ts.is_featured,
        ts.created_by, ts.created_at, ts.updated_at,
        ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'name')},
        ${localizedSQL(lang, 'ts.description_vi', 'ts.description_en', 'description')},
        ${localizedSQL(lang, 'ts.address_vi', 'ts.address_en', 'address')},
        ${extractCoords('ts.geom')},
        ${asGeoJSON('ts.geom')},
        ${localizedSQL(lang, 'sc.name_vi', 'sc.name_en', 'category_name')},
        sc.code       AS category_code,
        sc.color_hex AS category_color, sc.icon_url   AS category_icon,
        ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
        p.code        AS province_code,
        ${localizedSQL(lang, 'c.name', 'c.name_en', 'commune_name')},

        -- Sá»©c chá»©a hiá»‡n táº¡i (báº£n ghi má»›i nháº¥t)
        cap.visitor_count     AS current_visitor_count,
        cap.capacity_pct      AS current_capacity_pct,
        cap.recorded_at       AS capacity_recorded_at,

        -- áº¢nh chÃ­nh
        (SELECT url FROM spot_media sm
         WHERE sm.spot_id = ts.id AND sm.is_primary = true
         LIMIT 1) AS primary_image,

        -- Danh sÃ¡ch dá»‹ch vá»¥ & doanh nghiá»‡p liÃªn quan (JSON array)
        (SELECT json_agg(json_build_object(
            'business_id',   b.id,
            'business_name', b.business_name,
            'service_id',    sv.id,
            'service_name',  ${localizedValueSQL(lang, 'sv.service_name_vi', 'sv.service_name_en')},
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
   * TÃ­nh láº¡i rating_avg + rating_count tá»« báº£ng ratings â†’ cáº­p nháº­t vÃ o tourism_spots
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
   * TÃ¬m theo ID
   */
  static async findById(id, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const sql = `
      SELECT ts.id, ts.category_id, ts.province_code, ts.ward_code, ts.slug,
        ts.altitude_m, ts.opening_hours,
        ts.ticket_price_adult, ts.ticket_price_child, ts.ticket_currency,
        ts.phone, ts.email, ts.website,
        ts.max_capacity, ts.alert_threshold_pct,
        ts.rating_avg, ts.rating_count,
        ts.has_vr_360, ts.has_ar_support, ts.has_audio_guide,
        ts.qr_code_url, ts.status, ts.is_featured,
        ts.created_by, ts.created_at, ts.updated_at,
        ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'name')},
        ${localizedSQL(lang, 'ts.description_vi', 'ts.description_en', 'description')},
        ${localizedSQL(lang, 'ts.address_vi', 'ts.address_en', 'address')},
        ${extractCoords('ts.geom')},
        ${asGeoJSON('ts.geom')},
        ${localizedSQL(lang, 'sc.name_vi', 'sc.name_en', 'category_name')},
        ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
        ${localizedSQL(lang, 'cm.name', 'cm.name_en', 'commune_name')},
        cap.visitor_count     AS current_visitor_count,
        cap.capacity_pct      AS current_capacity_pct,
        cap.recorded_at       AS capacity_recorded_at
      FROM ${this.tableName} ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      LEFT JOIN vn_units.provinces p ON ts.province_code = p.code
      LEFT JOIN vn_units.wards cm ON ts.ward_code = cm.code
      LEFT JOIN LATERAL (
        SELECT visitor_count, capacity_pct, recorded_at
        FROM capacity_logs
        WHERE spot_id = ts.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) cap ON true
      WHERE ts.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Táº¡o spot má»›i
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
   * Cáº­p nháº­t spot
   */
  static async updateSpot(id, data) {
    const updates = { ...data };
    delete updates.id;
    delete updates.geom;
    delete updates.search_vector;
    delete updates.created_at;
    delete updates.created_by;

    // Xá»­ lÃ½ cáº­p nháº­t vá»‹ trÃ­ náº¿u cÃ³
    if (data.longitude !== undefined && data.latitude !== undefined) {
      await query(
        `UPDATE ${this.tableName} SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        [data.longitude, data.latitude, id]
      );
      delete updates.longitude;
      delete updates.latitude;
    }

    // Xá»­ lÃ½ opening_hours JSONB
    if (updates.opening_hours && typeof updates.opening_hours === 'object') {
      updates.opening_hours = JSON.stringify(updates.opening_hours);
    }

    if (Object.keys(updates).length > 0) {
      await updateById(this.tableName, id, updates);
    }

    return this.findById(id);
  }

  /**
   * XÃ³a spot (soft delete)
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
   * Kiá»ƒm tra slug Ä‘Ã£ tá»“n táº¡i
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
   * Kiá»ƒm tra spot cÃ³ tá»“n táº¡i theo ID
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

  // Äáº·t áº£nh chÃ­nh: bá» is_primary cÃ¡c media khÃ¡c, set is_primary cho mediaId
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

  // Cáº­p nháº­t sort_order + metadata cho má»™t media
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
