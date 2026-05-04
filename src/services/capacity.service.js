const CapacityRepository = require('../models/repositories/capacity.repository');
const { Api404Error } = require('../core/error.response');
const { formatPagination } = require('../utils/responseFormatter');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { notifyChannel } = require('../realtime/websocket.server');
const NotificationService = require('./notification.service');
const FKValidator = require('../utils/fk-validator');

// SSE clients registry
const sseClients = new Set();

class CapacityService {
  async getCurrentAll() {
    return cacheOrFetch('capacity:current', () => CapacityRepository.getCurrentAll(), 30);
  }

  async getCurrentGeoJSON() {
    return cacheOrFetch('capacity:geojson', () => CapacityRepository.getCurrentGeoJSON(), 30);
  }

  async getCurrentBySpot(spotId) {
    return CapacityRepository.getCurrentBySpot(spotId);
  }

  async getHistory(spotId, options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(options.limit, 10) || 100));
    const { logs, totalCount } = await CapacityRepository.getHistory(spotId, { ...options, page, limit });
    const result = formatPagination(logs, totalCount, page, limit);
    return { logs: result.data, pagination: result.pagination };
  }

  async getStats(spotId, options = {}) {
    return CapacityRepository.getStats(spotId, options);
  }

  async logCapacity(data) {
    // Kiểm tra spot_id tồn tại trước khi ghi log
    await FKValidator.spot(data.spot_id);

    const log = await CapacityRepository.logCapacity(data);

    // Invalidate cache
    invalidateByPrefix('capacity:');

    const updatePayload = {
      type: 'capacity_update',
      spot_id: log.spot_id,
      visitor_count: log.visitor_count,
      capacity_pct: log.capacity_pct,
      status: log.status,
      recorded_at: log.recorded_at,
    };

    // NV-19: Broadcast qua SSE và WebSocket đồng thời
    this.broadcastSSE(updatePayload);
    notifyChannel('capacity', 'capacity_update', updatePayload);

    // NV-18: Phát cảnh báo nếu vượt ngưỡng
    if (log.status === 'near_full' || log.status === 'overloaded') {
      await this._triggerCapacityAlert(log).catch(() => {});
    }

    return log;
  }

  async _triggerCapacityAlert(log) {
    const configs = await CapacityRepository.getAlertConfigs({ spot_id: log.spot_id });
    const config = configs[0] || null;

    const capacityPct = Number(log.capacity_pct);
    const thresholdOver = config?.threshold_over ?? 100;
    const thresholdNear = config?.threshold_near ?? 85;

    const isOverloaded = capacityPct >= thresholdOver || log.status === 'overloaded';
    const isNearFull = !isOverloaded && (capacityPct >= thresholdNear || log.status === 'near_full');

    if (!isOverloaded && !isNearFull) return;

    const alertLevel = isOverloaded ? 'overloaded' : 'near_full';
    const alertTitle = isOverloaded
      ? `⚠️ CẢNH BÁO: Điểm du lịch quá tải (${capacityPct}%)`
      : `⚡ CHÚ Ý: Điểm du lịch gần đầy (${capacityPct}%)`;
    const alertBody = `Sức chứa đạt ${capacityPct}% (${log.visitor_count} khách). Vui lòng điều phối.`;

    const alertPayload = {
      type: 'capacity_alert',
      spot_id: log.spot_id,
      status: alertLevel,
      capacity_pct: log.capacity_pct,
      visitor_count: log.visitor_count,
      recorded_at: log.recorded_at,
    };

    // Broadcast SSE + WebSocket cho alert
    this.broadcastSSE(alertPayload);
    notifyChannel('capacity', 'capacity_alert', alertPayload);

    // Ghi notification vào DB cho target_roles (nếu có config)
    const targetRoles = config?.notify_roles || null;
    await NotificationService.createNotification({
      target_roles: targetRoles,
      type: 'capacity_alert',
      title_vi: alertTitle,
      body_vi: alertBody,
      data: alertPayload,
      triggered_by: 'capacity_service',
    }, { broadcastUser: false });
  }

  async getSuggestedAlternatives(spotId, options = {}) {
    const alternatives = await CapacityRepository.getSuggestedAlternatives(spotId, options);
    if (!alternatives.length) {
      // Spot không tồn tại vs không tìm được thay thế — đều trả rỗng
      const current = await CapacityRepository.getCurrentBySpot(spotId);
      if (!current) throw new Api404Error('Không tìm thấy điểm du lịch');
    }
    return alternatives;
  }

  async getAlertConfigs(options = {}) {
    return CapacityRepository.getAlertConfigs(options);
  }

  async upsertAlertConfig(data) {
    // Kiểm tra spot_id nếu cấu hình alert cho một spot cụ thể
    await FKValidator.all([
      FKValidator.spot(data.spot_id),
      FKValidator.province(data.province_code),
    ]);
    return CapacityRepository.upsertAlertConfig(data);
  }

  // ==================== SSE ====================

  /**
   * Đăng ký SSE client
   */
  registerSSEClient(res) {
    sseClients.add(res);
    res.on('close', () => {
      sseClients.delete(res);
    });
  }

  /**
   * Broadcast dữ liệu tới tất cả SSE clients
   */
  broadcastSSE(payload) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(data);
      } catch (err) {
        sseClients.delete(client);
      }
    });
  }

  getSSEClientCount() {
    return sseClients.size;
  }
}

module.exports = new CapacityService();
