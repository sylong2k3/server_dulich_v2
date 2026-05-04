const { query } = require('../../configs/database');

class RatingRepository {
  static tableName = 'ratings';

  /**
   * Danh sách đánh giá theo spot hoặc business
   */
  static async getRatings(options = {}) {
    const { spot_id, business_id, business_ids, status = 'published', page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;

    const values = [];
    let paramCount = 1;
    let whereClause = 'WHERE 1=1';

    if (spot_id) {
      whereClause += ` AND r.spot_id = $${paramCount}`;
      values.push(spot_id);
      paramCount++;
    }

    if (business_id) {
      whereClause += ` AND r.business_id = $${paramCount}`;
      values.push(business_id);
      paramCount++;
    }

    if (Array.isArray(business_ids) && business_ids.length) {
      whereClause += ` AND r.business_id = ANY($${paramCount}::uuid[])`;
      values.push(business_ids);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND r.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    const safeOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    const sql = `
      SELECT r.id, r.user_id, r.spot_id, r.business_id,
        r.stars, r.title, r.content, r.pros, r.cons,
        r.visit_date, r.photo_urls, r.status,
        r.is_verified_visit, r.helpful_count,
        r.reply_text, r.reply_at,
        r.created_at, r.updated_at,
        u.full_name AS user_name, u.avatar_url AS user_avatar,
        ru.full_name AS reply_by_name,
        COUNT(*) OVER() AS total_count
      FROM ${this.tableName} r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users ru ON r.reply_by = ru.id
      ${whereClause}
      ORDER BY r.created_at ${safeOrder}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(limit, offset);

    const { rows } = await query(sql, values);
    const totalCount = rows.length ? Number(rows[0].total_count) : 0;
    return {
      ratings: rows.map(({ total_count, ...r }) => r),
      totalCount,
    };
  }

  /**
   * Chi tiết đánh giá
   */
  static async findById(id) {
    const sql = `
      SELECT r.*, u.full_name AS user_name, u.avatar_url AS user_avatar,
        ru.full_name AS reply_by_name
      FROM ${this.tableName} r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users ru ON r.reply_by = ru.id
      WHERE r.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Tạo đánh giá
   */
  static async createRating(data) {
    const sql = `
      INSERT INTO ${this.tableName} (user_id, spot_id, business_id, stars, title, content, pros, cons, visit_date, photo_urls)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    const { rows } = await query(sql, [
      data.user_id, data.spot_id || null, data.business_id || null,
      data.stars, data.title, data.content, data.pros, data.cons,
      data.visit_date, data.photo_urls || null,
    ]);
    return this.findById(rows[0].id);
  }

  /**
   * Cập nhật đánh giá
   */
  static async updateRating(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowed = ['stars', 'title', 'content', 'pros', 'cons', 'visit_date', 'photo_urls'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
        paramCount++;
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id`;
    await query(sql, values);
    return this.findById(id);
  }

  /**
   * Xóa đánh giá
   */
  static async deleteRating(id) {
    const { rows } = await query(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  }

  /**
   * Phản hồi từ doanh nghiệp/operator
   */
  static async addReply(id, replyText, replyBy) {
    const sql = `
      UPDATE ${this.tableName}
      SET reply_text = $1, reply_by = $2, reply_at = NOW()
      WHERE id = $3
      RETURNING id
    `;
    await query(sql, [replyText, replyBy, id]);
    return this.findById(id);
  }

  /**
   * Tăng helpful_count
   */
  static async incrementHelpful(id) {
    const sql = `UPDATE ${this.tableName} SET helpful_count = helpful_count + 1 WHERE id = $1 RETURNING helpful_count`;
    const { rows } = await query(sql, [id]);
    return rows[0]?.helpful_count || 0;
  }

  /**
   * Cập nhật status (kiểm duyệt)
   */
  static async updateStatus(id, status) {
    const sql = `UPDATE ${this.tableName} SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`;
    await query(sql, [status, id]);
    return this.findById(id);
  }

  /**
   * Kiểm tra user đã đánh giá spot/business chưa
   */
  static async hasUserRated(userId, spotId = null, businessId = null) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = $1`;
    const values = [userId];
    if (spotId) {
      sql += ' AND spot_id = $2';
      values.push(spotId);
    }
    if (businessId) {
      sql += ` AND business_id = $${values.length + 1}`;
      values.push(businessId);
    }
    const { rows } = await query(sql, values);
    return parseInt(rows[0].count) > 0;
  }
}

module.exports = RatingRepository;
