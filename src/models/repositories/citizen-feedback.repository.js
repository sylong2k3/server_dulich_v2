const db = require('../../configs/database');

class CitizenFeedbackRepository {
  static async findAll({ page = 1, limit = 10, search, status, moderation_status, priority, user_id, start_date, end_date, sortBy = 'created_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let idx = 1;

    if (status) { conditions.push(`f.status = $${idx++}`); params.push(status); }
    if (moderation_status) { conditions.push(`f.moderation_status = $${idx++}`); params.push(moderation_status); }
    if (priority) { conditions.push(`f.priority = $${idx++}`); params.push(priority); }
    if (user_id) { conditions.push(`f.user_id = $${idx++}`); params.push(user_id); }
    if (start_date) { conditions.push(`f.created_at >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`f.created_at <= $${idx++}`); params.push(end_date); }
    if (search) { conditions.push(`(f.title ILIKE $${idx} OR f.content ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const allowed = ['created_at', 'updated_at', 'priority', 'status'];
    const col = allowed.includes(sortBy) ? sortBy : 'created_at';
    const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT f.id, f.title, f.content, f.latitude, f.longitude, f.location_text,
             f.priority, f.status, f.moderation_status, f.images,
             f.admin_response, f.resolution_note, f.is_location_verified,
             f.forest_loss_area_estimate_m2, f.user_id, f.created_at, f.updated_at,
             u.full_name AS user_name, u.avatar_url AS user_avatar,
             COUNT(*) OVER() AS total_count
      FROM citizen_feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      ${where}
      ORDER BY f.${col} ${dir}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const result = await db.query(sql, params);
    return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
  }

  static async findById(id) {
    const sql = `
      SELECT f.*, u.full_name AS user_name, u.avatar_url AS user_avatar
      FROM citizen_feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { title, content, latitude, longitude, location_text, priority, images, forest_loss_area_estimate_m2, user_id } = data;

    const hasCoords = latitude != null && longitude != null;

    const sql = `
      INSERT INTO citizen_feedbacks
        (title, content, latitude, longitude, location_text, priority, images,
         forest_loss_area_estimate_m2, user_id, status, moderation_status${hasCoords ? ', geom' : ''})
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending','pending'${hasCoords ? ',ST_SetSRID(ST_MakePoint($11, $10), 4326)' : ''})
      RETURNING *
    `;
    const params = [
      title, content,
      latitude || null, longitude || null, location_text || null,
      priority || 'normal', JSON.stringify(images || []),
      forest_loss_area_estimate_m2 || null, user_id || null,
    ];
    if (hasCoords) {
      params.push(latitude, longitude);
    }
    const result = await db.query(sql, params);
    return result.rows[0];
  }

  static async update(id, fields) {
    const allowed = ['title', 'content', 'latitude', 'longitude', 'location_text', 'priority'];
    const sets = []; const params = []; let idx = 1;
    for (const key of allowed) {
      if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
    }
    if (!sets.length) return null;
    sets.push('updated_at = NOW()');
    params.push(id);
    const result = await db.query(`UPDATE citizen_feedbacks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    return result.rows[0] || null;
  }

  static async updateStatus(id, { status, admin_response, resolution_note, is_location_verified }) {
    const sets = ['status = $1', 'updated_at = NOW()'];
    const params = [status];
    let idx = 2;
    if (admin_response !== undefined) { sets.push(`admin_response = $${idx++}`); params.push(admin_response); }
    if (resolution_note !== undefined) { sets.push(`resolution_note = $${idx++}`); params.push(resolution_note); }
    if (is_location_verified !== undefined) { sets.push(`is_location_verified = $${idx++}`); params.push(is_location_verified); }
    if (status === 'resolved' || status === 'closed') { sets.push(`responded_at = NOW()`); }
    params.push(id);
    const result = await db.query(`UPDATE citizen_feedbacks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    return result.rows[0] || null;
  }

  static async updateModerationStatus(id, { moderation_status, admin_response }) {
    const sets = ['moderation_status = $1', 'updated_at = NOW()'];
    const params = [moderation_status];
    let idx = 2;
    if (admin_response !== undefined) { sets.push(`admin_response = $${idx++}`); params.push(admin_response); }
    params.push(id);
    const result = await db.query(`UPDATE citizen_feedbacks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM citizen_feedbacks WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CitizenFeedbackRepository;
