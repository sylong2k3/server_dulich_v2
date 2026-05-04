const { query } = require('../../configs/database');
const {
    create,
    findById: findByIdUtil,
    updateById,
    deleteById,
    count,
    exists
} = require('../../utils/database');
const RefreshToken = require('../refresh-token.model');
const { tableExists, warnMissingTableOnce } = require('../../utils/table-exists');

class RefreshTokenRepository {
    static tableName = 'auth.refresh_tokens';

    static async createToken(tokenData) {
        const { token, userId, expiresAt } = tokenData;
        const data = {
            token,
            user_id: userId,
            expires_at: expiresAt
        };

        const result = await create(this.tableName, data);
        return new RefreshToken(result);
    }

    static async findValidToken(tokenString) {
        const sql = `
    SELECT * FROM ${this.tableName} 
    WHERE token = $1 AND revoked_at IS NULL AND expires_at > NOW()
  `;

        const result = await query(sql, [tokenString]);
        return result.rows.length > 0 ? new RefreshToken(result.rows[0]) : null;
    }

    static async findById(id) {
        const result = await findByIdUtil(this.tableName, id);
        return result ? new RefreshToken(result) : null;
    }

    static async updateLastUsed(tokenId) {
        const result = await updateById(this.tableName, tokenId, {
            last_used: new Date()
        });
        return result ? new RefreshToken(result) : null;
    }

    static async revokeById(tokenId) {
        const result = await updateById(this.tableName, tokenId, {
            revoked_at: new Date()
        });
        return result ? new RefreshToken(result) : null;
    }

    static async revokeByToken(tokenString) {
        const sql = `
    UPDATE ${this.tableName} 
    SET revoked_at = NOW() 
    WHERE token = $1 
    RETURNING *
  `;

        const result = await query(sql, [tokenString]);
        return result.rowCount > 0;
    }

    static async revokeAllUserTokens(userId) {
        const sql = `
    UPDATE ${this.tableName} 
    SET revoked_at = NOW() 
    WHERE user_id = $1 AND revoked_at IS NULL
  `;

        const result = await query(sql, [userId]);
        return result.rowCount;
    }

    static async cleanupExpired() {
        const exists = await tableExists(this.tableName);
        if (!exists) {
            warnMissingTableOnce('refresh token cleanup', this.tableName);
            return 0;
        }

        const sql = `
    DELETE FROM ${this.tableName} 
    WHERE expires_at < NOW() OR revoked_at IS NOT NULL
  `;

        const result = await query(sql);
        return result.rowCount;
    }

    static async countUserActiveTokens(userId) {
        const sql = `
    SELECT COUNT(*) as count 
    FROM ${this.tableName} 
    WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
  `;

        const result = await query(sql, [userId]);
        return parseInt(result.rows[0].count);
    }

    static async getUserActiveTokens(userId) {
        const sql = `
    SELECT * FROM ${this.tableName} 
    WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
    ORDER BY created_at DESC
  `;

        const result = await query(sql, [userId]);
        return result.rows.map(row => new RefreshToken(row));
    }

    static async findByTokenString(tokenString) {
        const sql = `SELECT * FROM ${this.tableName} WHERE token = $1`;
        const result = await query(sql, [tokenString]);
        return result.rows.length > 0 ? new RefreshToken(result.rows[0]) : null;
    }

    static async getTokenStatistics() {
        const sql = `
    SELECT 
      COUNT(*) as total_tokens,
      COUNT(CASE WHEN revoked_at IS NOT NULL THEN 1 END) as revoked_tokens,
      COUNT(CASE WHEN revoked_at IS NULL AND expires_at > NOW() THEN 1 END) as active_tokens,
      COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_tokens
    FROM ${this.tableName}
  `;
        const result = await query(sql);
        return result.rows[0];
    }

    static async deleteExpiredTokens() {
        const sql = `DELETE FROM ${this.tableName} WHERE expires_at < NOW()`;
        const result = await query(sql);
        return result.rowCount;
    }
}

module.exports = RefreshTokenRepository;
