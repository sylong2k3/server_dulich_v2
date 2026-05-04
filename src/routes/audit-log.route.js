const express = require('express');
const AuditLogController = require('../controllers/audit-log.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateQuery } = require('../middlewares/validation');
const { getAuditLogsQuerySchema, getVisitorStatsQuerySchema } = require('../middlewares/validators/audit-log.validation');

const router = express.Router();

// ROUTE: GET / - Truy vấn nhật ký kiểm toán. Xử lý bởi AuditLogController.getAuditLogs. Truy cập: yêu cầu đăng nhập, cần quyền audit_logs:read.
router.get('/', authenticateToken, checkPermission('audit_logs', 'read'), validateQuery(getAuditLogsQuerySchema), AuditLogController.getAuditLogs );

// ROUTE: GET /visitor-statistics - Lấy số liệu thống kê nhật ký kiểm toán. Xử lý bởi AuditLogController.getVisitorStatistics. Truy cập: yêu cầu đăng nhập, cần quyền audit_logs:read.
router.get('/visitor-statistics', authenticateToken, checkPermission('audit_logs', 'read'), validateQuery(getVisitorStatsQuerySchema), AuditLogController.getVisitorStatistics );

module.exports = router;
