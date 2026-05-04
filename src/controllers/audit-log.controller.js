const auditLogService = require('../services/audit-log.service');
const asyncHandler = require('../helpers/async-handler');
const { OK } = require('../core/success.response');

class AuditLogController {
    static getAuditLogs = asyncHandler(async (req, res) => {
        const result = await auditLogService.getAuditLogs(req.query);
        return OK(res, 'Lấy danh sách nhật ký hệ thống thành công', {
            logs: result.logs.map(log => log.toJSON()),
            pagination: result.pagination
        });
    });

    static getVisitorStatistics = asyncHandler(async (req, res) => {
        const statistics = await auditLogService.getVisitorStatistics(req.query);
        return OK(res, 'Lấy thống kê số lượng người truy cập thành công', statistics);
    });
}

module.exports = AuditLogController;
