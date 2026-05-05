const spotService = require('../services/spot.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class SpotController {
  // ==================== PUBLIC ====================

  static getAllSpots = asyncHandler(async (req, res) => {
    const result = await spotService.getAllSpots(req.query, { user: req.user });
    return OK(res, 'Lấy danh sách điểm du lịch thành công', result);
  });

  static getAdminSpots = asyncHandler(async (req, res) => {
    const result = await spotService.getAdminSpots(req.query, { user: req.user });
    return OK(res, 'Lấy danh sách điểm du lịch quản trị thành công', result);
  });

  static getMapSpots = asyncHandler(async (req, res) => {
    const result = await spotService.getMapSpots(req.query, { user: req.user });
    return OK(res, 'Lấy dữ liệu bản đồ điểm du lịch thành công', result);
  });

  static getNearbySpots = asyncHandler(async (req, res) => {
    const { lat, lng, radius_km, limit, lang } = req.query;
    const spots = await spotService.getNearbySpots(lat, lng, radius_km, limit, lang);
    return OK(res, 'Tìm điểm du lịch lân cận thành công', { spots });
  });

  static getSpotsByBbox = asyncHandler(async (req, res) => {
    const { bbox, limit, lang } = req.query;
    const spots = await spotService.getSpotsByBbox(bbox, limit, lang);
    return OK(res, 'Lấy điểm du lịch trong vùng thành công', { spots });
  });

  static getSpotsGeoJSON = asyncHandler(async (req, res) => {
    const geojson = await spotService.getSpotsGeoJSON(req.query);
    return OK(res, 'Lấy GeoJSON điểm du lịch thành công', geojson);
  });

  static getFeaturedSpots = asyncHandler(async (req, res) => {
    const { limit, category_id, category_ids, lang } = req.query;
    const spots = await spotService.getFeaturedSpots(limit, category_id, lang, category_ids);
    return OK(res, 'Lấy danh sách điểm nổi bật thành công', { spots });
  });

  static getSpotBySlug = asyncHandler(async (req, res) => {
    const spot = await spotService.getSpotBySlug(req.params.slug, { user: req.user }, { lang: req.query.lang });
    return OK(res, 'Lấy thông tin điểm du lịch thành công', { spot });
  });

  static getSpotMedia = asyncHandler(async (req, res) => {
    const media = await spotService.getSpotMedia(req.params.id, req.query.media_type);
    return OK(res, 'Lấy media điểm du lịch thành công', { media });
  });

  // NV-33: Audio guide
  static getAudioGuide = asyncHandler(async (req, res) => {
    const language = req.query.language || null;
    const audio = await spotService.getAudioGuide(req.params.id, language);
    return OK(res, 'Thuyết minh âm thanh', { audio });
  });

  // ==================== PROTECTED ====================

  static createSpot = asyncHandler(async (req, res) => {
    const spotData = { ...req.body, created_by: req.user?.id };
    const spot = await spotService.createSpot(spotData);
    return CREATED(res, 'Tạo điểm du lịch thành công', { spot });
  });

  static updateSpot = asyncHandler(async (req, res) => {
    const spot = await spotService.updateSpot(req.params.id, req.body, req.user);
    return OK(res, 'Cập nhật điểm du lịch thành công', { spot });
  });

  static deleteSpot = asyncHandler(async (req, res) => {
    await spotService.deleteSpot(req.params.id, req.user);
    return OK(res, 'Xóa điểm du lịch thành công', {});
  });

  static toggleFeatured = asyncHandler(async (req, res) => {
    const result = await spotService.toggleFeatured(req.params.id);
    return OK(res, 'Cập nhật trạng thái nổi bật thành công', result);
  });

  static addSpotMedia = asyncHandler(async (req, res) => {
    if (!req.file) {
      const { Api400Error } = require('../core/error.response');
      throw new Api400Error('Vui lòng chọn file để upload');
    }
    const media = await spotService.addSpotMedia(req.params.id, req.file, req.body);
    return CREATED(res, 'Upload media thành công', { media });
  });

  static deleteSpotMedia = asyncHandler(async (req, res) => {
    await spotService.deleteSpotMedia(req.params.id, req.params.mediaId);
    return OK(res, 'Xóa media thành công', {});
  });

  // Đặt ảnh chính
  static setPrimaryMedia = asyncHandler(async (req, res) => {
    const media = await spotService.setPrimaryMedia(req.params.id, req.params.mediaId);
    return OK(res, 'Đặt ảnh chính thành công', { media });
  });

  // Cập nhật metadata media (title, sort_order, language)
  static updateMediaMeta = asyncHandler(async (req, res) => {
    const media = await spotService.updateMediaMeta(req.params.id, req.params.mediaId, req.body);
    return OK(res, 'Cập nhật media thành công', { media });
  });

  // Batch upload nhiều ảnh/video
  static batchAddSpotMedia = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      const { Api400Error } = require('../core/error.response');
      throw new Api400Error('Vui lòng chọn ít nhất một file');
    }
    const media = await spotService.batchAddSpotMedia(req.params.id, req.files, req.body);
    return CREATED(res, `Upload ${media.length} file thành công`, { media });
  });
}

module.exports = SpotController;
