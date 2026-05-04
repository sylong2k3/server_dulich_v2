const { query } = require('../../configs/database');

class GeographyRepository {
  // ==================== PROVINCES ====================

  static async getAllProvinces() {
    const sql = `
      SELECT p.code, p.name, p.name_en, p.full_name,
             au.short_name AS unit_short_name
      FROM vn_units.provinces p
      LEFT JOIN vn_units.administrative_units au ON au.id = p.administrative_unit_id
      ORDER BY p.name ASC
    `;
    const { rows } = await query(sql);
    return rows;
  }

  static async getProvinceByCode(code) {
    const sql = `
      SELECT p.code, p.name, p.name_en, p.full_name,
             au.short_name AS unit_short_name,
             COALESCE(ps.spot_count, 0)       AS spot_count,
             COALESCE(ps.featured_count, 0)   AS featured_count,
             COALESCE(ps.business_count, 0)   AS business_count,
             COALESCE(ps.avg_rating, 0)        AS avg_rating
      FROM vn_units.provinces p
      LEFT JOIN vn_units.administrative_units au ON au.id = p.administrative_unit_id
      LEFT JOIN v_province_stats ps ON ps.province_code = p.code
      WHERE p.code = $1
    `;
    const { rows } = await query(sql, [code]);
    return rows[0] || null;
  }

  // ==================== SEARCH ====================

  static async searchProvinces(q) {
    const sql = `
      SELECT p.code, p.name, p.name_en, p.full_name,
             au.short_name AS unit_short_name
      FROM vn_units.provinces p
      LEFT JOIN vn_units.administrative_units au ON au.id = p.administrative_unit_id
      WHERE p.name ILIKE $1 OR p.full_name ILIKE $1
      ORDER BY p.name ASC
      LIMIT 20
    `;
    const { rows } = await query(sql, [`%${q}%`]);
    return rows;
  }

  static async searchWards(q, provinceCode) {
    const conditions = ['(w.name ILIKE $1 OR w.full_name ILIKE $1)'];
    const values = [`%${q}%`];

    if (provinceCode) {
      values.push(provinceCode);
      conditions.push(`w.province_code = $${values.length}`);
    }

    const sql = `
      SELECT w.code, w.province_code, w.name, w.name_en, w.full_name,
             p.name AS province_name, p.name_en AS province_name_en
      FROM vn_units.wards w
      LEFT JOIN vn_units.provinces p ON p.code = w.province_code
      WHERE ${conditions.join(' AND ')}
      ORDER BY w.name ASC
      LIMIT 50
    `;
    const { rows } = await query(sql, values);
    return rows;
  }

  // ==================== WARDS ====================

  static async getAllWards() {
    const sql = `
      SELECT w.code, w.province_code, w.name, w.name_en, w.full_name,
             p.name AS province_name, p.name_en AS province_name_en
      FROM vn_units.wards w
      LEFT JOIN vn_units.provinces p ON p.code = w.province_code
      ORDER BY w.name ASC
    `;
    const { rows } = await query(sql);
    return rows;
  }

  static async getWardsByProvince(provinceCode) {
    const sql = `
      SELECT w.code, w.province_code, w.name, w.name_en, w.full_name,
             p.name AS province_name, p.name_en AS province_name_en
      FROM vn_units.wards w
      LEFT JOIN vn_units.provinces p ON p.code = w.province_code
      WHERE w.province_code = $1
      ORDER BY w.name ASC
    `;
    const { rows } = await query(sql, [provinceCode]);
    return rows;
  }
}

module.exports = GeographyRepository;
