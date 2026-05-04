const { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken, generateTempToken, verifyTempToken } = require('./jwt');
const BlacklistTokenRepository = require('../models/repositories/blacklist-token.repository');
const RefreshTokenRepository = require('../models/repositories/refresh-token.repository');
const { Api401Error } = require('../core/error.response');
class TokenManager {
  static extractToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
    return null;
  }

  // Token tạm cho flow 2FA (TTL 5 phút)
  static generateTempToken(user) {
    return generateTempToken(user);
  }

  static async validateTempToken(token) {
    const isBlacklisted = await BlacklistTokenRepository.isBlacklisted(token);
    if (isBlacklisted) throw new Api401Error("Token đã bị thu hồi");
    return verifyTempToken(token);
  }

  static generateTokens(user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    };
  }
  static async validateRefreshToken(token) {
    const decoded = verifyRefreshToken(token);
    return decoded;
  }

  static validateAccessToken(token) {
    return verifyAccessToken(token);
  }
  static async cleanupExpiredBlacklistedTokens() {
    try {
      const cleaned = await BlacklistTokenRepository.cleanupExpired();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired blacklisted tokens`);
      }
      return cleaned;
    } catch (error) {
      console.error('Error cleaning up expired blacklisted tokens:', error);
      return 0;
    }
  }

  static async cleanupExpiredRefreshTokens() {
    try {
      const cleaned = await RefreshTokenRepository.cleanupExpired();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired/revoked refresh tokens`);
      }
      return cleaned;
    } catch (error) {
      console.error('Error cleaning up expired refresh tokens:', error);
      return 0;
    }
  }

  static async cleanupAllExpiredTokens() {
    try {
      const blacklistCleaned = await TokenManager.cleanupExpiredBlacklistedTokens();
      const refreshCleaned = await TokenManager.cleanupExpiredRefreshTokens();
      return { blacklistCleaned, refreshCleaned };
    } catch (error) {
      console.error('Error during token cleanup:', error);
      return { blacklistCleaned: 0, refreshCleaned: 0 };
    }
  }

  static _cleanupIntervalId = null;

  static initializeCleanup() {
    if (TokenManager._cleanupIntervalId) return;
    TokenManager._cleanupIntervalId = setInterval(() => {
      TokenManager.cleanupAllExpiredTokens();
    }, 60 * 60 * 1000);
    TokenManager.cleanupAllExpiredTokens();
  }

  static stopCleanup() {
    if (TokenManager._cleanupIntervalId) {
      clearInterval(TokenManager._cleanupIntervalId);
      TokenManager._cleanupIntervalId = null;
    }
  }
}

module.exports = TokenManager;
