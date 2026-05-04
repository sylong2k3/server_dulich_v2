const jwt = require('jsonwebtoken');

// Validate required JWT environment variables at startup
const REQUIRED_JWT_ENV = ['JWT_SECRET', 'JWT_SECRET_REFRESH', 'JWT_ACCESS_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN'];
for (const envVar of REQUIRED_JWT_ENV) {
    if (!process.env[envVar]) {
        throw new Error(`FATAL: Missing required environment variable "${envVar}". Server cannot start safely.`);
    }
}

/**
 * Parse duration string (e.g. '7d', '24h', '30m', '3600') to milliseconds
 */
function parseDurationToMs(duration) {
    if (!duration) return 0;
    const str = String(duration).trim();
    const num = parseInt(str, 10);
    if (/^\d+$/.test(str)) return num * 1000; // pure number = seconds
    const unit = str.slice(-1).toLowerCase();
    switch (unit) {
        case 'd': return num * 86400000;
        case 'h': return num * 3600000;
        case 'm': return num * 60000;
        case 's': return num * 1000;
        default: return num * 1000;
    }
}

const createTokenPayload = (user, tokenType = 'access') => {
    const basePayload = {
        id: user.id,
        role_id: user.role_id,
        type: tokenType
    };
    return basePayload;
};

const createJwtOptions = (expiresIn) => ({
    expiresIn,
    issuer: 'daklak-an-ninh-bien-gioi',
    audience: 'daklak-an-ninh-bien-gioi'
});

const generateAccessToken = (user) => {
    const payload = createTokenPayload(user, 'access');
    const options = createJwtOptions(process.env.JWT_ACCESS_EXPIRES_IN);
    return jwt.sign(payload, process.env.JWT_SECRET, options);
};

const generateRefreshToken = (user) => {
    const payload = createTokenPayload(user, 'refresh');
    const options = createJwtOptions(process.env.JWT_REFRESH_EXPIRES_IN);
    return jwt.sign(payload, process.env.JWT_SECRET_REFRESH, options);
};

const verifyAccessToken = (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'daklak-an-ninh-bien-gioi',
        audience: 'daklak-an-ninh-bien-gioi'
    });
    if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
    }
    return decoded;
};

const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_REFRESH, {
            issuer: 'daklak-an-ninh-bien-gioi',
            audience: 'daklak-an-ninh-bien-gioi'
        });
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (err) {
        throw new Error(`Invalid refresh token: ${err.message}`);
    }
};

// Token tạm thời dùng cho 2FA (TTL 5 phút, type='2fa_pending')
const generateTempToken = (user) => {
    const payload = createTokenPayload(user, '2fa_pending');
    const options = createJwtOptions('5m');
    return jwt.sign(payload, process.env.JWT_SECRET, options);
};

const verifyTempToken = (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'daklak-an-ninh-bien-gioi',
        audience: 'daklak-an-ninh-bien-gioi'
    });
    if (decoded.type !== '2fa_pending') {
        throw new Error('Invalid token type');
    }
    return decoded;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTempToken,
    verifyTempToken,
    parseDurationToMs
};
