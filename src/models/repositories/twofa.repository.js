const { query } = require("../../configs/database");

class TwoFARepository {
  static async saveSecret(userId, secret) {
    await query(
      `INSERT INTO auth.user_two_factor (user_id, secret, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET secret = $2, updated_at = NOW()`,
      [userId, secret]
    );
  }

  static async getSecret(userId) {
    const { rows } = await query(
      `SELECT secret FROM auth.user_two_factor WHERE user_id = $1`,
      [userId]
    );
    return rows[0]?.secret || null;
  }

  static async deleteSecret(userId) {
    await query(`DELETE FROM auth.user_two_factor WHERE user_id = $1`, [userId]);
  }
}

module.exports = TwoFARepository;
