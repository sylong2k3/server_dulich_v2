const { query } = require('../../configs/database');
const BlacklistToken = require('../blacklist-token.model');
const { tableExists, warnMissingTableOnce } = require('../../utils/table-exists');

class BlacklistTokenRepository {
    static tableName = 'auth.blacklist_tokens';
    static refreshTableName = 'auth.refresh_tokens';

    static async addToBlacklist(tokenData) {
        const { token, user_id, tokenType = 'access', expiresAt, reason = 'logout' } = tokenData;

        const sql = `
    INSERT INTO ${this.tableName} (token, user_id, token_type, expires_at, reason)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (token) DO NOTHING
    RETURNING *
  `;

        const result = await query(sql, [token, user_id, tokenType, expiresAt, reason]);
        return result.rows.length > 0 ? new BlacklistToken(result.rows[0]) : null;
    }

    static async isBlacklisted(tokenString) {
        const sql = `
    SELECT EXISTS(
      SELECT 1 FROM ${this.tableName} 
      WHERE token = $1 AND expires_at > NOW()
    ) as exists
  `;

        const result = await query(sql, [tokenString]);
        return result.rows[0].exists;
    }

    static async findByToken(tokenString) {
        const sql = `SELECT * FROM ${this.tableName} WHERE token = $1`;
        const result = await query(sql, [tokenString]);
        return result.rows.length > 0 ? new BlacklistToken(result.rows[0]) : null;
    }

    static async revokeAllUserTokens(userId, reason = 'password_change') {
        const sql = `
    INSERT INTO ${this.tableName} (token, user_id, token_type, expires_at, reason)
    SELECT token, user_id, 'refresh' as token_type, expires_at, $2 as reason
    FROM ${this.refreshTableName}
    WHERE user_id = $1 AND (revoked_at IS NULL OR revoked_at > NOW()) AND expires_at > NOW()
    ON CONFLICT (token) DO NOTHING
  `;

        const result = await query(sql, [userId, reason]);
        return result.rowCount;
    }

    static async cleanupExpired() {
        const exists = await tableExists(this.tableName);
        if (!exists) {
            warnMissingTableOnce('token blacklist cleanup', this.tableName);
            return 0;
        }

        const sql = `DELETE FROM ${this.tableName} WHERE expires_at < NOW()`;
        const result = await query(sql);
        return result.rowCount;
    }

    static async countUserBlacklistedTokens(userId) {
        const sql = `
    SELECT COUNT(*) as count 
    FROM ${this.tableName} 
    WHERE user_id = $1 AND expires_at > NOW()
  `;

        const result = await query(sql, [userId]);
        return parseInt(result.rows[0].count);
    }

    static async getUserBlacklistedTokens(userId) {
        const sql = `
    SELECT * FROM ${this.tableName} 
    WHERE user_id = $1 AND expires_at > NOW()
    ORDER BY revoked_at DESC
  `;

        const result = await query(sql, [userId]);
        return result.rows.map(row => new BlacklistToken(row));
    }
}

module.exports = BlacklistTokenRepository;
