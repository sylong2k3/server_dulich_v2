const { query, getClient } = require('../../configs/database');
const BusinessActivityReport = require('../business-activity-report.model');
const GeneratedReport = require('../generated-report.model');
const Permission = require('../permission.model');
const RolePermission = require('../role-permission.model');

class GovernanceRepository {
    /**
     * CRIT-01 FIX: Rewritten from 4 correlated subqueries → 4 CTEs with LEFT JOINs
     *
     * BEFORE: Each province row triggers 4 separate COUNT/SUM scans = O(4 × N provinces)
     * AFTER:  4 CTEs pre-aggregate once, then JOIN = O(4) total scans regardless of province count
     *
     * Estimated improvement: 70-90% faster for provinces table with many rows
     */
    static async getProvinceOperationalReport({ fromDate, toDate }) {
        const sql = `
      WITH spot_counts AS (
        SELECT province_code, COUNT(*) AS spot_count
        FROM tourism_spots
        WHERE status = 'active'
        GROUP BY province_code
      ),
      approved_biz AS (
        SELECT province_code, COUNT(*) AS service_unit_count
        FROM businesses
        WHERE status = 'approved'
        GROUP BY province_code
      ),
      new_biz AS (
        SELECT province_code, COUNT(*) AS new_business_count
        FROM businesses
        WHERE created_at BETWEEN $1::timestamp AND $2::timestamp
        GROUP BY province_code
      ),
      revenue AS (
        SELECT b.province_code, SUM(bar.total_revenue_vnd) AS reported_revenue_vnd
        FROM business_activity_reports bar
        INNER JOIN businesses b ON b.id = bar.business_id
        WHERE bar.period_from <= $2::date
          AND bar.period_to >= $1::date
          AND bar.status IN ('submitted', 'reviewed', 'approved')
        GROUP BY b.province_code
      )
      SELECT
        p.code AS province_code,
        p.name AS province_name,
        COALESCE(sc.spot_count, 0) AS spot_count,
        COALESCE(ab.service_unit_count, 0) AS service_unit_count,
        COALESCE(nb.new_business_count, 0) AS new_business_count,
        COALESCE(rv.reported_revenue_vnd, 0) AS reported_revenue_vnd
      FROM vn_units.provinces p
      LEFT JOIN spot_counts sc ON sc.province_code = p.code
      LEFT JOIN approved_biz ab ON ab.province_code = p.code
      LEFT JOIN new_biz nb ON nb.province_code = p.code
      LEFT JOIN revenue rv ON rv.province_code = p.code
      ORDER BY reported_revenue_vnd DESC, spot_count DESC, service_unit_count DESC
    `;

        const { rows } = await query(sql, [fromDate, toDate]);
        return rows;
    }

    static async getCapacityAlerts({ provinceId = null, statuses = ['near_full', 'overloaded'], limit = 50 }) {
        const sql = `
      SELECT
        vc.spot_id,
        vc.name_vi,
        vc.visitor_count,
        vc.capacity_pct,
        vc.status,
        vc.recorded_at,
        vc.max_capacity,
        ts.province_code,
        p.name AS province_name
      FROM v_current_capacity vc
      INNER JOIN tourism_spots ts ON ts.id = vc.spot_id
      LEFT JOIN vn_units.provinces p ON p.code = ts.province_code
      WHERE ($1::text IS NULL OR ts.province_code = $1)
        AND vc.status = ANY($2::text[])
      ORDER BY vc.capacity_pct DESC NULLS LAST
      LIMIT $3
    `;

        const { rows } = await query(sql, [provinceId, statuses, limit]);
        return rows;
    }

