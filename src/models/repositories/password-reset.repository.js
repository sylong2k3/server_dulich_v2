const { query } = require("../../configs/database");
const crypto = require("crypto");

class PasswordResetRepository {
  static hashToken(rawToken) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  static async createToken(userId) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await query(
      `DELETE FROM auth.password_reset_tokens WHERE user_id = $1`,
      [userId]
    );

    await query(
      `INSERT INTO auth.password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    return rawToken;
  }

  static async findValidToken(rawToken) {
    const tokenHash = this.hashToken(rawToken);
    const { rows } = await query(
      `SELECT * FROM auth.password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  static async markAsUsed(rawToken) {
    const tokenHash = this.hashToken(rawToken);
    await query(
      `UPDATE auth.password_reset_tokens SET used_at = NOW() WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  static async deleteUserTokens(userId) {
    await query(`DELETE FROM auth.password_reset_tokens WHERE user_id = $1`, [userId]);
  }

  static async cleanup() {
    const { rowCount } = await query(
      `DELETE FROM auth.password_reset_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL`
    );
    return rowCount;
  }
}

module.exports = PasswordResetRepository;
