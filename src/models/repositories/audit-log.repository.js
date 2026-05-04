const { query } = require('../../configs/database');
const { create } = require('../../utils/database');
const AuditLog = require('../audit-log.model');

class AuditLogRepository {
    static tableName = 'audit_logs';

    static async createLog(logData) {
        const preparedData = AuditLog.prepareData(logData);

        // Xử lý old_value/new_value JSONB
        if (preparedData.old_value && typeof preparedData.old_value === 'object') {
            preparedData.old_value = JSON.stringify(preparedData.old_value);
        }
        if (preparedData.new_value && typeof preparedData.new_value === 'object') {
            preparedData.new_value = JSON.stringify(preparedData.new_value);
        }

        const sql = `
            INSERT INTO ${this.tableName} (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::inet, $8)
            RETURNING *
        `;
        const values = [
            preparedData.user_id || null,
            preparedData.action,
            preparedData.entity_type || null,
            preparedData.entity_id || null,
            preparedData.old_value || null,
            preparedData.new_value || null,
            preparedData.ip_address || null,
            preparedData.user_agent || null,
        ];
        const { rows } = await query(sql, values);
        return new AuditLog(rows[0]);
    }

    static async getAuditLogs(options = {}) {
        const { page = 1, limit = 20, user_id, action, entity_type, from_date, to_date, search } = options;

        const values = [];
        let paramCount = 1;
        let whereClause = 'WHERE 1=1';

        if (user_id) {
            whereClause += ` AND al.user_id = $${paramCount++}`;
            values.push(user_id);
        }

        if (action) {
            whereClause += ` AND al.action = $${paramCount++}`;
            values.push(action);
        }

        if (entity_type) {
            whereClause += ` AND al.entity_type = $${paramCount++}`;
            values.push(entity_type);
        }

        if (from_date) {
            whereClause += ` AND al.created_at >= $${paramCount++}`;
            values.push(from_date);
        }

        if (to_date) {
            whereClause += ` AND al.created_at <= $${paramCount++}`;
            values.push(to_date);
        }

        if (search) {
            whereClause += ` AND (al.action ILIKE $${paramCount} OR al.entity_type ILIKE $${paramCount} OR al.entity_id ILIKE $${paramCount})`;
            values.push(`%${search}%`);
            paramCount++;
        }

        const offset = (page - 1) * limit;
        values.push(limit, offset);

        const sql = `
            SELECT
                al.*,
                u.email AS user_email,
                u.full_name AS user_full_name,
                COUNT(*) OVER() AS total_count
            FROM ${this.tableName} al
            LEFT JOIN users u ON u.id = al.user_id
            ${whereClause}
            ORDER BY al.created_at DESC
            LIMIT $${paramCount++} OFFSET $${paramCount}
        `;

        const { rows } = await query(sql, values);
        const logs = rows.map((row) => new AuditLog(row));
        const totalCount = rows.length ? Number(rows[0].total_count) : 0;
        return { logs, totalCount };
    }

    /**
     * Lịch sử thay đổi của 1 entity cụ thể
     */
    static async getEntityHistory(entityType, entityId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;

        const sql = `
            SELECT al.*, u.email AS user_email, u.full_name AS user_full_name,
                   COUNT(*) OVER() AS total_count
            FROM ${this.tableName} al
            LEFT JOIN users u ON u.id = al.user_id
            WHERE al.entity_type = $1 AND al.entity_id = $2
            ORDER BY al.created_at DESC
            LIMIT $3 OFFSET $4
        `;

        const { rows } = await query(sql, [entityType, entityId, limit, offset]);
        const logs = rows.map((row) => new AuditLog(row));
        const totalCount = rows.length ? Number(rows[0].total_count) : 0;
        return { logs, totalCount };
    }

    /**
     * Thống kê audit log
     */
    static async getAuditStatistics(options = {}) {
        const { from_date, to_date, group_by = 'day' } = options;
        const values = [];
        let paramCount = 1;
        let whereClause = 'WHERE 1=1';

        if (from_date) {
            whereClause += ` AND al.created_at >= $${paramCount++}`;
            values.push(from_date);
        }

        if (to_date) {
            whereClause += ` AND al.created_at <= $${paramCount++}`;
            values.push(to_date);
        }

        // Thống kê tổng quan
        const overviewSql = `
            SELECT
                COUNT(*) as total_actions,
                COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
                COUNT(DISTINCT ip_address) as unique_ips,
                COUNT(DISTINCT entity_type) as entity_types_affected
            FROM ${this.tableName} al
            ${whereClause}
        `;

        const { rows: overviewRows } = await query(overviewSql, values);
        const overview = overviewRows[0];

        // Group by time period
        let dateFormat;
        switch (group_by) {
            case 'week':
                dateFormat = "TO_CHAR(DATE_TRUNC('week', al.created_at), 'YYYY-\"W\"IW')";
                break;
            case 'month':
                dateFormat = "TO_CHAR(DATE_TRUNC('month', al.created_at), 'YYYY-MM')";
                break;
            case 'day':
            default:
                dateFormat = "DATE(al.created_at)";
                break;
        }

        const timeSeriesSql = `
            SELECT
                ${dateFormat} as period,
                COUNT(*) as actions,
                COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
            FROM ${this.tableName} al
            ${whereClause}
            GROUP BY period
            ORDER BY period DESC
            LIMIT 30
        `;

        const { rows: timeSeriesRows } = await query(timeSeriesSql, values);

        // Top actions
        const topActionsSql = `
            SELECT action, entity_type, COUNT(*) as count
            FROM ${this.tableName} al
            ${whereClause}
            GROUP BY action, entity_type
            ORDER BY count DESC
            LIMIT 10
        `;

        const { rows: topActionsRows } = await query(topActionsSql, values);

        return {
            overview: {
                total_actions: parseInt(overview.total_actions),
                unique_users: parseInt(overview.unique_users),
                unique_ips: parseInt(overview.unique_ips),
                entity_types_affected: parseInt(overview.entity_types_affected),
            },
            time_series: timeSeriesRows.map(row => ({
                period: row.period,
                actions: parseInt(row.actions),
                unique_users: parseInt(row.unique_users),
            })),
            top_actions: topActionsRows.map(row => ({
                action: row.action,
                entity_type: row.entity_type,
                count: parseInt(row.count),
            })),
        };
    }
}

module.exports = AuditLogRepository;
