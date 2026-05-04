const AuditLogRepository = require('../models/repositories/audit-log.repository');
const { formatPagination } = require('../utils/responseFormatter');

class AuditLogService {
    async createLog(logData) {
        return AuditLogRepository.createLog(logData);
    }

    async getAuditLogs(options = {}) {
        const page = Math.max(1, parseInt(options.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20));

        const { logs, totalCount } = await AuditLogRepository.getAuditLogs({
            ...options,
            page,
            limit
        });

        const result = formatPagination(logs, totalCount, page, limit);
        return {
            logs: result.data,
            pagination: result.pagination
        };
    }

    async getVisitorStatistics(options = {}) {
        return AuditLogRepository.getAuditStatistics(options);
    }
}

module.exports = new AuditLogService();
