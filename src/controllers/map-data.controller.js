/**
 * Map Data Controller — Xử lý truy cập data qua API Key
 *
 * Endpoint cho client bên ngoài dùng API key để:
 *  - Xem danh sách API mình có quyền truy cập
 *  - Lấy data từ map layer API cụ thể
 */

const asyncHandler = require('../helpers/async-handler');
const { OK } = require('../core/success.response');
const ApiKeyMiddleware = require('../middlewares/api-key.middleware');
const MapDataService = require('../services/map-data.service');

class MapDataController {
  /**
   * GET /map-data/apis
   * Xem danh sách API mà key này có quyền truy cập
   */
  static listAccessibleApis = asyncHandler(async (req, res) => {
    const apis = await ApiKeyMiddleware.getAccessibleApis(req.apiKey.id);
    return OK(res, 'Danh sách API có quyền truy cập', {
      api_key_name: req.apiKey.name,
      items: apis,
      total: apis.length,
    });
  });

  /**
   * GET /map-data/apis/:apiId/data
   * Lấy data từ map layer API cụ thể
   */
  static getApiData = asyncHandler(async (req, res) => {
    const apiId = Number(req.params.apiId);
    const data = await MapDataService.getMapLayerApiData(apiId, req.query);
    return OK(res, 'Dữ liệu API lớp bản đồ', data);
  });

  /**
   * GET /map-data/layers
   * Lấy danh sách layers từ các APIs mà key có quyền
   */
  static getAccessibleLayers = asyncHandler(async (req, res) => {
    const layers = await MapDataService.getAccessibleLayers(req.apiKey.id);
    return OK(res, 'Danh sách lớp bản đồ có quyền truy cập', {
      api_key_name: req.apiKey.name,
      items: layers,
      total: layers.length,
    });
  });
}

module.exports = MapDataController;
