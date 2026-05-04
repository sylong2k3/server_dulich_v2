const { query } = require('../../configs/database');
const Notification = require('../notification.model');
const { tableExists, warnMissingTableOnce } = require('../../utils/table-exists');

class NotificationRepository {
  static tableName = 'public.notifications';
  static usersTableName = 'auth.users';

  static mapRowToModel(row) {
    return new Notification(row);
  }

  /**
   * Tạo notification (có thể targeted theo user hoặc broadcast theo role/geo)
   */
  static async create(data = {}) {
    const titleVi = data.title_vi || data.title || null;
    const bodyVi = data.body_vi !== undefined ? data.body_vi : (data.body || null);
    const deliveryStatus = data.delivery_status || 'pending';

    const sql = `
      INSERT INTO ${this.tableName} (
        user_id, target_roles, target_geom, target_radius_m,
        type, title_vi, body_vi, data,
        sent_at, delivery_status, triggered_by
      ) VALUES (
        $1, $2, 
        CASE WHEN $3::float IS NOT NULL AND $4::float IS NOT NULL 
          THEN ST_SetSRID(ST_MakePoint($3, $4), 4326)
          ELSE NULL
        END,
        $5,
        $6, $7, $8, $9::jsonb,
        CASE WHEN $10 = 'sent' THEN NOW() ELSE NULL END,
        $10, $11
      )
      RETURNING *
    `;

    const values = [
      data.user_id || null,
      data.target_roles || null,
      data.target_lng || null,
      data.target_lat || null,
      data.target_radius_m || null,
      data.type,
      titleVi,
      bodyVi,
      data.data ? JSON.stringify(data.data) : null,
      deliveryStatus,
      data.triggered_by || 'system',
    ];

    const { rows } = await query(sql, values);
    return this.mapRowToModel(rows[0]);
  }

  /**
   * CRIT-03 FIX: Bulk insert notifications cho nhiều users trong 1 query
   * 
   * Sử dụng unnest($1::uuid[]) để expand mảng user IDs thành nhiều rows
   * Thay vì N INSERT riêng lẻ → 1 INSERT duy nhất
   *
   * Performance: 1000 users = 1 query thay vì 1000 queries
   */
  static async bulkCreateForUsers(userIds, data = {}) {
    if (!userIds || !userIds.length) return [];

    const titleVi = data.title_vi || data.title || null;
    const bodyVi = data.body_vi !== undefined ? data.body_vi : (data.body || null);
    const deliveryStatus = data.delivery_status || 'pending';

    const sql = `
      INSERT INTO ${this.tableName} (
        user_id, target_roles,
        type, title_vi, body_vi, data,
        sent_at, delivery_status, triggered_by
      )
      SELECT
        unnest($1::uuid[]),
        $2::int[],
        $3, $4, $5, $6::jsonb,
        CASE WHEN $7 = 'sent' THEN NOW() ELSE NULL END,
        $7, $8
      RETURNING id, user_id
    `;

    const values = [
      userIds,
      data.target_roles || null,
      data.type,
      titleVi,
      bodyVi,
      data.data ? JSON.stringify(data.data) : null,
      deliveryStatus,
      data.triggered_by || 'system',
    ];

    const { rows } = await query(sql, values);
    return rows;
  }

