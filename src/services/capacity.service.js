const CapacityRepository = require('../models/repositories/capacity.repository');
const { Api404Error, Api400Error, Api403Error } = require('../core/error.response');
const { formatPagination } = require('../utils/responseFormatter');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { notifyChannel } = require('../realtime/websocket.server');
const NotificationService = require('./notification.service');
const FKValidator = require('../utils/fk-validator');

// Các role được bypass ownership check (quản lý nội dung toàn hệ thống)
const GLOBAL_SPOT_ROLES = new Set(['system_admin', 'ministry_manager']);
const GLOBAL_WRITE_ROLES = new Set(['system_admin']);
const DEPARTMENT_SPOT_ROLES = new Set(['department_manager']);
const OWNER_SPOT_ROLES = new Set(['spot_operator', 'travel_company', 'service_provider']);
const DEFAULT_DEPARTMENT_PROVINCE_CODE = '37';

// SSE clients registry
const sseClients = new Set();

class CapacityService {
  async getCurrentAll(options = {}) {
    const sortOrder = String(options.sortOrder || options.sort_order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return cacheOrFetch(`capacity:current:${sortOrder}`, async () => {
      const { logs } = await CapacityRepository.getCurrentAll({ sortOrder });
      return logs;
    }, 30);
  }

  async getAdminAll(options = {}, viewer = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20));

    // Apply RBAC listing scope
    const effectiveOptions = this._applyListScope({ ...options, page, limit }, viewer?.user);

    // Construct a cache key based on query filters and RBAC filters
    const cacheKey = [
      'capacity:admin',
      `p${page}`,
      `l${limit}`,
      effectiveOptions.sortBy || 'capacity_pct',
      effectiveOptions.sortOrder || 'DESC',
      effectiveOptions.search || '',
      effectiveOptions.status || 'all',
      effectiveOptions.province_code || 'all',
      effectiveOptions.created_by || 'any',
      effectiveOptions.owner_id || 'any',
      effectiveOptions.spot_status || 'all',
    ].join(':');

