const aframeService = require('../services/aframe.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class AFrameController {
  static getScenes = asyncHandler(async (req, res) => {
    const scenes = await aframeService.getScenes(req.params.id, req.query);
    return OK(res, 'Lấy danh sách A-Frame scene thành công', { scenes });
  });

  static getScene = asyncHandler(async (req, res) => {
    const scene = await aframeService.getScene(req.params.id, req.params.sceneId);
    return OK(res, 'Lấy A-Frame scene thành công', { scene });
  });

  static getPreloadScenes = asyncHandler(async (req, res) => {
    const preload = await aframeService.getPreloadScenes(req.params.id, req.params.sceneId);
    return OK(res, 'Lấy danh sách preload scene thành công', preload);
  });

  static createScene = asyncHandler(async (req, res) => {
    const scene = await aframeService.createScene(req.params.id, req.body, req.user);
    return CREATED(res, 'Tạo A-Frame scene thành công', { scene });
  });

  static updateScene = asyncHandler(async (req, res) => {
    const scene = await aframeService.updateScene(req.params.id, req.params.sceneId, req.body);
    return OK(res, 'Cập nhật A-Frame scene thành công', { scene });
  });

  static deleteScene = asyncHandler(async (req, res) => {
    const deleted = await aframeService.deleteScene(req.params.id, req.params.sceneId);
    return OK(res, 'Xóa A-Frame scene thành công', { deleted });
  });

  static setMainScene = asyncHandler(async (req, res) => {
    const scene = await aframeService.setMainScene(req.params.id, req.params.sceneId);
    return OK(res, 'Đặt scene chính thành công', { scene });
  });

  static activateScene = asyncHandler(async (req, res) => {
    const scene = await aframeService.activateScene(req.params.id, req.params.sceneId);
    return OK(res, 'Bật scene thành công', { scene });
  });

  static deactivateScene = asyncHandler(async (req, res) => {
    const scene = await aframeService.deactivateScene(req.params.id, req.params.sceneId);
    return OK(res, 'Tắt scene thành công', { scene });
  });

  static getHotspots = asyncHandler(async (req, res) => {
    const hotspots = await aframeService.getHotspots(req.params.id, req.params.sceneId, req.query);
    return OK(res, 'Lấy danh sách A-Frame hotspot thành công', { hotspots });
  });

  static createHotspot = asyncHandler(async (req, res) => {
    const hotspot = await aframeService.createHotspot(req.params.id, req.params.sceneId, req.body, req.user);
    return CREATED(res, 'Tạo A-Frame hotspot thành công', { hotspot });
  });

  static updateHotspot = asyncHandler(async (req, res) => {
    const hotspot = await aframeService.updateHotspot(
      req.params.id,
      req.params.sceneId,
      req.params.hotspotId,
      req.body,
    );
    return OK(res, 'Cập nhật A-Frame hotspot thành công', { hotspot });
  });

  static deleteHotspot = asyncHandler(async (req, res) => {
    const deleted = await aframeService.deleteHotspot(req.params.id, req.params.sceneId, req.params.hotspotId);
    return OK(res, 'Xóa A-Frame hotspot thành công', { deleted });
  });

  static activateHotspot = asyncHandler(async (req, res) => {
    const hotspot = await aframeService.activateHotspot(req.params.id, req.params.sceneId, req.params.hotspotId);
    return OK(res, 'Bật hotspot thành công', { hotspot });
  });

  static deactivateHotspot = asyncHandler(async (req, res) => {
    const hotspot = await aframeService.deactivateHotspot(req.params.id, req.params.sceneId, req.params.hotspotId);
    return OK(res, 'Tắt hotspot thành công', { hotspot });
  });
}

module.exports = AFrameController;