  /**
   * Danh sách notifications theo user
   */
  static async findAll(options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const offset = (page - 1) * limit;

    const values = [];
    let paramCount = 1;
    let whereClause = 'WHERE 1=1';

    if (options.user_id) {
      whereClause += ` AND n.user_id = $${paramCount++}`;
      values.push(options.user_id);
    }

    if (options.type) {
      whereClause += ` AND n.type = $${paramCount++}`;
      values.push(options.type);
    }

    if (options.unread_only === true) {
      whereClause += ' AND n.read_at IS NULL';
    }

    if (options.delivery_status) {
      whereClause += ` AND n.delivery_status = $${paramCount++}`;
      values.push(options.delivery_status);
    }

    const sql = `
      SELECT
        n.*, COUNT(*) OVER() AS total_count
      FROM ${this.tableName} n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);

    const { rows } = await query(sql, values);
    const notifications = rows.map((row) => this.mapRowToModel(row));
    const totalCount = rows.length ? Number(rows[0].total_count) : 0;

    return { notifications, totalCount };
  }

  static async findById(id) {
    const { rows } = await query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    return rows.length ? this.mapRowToModel(rows[0]) : null;
  }

  /**
   * Đánh dấu đã đọc
   */
  static async markAsRead(id, userId = null) {
    const values = [id];
    let userFilter = '';

    if (userId) {
      values.push(userId);
      userFilter = 'AND user_id = $2';
    }

    const sql = `
      UPDATE ${this.tableName}
      SET read_at = COALESCE(read_at, NOW())
      WHERE id = $1
      ${userFilter}
      RETURNING *
    `;

    const { rows } = await query(sql, values);
    return rows.length ? this.mapRowToModel(rows[0]) : null;
  }

  static async markAllAsRead(userId) {
    const sql = `
      UPDATE ${this.tableName}
      SET read_at = COALESCE(read_at, NOW())
      WHERE user_id = $1 AND read_at IS NULL
    `;
    const result = await query(sql, [userId]);
    return result.rowCount;
  }

  /**
   * Cập nhật trạng thái gửi
   */
  static async updateDeliveryStatus(id, status) {
    const sql = `
      UPDATE ${this.tableName}
      SET delivery_status = $1::text,
          sent_at = CASE WHEN $1::text = 'sent' THEN COALESCE(sent_at, NOW()) ELSE sent_at END
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await query(sql, [status, id]);
    return rows.length ? this.mapRowToModel(rows[0]) : null;
  }

  static async finalizePendingDelivery(id, status) {
    const sql = `
      UPDATE ${this.tableName}
      SET delivery_status = $1::text,
          sent_at = CASE WHEN $1::text = 'sent' THEN COALESCE(sent_at, NOW()) ELSE sent_at END
      WHERE id = $2
        AND delivery_status = 'pending'
      RETURNING *
    `;
    const { rows } = await query(sql, [status, id]);
    return rows.length ? this.mapRowToModel(rows[0]) : null;
  }

  static async deleteByIdAndUser(id, userId) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1 AND user_id = $2 RETURNING *`;
    const { rows } = await query(sql, [id, userId]);
    return rows.length ? this.mapRowToModel(rows[0]) : null;
  }

  static async deleteAllByUser(userId) {
    const sql = `DELETE FROM ${this.tableName} WHERE user_id = $1`;
    const result = await query(sql, [userId]);
    return result.rowCount;
  }

  static async countUnreadByUser(userId) {
    const sql = `SELECT COUNT(*) AS unread_count FROM ${this.tableName} WHERE user_id = $1 AND read_at IS NULL`;
    const { rows } = await query(sql, [userId]);
    return rows.length ? Number(rows[0].unread_count) : 0;
  }

  /**
   * Lấy danh sách notifications chưa gửi (cho push worker)
   */
  static async getPendingNotifications(limit = 100) {
    const notificationsExists = await tableExists(this.tableName);
    if (!notificationsExists) {
      warnMissingTableOnce('notification push worker', this.tableName);
      return [];
    }

    const usersExists = await tableExists(this.usersTableName);
    if (!usersExists) {
      warnMissingTableOnce('notification push worker', this.usersTableName);
      return [];
    }

    const sql = `
      SELECT n.*, u.fcm_token, u.apns_token, u.device_os
      FROM ${this.tableName} n
      LEFT JOIN ${this.usersTableName} u ON n.user_id = u.id
      WHERE n.delivery_status = 'pending'
        AND n.user_id IS NOT NULL
      ORDER BY n.created_at ASC
      LIMIT $1
    `;
    const { rows } = await query(sql, [limit]);
    return rows;
  }
}

module.exports = NotificationRepository;
