const { query } = require("../../configs/database");
const { create, updateById, exists, count } = require("../../utils/database");
const bcrypt = require("bcrypt");
const User = require("../user.model");

class UserRepository {
  static tableName = "users";
  static uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  static normalizePermissions(rawPermissions) {
    if (!rawPermissions) return [];
    if (Array.isArray(rawPermissions)) return rawPermissions;
    if (typeof rawPermissions === "string") {
      try {
        const parsed = JSON.parse(rawPermissions);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  static async getRolePermissions(roleId) {
    if (!roleId) return [];
    const sql = `
    SELECT p.resource, p.action
    FROM role_permissions rp
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = $1
  `;
    const { rows } = await query(sql, [roleId]);
    return rows;
  }

  static buildUserFromRow(row) {
    if (!row) return null;

    if (row.role_id) {
      row.role = {
        id: row.role_id,
        code: row.role_code,
        name_vi: row.role_name_vi || row.role_name,
        name_en: row.role_name_en || null,
      };
    }

    row.permissions = this.normalizePermissions(row.permissions);
    return new User(row);
  }

  static async getDefaultRoleId() {
    const preferredSql = `
      SELECT id FROM roles WHERE lower(code) = 'tourist' LIMIT 1
    `;
    const preferred = await query(preferredSql);
    if (preferred.rows.length) return preferred.rows[0].id;

    const fallback = await query("SELECT id FROM roles ORDER BY id ASC LIMIT 1");
    return fallback.rows.length ? fallback.rows[0].id : null;
  }

  static async createUser(userData) {
    const {
      email,
      password,
      full_name,
      phone,
      avatar_url,
      role_id,
      sso_provider,
      sso_uid,
    } = userData;

    const resolvedRoleId = role_id || (await this.getDefaultRoleId());
    if (!resolvedRoleId) {
      throw new Error("Default role is not configured");
    }
    const insertData = {
      email: email ? String(email).trim().toLowerCase() : null,
      full_name: full_name ? String(full_name).trim() : null,
      phone: phone ? String(phone).trim() : null,
      avatar_url: avatar_url ? String(avatar_url).trim() : null,
      role_id: resolvedRoleId,
    };

    // Mật khẩu chỉ cần khi không dùng SSO
    if (password) {
      insertData.password_hash = await bcrypt.hash(password, 12);
    }

    if (sso_provider) {
      insertData.sso_provider = sso_provider;
      insertData.sso_uid = sso_uid;
    }

    const newUser = await create(this.tableName, insertData);
    return new User(newUser);
  }

  static async getAllUsers(options = {}) {
    const {
      page,
      limit,
      role_id,
      search,
      is_active,
      sortBy,
      sortOrder,
      sort_by,
      sort_order,
    } = options;

    const safeSortBy = sortBy || sort_by || "created_at";
    const safeSortOrder = sortOrder || sort_order || "DESC";

    const values = [];
    let sql = `
    SELECT u.*, r.code AS role_code, r.name_vi AS role_name,
           COUNT(*) OVER() as total_count
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
        WHERE 1=1
  `;
    let paramCount = 1;

    if (role_id) {
      sql += ` AND u.role_id = $${paramCount++}`;
      values.push(role_id);
    }

    if (is_active !== undefined) {
      sql += ` AND u.is_active = $${paramCount++}`;
      values.push(is_active);
    }

    if (search) {
      sql += ` AND (u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.phone ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    const allowedSortFields = [
      "created_at",
      "updated_at",
      "email",
      "full_name",
      "phone",
      "last_login_at",
      "id",
    ];
    const sortField = allowedSortFields.includes(safeSortBy)
      ? safeSortBy
      : "created_at";
    const order = safeSortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    sql += ` ORDER BY u.${sortField} ${order}`;
    if (limit && page) {
      sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      values.push(limit, (page - 1) * limit);
    }

    const { rows } = await query(sql, values);

    const users = rows.map((row) => {
      row.role = { code: row.role_code, name_vi: row.role_name };
      row.permissions = [];
      return new User(row);
    });
    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

    return { users, totalCount };
  }

  static async findUserById(id) {
    const sql = `
    SELECT u.*, r.code as role_code, r.name_vi as role_name_vi, r.name_en as role_name_en
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
  `;
    const { rows } = await query(sql, [id]);
    if (rows.length === 0) return null;

    const row = rows[0];
    row.permissions = await this.getRolePermissions(row.role_id);
    return this.buildUserFromRow(row);
  }

  static async findUserByMail(email) {
    const sql = `
    SELECT u.*, r.code as role_code, r.name_vi as role_name_vi, r.name_en as role_name_en
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
        WHERE lower(u.email) = lower($1) AND u.is_active = TRUE
  `;
    const { rows } = await query(sql, [email]);
    if (rows.length === 0) return null;

    const row = rows[0];
    row.permissions = await this.getRolePermissions(row.role_id);
    return this.buildUserFromRow(row);
  }

  // Tìm user theo email không lọc is_active (dùng cho forgot password)
  static async findUserByMailAny(email) {
    const sql = `
    SELECT u.*, r.code as role_code, r.name_vi as role_name_vi, r.name_en as role_name_en
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE lower(u.email) = lower($1)
  `;
    const { rows } = await query(sql, [email]);
    if (rows.length === 0) return null;
    const row = rows[0];
    row.permissions = await this.getRolePermissions(row.role_id);
    return this.buildUserFromRow(row);
  }

  static async findUserByPhone(phone) {
    const sql = `
    SELECT u.*, r.code as role_code, r.name_vi as role_name_vi, r.name_en as role_name_en
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.phone = $1 AND u.is_active = TRUE
  `;
    const { rows } = await query(sql, [phone]);
    if (rows.length === 0) return null;

    const row = rows[0];
    row.permissions = await this.getRolePermissions(row.role_id);
    return this.buildUserFromRow(row);
  }

  /**
   * Tìm user bằng SSO provider và uid
   */
  static async findBySSOProvider(provider, uid) {
    const sql = `
    SELECT u.*, r.code as role_code, r.name_vi as role_name_vi, r.name_en as role_name_en
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.sso_provider = $1 AND u.sso_uid = $2 AND u.is_active = TRUE
  `;
    const { rows } = await query(sql, [provider, uid]);
    if (rows.length === 0) return null;

    const row = rows[0];
    row.permissions = await this.getRolePermissions(row.role_id);
    return this.buildUserFromRow(row);
  }

  static async updateUser(id, updates) {
    const cleanData = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    if (!Object.keys(cleanData).length) throw new Error("No data to update");
    cleanData.updated_at = new Date();
    await updateById(this.tableName, id, cleanData);
    return await this.findUserById(id);
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 12);
    return await this.updateUser(id, { password_hash });
  }

  static async updateLoginInfo(id, ipAddress = null) {
    const sql = `UPDATE users SET last_login_at = NOW(), last_login_ip = $2, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const { rows } = await query(sql, [id, ipAddress]);
    return rows[0] || null;
  }

  static async checkEmailExists(email) {
    const sql = "SELECT EXISTS(SELECT 1 FROM users WHERE lower(email) = lower($1)) AS exists";
    const { rows } = await query(sql, [email]);
    return rows[0]?.exists === true;
  }

  static async checkPhoneExists(phone) {
    if (!phone) return false;
    return await exists(this.tableName, { phone });
  }

  // Backward-compatible stubs for legacy callers
  static async checkUsernameExists() {
    return false;
  }

  static async findUserByUsername() {
    return null;
  }

  static async verifyPassword(user, password) {
    if (!user.password_hash) return false;
    return await bcrypt.compare(password, user.password_hash);
  }

  static async incrementFailedAttempts() {
    return 0;
  }

  static async countUsers(filter = {}) {
    return await count(this.tableName, filter);
  }

  /**
   * Vô hiệu hoá tài khoản (thay thế soft-delete cũ)
   */
  static async deactivateUser(id) {
    const sql = `
    UPDATE users
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE id = $1 AND is_active = TRUE
    RETURNING *
  `;
    const { rows } = await query(sql, [id]);
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  static async toggleAccountLock(id) {
    const sql = `
    UPDATE users
    SET is_active = NOT is_active, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
    const { rows } = await query(sql, [id]);
    return rows.length ? new User(rows[0]) : null;
  }

  static async updateUserRole(id, role_id) {
    return await this.updateUser(id, { role_id });
  }

  static async getUsersByRole(role_id) {
    const sql = `SELECT * FROM users WHERE role_id = $1 AND is_active = TRUE`;
    const { rows } = await query(sql, [role_id]);
    return rows.map((row) => new User(row));
  }

  /**
   * CRIT-03 FIX: Fetch users for multiple role IDs in 1 query
   *
   * BEFORE (NotificationService): Promise.all(roleIds.map(id => getUsersByRole(id)))
   *   → N separate SELECT queries, one per role
   *
   * AFTER: 1 query with ANY($1::int[])
   *   → Single round-trip to DB regardless of role count
   */
  static async getUsersByRoleIds(roleIds = []) {
    const safeIds = roleIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (!safeIds.length) return [];

    const sql = `SELECT id FROM users WHERE role_id = ANY($1::int[]) AND is_active = TRUE`;
    const { rows } = await query(sql, [safeIds]);
    return rows;
  }

  static async getUsersByRoleCodes(roleCodes = []) {
    const safeCodes = roleCodes
      .filter((c) => typeof c === "string")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);

    if (!safeCodes.length) return [];

    const sql = `
    SELECT u.*, r.code AS role_code, r.name_vi AS role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.is_active = TRUE
      AND lower(r.code) = ANY($1::text[])
  `;

    const { rows } = await query(sql, [safeCodes]);

    return rows.map((row) => {
      row.role = { code: row.role_code, name_vi: row.role_name };
      return new User(row);
    });
  }

  static async searchUsers(searchTerm) {
    const sql = `SELECT * FROM users WHERE (full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1) AND is_active = TRUE`;
    const { rows } = await query(sql, [`%${searchTerm}%`]);
    return rows.map((row) => new User(row));
  }

  /**
   * Cập nhật push token cho mobile
   */
  static async updatePushToken(id, { fcm_token, apns_token, device_os, app_version }) {
    const updates = {};
    if (fcm_token !== undefined) updates.fcm_token = fcm_token;
    if (apns_token !== undefined) updates.apns_token = apns_token;
    if (device_os !== undefined) updates.device_os = device_os;
    if (app_version !== undefined) updates.app_version = app_version;
    return await this.updateUser(id, updates);
  }

  static async getUserStatistics() {
    const sql = `
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_active THEN 1 END) as active_users,
      COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_users,
      COUNT(CASE WHEN is_verified THEN 1 END) as verified_users,
      COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as monthly_active_users,
      COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '7 days' THEN 1 END) as weekly_active_users,
      COUNT(CASE WHEN sso_provider IS NOT NULL THEN 1 END) as sso_users
    FROM users
  `;
    const { rows } = await query(sql);
    return rows[0];
  }

  static async getRecentUsers(limit = 10) {
    const sql = `SELECT * FROM users ORDER BY created_at DESC LIMIT $1`;
    const { rows } = await query(sql, [limit]);
    return rows.map((row) => new User(row));
  }

  static async getAllActiveUserIds() {
    const sql = `
    SELECT id
    FROM users
    WHERE is_active = TRUE
    ORDER BY created_at ASC
  `;

    const { rows } = await query(sql);
    return rows;
  }

  static async hardDeleteUser(id) {
    const sql = "DELETE FROM users WHERE id = $1";
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }

  static async deleteUsersBatch(userIds = []) {
    const safeIds = userIds
      .map((id) => (typeof id === "string" ? id.trim() : String(id || "").trim()))
      .filter((id) => this.uuidRegex.test(id));

    if (!safeIds.length) return [];

    const sql = `
    DELETE FROM users
    WHERE id = ANY($1::uuid[])
    RETURNING id
  `;
    const { rows } = await query(sql, [safeIds]);
    return rows;
  }
}

module.exports = UserRepository;
