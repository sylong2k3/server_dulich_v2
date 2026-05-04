const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateQuery, validateParams } = require('../middlewares/validation');
const {
    filenameParamSchema,
} = require('../middlewares/validators/statistics.validation');

// NV-Stat: File thống kê nội bộ — chỉ dành cho quản trị viên có quyền analytics:read
// ROUTE: GET /data-files - Truy vấn thống kê. Xử lý bởi statisticsController.listDataFiles. Truy cập: yêu cầu đăng nhập, cần quyền analytics:read.
router.get('/data-files', authenticateToken, checkPermission('analytics', 'read'), statisticsController.listDataFiles );
// ROUTE: GET /data-files/download/:filename - Tải dữ liệu xuống thống kê. Xử lý bởi statisticsController.downloadDataFile. Truy cập: yêu cầu đăng nhập, cần quyền analytics:read.
router.get('/data-files/download/:filename', authenticateToken, checkPermission('analytics', 'read'), validateParams(filenameParamSchema), statisticsController.downloadDataFile );

module.exports = router;