    /**
     * MED-03 NOTE: conservation_areas and satellite_analysis tables may not exist yet.
     * Wrapped in try-catch to prevent crashing the governance dashboard.
     */
    static async getConservationMonitoring({ provinceId = null, days = 30 }) {
        try {
            const tableCheck = await query(`
      SELECT
        to_regclass('public.conservation_areas') AS conservation_areas,
        to_regclass('public.satellite_analysis') AS satellite_analysis
    `);

            if (!tableCheck.rows[0]?.conservation_areas || !tableCheck.rows[0]?.satellite_analysis) {
                return [];
            }

            const sql = `
      SELECT
        ca.id AS conservation_id,
        ca.name_vi AS conservation_name,
        p.name AS province_name,
        COUNT(sa.id) FILTER (WHERE sa.change_detected = TRUE) AS detected_changes,
        COALESCE(SUM(sa.change_area_ha) FILTER (WHERE sa.change_detected = TRUE), 0) AS total_change_area_ha,
        MAX(sa.analyzed_at) AS latest_analyzed_at
      FROM conservation_areas ca
      LEFT JOIN vn_units.provinces p ON p.code = ca.province_code
      LEFT JOIN satellite_analysis sa
        ON sa.conservation_id = ca.id
       AND sa.analyzed_at >= NOW() - ($1::text || ' days')::interval
      WHERE ($2::text IS NULL OR ca.province_code = $2)
      GROUP BY ca.id, ca.name_vi, p.name
      ORDER BY detected_changes DESC, latest_analyzed_at DESC NULLS LAST
    `;

            const { rows } = await query(sql, [String(days), provinceId]);
            return rows;
        } catch (err) {
            // Tables not yet created — return empty gracefully
            console.warn('[GovernanceRepository] getConservationMonitoring skipped:', err.message);
            return [];
        }
    }

