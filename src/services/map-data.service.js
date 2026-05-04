/**
 * Map Data Service — Xử lý logic truy cập data từ map layer APIs
 */

const { query } = require('../configs/database');
const { Api404Error } = require('../core/error.response');

class MapDataService {
  /**
   * Lấy data từ map layer API theo ID.
   * Trả dữ liệu GeoJSON nếu layer có geometry, hoặc JSON thông thường.
   */
  static async getMapLayerApiData(apiId, queryParams = {}) {
    // 1. Lấy thông tin API
    const apiSql = `
      SELECT mla.*, ml.source_url, ml.layer_type, ml.style_json,
             mc.name_vi AS category_name
      FROM map_layer_apis mla
      LEFT JOIN map_layers ml ON ml.id = mla.map_layer_id
      LEFT JOIN map_categories mc ON mc.id = mla.category_id
      WHERE mla.id = $1 AND mla.status = 'published'
    `;

    const { rows: apiRows } = await query(apiSql, [apiId]);
    if (!apiRows.length) {
      throw new Api404Error('API lớp bản đồ không tồn tại hoặc chưa được publish');
    }

    const api = apiRows[0];

    // 2. Lấy dữ liệu tùy theo endpoint_url pattern
    // Nếu endpoint_url là internal path → query trực tiếp từ DB
    // Nếu endpoint_url là external URL → trả metadata
    if (api.endpoint_url && api.endpoint_url.startsWith('/')) {
      return this._resolveInternalEndpoint(api, queryParams);
    }

    // External endpoint — trả metadata để client tự gọi
    return {
      api: {
        id: api.id,
        name: api.name,
        slug: api.slug,
        http_method: api.http_method,
        endpoint_url: api.endpoint_url,
        description: api.description,
      },
      layer: api.map_layer_id
        ? {
            source_url: api.source_url,
            layer_type: api.layer_type,
            style_json: api.style_json,
          }
        : null,
      category_name: api.category_name,
    };
  }

  /**
   * Resolve internal endpoint paths to actual data queries.
   * Mapping các slug phổ biến → SQL queries.
   */
  static async _resolveInternalEndpoint(api, queryParams) {
    const { page = 1, limit = 50 } = queryParams;
    const offset = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
    const safeLimit = Math.min(100, Math.max(1, Number(limit)));

    // Dựa trên slug để biết cần query bảng nào
    const dataResolvers = {
      // Điểm du lịch GeoJSON
      'tourism-spots': async () => {
        const sql = `
          SELECT ts.id, ts.name_vi, ts.name_en, ts.address_vi,
                 ts.province_code, ts.ward_code,
                 sc.name_vi AS category_name,
                 ts.status, ts.rating_avg, ts.rating_count,
                 ST_AsGeoJSON(ts.geom)::json AS geometry,
                 COUNT(*) OVER() AS total_count
          FROM tourism_spots ts
          LEFT JOIN spot_categories sc ON sc.id = ts.category_id
          WHERE ts.status = 'active' AND ts.geom IS NOT NULL
          ORDER BY ts.name_vi
          LIMIT $1 OFFSET $2
        `;
        const { rows } = await query(sql, [safeLimit, offset]);
        return this._formatGeoJsonResponse(rows, 'tourism_spots');
      },

      // Doanh nghiệp
      'businesses': async () => {
        const sql = `
          SELECT b.id, b.business_name, b.business_type,
                 b.address_vi, b.phone, b.email,
                 b.province_code, b.ward_code,
                 b.status,
                 ST_AsGeoJSON(b.geom)::json AS geometry,
                 COUNT(*) OVER() AS total_count
          FROM businesses b
          WHERE b.status = 'approved' AND b.geom IS NOT NULL
          ORDER BY b.business_name
          LIMIT $1 OFFSET $2
        `;
        const { rows } = await query(sql, [safeLimit, offset]);
        return this._formatGeoJsonResponse(rows, 'businesses');
      },

      // Năng lực tải
      'capacity': async () => {
        const sql = `
          SELECT vc.spot_id, vc.name_vi,
                 vc.visitor_count, vc.max_capacity,
                 vc.capacity_pct, vc.status,
                 vc.recorded_at,
                 ST_AsGeoJSON(ts.geom)::json AS geometry,
                 COUNT(*) OVER() AS total_count
          FROM v_current_capacity vc
          INNER JOIN tourism_spots ts ON ts.id = vc.spot_id
          WHERE ts.geom IS NOT NULL
          ORDER BY vc.capacity_pct DESC NULLS LAST
          LIMIT $1 OFFSET $2
        `;
        const { rows } = await query(sql, [safeLimit, offset]);
        return this._formatGeoJsonResponse(rows, 'capacity');
      },
    };

    // Tìm resolver theo slug
    const resolver = dataResolvers[api.slug];
    if (resolver) {
      return resolver();
    }

    // Fallback — trả metadata API
    return {
      api: {
        id: api.id,
        name: api.name,
        slug: api.slug,
        endpoint_url: api.endpoint_url,
        description: api.description,
      },
      message: 'Endpoint nội bộ chưa được cấu hình resolver. Liên hệ quản trị viên.',
    };
  }

  /**
   * Format kết quả thành GeoJSON FeatureCollection
   */
  static _formatGeoJsonResponse(rows, layerName) {
    const total = rows.length ? Number(rows[0].total_count) : 0;

    const features = rows.map(({ total_count, geometry, ...props }) => ({
      type: 'Feature',
      geometry: geometry || null,
      properties: props,
    }));

    return {
      type: 'FeatureCollection',
      name: layerName,
      totalFeatures: total,
      features,
    };
  }

  /**
   * Lấy danh sách layers mà API key có quyền truy cập
   */
  static async getAccessibleLayers(apiKeyId) {
    const sql = `
      SELECT DISTINCT
        ml.id, ml.code, ml.name_vi, ml.name_en,
        ml.layer_type, ml.source_url, ml.style_json,
        ml.min_zoom, ml.max_zoom, ml.is_default_visible,
        ml.sort_order, ml.status,
        mc.name_vi AS category_name
      FROM api_key_map_layer_apis akm
      INNER JOIN map_layer_apis mla ON mla.id = akm.map_layer_api_id
      INNER JOIN map_layers ml ON ml.id = mla.map_layer_id
      LEFT JOIN map_categories mc ON mc.id = ml.category_id
      WHERE akm.api_key_id = $1
        AND mla.status = 'published'
        AND ml.status = 'active'
      ORDER BY mc.sort_order NULLS LAST, ml.sort_order
    `;

    const { rows } = await query(sql, [apiKeyId]);
    return rows;
  }
}

module.exports = MapDataService;
