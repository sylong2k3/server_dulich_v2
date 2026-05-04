const express = require('express');
const OfflineController = require('../controllers/offline.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateBody, validateParams } = require('../middlewares/validation');
const {
    requestDownloadSchema,
    downloadIdParamSchema,
} = require('../middlewares/validators/offline.validation');
const router = express.Router();

// NV-62: Tải bản đồ offline
// ROUTE: POST /download - Tạo/Gửi dữ liệu ngoại tuyến. Xử lý bởi OfflineController.requestDownload. Truy cập: yêu cầu đăng nhập.
router.post('/download', authenticateToken, validateBody(requestDownloadSchema), OfflineController.requestDownload );

// Danh sách bản đồ của user hiện tại
// ROUTE: GET / - Truy vấn dữ liệu ngoại tuyến. Xử lý bởi OfflineController.getDownloads. Truy cập: yêu cầu đăng nhập.
router.get('/', authenticateToken, OfflineController.getDownloads);

// FIX #4: Xem chi tiết 1 bản ghi (ownership check ở service)
// ROUTE: GET /:id - Truy vấn dữ liệu ngoại tuyến. Xử lý bởi OfflineController.getDownloadById. Truy cập: yêu cầu đăng nhập.
router.get('/:id', authenticateToken, validateParams(downloadIdParamSchema), OfflineController.getDownloadById );

// FIX #4: Xóa 1 bản ghi (ownership check ở service)
// ROUTE: DELETE /:id - Xóa dữ liệu ngoại tuyến. Xử lý bởi OfflineController.deleteDownload. Truy cập: yêu cầu đăng nhập.
router.delete('/:id', authenticateToken, validateParams(downloadIdParamSchema), OfflineController.deleteDownload );

module.exports = router;
