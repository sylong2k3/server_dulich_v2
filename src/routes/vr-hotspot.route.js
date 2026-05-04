const express = require('express');
const router = express.Router();

const VrHotspotController = require('../controllers/vr-hotspot.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateParams } = require('../middlewares/validation');
const {
    mediaHotspotParamSchema,
    hotspotParamSchema,
    createHotspotSchema,
    updateHotspotSchema,
} = require('../middlewares/validators/vr-hotspot.validation');

// ==================== VR HOTSPOT ====================
// ROUTE: GET /:id/media/:mediaId/hotspots - Truy vấn hotspot VR. Xử lý bởi VrHotspotController.getVrHotspots. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/media/:mediaId/hotspots', validateParams(mediaHotspotParamSchema), VrHotspotController.getVrHotspots );

// ROUTE: POST /:id/media/:mediaId/hotspots - Tạo mới hotspot VR. Xử lý bởi VrHotspotController.createVrHotspot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.post('/:id/media/:mediaId/hotspots', authenticateToken, checkPermission('spots', 'update'), validateParams(mediaHotspotParamSchema), validateBody(createHotspotSchema), VrHotspotController.createVrHotspot );

// ROUTE: PATCH /:id/media/:mediaId/hotspots/:hotspotId - Cập nhật hotspot VR. Xử lý bởi VrHotspotController.updateVrHotspot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/media/:mediaId/hotspots/:hotspotId', authenticateToken, checkPermission('spots', 'update'), validateParams(hotspotParamSchema), validateBody(updateHotspotSchema), VrHotspotController.updateVrHotspot );

// ROUTE: DELETE /:id/media/:mediaId/hotspots/:hotspotId - Xóa hotspot VR. Xử lý bởi VrHotspotController.deleteVrHotspot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.delete('/:id/media/:mediaId/hotspots/:hotspotId', authenticateToken, checkPermission('spots', 'update'), validateParams(hotspotParamSchema), VrHotspotController.deleteVrHotspot );

module.exports = router;
