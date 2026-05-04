const express = require('express');
const GpsController = require('../controllers/gps.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateBody, validateParams } = require('../middlewares/validation');
const {
  trackIdParamSchema,
  startTrackSchema,
  endTrackSchema,
  syncPointsSchema,
} = require('../middlewares/validators/gps.validation');
const router = express.Router();

// NV-61: Theo dõi lộ trình GPS
// ROUTE: POST /start - Tạo/Gửi GPS và vị trí. Xử lý bởi GpsController.startTrack. Truy cập: yêu cầu đăng nhập.
router.post('/start', authenticateToken, validateBody(startTrackSchema), GpsController.startTrack);
// ROUTE: POST /:trackId/sync - Đồng bộ dữ liệu GPS và vị trí. Xử lý bởi GpsController.syncPoints. Truy cập: yêu cầu đăng nhập.
router.post('/:trackId/sync', authenticateToken, validateParams(trackIdParamSchema), validateBody(syncPointsSchema), GpsController.syncPoints);
// ROUTE: PATCH /:trackId/end - Cập nhật một phần GPS và vị trí. Xử lý bởi GpsController.endTrack. Truy cập: yêu cầu đăng nhập.
router.patch('/:trackId/end', authenticateToken, validateParams(trackIdParamSchema), validateBody(endTrackSchema), GpsController.endTrack);

module.exports = router;