    static async getBusinessRegistrations({ status, provinceId, page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        const sql = `
      SELECT
        b.*,
        p.name AS province_name,
        w.name AS ward_name,
        u.full_name AS owner_name,
        COUNT(*) OVER() AS total_count
      FROM businesses b
      LEFT JOIN vn_units.provinces p ON p.code = b.province_code
      LEFT JOIN vn_units.wards w ON w.code = b.ward_code
      LEFT JOIN users u ON u.id = b.owner_id
      WHERE ($1::text IS NULL OR b.status = $1)
        AND ($2::text IS NULL OR b.province_code = $2)
      ORDER BY b.created_at DESC
      LIMIT $3 OFFSET $4
    `;

        const { rows } = await query(sql, [status || null, provinceId || null, limit, offset]);
        const total = rows.length ? Number(rows[0].total_count) : 0;
        return {
            rows: rows.map(({ total_count, ...item }) => item),
            total,
        };
    }

    static async updateBusinessRegistration(id, { status, rejection_note, approved_by }) {
        const sql = `
      UPDATE businesses
      SET
        status = $1::text,
        approved_by = CASE WHEN $1::text = 'approved' THEN $2 ELSE approved_by END,
        approved_at = CASE WHEN $1::text = 'approved' THEN NOW() ELSE approved_at END,
        rejection_note = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

        const { rows } = await query(sql, [status, approved_by || null, rejection_note || null, id]);
        return rows[0] || null;
    }

    static async getSpotRegistrations({ status, provinceId, page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        const sql = `
      SELECT
        ts.*,
        p.name AS province_name,
        w.name AS ward_name,
        sc.name_vi AS category_name,
        u.full_name AS created_by_name,
        COUNT(*) OVER() AS total_count
      FROM tourism_spots ts
      LEFT JOIN vn_units.provinces p ON p.code = ts.province_code
      LEFT JOIN vn_units.wards w ON w.code = ts.ward_code
      LEFT JOIN spot_categories sc ON sc.id = ts.category_id
      LEFT JOIN users u ON u.id = ts.created_by
      WHERE ($1::text IS NULL OR ts.status = $1)
        AND ($2::text IS NULL OR ts.province_code = $2)
      ORDER BY ts.created_at DESC
      LIMIT $3 OFFSET $4
    `;

        const { rows } = await query(sql, [status || null, provinceId || null, limit, offset]);
        const total = rows.length ? Number(rows[0].total_count) : 0;
        return {
            rows: rows.map(({ total_count, ...item }) => item),
            total,
        };
    }

    static async updateSpotRegistration(id, { status }) {
        const sql = `
      UPDATE tourism_spots
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

        const { rows } = await query(sql, [status, id]);
        return rows[0] || null;
    }

    static async getDepartmentFeedbacks({
        page = 1,
        limit = 10,
        search,
        status,
        moderation_status,
        priority,
        sortBy = 'created_at',
        sortOrder = 'DESC',
    }) {
        const allowedSortFields = ['created_at', 'updated_at', 'priority', 'status'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const offset = (page - 1) * limit;
        const values = [];
        let p = 1;
        const conditions = ['1=1'];

        if (search) {
            conditions.push(`(f.title ILIKE $${p} OR f.content ILIKE $${p} OR COALESCE(f.location_text, '') ILIKE $${p})`);
            values.push(`%${search}%`);
            p++;
        }

        if (status) {
            conditions.push(`f.status = $${p}`);
            values.push(status);
            p++;
        }

        if (moderation_status) {
            conditions.push(`f.moderation_status = $${p}`);
            values.push(moderation_status);
            p++;
        }

        if (priority) {
            conditions.push(`f.priority = $${p}`);
            values.push(priority);
            p++;
        }

        const sql = `
      SELECT
        f.*,
        u.full_name AS user_name,
        u.avatar_url AS user_avatar,
        COUNT(*) OVER() AS total_count
      FROM citizen_feedbacks f
      LEFT JOIN users u ON u.id = f.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY f.${sortField} ${order}
      LIMIT $${p} OFFSET $${p + 1}
    `;

        values.push(limit, offset);

        const { rows } = await query(sql, values);
        const total = rows.length ? Number(rows[0].total_count) : 0;
        return {
            rows: rows.map(({ total_count, ...item }) => item),
            total,
        };
    }

    static async createDepartmentReport(data) {
        const sql = `
      INSERT INTO generated_reports (
        schedule_id,
        created_by,
        report_type,
        period_from,
        period_to,
        title,
        file_url,
        file_format,
        file_size_kb,
        sent_to_roles
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;

        const values = [
            data.schedule_id || null,
            data.created_by || null,
            data.report_type,
            data.period_from,
            data.period_to,
            data.title,
            data.file_url || null,
            data.file_format || 'pdf',
            data.file_size_kb || null,
            data.sent_to_roles || [],
        ];

        const { rows } = await query(sql, values);
        return rows[0] ? new GeneratedReport(rows[0]) : null;
    }

    static async listDepartmentReports({ page = 1, limit = 10, report_type, created_by }) {
        const offset = (page - 1) * limit;
        const values = [];
        let p = 1;
        const conditions = ['1=1'];

        if (report_type) {
            conditions.push(`gr.report_type = $${p}`);
            values.push(report_type);
            p++;
        }

        if (created_by) {
            conditions.push(`gr.created_by = $${p}`);
            values.push(created_by);
            p++;
        }

        const sql = `
      SELECT
        gr.*,
        u.full_name AS created_by_name,
        COUNT(*) OVER() AS total_count
      FROM generated_reports gr
      LEFT JOIN users u ON u.id = gr.created_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY gr.generated_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `;

        values.push(limit, offset);
        const { rows } = await query(sql, values);

        const total = rows.length ? Number(rows[0].total_count) : 0;
        return {
            rows: rows.map(({ total_count, ...item }) => new GeneratedReport(item)),
            total,
        };
    }

    static async findDepartmentReportById(id) {
        const { rows } = await query('SELECT * FROM generated_reports WHERE id = $1', [id]);
        return rows[0] ? new GeneratedReport(rows[0]) : null;
    }

    static async sendDepartmentReportNotification({ report, targetRoles, title, body, triggeredBy }) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            const roleValues = Array.isArray(targetRoles) ? targetRoles : [];
            let recipientSql = 'SELECT id FROM users WHERE is_active = TRUE';
            const recipientParams = [];

            if (roleValues.length > 0) {
                recipientSql += ' AND role_id = ANY($1::int[])';
                recipientParams.push(roleValues);
            }

            const recipientResult = await client.query(recipientSql, recipientParams);
            const recipientIds = recipientResult.rows.map((r) => r.id);

            if (!recipientIds.length) {
                await client.query('ROLLBACK');
                return { sent_count: 0 };
            }

            const payload = {
                report_id: report.id,
                report_type: report.report_type,
                period_from: report.period_from,
                period_to: report.period_to,
                file_url: report.file_url,
                file_format: report.file_format,
            };

            const insertSql = `
        INSERT INTO notifications (
          user_id,
          target_roles,
          type,
          title_vi,
          body_vi,
          data,
          sent_at,
          delivery_status,
          triggered_by
        )
        SELECT
          unnest($1::uuid[]),
          $2::int[],
          'system_report',
          $3,
          $4,
          $5::jsonb,
          NOW(),
          'sent',
          $6
        RETURNING id
      `;

            const insertValues = [
                recipientIds,
                roleValues,
                title,
                body,
                JSON.stringify(payload),
                triggeredBy || 'system',
            ];

            const inserted = await client.query(insertSql, insertValues);
            await client.query('COMMIT');

            return { sent_count: inserted.rowCount };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async createBusinessActivityReport(data) {
        const sql = `
      INSERT INTO business_activity_reports (
        business_id,
        report_period,
        period_from,
        period_to,
        total_revenue_vnd,
        total_bookings,
        total_visitors,
        avg_capacity_pct,
        notes,
        status,
        submitted_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;

        const values = [
            data.business_id,
            data.report_period,
            data.period_from,
            data.period_to,
            data.total_revenue_vnd || 0,
            data.total_bookings || 0,
            data.total_visitors || 0,
            data.avg_capacity_pct || null,
            data.notes || null,
            data.status || 'submitted',
            data.submitted_by || null,
        ];

        const { rows } = await query(sql, values);
        return rows[0] ? new BusinessActivityReport(rows[0]) : null;
    }

    static async listBusinessActivityReports({ page = 1, limit = 10, business_id, owner_id, report_period, status }) {
        const offset = (page - 1) * limit;
        const values = [];
        let p = 1;
        const conditions = ['1=1'];

        if (business_id) {
            conditions.push(`bar.business_id = $${p}`);
            values.push(business_id);
            p++;
        }

        if (owner_id) {
            conditions.push(`b.owner_id = $${p}`);
            values.push(owner_id);
            p++;
        }

        if (report_period) {
            conditions.push(`bar.report_period = $${p}`);
            values.push(report_period);
            p++;
        }

        if (status) {
            conditions.push(`bar.status = $${p}`);
            values.push(status);
            p++;
        }

        const sql = `
      SELECT
        bar.*,
        b.business_name,
        COUNT(*) OVER() AS total_count
      FROM business_activity_reports bar
      INNER JOIN businesses b ON b.id = bar.business_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY bar.created_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `;

        values.push(limit, offset);
        const { rows } = await query(sql, values);
        const total = rows.length ? Number(rows[0].total_count) : 0;

        return {
            rows: rows.map(({ total_count, ...item }) => new BusinessActivityReport(item)),
            total,
        };
    }

    static async findBusinessById(id) {
        const { rows } = await query('SELECT * FROM businesses WHERE id = $1', [id]);
        return rows[0] || null;
    }

    static async updateBusinessInfo(id, fields = {}) {
        const allowed = [
            'business_name',
            'business_type',
            'description_vi',
            'phone',
            'email',
            'website',
            'address_vi',
            'logo_url',
        ];

        const sets = [];
        const values = [];
        let p = 1;

        for (const field of allowed) {
            if (fields[field] !== undefined) {
                sets.push(`${field} = $${p}`);
                values.push(fields[field]);
                p++;
            }
        }

        if (!sets.length) {
            const { rows } = await query('SELECT * FROM businesses WHERE id = $1', [id]);
            return rows[0] || null;
        }

        sets.push('updated_at = NOW()');
        values.push(id);

        const sql = `
      UPDATE businesses
      SET ${sets.join(', ')}
      WHERE id = $${p}
      RETURNING *
    `;

        const { rows } = await query(sql, values);
        return rows[0] || null;
    }

    static async getBusinessDashboardSummary(businessId, { dateFrom, dateTo }) {
        const summarySql = `
      SELECT
        COALESCE(SUM(total_revenue_vnd), 0) AS total_revenue_vnd,
        COALESCE(SUM(total_bookings), 0) AS total_bookings,
        COALESCE(SUM(total_visitors), 0) AS total_visitors,
        ROUND(COALESCE(AVG(avg_capacity_pct), 0)::numeric, 2) AS avg_capacity_pct,
        COUNT(*) AS report_count
      FROM business_activity_reports
      WHERE business_id = $1
        AND period_from >= $2::date
        AND period_to <= $3::date
    `;

        const trendSql = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', period_from::timestamp), 'YYYY-MM') AS period,
        COALESCE(SUM(total_revenue_vnd), 0) AS revenue_vnd,
        COALESCE(SUM(total_bookings), 0) AS bookings,
        COALESCE(SUM(total_visitors), 0) AS visitors
      FROM business_activity_reports
      WHERE business_id = $1
        AND period_from >= $2::date
        AND period_to <= $3::date
      GROUP BY period
      ORDER BY period ASC
    `;

        const spotCapacitySql = `
      SELECT
        vc.spot_id,
        vc.name_vi,
        vc.capacity_pct,
        vc.status,
        vc.recorded_at
      FROM services s
      INNER JOIN v_current_capacity vc ON vc.spot_id = s.spot_id
      WHERE s.business_id = $1
      ORDER BY vc.capacity_pct DESC NULLS LAST
      LIMIT 20
    `;

        const [summaryRes, trendRes, capacityRes] = await Promise.all([
            query(summarySql, [businessId, dateFrom, dateTo]),
            query(trendSql, [businessId, dateFrom, dateTo]),
            query(spotCapacitySql, [businessId]),
        ]);

        return {
            summary: summaryRes.rows[0],
            revenue_trend: trendRes.rows,
            capacity_alerts: capacityRes.rows,
        };
    }

    static async getEnterpriseFeedbacks({ businessId, radiusMeters, page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;

        const sql = `
      SELECT
        f.*,
        COUNT(*) OVER() AS total_count
      FROM citizen_feedbacks f
      INNER JOIN businesses b ON b.id = $1
      WHERE f.moderation_status = 'approved'
        AND f.geom IS NOT NULL
        AND b.geom IS NOT NULL
        AND ST_DWithin(f.geom::geography, b.geom::geography, $2)
      ORDER BY f.created_at DESC
      LIMIT $3 OFFSET $4
    `;

        const { rows } = await query(sql, [businessId, radiusMeters, limit, offset]);
        const total = rows.length ? Number(rows[0].total_count) : 0;

        return {
            rows: rows.map(({ total_count, ...item }) => item),
            total,
        };
    }

    static async listPermissions({ page = 1, limit = 20, search }) {
        const offset = (page - 1) * limit;
        const values = [];
        let p = 1;
        let whereClause = 'WHERE 1=1';

        if (search) {
            whereClause += ` AND (
        perm.resource ILIKE $${p}
        OR perm.action ILIKE $${p}
        OR COALESCE(perm.name_vi, '') ILIKE $${p}
      )`;
            values.push(`%${search}%`);
            p++;
        }

        const sql = `
      SELECT
        perm.*,
        COUNT(*) OVER() AS total_count
      FROM permissions perm
      ${whereClause}
      ORDER BY perm.resource ASC, perm.action ASC
      LIMIT $${p} OFFSET $${p + 1}
    `;

        values.push(limit, offset);
        const { rows } = await query(sql, values);
        const total = rows.length ? Number(rows[0].total_count) : 0;

        return {
            rows: rows.map(({ total_count, ...item }) => new Permission(item)),
            total,
        };
    }

    static async createPermission(data) {
        const sql = `
      INSERT INTO permissions (resource, action, name_vi, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

        const { rows } = await query(sql, [
            data.resource,
            data.action,
            data.name_vi || null,
            data.description || null,
        ]);

        return rows[0] ? new Permission(rows[0]) : null;
    }

    static async getRolePermissions(roleId) {
        const sql = `
      SELECT
        rp.role_id,
        p.id AS permission_id,
        p.resource,
        p.action,
        p.name_vi,
        p.description,
        rp.granted_at
      FROM role_permissions rp
      INNER JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.resource, p.action
    `;

        const { rows } = await query(sql, [roleId]);
        return rows.map((row) => new RolePermission(row));
    }

    static async replaceRolePermissions(roleId, permissionIds = [], grantedBy = null) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

            const uniqueIds = [...new Set(permissionIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];

            if (uniqueIds.length > 0) {
                const insertSql = `
          INSERT INTO role_permissions (role_id, permission_id, granted_by)
          SELECT $1, unnest($2::int[]), $3
        `;

                await client.query(insertSql, [roleId, uniqueIds, grantedBy]);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return this.getRolePermissions(roleId);
    }

    /**
     * CRIT-02 FIX: Run counts in parallel via Promise.all instead of 12 serial subqueries
     *
     * BEFORE: 1 SQL with 12 correlated subqueries → sequential full-table scans
     * AFTER:  12 lightweight queries running in parallel → total time = max(individual times)
     *
     * Estimated improvement: 60-80% faster (parallel vs serial execution)
     */
    static async getAdminDashboard(days = 30) {
        const interval = `${String(days)} days`;

        const queries = [
            query('SELECT COUNT(*) AS c FROM users'),
            query('SELECT COUNT(*) AS c FROM users WHERE is_active = TRUE'),
            query('SELECT COUNT(*) AS c FROM news'),
            query('SELECT COUNT(*) AS c FROM map_categories'),
            query('SELECT COUNT(*) AS c FROM map_layers'),
            query('SELECT COUNT(*) AS c FROM map_layer_apis'),
            query('SELECT COUNT(*) AS c FROM permissions'),
            query(`SELECT COUNT(*) AS c FROM audit_logs WHERE created_at >= NOW() - $1::interval`, [interval]),
            query(`SELECT COUNT(*) AS c FROM user_visit_history WHERE visited_at >= NOW() - $1::interval`, [interval]),
            query('SELECT COUNT(*) AS c FROM cuisine_items'),
            query('SELECT COUNT(*) AS c FROM festivals'),
            query(`SELECT COUNT(*) AS c FROM ocop_products WHERE is_active = TRUE`),
        ];

        const results = await Promise.all(queries);
        const counts = results.map(r => Number(r.rows[0]?.c || 0));

        return {
            total_users: counts[0],
            active_users: counts[1],
            total_news: counts[2],
            total_map_categories: counts[3],
            total_map_layers: counts[4],
            total_map_apis: counts[5],
            total_permissions: counts[6],
            audit_logs_in_range: counts[7],
            visits_in_range: counts[8],
            total_cuisine_items: counts[9],
            total_festivals: counts[10],
            total_ocop_products: counts[11],
        };
    }

    static async getTrafficAnalytics({ days = 30, groupBy = 'day' }) {
        const bucket = ['day', 'week', 'month'].includes(groupBy) ? groupBy : 'day';

        let periodExpr = "TO_CHAR(DATE_TRUNC('day', uvh.visited_at), 'YYYY-MM-DD')";
        if (bucket === 'week') {
            periodExpr = "TO_CHAR(DATE_TRUNC('week', uvh.visited_at), 'IYYY-\"W\"IW')";
        }
        if (bucket === 'month') {
            periodExpr = "TO_CHAR(DATE_TRUNC('month', uvh.visited_at), 'YYYY-MM')";
        }

        const visitsSql = `
      SELECT
        ${periodExpr} AS period,
        COUNT(*) AS visit_count,
        COUNT(DISTINCT uvh.user_id) AS unique_users
      FROM user_visit_history uvh
      WHERE uvh.visited_at >= NOW() - ($1::text || ' days')::interval
      GROUP BY period
      ORDER BY period ASC
    `;

        const sourceSql = `
      SELECT
        COALESCE(source, 'unknown') AS source,
        COUNT(*) AS count
      FROM user_visit_history
      WHERE visited_at >= NOW() - ($1::text || ' days')::interval
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `;

        const auditSql = `
      SELECT
        action,
        COUNT(*) AS count
      FROM audit_logs
      WHERE created_at >= NOW() - ($1::text || ' days')::interval
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

        const totalsSql = `
      SELECT
        COUNT(*) AS total_visits,
        COUNT(DISTINCT user_id) AS unique_visitors
      FROM user_visit_history
      WHERE visited_at >= NOW() - ($1::text || ' days')::interval
    `;

        const [visitsRes, sourceRes, auditRes, totalsRes] = await Promise.all([
            query(visitsSql, [String(days)]),
            query(sourceSql, [String(days)]),
            query(auditSql, [String(days)]),
            query(totalsSql, [String(days)]),
        ]);

        const timeline = visitsRes.rows.map((row) => ({
            period: row.period,
            visits: Number(row.visit_count || 0),
            unique_visitors: Number(row.unique_users || 0),
        }));
        const totals = totalsRes.rows[0] || {};

        return {
            total_visits: Number(totals.total_visits || 0),
            unique_visitors: Number(totals.unique_visitors || 0),
            avg_duration_seconds: null,
            bounce_rate_pct: null,
            timeline,
            time_series: visitsRes.rows,
            top_sources: sourceRes.rows,
            top_actions: auditRes.rows,
        };
    }
}

module.exports = GovernanceRepository;
