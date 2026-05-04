const IntegrationRepository = require('../models/repositories/integration.repository');
const { Api404Error, Api400Error } = require('../core/error.response');

class IntegrationService {
  static async list(query) {
    const { page = 1, limit = 20, search, is_active } = query;
    const { rows, total } = await IntegrationRepository.findAll({ page, limit, search, is_active });
    return {
      items: rows,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id) {
    const item = await IntegrationRepository.findById(id);
    if (!item) throw new Api404Error('Không tìm thấy tích hợp');
    return item;
  }

  static async create(data) {
    return IntegrationRepository.create(data);
  }

  static async update(id, data) {
    const existing = await IntegrationRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy tích hợp');
    const updated = await IntegrationRepository.update(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy tích hợp');
    return updated;
  }

  static async delete(id) {
    const existing = await IntegrationRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy tích hợp');
    await IntegrationRepository.delete(id);
  }

  static async triggerSync(integrationId, triggeredBy) {
    const integration = await IntegrationRepository.findById(integrationId);
    if (!integration) throw new Api404Error('Không tìm thấy tích hợp');
    if (!integration.is_active) throw new Api400Error('Tích hợp đang bị vô hiệu hóa');

    const log = await IntegrationRepository.createSyncLog({
      integration_id: integrationId,
      job_type: 'manual_sync',
      status: 'running',
      request_payload: { triggered_by: triggeredBy },
    });

    // Placeholder: thực tế gọi external API và xử lý response
    try {
      // Simulate sync result
      await IntegrationRepository.markSynced(integrationId);
      const finished = await IntegrationRepository.finishSyncLog(log.id, {
        status: 'success',
        response_payload: { message: 'Sync completed' },
      });
      return { sync_log: finished };
    } catch (err) {
      await IntegrationRepository.finishSyncLog(log.id, {
        status: 'failed',
        error_message: err.message,
      });
      throw err;
    }
  }

  static async getLogs(integrationId, query) {
    const existing = await IntegrationRepository.findById(integrationId);
    if (!existing) throw new Api404Error('Không tìm thấy tích hợp');
    const { page = 1, limit = 20 } = query;
    const { rows, total } = await IntegrationRepository.findSyncLogs(integrationId, { page, limit });
    return {
      items: rows,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

module.exports = IntegrationService;
