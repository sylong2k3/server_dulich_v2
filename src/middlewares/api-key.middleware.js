
const crypto = require('crypto');
const { query } = require('../configs/database');
const { Api401Error, Api403Error } = require('../core/error.response');
const asyncHandler = require('../helpers/async-handler');

class ApiKeyMiddleware {
  static authenticateApiKey = asyncHandler(async (req, res, next) => {
    const rawKey = req.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
      throw new Api401Error('API key là bắt buộc. Gửi qua header X-API-Key.', ['API_KEY_REQUIRED']);
    }
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const findSql = `
      SELECT
        id, name, status, expires_at, issued_to_user_id, revoked_at,
        CASE
          WHEN status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW() THEN 'expired'
          ELSE status
        END AS effective_status
      FROM api_keys
      WHERE key_hash = $1
      LIMIT 1
    `;

    const { rows } = await query(findSql, [keyHash]);

    if (!rows.length) {
      throw new Api401Error('API key không hợp lệ', ['API_KEY_INVALID']);
    }

    const apiKey = rows[0];

    if (apiKey.effective_status === 'revoked') {
      throw new Api403Error('API key đã bị thu hồi', ['API_KEY_REVOKED']);
    }

    if (apiKey.effective_status === 'expired') {
      throw new Api403Error('API key đã hết hạn', ['API_KEY_EXPIRED']);
    }

    if (apiKey.effective_status !== 'active') {
      throw new Api403Error(`API key ở trạng thái không hợp lệ: ${apiKey.effective_status}`, ['API_KEY_INACTIVE']);
    }

    // Gắn vào request
    req.apiKey = {
      id: apiKey.id,
      name: apiKey.name,
      issued_to_user_id: apiKey.issued_to_user_id,
    };

    next();
  });

  /**
   * Kiểm tra API key có quyền truy cập map_layer_api_id cụ thể.
   * Phải chạy sau `authenticateApiKey`.
   *
   * @param {Function} getApiIdFn - Hàm trích xuất map_layer_api_id từ req (vd: req => req.params.apiId)
   */
  static requireApiAccess(getApiIdFn) {
    return asyncHandler(async (req, res, next) => {
      if (!req.apiKey) {
        throw new Api401Error('API key chưa được xác thực', ['API_KEY_NOT_AUTHENTICATED']);
      }

      const mapLayerApiId = getApiIdFn(req);
      if (!mapLayerApiId) {
        throw new Api401Error('Thiếu map_layer_api_id', ['MAP_API_ID_REQUIRED']);
      }

      // Kiểm tra mapping api_key ↔ map_layer_api
      const checkSql = `
        SELECT 1
        FROM api_key_map_layer_apis
        WHERE api_key_id = $1 AND map_layer_api_id = $2
        LIMIT 1
      `;

      const { rows } = await query(checkSql, [req.apiKey.id, mapLayerApiId]);

      if (!rows.length) {
        throw new Api403Error('API key không có quyền truy cập API này', ['API_ACCESS_DENIED']);
      }

      next();
    });
  }

  /**
   * Log usage vào bảng api_key_usage_logs.
   * Chạy SAU khi response đã gửi (non-blocking).
   *
   * @param {Function} getApiIdFn - Hàm trích xuất map_layer_api_id từ req
   */
  static logUsage(getApiIdFn) {
    return (req, res, next) => {
      // Ghi log sau khi response hoàn tất (non-blocking)
      res.on('finish', () => {
        if (!req.apiKey) return;

        const mapLayerApiId = getApiIdFn ? getApiIdFn(req) : null;

        const logSql = `
          INSERT INTO api_key_usage_logs (
            api_key_id, map_layer_api_id, request_path,
            http_method, status_code, response_time_ms, request_ip
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        // Tính response time
        const responseTime = req._startTime
          ? Date.now() - req._startTime
          : null;

        const params = [
          req.apiKey.id,
          mapLayerApiId || null,
          req.originalUrl,
          req.method,
          res.statusCode,
          responseTime,
          req.ip || req.connection?.remoteAddress || null,
        ];

        // Fire-and-forget — không block response
        query(logSql, params).catch((err) => {
          console.error('[ApiKeyMiddleware] Failed to log usage:', err.message);
        });
      });

      // Ghi thời điểm bắt đầu
      req._startTime = Date.now();
      next();
    };
  }

  /**
   * Lấy danh sách map_layer_api_ids mà API key có quyền truy cập.
   */
  static async getAccessibleApis(apiKeyId) {
    const sql = `
      SELECT mla.id, mla.name, mla.slug, mla.endpoint_url, mla.http_method,
             ml.name_vi AS layer_name, mc.name_vi AS category_name
      FROM api_key_map_layer_apis akm
      INNER JOIN map_layer_apis mla ON mla.id = akm.map_layer_api_id
      LEFT JOIN map_layers ml ON ml.id = mla.map_layer_id
      LEFT JOIN map_categories mc ON mc.id = mla.category_id
      WHERE akm.api_key_id = $1
        AND mla.status = 'published'
      ORDER BY mc.sort_order, mla.name
    `;

    const { rows } = await query(sql, [apiKeyId]);
    return rows;
  }
}

module.exports = ApiKeyMiddleware;