    return cacheOrFetch(cacheKey, async () => {
      const { logs, totalCount } = await CapacityRepository.getCurrentAll(effectiveOptions);
      const result = formatPagination(logs, totalCount, page, limit);
      return { capacity: result.data, pagination: result.pagination };
    }, 30);
  }

  async getCurrentGeoJSON() {
    return cacheOrFetch('capacity:geojson', () => CapacityRepository.getCurrentGeoJSON(), 30);
  }

  async getCurrentBySpot(spotId) {
    return CapacityRepository.getCurrentBySpot(spotId);
  }

  async getCurrentByTour(tourId) {
    return cacheOrFetch(`capacity:tour:current:${tourId}`, async () => {
      const tour = await CapacityRepository.getCurrentByTour(tourId);
      if (!tour) throw new Api404Error('Không tìm thấy tuyến du lịch đã xuất bản');

      const stops = tour.stops.map((stop) => this._normalizeTourStopCapacity(stop));
      const spotStops = stops.filter((stop) => Boolean(stop.spot_id));
      const capacityTrackedStops = spotStops.filter((stop) => stop.max_capacity > 0);
      const capacityPctStops = spotStops.filter((stop) => stop.capacity_pct !== null);

      const totalCurrentVisitors = capacityTrackedStops.reduce(
        (sum, stop) => sum + (stop.visitor_count || 0),
        0,
      );
      const totalObservedVisitors = spotStops.reduce(
        (sum, stop) => sum + (stop.visitor_count || 0),
        0,
      );
      const totalMaxCapacity = capacityTrackedStops.reduce(
        (sum, stop) => sum + stop.max_capacity,
        0,
      );
      const routeCapacityPct = totalMaxCapacity > 0
        ? this._round((totalCurrentVisitors / totalMaxCapacity) * 100)
        : null;

      const avgCapacityPct = capacityPctStops.length
        ? this._round(capacityPctStops.reduce((sum, stop) => sum + stop.capacity_pct, 0) / capacityPctStops.length)
        : null;

      const bottleneckStop = capacityPctStops.reduce((current, stop) => {
        if (!current || stop.capacity_pct > current.capacity_pct) return stop;
        return current;
      }, null);

      const worstStopRank = stops.reduce((rank, stop) => Math.max(rank, this._statusRank(stop.capacity_status)), 0);
      const routeRank = routeCapacityPct === null ? 0 : this._statusRank(this._statusFromPct(routeCapacityPct));
      const statusRank = Math.max(worstStopRank, routeRank);

      return {
        tour: {
          id: tour.tour_id,
          name_vi: tour.tour_name_vi,
          name_en: tour.tour_name_en,
          slug: tour.tour_slug,
          status: tour.tour_status,
          duration_days: tour.duration_days,
          max_guests: this._toNumber(tour.max_guests),
          province_code: tour.province_code,
        },
        summary: {
          total_stops: stops.length,
          spot_stop_count: spotStops.length,
          capacity_tracked_stops: capacityTrackedStops.length,
          stops_without_capacity_data: spotStops.filter((stop) => stop.capacity_pct === null).length,
          stops_without_max_capacity: spotStops.filter((stop) => !stop.max_capacity || stop.max_capacity <= 0).length,
          total_current_visitors: totalCurrentVisitors,
          total_observed_visitors: totalObservedVisitors,
          total_max_capacity: totalMaxCapacity,
          route_capacity_pct: routeCapacityPct,
          avg_capacity_pct: avgCapacityPct,
          bottleneck_capacity_pct: bottleneckStop?.capacity_pct ?? null,
          bottleneck_stop: bottleneckStop ? {
            stop_id: bottleneckStop.stop_id,
            spot_id: bottleneckStop.spot_id,
            name_vi: bottleneckStop.spot_name_vi || bottleneckStop.title_vi,
            capacity_pct: bottleneckStop.capacity_pct,
            capacity_status: bottleneckStop.capacity_status,
          } : null,
          status: statusRank > 0 ? this._statusFromRank(statusRank) : 'unknown',
        },
        stops,
      };
    }, 30);
  }

  async getHistory(spotId, options = {}, viewer = {}) {
    await this._ensureSpotAccess(spotId, viewer?.user, { write: false });
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(options.limit, 10) || 100));
    const { logs, totalCount } = await CapacityRepository.getHistory(spotId, { ...options, page, limit });
    const result = formatPagination(logs, totalCount, page, limit);
    return { logs: result.data, pagination: result.pagination };
  }

  async getStats(spotId, options = {}, viewer = {}) {
    await this._ensureSpotAccess(spotId, viewer?.user, { write: false });
    return CapacityRepository.getStats(spotId, options);
  }

  async logCapacity(data, viewer = {}) {
    // Kiểm tra spot_id tồn tại trước khi ghi log
    await FKValidator.spot(data.spot_id);
    await this._ensureSpotAccess(data.spot_id, viewer?.user, { write: true });

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

    // Ghi notification vào DB cho target_roles (nếu có config), mặc định gửi department_manager + ministry_manager
    let roleIds = [];
    if (Array.isArray(config?.notify_roles) && config.notify_roles.length > 0) {
      // config.notify_roles đã là mảng role ID (số nguyên) được cấu hình tùy chỉnh
      roleIds = config.notify_roles.map((id) => Number(id)).filter(Boolean);
    } else {
      // Mặc định gửi cho department_manager + ministry_manager dựa theo code
      const defaultRoleCodes = ['department_manager', 'ministry_manager'];
      const { query: dbQuery } = require('../configs/database');
      const { rows: roleRows } = await dbQuery(
        `SELECT id FROM roles WHERE lower(code) = ANY($1::text[])`,
        [defaultRoleCodes.map((c) => String(c).toLowerCase())],
      );
      roleIds = roleRows.map((r) => Number(r.id)).filter(Boolean);
    }

    if (roleIds.length > 0) {
      await NotificationService.createNotificationForRoleIds({
        type: 'capacity_alert',
        title_vi: alertTitle,
        body_vi: alertBody,
        data: alertPayload,
        triggered_by: 'capacity_service',
      }, roleIds);
    }
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

  async getAlertConfigs(options = {}, viewer = {}) {
    const effectiveOptions = await this._applyAlertConfigScope(options, viewer?.user, { write: false });
    return CapacityRepository.getAlertConfigs(effectiveOptions);
  }

  async upsertAlertConfig(data, viewer = {}) {
    // Kiểm tra spot_id nếu cấu hình alert cho một spot cụ thể
    await FKValidator.all([
      FKValidator.spot(data.spot_id),
      FKValidator.province(data.province_code),
    ]);
    await this._applyAlertConfigScope(data, viewer?.user, { write: true });
    return CapacityRepository.upsertAlertConfig(data);
  }

  async updateSpotSettings(spotId, data, viewer = {}) {
    await FKValidator.spot(spotId);
    await this._ensureSpotAccess(spotId, viewer?.user, { write: true });
    
    const { query: dbQuery } = require('../configs/database');
    
    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (data.max_capacity !== undefined) {
      updates.push(`max_capacity = $${paramIdx++}`);
      values.push(data.max_capacity);
    }
    
    if (data.alert_threshold_pct !== undefined) {
      updates.push(`alert_threshold_pct = $${paramIdx++}`);
      values.push(data.alert_threshold_pct);
    }

    if (updates.length === 0) return null;

    values.push(spotId);
    
    const sql = `
      UPDATE tourism_spots 
      SET ${updates.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramIdx} 
      RETURNING max_capacity, alert_threshold_pct
    `;

    const { rows } = await dbQuery(sql, values);
    
    invalidateByPrefix('spot:');
    invalidateByPrefix('capacity:');
    
    return rows[0];
  }

  async updateTourSettings(tourId, data, viewer = {}) {
    await this._ensureTourAccess(tourId, viewer?.user);
    
    const { query: dbQuery } = require('../configs/database');
    const sql = `
      UPDATE tour_packages 
      SET max_guests = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING max_guests
    `;
    const { rows } = await dbQuery(sql, [data.max_guests, tourId]);
    
    invalidateByPrefix('tours:');
    invalidateByPrefix('capacity:');
    
    return rows[0];
  }

  async deleteTourSettings(tourId, viewer = {}) {
    await this._ensureTourAccess(tourId, viewer?.user);
    
    const { query: dbQuery } = require('../configs/database');
    const sql = `
      UPDATE tour_packages 
      SET max_guests = NULL, updated_at = NOW() 
      WHERE id = $1 
      RETURNING max_guests
    `;
    const { rows } = await dbQuery(sql, [tourId]);
    
    invalidateByPrefix('tours:');
    invalidateByPrefix('capacity:');
    
    return rows[0];
  }

  async _ensureTourAccess(tourId, user) {
    const TourRepository = require('../models/repositories/tour.repository');
    const tour = await TourRepository.findById(tourId);
    if (!tour) {
      throw new Api404Error('Không tìm thấy tour du lịch');
    }

    const roleCode = this._roleCode(user);
    
    // Admin, Ministry, Department can update tour settings
    const BYPASS_ROLES = new Set(['system_admin', 'ministry_manager', 'department_manager']);
    if (BYPASS_ROLES.has(roleCode)) {
      if (roleCode === 'department_manager') {
        const provinceCode = this._resolveProvinceCode(user);
        if (provinceCode && tour.province_code !== provinceCode) {
          throw new Api403Error('Sở chỉ được thao tác tour trong tỉnh của mình');
        }
      }
      return tour;
    }

    // Travel companies can manage their own tours
    if (roleCode === 'travel_company' || roleCode === 'service_provider') {
      if (!tour.business_id) {
        throw new Api403Error('Tour không gắn với doanh nghiệp — không thể xác định quyền sở hữu');
      }
      
      const BusinessRepository = require('../models/repositories/business.repository');
      const businesses = await BusinessRepository.findByOwnerId(user?.id);
      const businessIds = businesses.map(b => b.id);
      
      if (!businessIds.includes(tour.business_id)) {
        throw new Api403Error('Bạn không có quyền chỉnh sửa tour của doanh nghiệp khác');
      }
      return tour;
    }

    throw new Api403Error('Bạn không có quyền thao tác dữ liệu tour này');
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
        if (typeof client.flush === 'function') {
          client.flush();
        }
      } catch (err) {
        sseClients.delete(client);
      }
    });
  }

  getSSEClientCount() {
    return sseClients.size;
  }

  async _ensureSpotAccess(spotId, user, { write = false } = {}) {
    const spot = await CapacityRepository.getSpotAccessInfo(spotId);
    if (!spot) {
      throw new Api404Error('Không tìm thấy điểm du lịch');
    }

    const roleCode = this._roleCode(user);
    const userId = user?.id;

    if (write && GLOBAL_WRITE_ROLES.has(roleCode)) return spot;
    if (!write && GLOBAL_SPOT_ROLES.has(roleCode)) return spot;

    if (roleCode === 'ministry_manager') {
      if (write) {
        throw new Api403Error('Bộ chỉ được xem/giám sát dữ liệu sức chứa');
      }
      return spot;
    }

    if (DEPARTMENT_SPOT_ROLES.has(roleCode)) {
      const provinceCode = this._resolveProvinceCode(user);
      if (String(spot.province_code || '') === String(provinceCode)) return spot;
      throw new Api403Error('Sở chỉ được thao tác dữ liệu trong tỉnh của mình');
    }

    if (OWNER_SPOT_ROLES.has(roleCode)) {
      if (spot.created_by && String(spot.created_by) === String(userId)) return spot;

      const ownsThroughBusiness = await CapacityRepository.userOwnsSpotThroughBusiness(userId, spotId);
      if (ownsThroughBusiness) return spot;

      throw new Api403Error('Doanh nghiệp chỉ được thao tác điểm mình vận hành hoặc dịch vụ có liên kết');
    }

    throw new Api403Error('Bạn không có quyền thao tác dữ liệu sức chứa');
  }

  async _applyAlertConfigScope(options = {}, user, { write = false } = {}) {
    const roleCode = this._roleCode(user);
    const scoped = { ...options };

    if (write && GLOBAL_WRITE_ROLES.has(roleCode)) return scoped;
    if (!write && GLOBAL_SPOT_ROLES.has(roleCode)) return scoped;

    if (roleCode === 'ministry_manager') {
      if (write) {
        throw new Api403Error('Bộ chỉ được xem cấu hình cảnh báo sức chứa');
      }
      return scoped;
    }

    if (scoped.spot_id) {
      await this._ensureSpotAccess(scoped.spot_id, user, { write });
      return scoped;
    }

    if (DEPARTMENT_SPOT_ROLES.has(roleCode)) {
      const provinceCode = this._resolveProvinceCode(user, scoped);
      scoped.province_code = provinceCode;
      return scoped;
    }

    if (OWNER_SPOT_ROLES.has(roleCode)) {
      if (write) {
        throw new Api400Error('Doanh nghiệp cần chọn spot_id cụ thể để cấu hình cảnh báo');
      }
      scoped.owner_id = user?.id;
      return scoped;
    }

    scoped.spot_status = 'active';
    return scoped;
  }

  _applyListScope(options = {}, user) {
    const roleCode = this._roleCode(user);
    const scoped = { ...options };

    if (GLOBAL_SPOT_ROLES.has(roleCode)) {
      return scoped;
    }

    if (DEPARTMENT_SPOT_ROLES.has(roleCode)) {
      const provinceCode = this._resolveProvinceCode(user, scoped);
      scoped.province_code = provinceCode;
      return scoped;
    }

    if (OWNER_SPOT_ROLES.has(roleCode)) {
      scoped.owner_id = user?.id;
      return scoped;
    }

    scoped.spot_status = 'active';
    return scoped;
  }

  _resolveProvinceCode(user, options = {}) {
    return user?.province_code
      || user?.province?.code
      || user?.department?.province_code
      || user?.profile?.province_code
      || options.province_code
      || DEFAULT_DEPARTMENT_PROVINCE_CODE;
  }

  _roleCode(user) {
    return String(user?.role?.code || '').trim().toLowerCase();
  }

  _normalizeTourStopCapacity(stop) {
    return {
      ...stop,
      max_capacity: this._toNumber(stop.max_capacity),
      visitor_count: this._toNumber(stop.visitor_count),
      capacity_pct: this._toNumber(stop.capacity_pct),
      capacity_status: stop.capacity_status || null,
    };
  }

  _toNumber(value) {
    if (value === null || value === undefined) return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  _round(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  _statusRank(status) {
    const ranks = {
      normal: 1,
      busy: 2,
      near_full: 3,
      overloaded: 4,
    };
    return ranks[status] || 0;
  }

  _statusFromRank(rank) {
    if (rank >= 4) return 'overloaded';
    if (rank === 3) return 'near_full';
    if (rank === 2) return 'busy';
    if (rank === 1) return 'normal';
    return 'unknown';
  }

  _statusFromPct(capacityPct) {
    if (capacityPct >= 100) return 'overloaded';
    if (capacityPct >= 85) return 'near_full';
    if (capacityPct >= 60) return 'busy';
    return 'normal';
  }
}

module.exports = new CapacityService();

