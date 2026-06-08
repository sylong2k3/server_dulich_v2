const { query } = require('../../configs/database');

class CapacityRepository {
  static _currentCapacityBaseSql() {
    return `
      SELECT
        ts.id AS spot_id,
        ts.name_vi,
        cl.visitor_count,
        CASE
          WHEN ts.max_capacity IS NOT NULL AND ts.max_capacity > 0 AND cl.visitor_count IS NOT NULL
            THEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2)::numeric(5,2)
          ELSE cl.capacity_pct
        END AS capacity_pct,
        CASE
          WHEN ts.max_capacity IS NOT NULL AND ts.max_capacity > 0 AND cl.visitor_count IS NOT NULL THEN
            CASE
              WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 100 THEN 'overloaded'
              WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 85 THEN 'near_full'
              WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 60 THEN 'busy'
              ELSE 'normal'
            END
          ELSE cl.status
        END::varchar(20) AS status,
        cl.recorded_at,
        ts.max_capacity,
        ts.alert_threshold_pct,
        ST_AsGeoJSON(ts.geom)::jsonb AS geojson
      FROM tourism_spots ts
      LEFT JOIN LATERAL (
        SELECT visitor_count, capacity_pct, status, recorded_at
        FROM capacity_logs cl
        WHERE cl.spot_id = ts.id
        ORDER BY cl.recorded_at DESC
        LIMIT 1
      ) cl ON TRUE
    `;
  }

