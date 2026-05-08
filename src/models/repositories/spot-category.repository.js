const { query } = require('../../configs/database');
const { create, updateById, deleteById } = require('../../utils/database');

const TABLE = 'spot_categories';

class SpotCategoryRepository {
  // ─── Danh sách (phân trang + filter) ────────────────────────────────────────

  static async findAll({ page = 1, limit = 50, search, parent_id, is_active, sortBy = 'sort_order', sortOrder = 'ASC' } = {}) {
    const offset  = (page - 1) * limit;
    const params  = [];
    let   p       = 1;
    const wheres  = [];

    if (search) {
      wheres.push(`(c.name_vi ILIKE $${p} OR c.name_en ILIKE $${p} OR c.code ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }

    if (parent_id !== undefined && parent_id !== null) {
      wheres.push(`c.parent_id = $${p++}`);
      params.push(parent_id);
    } else if (parent_id === null) {
      wheres.push('c.parent_id IS NULL');
    }

    if (is_active !== undefined) {
      wheres.push(`c.is_active = $${p++}`);
      params.push(is_active);
    }

    const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

    // Cột sort được kiểm soát bởi Joi enum → an toàn
    const orderClause = `c.${sortBy} ${sortOrder}`;

    const sql = `
      SELECT
        c.id, c.parent_id, c.code, c.name_vi, c.name_en,
        c.icon_url, c.color_hex, c.sort_order, c.is_active,
        p.name_vi                        AS parent_name_vi,
        COUNT(*) OVER ()                 AS total_count,
        COALESCE(sc.spot_count, 0)       AS spot_count
      FROM ${TABLE} c
      LEFT JOIN ${TABLE} p ON p.id = c.parent_id
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS spot_count
        FROM tourism_spots
        WHERE status = 'active'
        GROUP BY category_id
      ) sc ON sc.category_id = c.id
      ${where}
      ORDER BY ${orderClause}
      LIMIT $${p++} OFFSET $${p++}
    `;

    params.push(limit, offset);
    const { rows } = await query(sql, params);

    return {
      rows,
      total: rows.length > 0 ? parseInt(rows[0].total_count) : 0,
    };
  }

  // ─── Dạng cây (toàn bộ, cho dropdown/map) ───────────────────────────────────

  static async findTree(onlyActive = true) {
    const activeClause = onlyActive ? `WHERE c.is_active = true` : '';

    const sql = `
      WITH cat AS (
        SELECT
          c.id, c.parent_id, c.code, c.name_vi, c.name_en,
          c.icon_url, c.color_hex, c.sort_order, c.is_active,
          COUNT(ts.id) AS spot_count
        FROM ${TABLE} c
        LEFT JOIN tourism_spots ts ON ts.category_id = c.id AND ts.status = 'active'
        ${activeClause}
        GROUP BY c.id, c.parent_id, c.code, c.name_vi, c.name_en,
                 c.icon_url, c.color_hex, c.sort_order, c.is_active
        ORDER BY c.sort_order ASC, c.name_vi ASC
      )
      SELECT * FROM cat
    `;

    const { rows } = await query(sql);

    const pruneEmptyBranches = (categories) => categories
      .map(category => ({
        ...category,
        children: pruneEmptyBranches(category.children),
      }))
      .filter(category => category.spot_count > 0 || category.children.length > 0);

    // Build cây trong JS
    const map = {};
    rows.forEach(r => { map[r.id] = { ...r, spot_count: parseInt(r.spot_count), children: [] }; });

    const roots = [];
    rows.forEach(r => {
      if (r.parent_id && map[r.parent_id]) {
        map[r.parent_id].children.push(map[r.id]);
      } else {
        roots.push(map[r.id]);
      }
    });

    return pruneEmptyBranches(roots);
  }

  // ─── Chi tiết (kèm danh sách con nếu là danh mục cha) ───────────────────────

  static async findById(id, { onlyActive = false } = {}) {
    const activeClause = onlyActive ? 'AND c.is_active = true' : '';
    const childActiveClause = onlyActive ? 'AND ch.is_active = true' : '';
    // 1. Lấy thông tin chính của danh mục
    const mainSql = `
      SELECT
        c.id, c.parent_id, c.code, c.name_vi, c.name_en,
        c.icon_url, c.color_hex, c.sort_order, c.is_active,
        p.name_vi                  AS parent_name_vi,
        COALESCE(sc.spot_count, 0) AS spot_count
      FROM ${TABLE} c
      LEFT JOIN ${TABLE} p ON p.id = c.parent_id
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS spot_count
        FROM tourism_spots
        WHERE status = 'active'
        GROUP BY category_id
      ) sc ON sc.category_id = c.id
      WHERE c.id = $1
        ${activeClause}
    `;
    const { rows: mainRows } = await query(mainSql, [id]);
    if (!mainRows[0]) return null;

    const category = { ...mainRows[0], spot_count: parseInt(mainRows[0].spot_count) };

    // 2. Lấy danh sách danh mục con (nếu có)
    const childSql = `
      SELECT
        ch.id, ch.code, ch.name_vi, ch.name_en,
        ch.icon_url, ch.color_hex, ch.sort_order, ch.is_active,
        COALESCE(sc.spot_count, 0) AS spot_count
      FROM ${TABLE} ch
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS spot_count
        FROM tourism_spots
        WHERE status = 'active'
        GROUP BY category_id
      ) sc ON sc.category_id = ch.id
      WHERE ch.parent_id = $1
        ${childActiveClause}
      ORDER BY ch.sort_order ASC, ch.name_vi ASC
    `;
    const { rows: childRows } = await query(childSql, [id]);

    category.children = childRows.map(r => ({
      ...r,
      spot_count: parseInt(r.spot_count),
    }));

    return category;
  }

  // ─── Kiểm tra trùng code ──────────────────────────────────────────────────

  static async existsByCode(code, excludeId = null) {
    const params = [code];
    let sql = `SELECT id FROM ${TABLE} WHERE code = $1`;
    if (excludeId) {
      sql += ` AND id <> $2`;
      params.push(excludeId);
    }
    const { rows } = await query(sql, params);
    return rows.length > 0;
  }

  // ─── Đếm spots đang dùng category ────────────────────────────────────────────

  static async countSpots(id) {
    const sql = `SELECT COUNT(*) AS cnt FROM tourism_spots WHERE category_id = $1`;
    const { rows } = await query(sql, [id]);
    return parseInt(rows[0].cnt);
  }

  // ─── Đếm children ────────────────────────────────────────────────────────────

  static async countChildren(id) {
    const sql = `SELECT COUNT(*) AS cnt FROM ${TABLE} WHERE parent_id = $1`;
    const { rows } = await query(sql, [id]);
    return parseInt(rows[0].cnt);
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  static async create(data) {
    return create(TABLE, data);
  }

  static async update(id, data) {
    return updateById(TABLE, id, data);
  }

  static async delete(id) {
    return deleteById(TABLE, id);
  }

  // ─── Toggle is_active ─────────────────────────────────────────────────────────

  static async toggle(id) {
    const sql = `
      UPDATE ${TABLE}
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }
}

module.exports = SpotCategoryRepository;
