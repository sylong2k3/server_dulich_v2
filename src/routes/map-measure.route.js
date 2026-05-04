const express = require('express');
const MapMeasureController = require('../controllers/map-measure.controller');
const { validateBody } = require('../middlewares/validation');
const { measureDistanceSchema, measureAreaSchema } = require('../middlewares/validators/map-measure.validation');

const router = express.Router();

// ROUTE: POST /distance - Tạo/Gửi đo đạc trên bản đồ. Xử lý bởi MapMeasureController.measureDistance. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post('/distance', validateBody(measureDistanceSchema), MapMeasureController.measureDistance);
// ROUTE: POST /area - Tạo/Gửi đo đạc trên bản đồ. Xử lý bởi MapMeasureController.measureArea. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post('/area', validateBody(measureAreaSchema), MapMeasureController.measureArea);

module.exports = router;
