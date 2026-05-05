const { pool } = require('../../configs/database');

class ChatbotRepository {
  static async createSession({ user_id, session_type = 'tourist', language = 'vi', context = null }) {
    const { rows } = await pool.query(
      `INSERT INTO ai_chat_sessions (user_id, session_type, language, context)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id ?? null, session_type, language, context ? JSON.stringify(context) : null]
    );
    return rows[0];
  }

  static async findSession(sessionId) {
    const { rows } = await pool.query(
      `SELECT * FROM ai_chat_sessions WHERE id = $1`,
      [sessionId]
    );
    return rows[0] || null;
  }

  static async getUserSessions(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM ai_chat_sessions
       WHERE user_id = $1
       ORDER BY last_message_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const total = rows[0] ? parseInt(rows[0].total_count) : 0;
    return { rows: rows.map(({ total_count, ...r }) => r), total };
  }

  /**
   * Lưu tin nhắn + cập nhật last_message_at trong CÙNG transaction để tránh
   * trạng thái không nhất quán nếu UPDATE fail.
   */
  static async saveMessage({
    session_id,
    role,
    content,
    map_actions = null,
    token_usage = null,
    tool_calls = null,
    latency_ms = null,
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO ai_chat_messages
           (session_id, role, content, map_actions, token_usage, tool_calls, latency_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          session_id,
          role,
          content,
          map_actions ? JSON.stringify(map_actions) : null,
          token_usage ? JSON.stringify(token_usage) : null,
          tool_calls ? JSON.stringify(tool_calls) : null,
          latency_ms,
        ]
      );
      await client.query(
        `UPDATE ai_chat_sessions SET last_message_at = NOW() WHERE id = $1`,
        [session_id]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /** Phân trang tin nhắn (UI hiển thị, ASC theo thời gian). */
  static async getMessages(sessionId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM ai_chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );
    const total = rows[0] ? parseInt(rows[0].total_count) : 0;
    return { rows: rows.map(({ total_count, ...r }) => r), total };
  }

  /**
   * Lấy N tin nhắn GẦN NHẤT theo thứ tự cũ → mới, dùng làm context cho OpenAI.
   * Khác với getMessages (paginated) — luôn cắt từ cuối.
   */
  static async getRecentMessages(sessionId, limit = 10) {
    const { rows } = await pool.query(
      `SELECT * FROM (
         SELECT * FROM ai_chat_messages
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       ) sub
       ORDER BY created_at ASC`,
      [sessionId, limit]
    );
    return rows;
  }

  static async deleteSession(sessionId) {
    const { rowCount } = await pool.query(
      `DELETE FROM ai_chat_sessions WHERE id = $1`,
      [sessionId]
    );
    return rowCount > 0;
  }
}

module.exports = ChatbotRepository;
