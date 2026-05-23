const db = require('../../configs/database');
const { Api400Error } = require('../../core/error.response');
const { normalizeLang, localizedSQL, localizedValueSQL } = require('../../utils/i18n.utils');

class TourRepository {
  // ==================== TOUR PACKAGES ====================

  static async findAll({ page = 1, limit = 10, search, status, province_code, is_featured, business_id, sortBy = 'created_at', sortOrder = 'DESC', lang: rawLang = 'vi' }) {
    const lang = normalizeLang(rawLang);
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let idx = 1;

    if (status) { conditions.push(`tp.status = $${idx++}`); params.push(status); }
    if (province_code) { conditions.push(`tp.province_code = $${idx++}`); params.push(province_code); }
    if (is_featured !== undefined) { conditions.push(`tp.is_featured = $${idx++}`); params.push(is_featured); }
    if (business_id) { conditions.push(`tp.business_id = $${idx++}`); params.push(business_id); }
    if (search) {
      conditions.push(`(tp.name_vi ILIKE $${idx} OR tp.name_en ILIKE $${idx} OR tp.description_vi ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const allowed = ['id', 'price_from_vnd', 'duration_days', 'rating_avg', 'created_at', 'published_at'];
    let orderClause;
    if (sortBy === 'name' || sortBy === 'name_vi') {
      orderClause = `${localizedValueSQL(lang, 'tp.name_vi', 'tp.name_en')} ${sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
    } else {
      const col = allowed.includes(sortBy) ? sortBy : 'created_at';
      const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      orderClause = `tp.${col} ${dir}`;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT tp.id, tp.business_id, tp.province_code,
             ${localizedSQL(lang, 'tp.name_vi', 'tp.name_en', 'name')},
             tp.slug,
             tp.description_vi, tp.duration_days, tp.price_from_vnd,
             tp.max_guests, tp.includes, tp.excludes,
             tp.start_location_vi, tp.end_location_vi,
             tp.cover_image_url, tp.rating_avg, tp.rating_count,
             tp.status, tp.is_featured, tp.published_at,
             tp.created_at, tp.updated_at,
             b.business_name,
             ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
             COUNT(*) OVER() AS total_count
      FROM tour_packages tp
      LEFT JOIN businesses b ON tp.business_id = b.id
      LEFT JOIN vn_units.provinces p ON tp.province_code = p.code
      ${where}
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
      SELECT tp.*,
             ${localizedSQL(lang, 'tp.name_vi', 'tp.name_en', 'name')},
             b.business_name,
             ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
             json_agg(
               json_build_object(
                 'id', s.id, 'day_number', s.day_number, 'stop_order', s.stop_order,
                 'spot_id', s.spot_id, 'business_id', s.business_id,
                 'title_vi', s.title_vi, 'description_vi', s.description_vi,
                 'planned_duration_min', s.planned_duration_min,
                 'geom', ST_AsGeoJSON(COALESCE(ts.geom, b.geom, ST_GeomFromText('POINT(0 0)', 4326)))::json
               ) ORDER BY s.day_number, s.stop_order
             ) FILTER (WHERE s.id IS NOT NULL) AS stops
      FROM tour_packages tp
      LEFT JOIN businesses b ON tp.business_id = b.id
      LEFT JOIN vn_units.provinces p ON tp.province_code = p.code
      LEFT JOIN tour_package_stops s ON s.tour_package_id = tp.id
      LEFT JOIN tourism_spots ts ON s.spot_id = ts.id
      LEFT JOIN businesses bs ON s.business_id = bs.id
      WHERE tp.id = $1
      GROUP BY tp.id, b.business_name, p.name, p.name_en
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  static async findBySlug(slug, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const sql = `
      SELECT tp.*,
             ${localizedSQL(lang, 'tp.name_vi', 'tp.name_en', 'name')},
             b.business_name,
             ${localizedSQL(lang, 'p.name', 'p.name_en', 'province_name')},
             json_agg(
               json_build_object(
                 'id', s.id, 'day_number', s.day_number, 'stop_order', s.stop_order,
                 'spot_id', s.spot_id, 'business_id', s.business_id,
                 'title_vi', s.title_vi, 'description_vi', s.description_vi,
                 'planned_duration_min', s.planned_duration_min,
                 'geom', ST_AsGeoJSON(COALESCE(ts.geom, bs.geom, ST_GeomFromText('POINT(0 0)', 4326)))::json,
                 'spot_name', ${localizedValueSQL(lang, 'ts.name_vi', 'ts.name_en')}
               ) ORDER BY s.day_number, s.stop_order
             ) FILTER (WHERE s.id IS NOT NULL) AS stops
      FROM tour_packages tp
      LEFT JOIN businesses b ON tp.business_id = b.id
      LEFT JOIN vn_units.provinces p ON tp.province_code = p.code
      LEFT JOIN tour_package_stops s ON s.tour_package_id = tp.id
      LEFT JOIN tourism_spots ts ON s.spot_id = ts.id
      LEFT JOIN businesses bs ON s.business_id = bs.id
      WHERE tp.slug = $1
      GROUP BY tp.id, b.business_name, p.name, p.name_en
    `;
    const result = await db.query(sql, [slug]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      business_id, province_code, name_vi, name_en, slug,
      description_vi, duration_days, price_from_vnd, max_guests,
      includes, excludes, start_location_vi, end_location_vi,
      cover_image_url, status, is_featured
    } = data;
    const sql = `
      INSERT INTO tour_packages (
        business_id, province_code, name_vi, name_en, slug,
        description_vi, duration_days, price_from_vnd, max_guests,
        includes, excludes, start_location_vi, end_location_vi,
        cover_image_url, status, is_featured,
        rating_avg, rating_count
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,0,0)
      RETURNING *
    `;
    const result = await db.query(sql, [
      business_id || null, province_code || null, name_vi, name_en || null, slug,
      description_vi || null, duration_days || null, price_from_vnd || null, max_guests || null,
      JSON.stringify(includes || []), JSON.stringify(excludes || []),
      start_location_vi || null, end_location_vi || null,
      cover_image_url || null, status || 'draft', is_featured ?? false,
    ]);
    return result.rows[0];
  }

  static async update(id, fields) {
    const allowed = [
      'name_vi', 'name_en', 'slug', 'description_vi', 'duration_days',
      'price_from_vnd', 'max_guests', 'includes', 'excludes',
      'start_location_vi', 'end_location_vi', 'cover_image_url',
      'status', 'is_featured', 'published_at', 'province_code'
    ];
    const sets = [];
    const params = [];
    let idx = 1;
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = $${idx++}`);
        params.push(['includes', 'excludes'].includes(key) ? JSON.stringify(fields[key]) : fields[key]);
      }
    }
    if (!sets.length) return null;
    sets.push('updated_at = NOW()');
    params.push(id);
    const sql = `UPDATE tour_packages SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(sql, params);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM tour_packages WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }

  static async slugExists(slug, excludeId = null) {
    const sql = excludeId
      ? 'SELECT id FROM tour_packages WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM tour_packages WHERE slug = $1';
    const result = await db.query(sql, excludeId ? [slug, excludeId] : [slug]);
    return result.rows.length > 0;
  }

  // ==================== TOUR PACKAGE STOPS ====================

  static async getStopsByTourId(tourPackageId, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const sql = `
      SELECT s.*,
             ST_AsGeoJSON(COALESCE(ts.geom, bs.geom, ST_GeomFromText('POINT(0 0)', 4326)))::json AS geom_json,
             ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'spot_name')}
      FROM tour_package_stops s
      LEFT JOIN tourism_spots ts ON s.spot_id = ts.id
      LEFT JOIN businesses bs ON s.business_id = bs.id
      WHERE s.tour_package_id = $1
      ORDER BY s.day_number, s.stop_order
    `;
    const result = await db.query(sql, [tourPackageId]);
    return result.rows;
  }

  static async createStop(data) {
    const {
      tour_package_id, day_number, stop_order, spot_id, business_id,
      title_vi, description_vi, planned_duration_min
    } = data;
    const sql = `
      INSERT INTO tour_package_stops (
        tour_package_id, day_number, stop_order, spot_id, business_id,
        title_vi, description_vi, planned_duration_min
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `;
    const params = [
      tour_package_id, day_number, stop_order,
      spot_id || null, business_id || null,
      title_vi || null, description_vi || null, planned_duration_min || null,
    ];
    const result = await db.query(sql, params);
    return result.rows[0];
  }

  static async findStopById(id) {
    const result = await db.query(
      `SELECT s.*,
              ST_AsGeoJSON(COALESCE(ts.geom, bs.geom, ST_GeomFromText('POINT(0 0)', 4326)))::json AS geom_json
       FROM tour_package_stops s
       LEFT JOIN tourism_spots ts ON s.spot_id = ts.id
       LEFT JOIN businesses bs ON s.business_id = bs.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async updateStop(id, fields) {
    const allowed = ['day_number', 'stop_order', 'spot_id', 'business_id', 'title_vi', 'description_vi', 'planned_duration_min'];
    const sets = [];
    const params = [];
    let idx = 1;
    for (const key of allowed) {
      if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
    }
    if (!sets.length) return null;
    params.push(id);
    const sql = `UPDATE tour_package_stops SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(sql, params);
    return result.rows[0] || null;
  }

  static async reorderStops(tourPackageId, payload) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const finalStops = payload.stop_ids
        ? payload.stop_ids.map((id, index) => ({
          id,
          day_number: payload.day_number,
          stop_order: index + 1,
        }))
        : payload.stops;

      const requestedIds = finalStops.map((stop) => stop.id);
      const currentResult = await client.query(
        `SELECT id, day_number
         FROM tour_package_stops
         WHERE tour_package_id = $1 AND id = ANY($2::uuid[])`,
        [tourPackageId, requestedIds]
      );

      if (currentResult.rowCount !== requestedIds.length) {
        throw new Api400Error('Danh sách điểm dừng không thuộc tour này');
      }

      const affectedDays = [...new Set([
        ...currentResult.rows.map((stop) => stop.day_number),
        ...finalStops.map((stop) => stop.day_number),
      ])];

      const affectedResult = await client.query(
        `SELECT id
         FROM tour_package_stops
         WHERE tour_package_id = $1 AND day_number = ANY($2::int[])`,
        [tourPackageId, affectedDays]
      );

      const affectedIds = affectedResult.rows.map((stop) => stop.id);
      if (affectedIds.length !== requestedIds.length || affectedIds.some((id) => !requestedIds.includes(id))) {
        throw new Api400Error('Cần gửi đủ tất cả điểm dừng của các ngày bị thay đổi');
      }

      await client.query(
        `UPDATE tour_package_stops AS s
         SET stop_order = -tmp.temp_order
         FROM (
           SELECT id, row_number() OVER (ORDER BY id) AS temp_order
           FROM tour_package_stops
           WHERE tour_package_id = $1 AND id = ANY($2::uuid[])
         ) AS tmp
         WHERE s.id = tmp.id`,
        [tourPackageId, requestedIds]
      );

      for (const stop of finalStops) {
        await client.query(
          `UPDATE tour_package_stops
           SET day_number = $1, stop_order = $2
           WHERE tour_package_id = $3 AND id = $4`,
          [stop.day_number, stop.stop_order, tourPackageId, stop.id]
        );
      }

      const result = await client.query(
        `SELECT s.*,
                ST_AsGeoJSON(COALESCE(ts.geom, bs.geom, ST_GeomFromText('POINT(0 0)', 4326)))::json AS geom_json,
                ts.name_vi AS spot_name
         FROM tour_package_stops s
         LEFT JOIN tourism_spots ts ON s.spot_id = ts.id
         LEFT JOIN businesses bs ON s.business_id = bs.id
         WHERE s.tour_package_id = $1
         ORDER BY s.day_number, s.stop_order`,
        [tourPackageId]
      );

      await client.query('COMMIT');
      return result.rows;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async deleteStop(id) {
    const result = await db.query('DELETE FROM tour_package_stops WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }
}

module.exports = TourRepository;
