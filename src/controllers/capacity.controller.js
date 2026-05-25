const capacityService = require('../services/capacity.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class CapacityController {
  static getCurrentAll = asyncHandler(async (req, res) => {
    const data = await capacityService.getCurrentAll(req.query);
    return OK(res, 'Lấy tải trọng hiện tại thành công', { capacity: data });
  });

  static getAdminAll = asyncHandler(async (req, res) => {
    const result = await capacityService.getAdminAll(req.query, { user: req.user });
    return OK(res, 'Lấy danh sách tải trọng quản trị thành công', result);
  });

  static getCurrentGeoJSON = asyncHandler(async (req, res) => {
    const geojson = await capacityService.getCurrentGeoJSON();
    return OK(res, 'Lấy GeoJSON tải trọng thành công', geojson);
  });

  static getHistory = asyncHandler(async (req, res) => {
    const result = await capacityService.getHistory(req.params.spotId, req.query);
    return OK(res, 'Lấy lịch sử tải trọng thành công', result);
  });

  static getStats = asyncHandler(async (req, res) => {
    const stats = await capacityService.getStats(req.params.spotId, req.query);
    return OK(res, 'Lấy thống kê tải trọng thành công', { stats });
  });

  static logCapacity = asyncHandler(async (req, res) => {
    const data = {
      spot_id: req.params.spotId,
      visitor_count: req.body.visitor_count,
      data_source: req.body.data_source || 'manual',
      recorded_by: req.user?.id,
    };
    const log = await capacityService.logCapacity(data);
    return CREATED(res, 'Ghi nhận tải trọng thành công', { log });
  });

  static updateSpotSettings = asyncHandler(async (req, res) => {
    const settings = await capacityService.updateSpotSettings(req.params.spotId, req.body);
    return OK(res, 'Cập nhật cấu hình sức chứa điểm du lịch thành công', { settings });
  });

  static getSuggestedAlternatives = asyncHandler(async (req, res) => {
    const alternatives = await capacityService.getSuggestedAlternatives(req.params.spotId, {
      radius_km: Number(req.query.radius_km) || 10,
      limit: Number(req.query.limit) || 5,
      max_capacity_pct: Number(req.query.max_capacity_pct) || 80,
    });
    return OK(res, 'Gợi ý điểm du lịch thay thế', { alternatives, total: alternatives.length });
  });

  static getAlertConfigs = asyncHandler(async (req, res) => {
    const configs = await capacityService.getAlertConfigs(req.query);
    return OK(res, 'Lấy cấu hình cảnh báo thành công', { configs });
  });

  static upsertAlertConfig = asyncHandler(async (req, res) => {
    const config = await capacityService.upsertAlertConfig({
      ...req.body,
      updated_by: req.user?.id,
    });
    return CREATED(res, 'Cập nhật cấu hình cảnh báo thành công', { config });
  });

  /**
   * SSE endpoint — Server-Sent Events stream
   */
  static streamCapacity = (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Capacity stream connected' })}\n\n`);
    if (typeof res.flush === 'function') {
      res.flush();
    }

    // Đăng ký client
    capacityService.registerSSEClient(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (err) {
        clearInterval(heartbeat);
      }
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  };
}

module.exports = CapacityController;
