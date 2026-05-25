const express = require('express');
const router = express.Router();
const SpotController = require('../controllers/spot.controller');
const { authenticateToken, checkPermission, optionalAuth, requireRole } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
  idParamSchema,
  mediaParamSchema,
  slugParamSchema,
  spotQuerySchema,
  spotAdminQuerySchema,
  spotMapQuerySchema,
  nearbyQuerySchema,
  bboxQuerySchema,
  geojsonQuerySchema,
  featuredQuerySchema,
  mediaTypeQuerySchema,
  audioGuideQuerySchema,
  spotDetailQuerySchema,
  createSpotSchema,
  updateSpotSchema,
  updateMediaMetaSchema,
} = require('../middlewares/validators/spot.validation');

// ==================== PUBLIC ROUTES ====================

// 2) Phân trang cho trang điểm du lịch: đủ dữ liệu để hiển thị card/list
// ROUTE: GET / - Truy vấn điểm du lịch. Xử lý bởi SpotController.getAllSpots. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/', optionalAuth, validateQuery(spotQuerySchema), SpotController.getAllSpots);
router.get(
  '/admin',
  authenticateToken,
  requireRole(['system_admin', 'ministry_manager', 'department_manager', 'spot_operator', 'travel_company', 'service_provider']),
  checkPermission('spots', 'read'),
  validateQuery(spotAdminQuerySchema),
  SpotController.getAdminSpots
);
router.get('/map', optionalAuth, validateQuery(spotMapQuerySchema), SpotController.getMapSpots);
// ROUTE: GET /nearby - Tìm các mục ở gần vị trí người dùng điểm du lịch. Xử lý bởi SpotController.getNearbySpots. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/nearby', validateQuery(nearbyQuerySchema), SpotController.getNearbySpots);
// ROUTE: GET /bbox - Truy vấn điểm du lịch. Xử lý bởi SpotController.getSpotsByBbox. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/bbox', validateQuery(bboxQuerySchema), SpotController.getSpotsByBbox);
// ROUTE: GET /geojson - Truy vấn điểm du lịch. Xử lý bởi SpotController.getSpotsGeoJSON. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/geojson', validateQuery(geojsonQuerySchema), SpotController.getSpotsGeoJSON);
// ROUTE: GET /featured - Truy vấn điểm du lịch. Xử lý bởi SpotController.getFeaturedSpots. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/featured', validateQuery(featuredQuerySchema), SpotController.getFeaturedSpots);

// ==================== PROTECTED ROUTES ====================
// 3) Phân trang cho trang quản trị: xem cả trạng thái draft/archived nếu cần
// ROUTE: GET /id/:id - Truy vấn điểm du lịch theo ID. Xử lý bởi SpotController.getSpotById. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/id/:id', optionalAuth, validateParams(idParamSchema), validateQuery(spotDetailQuerySchema), SpotController.getSpotById);
// ROUTE: GET /:slug - Truy vấn điểm du lịch. Xử lý bởi SpotController.getSpotBySlug. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/:slug', optionalAuth, validateParams(slugParamSchema), validateQuery(spotDetailQuerySchema), SpotController.getSpotBySlug);
// ROUTE: GET /:id/media - Truy vấn điểm du lịch. Xử lý bởi SpotController.getSpotMedia. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/media', validateParams(idParamSchema), validateQuery(mediaTypeQuerySchema), SpotController.getSpotMedia);
// ROUTE: GET /:id/audio-guide - Truy vấn điểm du lịch. Xử lý bởi SpotController.getAudioGuide. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:id/audio-guide', validateParams(idParamSchema), validateQuery(audioGuideQuerySchema), SpotController.getAudioGuide);

// Tạo điểm du lịch — Sở VH-TT&DL hoặc Admin
// ROUTE: POST / - Tạo mới điểm du lịch. Xử lý bởi SpotController.createSpot. Truy cập: yêu cầu đăng nhập, cần quyền spots:create.
router.post('/', authenticateToken, checkPermission('spots', 'create'), validateBody(createSpotSchema), SpotController.createSpot);

// Cập nhật — Sở, Operator hoặc Admin
// ROUTE: PATCH /:id - Cập nhật điểm du lịch. Xử lý bởi SpotController.updateSpot. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id', authenticateToken, checkPermission('spots', 'update'), validateParams(idParamSchema), validateBody(updateSpotSchema), SpotController.updateSpot);

// Xóa (soft) — Admin
// ROUTE: DELETE /:id - Xóa điểm du lịch. Xử lý bởi SpotController.deleteSpot. Truy cập: yêu cầu đăng nhập, cần quyền spots:delete.
router.delete('/:id', authenticateToken, checkPermission('spots', 'delete'), validateParams(idParamSchema), SpotController.deleteSpot);

// ROUTE: PATCH /:id/featured - Cập nhật một phần điểm du lịch. Xử lý bởi SpotController.toggleFeatured. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/featured', authenticateToken, checkPermission('spots', 'update'), validateParams(idParamSchema), SpotController.toggleFeatured);

// Upload media — Sở, Operator
// ROUTE: POST /:id/media - Tạo mới điểm du lịch. Xử lý bởi SpotController.addSpotMedia. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.post('/:id/media', authenticateToken, checkPermission('spots', 'update'), validateParams(idParamSchema), upload.single('file'), SpotController.addSpotMedia);

// ROUTE: DELETE /:id/media/:mediaId - Xóa điểm du lịch. Xử lý bởi SpotController.deleteSpotMedia. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.delete('/:id/media/:mediaId', authenticateToken, checkPermission('spots', 'update'), validateParams(mediaParamSchema), SpotController.deleteSpotMedia);

// ROUTE: PATCH /:id/media/:mediaId/primary - Thiết lập điểm du lịch. Xử lý bởi SpotController.setPrimaryMedia. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/media/:mediaId/primary', authenticateToken, checkPermission('spots', 'update'), validateParams(mediaParamSchema), SpotController.setPrimaryMedia);

// ROUTE: PATCH /:id/media/:mediaId - Cập nhật điểm du lịch. Xử lý bởi SpotController.updateMediaMeta. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.patch('/:id/media/:mediaId', authenticateToken, checkPermission('spots', 'update'), validateParams(mediaParamSchema), validateBody(updateMediaMetaSchema), SpotController.updateMediaMeta);

// ROUTE: POST /:id/media/batch - Tạo/Gửi điểm du lịch. Xử lý bởi SpotController.batchAddSpotMedia. Truy cập: yêu cầu đăng nhập, cần quyền spots:update.
router.post('/:id/media/batch', authenticateToken, checkPermission('spots', 'update'), validateParams(idParamSchema), upload.array('files', 20), SpotController.batchAddSpotMedia);

module.exports = router;
