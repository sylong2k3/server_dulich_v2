const db = require('../../configs/database');
const { normalizeLang, localizedSQL } = require('../../utils/i18n.utils');

class BusinessRepository {
  // ==================== BUSINESSES ====================

  static async findAll({ page = 1, limit = 10, search, status, business_type, province_code, ward_code, sortBy = 'created_at', sortOrder = 'DESC', lang: rawLang = 'vi' }) {
    const lang = normalizeLang(rawLang);
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let idx = 1;

    if (status) { conditions.push(`b.status = $${idx++}`); params.push(status); }
    if (business_type) { conditions.push(`b.business_type = $${idx++}`); params.push(business_type); }
    if (province_code) { conditions.push(`b.province_code = $${idx++}`); params.push(province_code); }
    if (ward_code) { conditions.push(`b.ward_code = $${idx++}`); params.push(ward_code); }
    if (search) {
      conditions.push(`(b.business_name ILIKE $${idx} OR b.business_code ILIKE $${idx} OR b.description_vi ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const allowed = ['id', 'business_name', 'business_type', 'status', 'rating_avg', 'created_at', 'updated_at'];
    const col = allowed.includes(sortBy) ? sortBy : 'created_at';
    const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT b.id, b.owner_id, b.province_code, b.ward_code,
             b.business_name, b.business_code, b.tax_id, b.license_number,
             b.business_type,
             ${localizedSQL(lang, 'b.description_vi', 'b.description_en', 'description')},
             b.logo_url, b.phone, b.email, b.website, b.address_vi,
             ST_AsGeoJSON(b.geom)::json AS geom,
             b.status, b.rating_avg, b.rating_count,
             b.created_at, b.updated_at,
             u.full_name AS owner_name,
             COUNT(*) OVER() AS total_count
      FROM businesses b
      LEFT JOIN users u ON b.owner_id = u.id
      ${where}
      ORDER BY b.${col} ${dir}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const result = await db.query(sql, params);
    return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
  }

  static async findById(id, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const sql = `
      SELECT b.id, b.owner_id, b.province_code, b.ward_code,
             b.business_name, b.business_code, b.tax_id, b.license_number,
             b.business_type,
             ${localizedSQL(lang, 'b.description_vi', 'b.description_en', 'description')},
             b.logo_url, b.phone, b.email, b.website, b.address_vi,
             ST_AsGeoJSON(b.geom)::json AS geom,
             b.status, b.rating_avg, b.rating_count,
             b.approved_at, b.rejection_note,
             b.created_at, b.updated_at,
             u.full_name AS owner_name, u.email AS owner_email,
             ap.full_name AS approved_by_name
      FROM businesses b
      LEFT JOIN users u ON b.owner_id = u.id
      LEFT JOIN users ap ON b.approved_by = ap.id
      WHERE b.id = $1
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  static async findByOwnerId(ownerId, status) {
    const params = [ownerId];
    let sql = `
      SELECT b.*, ST_AsGeoJSON(b.geom)::json AS geom
      FROM businesses b
      WHERE b.owner_id = $1
    `;
    if (status) {
      sql += ` AND b.status = $2`;
      params.push(status);
    }
    sql += ` ORDER BY b.created_at DESC`;
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async create(data) {
    const {
      owner_id, province_code, ward_code, business_name, business_code,
      tax_id, license_number, business_type, description_vi, description_en,
      logo_url, phone, email, website, address_vi, lng, lat,
    } = data;

    const geomExpr = lng && lat ? `ST_SetSRID(ST_MakePoint($16, $17), 4326)` : 'NULL';
    const sql = `
      INSERT INTO businesses (
        owner_id, province_code, ward_code, business_name, business_code,
        tax_id, license_number, business_type, description_vi, description_en,
        logo_url, phone, email, website, address_vi, geom, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        ${geomExpr}, 'pending'
      ) RETURNING *
    `;
    const params = [
      owner_id, province_code || null, ward_code || null, business_name,
      business_code || null, tax_id || null, license_number || null,
      business_type, description_vi || null, description_en || null,
      logo_url || null, phone || null, email || null, website || null,
      address_vi || null,
    ];
    if (lng && lat) { params.push(lng, lat); }

    const result = await db.query(sql, params);
    return result.rows[0];
  }

  static async update(id, fields) {
    const allowed = [
      'province_code', 'ward_code', 'business_name', 'business_code',
      'tax_id', 'license_number', 'business_type', 'description_vi',
      'description_en', 'logo_url', 'phone', 'email', 'website', 'address_vi',
    ];
    const sets = [];
    const params = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
    }
    // Xử lý geom riêng
    if (fields.lng !== undefined && fields.lat !== undefined) {
      sets.push(`geom = ST_SetSRID(ST_MakePoint($${idx}, $${idx + 1}), 4326)`);
      params.push(fields.lng, fields.lat);
      idx += 2;
    }

    if (!sets.length) return null;
    sets.push(`updated_at = NOW()`);
    params.push(id);
    const sql = `UPDATE businesses SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(sql, params);
    return result.rows[0] || null;
  }

  static async updateStatus(id, { status, approved_by, rejection_note }) {
    const sets = [`status = $1`];
    const params = [status];
    let idx = 2;

    if (status === 'approved') {
      sets.push(`approved_by = $${idx++}`, `approved_at = NOW()`);
      params.push(approved_by);
    }
    if (rejection_note !== undefined) {
      sets.push(`rejection_note = $${idx++}`);
      params.push(rejection_note);
    }
    sets.push(`updated_at = NOW()`);
    params.push(id);
    const sql = `UPDATE businesses SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(sql, params);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM businesses WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }

  // ==================== SERVICES ====================

  static async findServicesByBusinessId(businessId, { page = 1, limit = 20, lang: rawLang = 'vi' }) {
    const lang = normalizeLang(rawLang);
    const offset = (page - 1) * limit;
    const sql = `
      SELECT s.id, s.business_id, s.spot_id, s.category,
             ${localizedSQL(lang, 's.service_name_vi', 's.service_name_en', 'service_name')},
             s.description_vi,
             s.price_from, s.price_to, s.currency, s.unit,
             s.booking_url, s.is_active, s.created_at,
             COUNT(*) OVER() AS total_count
      FROM services s
      WHERE s.business_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(sql, [businessId, limit, offset]);
    return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
  }

  static async findServiceById(id) {
    const result = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async createService(data) {
    const {
      business_id, spot_id, service_name_vi, service_name_en,
      category, description_vi, price_from, price_to,
      currency, unit, booking_url,
    } = data;
    const sql = `
      INSERT INTO services (
        business_id, spot_id, service_name_vi, service_name_en,
        category, description_vi, price_from, price_to,
        currency, unit, booking_url, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE)
      RETURNING *
    `;
    const result = await db.query(sql, [
      business_id, spot_id || null, service_name_vi, service_name_en || null,
      category, description_vi || null, price_from || null, price_to || null,
      currency || 'VND', unit || null, booking_url || null,
    ]);
    return result.rows[0];
  }

  static async updateService(id, fields) {
    const allowed = [
      'spot_id', 'service_name_vi', 'service_name_en', 'category',
      'description_vi', 'price_from', 'price_to', 'currency',
      'unit', 'booking_url', 'is_active',
    ];
    const sets = [];
    const params = [];
    let idx = 1;
    for (const key of allowed) {
      if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
    }
    if (!sets.length) return null;
    params.push(id);
    const sql = `UPDATE services SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(sql, params);
    return result.rows[0] || null;
  }

  static async deleteService(id) {
    const result = await db.query('DELETE FROM services WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }
}

module.exports = BusinessRepository;
