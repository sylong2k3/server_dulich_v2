const auditLogService = require('../services/audit-log.service');

const DEFAULT_POINTCUT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_PAYLOAD_LENGTH = 4000;

const SENSITIVE_KEYS = new Set([
    'password',
    'password_hash',
    'token',
    'accessToken',
    'refreshToken',
    'authorization'
]);

const redactSensitiveFields = (input) => {
    if (!input || typeof input !== 'object') return input;

    if (Array.isArray(input)) {
        return input.map(redactSensitiveFields);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
        if (SENSITIVE_KEYS.has(key)) {
            sanitized[key] = '[REDACTED]';
            continue;
        }
        sanitized[key] = redactSensitiveFields(value);
    }
    return sanitized;
};

const toSafePayload = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const hasContent = Object.values(payload).some((value) => {
        if (value == null) return false;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    });

    if (!hasContent) {
        return null;
    }

    const sanitized = redactSensitiveFields(payload);

    try {
        const serialized = JSON.stringify(sanitized);
        if (serialized.length <= MAX_PAYLOAD_LENGTH) {
            return sanitized;
        }

        return {
            notice: 'Payload vượt kích thước lưu trữ cho phép, đã được rút gọn',
            preview: serialized.slice(0, MAX_PAYLOAD_LENGTH)
        };
    } catch (error) {
        return { notice: 'Không thể tuần tự hóa payload để lưu log' };
    }
};

const normalizeResource = (originalUrl = '') => {
    const cleanPath = originalUrl.split('?')[0];
    const segments = cleanPath.split('/').filter(Boolean);

    // /api/v1/<resource>/...
    return segments[2] || 'unknown';
};

const resolveAuditAction = (req) => {
    const resource = normalizeResource(req.originalUrl);
    const methodActionMap = {
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete'
    };

    const action = methodActionMap[req.method] || req.method.toLowerCase();
    return `${resource}.${action}`;
};

const shouldLogByPointcut = (req) => {
    // Pointcut cho các write operation để giảm nhiễu
    if (!DEFAULT_POINTCUT_METHODS.has(req.method)) {
        return false;
    }

    // Bỏ qua health route
    if (req.originalUrl?.includes('/health')) {
        return false;
    }

    return true;
};

const buildRequestContext = (req) => ({
    body: req.body,
    query: req.query,
    params: req.params
});

const activityLogger = (req, res, next) => {
    const startTime = Date.now();

    // After-advice: ghi khi request đã hoàn tất
    res.on('finish', () => {
        if (!shouldLogByPointcut(req)) {
            return;
        }

        if (!req.user?.id) {
            return;
        }

        const endpoint = req.originalUrl?.split('?')[0] || req.path;
        const payload = {
            user_id: req.user.id,
            action: resolveAuditAction(req),
            method: req.method,
            endpoint,
            status_code: res.statusCode,
            ip_address: req.ip,
            user_agent: req.get('user-agent') || null,
            request_payload: toSafePayload(buildRequestContext(req)),
            response_time_ms: Date.now() - startTime
        };

        auditLogService.createLog(payload).catch((error) => {
            console.error('Không thể ghi audit log:', error.message);
        });
    });

    next();
};

module.exports = activityLogger;
