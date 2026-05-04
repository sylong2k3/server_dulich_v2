/**
 * Map Data Route — External API Key access to map data
 *
 * Tất cả endpoints yêu cầu header: X-API-Key: nb_xxxxx
 *
 * GET /map-data/apis               → Danh sách API có quyền truy cập
 * GET /map-data/apis/:apiId/data   → Lấy data từ API cụ thể
 * GET /map-data/layers             → Danh sách layers có quyền truy cập
 */

const express = require('express');
const router = express.Router();
const MapDataController = require('../controllers/map-data.controller');
const { authenticateApiKey, requireApiAccess, logUsage } = require('../middlewares/api-key.middleware');

// Tất cả routes đều yêu cầu API key
router.use(authenticateApiKey);

// GET /map-data/apis — Xem danh sách API mà key có quyền
// ROUTE: GET /apis - Truy vấn dữ liệu bản đồ. Xử lý bởi MapDataController.listAccessibleApis. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/apis', logUsage(() => null), MapDataController.listAccessibleApis );

// GET /map-data/layers — Xem danh sách layers
// ROUTE: GET /layers - Truy vấn dữ liệu bản đồ. Xử lý bởi MapDataController.getAccessibleLayers. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/layers', logUsage(() => null), MapDataController.getAccessibleLayers );

// GET /map-data/apis/:apiId/data — Lấy data từ API cụ thể
// ROUTE: GET /apis/:apiId/data - Truy vấn dữ liệu bản đồ. Xử lý bởi MapDataController.getApiData. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/apis/:apiId/data', requireApiAccess((req) => Number(req.params.apiId)), logUsage((req) => Number(req.params.apiId)), MapDataController.getApiData );

module.exports = router;