  /**
   * Tải trọng hiện tại tất cả spots với bộ lọc, phân trang, và phân quyền
   */
  static async getCurrentAll(options = {}) {
    const {
      page,
      limit,
      sortBy = 'capacity_pct',
      sortOrder = 'DESC',
      search,
      status, // capacity status: normal, busy, near_full, overloaded
      province_code,
      created_by,
      owner_id,
      spot_status, // spots status: active, draft, etc.
    } = options;

    const values = [];
    let paramIdx = 1;
    let whereClauses = [];

    if (search) {
      whereClauses.push(`ts.name_vi ILIKE $${paramIdx++}`);
      values.push(`%${search}%`);
    }

    if (province_code) {
      whereClauses.push(`ts.province_code = $${paramIdx++}`);
      values.push(province_code);
    }

    if (created_by) {
      whereClauses.push(`ts.created_by = $${paramIdx++}`);
      values.push(created_by);
    }

    if (owner_id) {
      whereClauses.push(`(
        ts.created_by = $${paramIdx}
        OR EXISTS (
          SELECT 1
          FROM services s
          INNER JOIN businesses b ON b.id = s.business_id
          WHERE s.spot_id = ts.id
            AND s.is_active = TRUE
            AND b.owner_id = $${paramIdx}
            AND b.status = 'approved'
        )
      )`);
      values.push(owner_id);
      paramIdx++;
    }

    if (spot_status) {
      whereClauses.push(`ts.status = $${paramIdx++}`);
      values.push(spot_status);
    }

    const effectiveCapacityPct = `
      CASE
        WHEN ts.max_capacity IS NOT NULL AND ts.max_capacity > 0 AND cl.visitor_count IS NOT NULL
          THEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2)::numeric(5,2)
        ELSE cl.capacity_pct
      END
    `;
    const effectiveCapacityStatus = `
      CASE
        WHEN ts.max_capacity IS NOT NULL AND ts.max_capacity > 0 AND cl.visitor_count IS NOT NULL THEN
          CASE
            WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 100 THEN 'overloaded'
            WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 85 THEN 'near_full'
            WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 60 THEN 'busy'
            ELSE 'normal'
          END
        ELSE cl.status
      END::varchar(20)
    `;

    // Capacity status filter uses the effective status against current max_capacity.
    if (status) {
      whereClauses.push(`${effectiveCapacityStatus} = $${paramIdx++}`);
      values.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Validate and build sorting
    const allowedSortFields = {
      capacity_pct: effectiveCapacityPct,
      visitor_count: 'cl.visitor_count',
      max_capacity: 'ts.max_capacity',
      name_vi: 'ts.name_vi',
      recorded_at: 'cl.recorded_at',
    };
    const sortField = allowedSortFields[sortBy] || 'cl.capacity_pct';
    const order = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let paginationSql = '';
    if (page && limit) {
      const offset = (page - 1) * limit;
      paginationSql = `LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      values.push(limit, offset);
    }

    const sql = `
      SELECT
        ts.id AS spot_id,
        ts.name_vi,
        cl.visitor_count,
        ${effectiveCapacityPct} AS capacity_pct,
        ${effectiveCapacityStatus} AS status,
        cl.recorded_at,
        ts.max_capacity,
        ts.alert_threshold_pct,
        ST_AsGeoJSON(ts.geom)::jsonb AS geojson,
        COUNT(*) OVER() AS total_count
      FROM tourism_spots ts
      LEFT JOIN LATERAL (
        SELECT visitor_count, capacity_pct, status, recorded_at
        FROM capacity_logs cl
        WHERE cl.spot_id = ts.id
        ORDER BY cl.recorded_at DESC
        LIMIT 1
      ) cl ON TRUE
      ${whereSql}
      ORDER BY ${sortField} ${order} NULLS LAST, ts.name_vi ASC
      ${paginationSql}
    `;

    const { rows } = await query(sql, values);
    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
    
    // Clean up total_count from each row before returning
    const logs = rows.map(({ total_count, ...r }) => r);
    return { logs, totalCount };
  }

  /**
   * GeoJSON tải trọng cho map layer
   */
  static async getCurrentGeoJSON() {
    const sql = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', vc.geojson,
            'properties', json_build_object(
              'spot_id', vc.spot_id,
              'name_vi', vc.name_vi,
              'visitor_count', vc.visitor_count,
              'capacity_pct', vc.capacity_pct,
              'status', vc.status,
              'max_capacity', vc.max_capacity,
              'alert_threshold_pct', vc.alert_threshold_pct,
              'recorded_at', vc.recorded_at
            )
          )
        ), '[]'::json)
      ) AS geojson
      FROM (
        ${this._currentCapacityBaseSql()}
      ) vc
    `;
    const { rows } = await query(sql);
    return rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
  }

  static async getCurrentBySpot(spotId) {
    const sql = `
      ${this._currentCapacityBaseSql()}
      WHERE ts.id = $1
    `;
    const { rows } = await query(sql, [spotId]);
    return rows[0] || null;
  }

  static async getSpotAccessInfo(spotId) {
    const sql = `
      SELECT id, province_code, created_by, status
      FROM tourism_spots
      WHERE id = $1
        AND status != 'deleted'
      LIMIT 1
    `;
    const { rows } = await query(sql, [spotId]);
    return rows[0] || null;
  }

  static async userOwnsSpotThroughBusiness(userId, spotId) {
    if (!userId || !spotId) return false;

    const sql = `
      SELECT 1
      FROM services s
      INNER JOIN businesses b ON b.id = s.business_id
      WHERE s.spot_id = $1
        AND s.is_active = TRUE
        AND b.owner_id = $2
        AND b.status = 'approved'
      LIMIT 1
    `;
    const { rows } = await query(sql, [spotId, userId]);
    return rows.length > 0;
  }

  static async getCurrentByTour(tourId) {
    const sql = `
      SELECT
        tp.id AS tour_id,
        tp.name_vi AS tour_name_vi,
        tp.name_en AS tour_name_en,
        tp.slug AS tour_slug,
        tp.status AS tour_status,
        tp.duration_days,
        tp.max_guests,
        tp.province_code,
        tps.id AS stop_id,
        tps.day_number,
        tps.stop_order,
        tps.spot_id,
        tps.business_id,
        tps.title_vi,
        tps.description_vi,
        tps.planned_duration_min,
        ts.name_vi AS spot_name_vi,
        ts.name_en AS spot_name_en,
        ts.max_capacity,
        vc.visitor_count,
        vc.capacity_pct,
        vc.status AS capacity_status,
        vc.recorded_at,
        ST_AsGeoJSON(COALESCE(ts.geom, bs.geom))::jsonb AS geojson
      FROM tour_packages tp
      LEFT JOIN tour_package_stops tps ON tps.tour_package_id = tp.id
      LEFT JOIN tourism_spots ts ON ts.id = tps.spot_id
      LEFT JOIN businesses bs ON bs.id = tps.business_id
      LEFT JOIN v_current_capacity vc ON vc.spot_id = tps.spot_id
      WHERE tp.id = $1
        AND tp.status = 'published'
      ORDER BY tps.day_number ASC NULLS LAST, tps.stop_order ASC NULLS LAST
    `;

    const { rows } = await query(sql, [tourId]);
    if (!rows.length) return null;

    const first = rows[0];
    return {
      tour_id: first.tour_id,
      tour_name_vi: first.tour_name_vi,
      tour_name_en: first.tour_name_en,
      tour_slug: first.tour_slug,
      tour_status: first.tour_status,
      duration_days: first.duration_days,
      max_guests: first.max_guests,
      province_code: first.province_code,
      stops: rows
        .filter((row) => row.stop_id)
        .map((row) => ({
          stop_id: row.stop_id,
          day_number: row.day_number,
          stop_order: row.stop_order,
          spot_id: row.spot_id,
          business_id: row.business_id,
          title_vi: row.title_vi,
          description_vi: row.description_vi,
          planned_duration_min: row.planned_duration_min,
          spot_name_vi: row.spot_name_vi,
          spot_name_en: row.spot_name_en,
          max_capacity: row.max_capacity,
          visitor_count: row.visitor_count,
          capacity_pct: row.capacity_pct,
          capacity_status: row.capacity_status,
          recorded_at: row.recorded_at,
          geojson: row.geojson,
        })),
    };
  }

  /**
   * Lịch sử tải trọng
   */
  static async getHistory(spotId, options = {}) {
    const { from, to, page = 1, limit = 100 } = options;
    const values = [spotId];
    let paramCount = 2;
    let whereClause = 'WHERE spot_id = $1';

    if (from) {
      whereClause += ` AND recorded_at >= $${paramCount}`;
      values.push(from);
      paramCount++;
    }
    if (to) {
      whereClause += ` AND recorded_at <= $${paramCount}`;
      values.push(to);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    const sql = `
      SELECT id, spot_id, recorded_at, visitor_count, capacity_pct,
        status, data_source, COUNT(*) OVER() AS total_count
      FROM capacity_logs
      ${whereClause}
      ORDER BY recorded_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(limit, offset);

    const { rows } = await query(sql, values);
    const totalCount = rows.length ? Number(rows[0].total_count) : 0;
    return {
      logs: rows.map(({ total_count, ...r }) => r),
      totalCount,
    };
  }

  /**
   * Thống kê tải theo ngày
   */
  static async getStats(spotId, options = {}) {
    const { from, to, group_by = 'day' } = options;
    const values = [spotId];
    let paramCount = 2;
    let whereClause = 'WHERE spot_id = $1';

    if (from) {
      whereClause += ` AND recorded_at >= $${paramCount}`;
      values.push(from);
      paramCount++;
    }
    if (to) {
      whereClause += ` AND recorded_at <= $${paramCount}`;
      values.push(to);
      paramCount++;
    }

    const truncField = group_by === 'month' ? 'month' : group_by === 'week' ? 'week' : 'day';

    const sql = `
      SELECT
        date_trunc('${truncField}', recorded_at) AS period,
        AVG(visitor_count)::integer AS avg_visitors,
        MAX(visitor_count) AS max_visitors,
        AVG(capacity_pct)::numeric(5,2) AS avg_capacity_pct,
        MAX(capacity_pct) AS max_capacity_pct,
        COUNT(*) AS record_count
      FROM capacity_logs
      ${whereClause}
      GROUP BY period
      ORDER BY period DESC
    `;
    const { rows } = await query(sql, values);
    return rows;
  }

  /**
   * Ghi nhận tải trọng (trigger tự tính capacity_pct & status)
   */
  static async logCapacity(data) {
    const sql = `
      INSERT INTO capacity_logs (spot_id, visitor_count, data_source, recorded_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.spot_id, data.visitor_count, data.data_source || 'manual', data.recorded_by,
    ]);
    return rows[0];
  }

  /**
   * NV-20: Gợi ý điểm du lịch thay thế cùng loại, gần đó, còn chỗ trống
   */
  static async getSuggestedAlternatives(spotId, options = {}) {
    const { radius_km = 10, limit = 5, max_capacity_pct = 80 } = options;

    // Lấy category_id + geom của spot hiện tại
    const spotSql = `
      SELECT category_id, geom
      FROM tourism_spots
      WHERE id = $1 AND status = 'active'
    `;
    const { rows: spotRows } = await query(spotSql, [spotId]);
    if (!spotRows[0]) return [];

    const { category_id, geom } = spotRows[0];

    // Query điểm cùng loại, trong bán kính, còn sức chứa tốt
    const altSql = `
      SELECT
        ts.id,
        ts.name_vi,
        ts.address_vi,
        ts.max_capacity,
        ts.rating_avg,
        ts.ticket_price_adult,
        ROUND((ST_Distance(ts.geom::geography, $1::geography) / 1000)::numeric, 2) AS distance_km,
        vc.visitor_count,
        vc.capacity_pct,
        vc.status AS capacity_status,
        ST_AsGeoJSON(ts.geom)::json AS geojson
      FROM tourism_spots ts
      LEFT JOIN v_current_capacity vc ON vc.spot_id = ts.id
      WHERE ts.id != $2
        AND ts.status = 'active'
        AND ($3::integer IS NULL OR ts.category_id = $3)
        AND ST_DWithin(ts.geom::geography, $1::geography, $4 * 1000)
        AND (vc.capacity_pct IS NULL OR vc.capacity_pct < $5)
      ORDER BY distance_km ASC
      LIMIT $6
    `;

    const { rows } = await query(altSql, [
      geom,
      spotId,
      category_id || null,
      radius_km,
      max_capacity_pct,
      limit,
    ]);

    return rows;
  }

  /**
   * Lấy cấu hình cảnh báo
   */
  static async getAlertConfigs(options = {}) {
    const values = [];
    const conditions = ['c.is_active = TRUE'];
    let paramIdx = 1;

    if (options.spot_id) {
      conditions.push(`c.spot_id = $${paramIdx++}`);
      values.push(options.spot_id);
    }

    if (options.province_code) {
      conditions.push(`(c.province_code = $${paramIdx} OR ts.province_code = $${paramIdx})`);
      values.push(options.province_code);
      paramIdx++;
    }

    if (options.owner_id) {
      conditions.push(`
        c.spot_id IS NOT NULL
        AND (
          ts.created_by = $${paramIdx}
          OR EXISTS (
            SELECT 1
            FROM services s
            INNER JOIN businesses b ON b.id = s.business_id
            WHERE s.spot_id = c.spot_id
              AND s.is_active = TRUE
              AND b.owner_id = $${paramIdx}
              AND b.status = 'approved'
          )
        )
      `);
      values.push(options.owner_id);
      paramIdx++;
    }

    if (options.spot_status) {
      conditions.push(`(c.spot_id IS NULL OR ts.status = $${paramIdx++})`);
      values.push(options.spot_status);
    }

    const sql = `
      SELECT c.*
      FROM capacity_alert_configs c
      LEFT JOIN tourism_spots ts ON ts.id = c.spot_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.updated_at DESC, c.id DESC
    `;

    const { rows } = await query(sql, values);
    return rows;
  }

  /**
   * Tạo/cập nhật cấu hình cảnh báo
   */
  static async upsertAlertConfig(data) {
    let existingConfig = null;
    if (data.spot_id) {
      const { rows } = await query(
        'SELECT id FROM capacity_alert_configs WHERE spot_id = $1 LIMIT 1',
        [data.spot_id]
      );
      if (rows.length > 0) {
        existingConfig = rows[0];
      }
    } else if (data.province_code) {
      const { rows } = await query(
        'SELECT id FROM capacity_alert_configs WHERE province_code = $1 AND spot_id IS NULL LIMIT 1',
        [data.province_code]
      );
      if (rows.length > 0) {
        existingConfig = rows[0];
      }
    }

    if (existingConfig) {
      const sql = `
        UPDATE capacity_alert_configs
        SET
          threshold_busy = $1,
          threshold_near = $2,
          threshold_over = $3,
          notify_roles = $4,
          is_active = $5,
          updated_by = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;
      const { rows } = await query(sql, [
        data.threshold_busy ?? 70,
        data.threshold_near ?? 85,
        data.threshold_over ?? 100,
        data.notify_roles || null,
        data.is_active ?? true,
        data.updated_by,
        existingConfig.id,
      ]);
      return rows[0];
    } else {
      const sql = `
        INSERT INTO capacity_alert_configs (spot_id, province_code, threshold_busy, threshold_near, threshold_over, notify_roles, updated_by, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const { rows } = await query(sql, [
        data.spot_id || null,
        data.province_code || null,
        data.threshold_busy ?? 70,
        data.threshold_near ?? 85,
        data.threshold_over ?? 100,
        data.notify_roles || null,
        data.updated_by,
        data.is_active ?? true,
      ]);
      return rows[0];
    }
  }
}

module.exports = CapacityRepository;
