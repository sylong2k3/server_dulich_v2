const express = require('express');
const router = express.Router();

const AFrameController = require('../controllers/aframe.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { idParamSchema } = require('../middlewares/validators/spot.validation');
const {
  includeInactiveQuerySchema,
  sceneParamSchema,
  hotspotParamSchema,
  createSceneSchema,
  updateSceneSchema,
  createHotspotSchema,
  updateHotspotSchema,
} = require('../middlewares/validators/aframe.validation');

// ROUTE: GET /:id/aframe-scenes - Truy vấn cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.getScenes. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/aframe-scenes', validateParams(idParamSchema), validateQuery(includeInactiveQuerySchema), AFrameController.getScenes);

// ROUTE: GET /:id/aframe-scenes/:sceneId - Truy vấn cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.getScene. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/aframe-scenes/:sceneId', validateParams(sceneParamSchema), AFrameController.getScene);

// ROUTE: GET /:id/aframe-scenes/:sceneId/preload - Truy vấn cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.getPreloadScenes. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/aframe-scenes/:sceneId/preload', validateParams(sceneParamSchema), AFrameController.getPreloadScenes);

// ROUTE: POST /:id/aframe-scenes - Tạo mới cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.createScene. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.post('/:id/aframe-scenes', authenticateToken, checkPermission('spots', 'update'), validateParams(idParamSchema), validateBody(createSceneSchema), AFrameController.createScene);

// ROUTE: PATCH /:id/aframe-scenes/:sceneId - Cập nhật cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.updateScene. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/aframe-scenes/:sceneId', authenticateToken, checkPermission('spots', 'update'), validateParams(sceneParamSchema), validateBody(updateSceneSchema), AFrameController.updateScene);

// ROUTE: PATCH /:id/aframe-scenes/:sceneId/set-main - Thiết lập cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.setMainScene. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/aframe-scenes/:sceneId/set-main', authenticateToken, checkPermission('spots', 'update'), validateParams(sceneParamSchema), AFrameController.setMainScene);

// ROUTE: PATCH /:id/aframe-scenes/:sceneId/activate - Kích hoạt cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.activateScene. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/aframe-scenes/:sceneId/activate', authenticateToken, checkPermission('spots', 'update'), validateParams(sceneParamSchema), AFrameController.activateScene);

// ROUTE: PATCH /:id/aframe-scenes/:sceneId/deactivate - Vô hiệu hóa cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.deactivateScene. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/aframe-scenes/:sceneId/deactivate', authenticateToken, checkPermission('spots', 'update'), validateParams(sceneParamSchema), AFrameController.deactivateScene);

// ROUTE: DELETE /:id/aframe-scenes/:sceneId - Xóa cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.deleteScene. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.delete('/:id/aframe-scenes/:sceneId', authenticateToken, checkPermission('spots', 'update'), validateParams(sceneParamSchema), AFrameController.deleteScene);

// ROUTE: GET /:id/aframe-scenes/:sceneId/hotspots - Truy vấn cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.getHotspots. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/aframe-scenes/:sceneId/hotspots', validateParams(sceneParamSchema), validateQuery(includeInactiveQuerySchema), AFrameController.getHotspots);

// ROUTE: POST /:id/aframe-scenes/:sceneId/hotspots - Tạo mới cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.createHotspot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.post('/:id/aframe-scenes/:sceneId/hotspots', authenticateToken, checkPermission('spots', 'update'), validateParams(sceneParamSchema), validateBody(createHotspotSchema), AFrameController.createHotspot);

// ROUTE: PATCH /:id/aframe-scenes/:sceneId/hotspots/:hotspotId - Cập nhật cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.updateHotspot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/aframe-scenes/:sceneId/hotspots/:hotspotId', authenticateToken, checkPermission('spots', 'update'), validateParams(hotspotParamSchema), validateBody(updateHotspotSchema), AFrameController.updateHotspot);

// ROUTE: PATCH /:id/aframe-scenes/:sceneId/hotspots/:hotspotId/activate - Kích hoạt cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.activateHotspot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/aframe-scenes/:sceneId/hotspots/:hotspotId/activate', authenticateToken, checkPermission('spots', 'update'), validateParams(hotspotParamSchema), AFrameController.activateHotspot);

// ROUTE: PATCH /:id/aframe-scenes/:sceneId/hotspots/:hotspotId/deactivate - Vô hiệu hóa cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.deactivateHotspot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/aframe-scenes/:sceneId/hotspots/:hotspotId/deactivate', authenticateToken, checkPermission('spots', 'update'), validateParams(hotspotParamSchema), AFrameController.deactivateHotspot);

// ROUTE: DELETE /:id/aframe-scenes/:sceneId/hotspots/:hotspotId - Xóa cảnh A-Frame/VR của điểm du lịch. Xử lý bởi AFrameController.deleteHotspot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.delete('/:id/aframe-scenes/:sceneId/hotspots/:hotspotId', authenticateToken, checkPermission('spots', 'update'), validateParams(hotspotParamSchema), AFrameController.deleteHotspot);

module.exports = router;
