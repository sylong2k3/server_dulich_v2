const { pool } = require('../../configs/database');

class IntegrationRepository {
  static async findAll({ page = 1, limit = 20, search, is_active } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(provider_code ILIKE $${idx} OR provider_name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (is_active !== undefined) {
      conditions.push(`is_active = $${idx++}`);
      params.push(is_active);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM external_integrations
       ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = rows[0] ? parseInt(rows[0].total_count) : 0;
    return { rows: rows.map(({ total_count, credentials, ...r }) => r), total };
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM external_integrations WHERE id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const { credentials, ...rest } = rows[0];
    return rest;
  }

  static async create(data) {
    const {
      provider_code, provider_name, integration_type, base_url,
      auth_type, credentials, webhook_secret, is_active = true,
    } = data;
    const { rows } = await pool.query(
      `INSERT INTO external_integrations
         (provider_code, provider_name, integration_type, base_url, auth_type, credentials, webhook_secret, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, provider_code, provider_name, integration_type, base_url, auth_type, webhook_secret, is_active, last_sync_at, created_at, updated_at`,
      [provider_code, provider_name, integration_type, base_url, auth_type, credentials ?? null, webhook_secret ?? null, is_active]
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['provider_name', 'base_url', 'auth_type', 'credentials', 'webhook_secret', 'is_active'];
    const sets = [];
    const params = [];
    let idx = 1;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        sets.push(`${key} = $${idx++}`);
        params.push(key === 'credentials' ? JSON.stringify(data[key]) : data[key]);
      }
    }
    if (!sets.length) return this.findById(id);

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE external_integrations SET ${sets.join(', ')} WHERE id = $${idx}
       RETURNING id, provider_code, provider_name, integration_type, base_url, auth_type, webhook_secret, is_active, last_sync_at, created_at, updated_at`,
      params
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM external_integrations WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  static async markSynced(id) {
    await pool.query(
      `UPDATE external_integrations SET last_sync_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  // Sync logs
  static async createSyncLog(data) {
    const { integration_id, job_type, status, request_payload, response_payload, error_message } = data;
    const { rows } = await pool.query(
      `INSERT INTO integration_sync_logs (integration_id, job_type, status, request_payload, response_payload, error_message)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [integration_id, job_type ?? null, status, request_payload ?? null, response_payload ?? null, error_message ?? null]
    );
    return rows[0];
  }

  static async finishSyncLog(logId, { status, response_payload, error_message }) {
    const { rows } = await pool.query(
      `UPDATE integration_sync_logs
       SET status = $1, response_payload = $2, error_message = $3, finished_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, response_payload ?? null, error_message ?? null, logId]
    );
    return rows[0];
  }

  static async findSyncLogs(integrationId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM integration_sync_logs
       WHERE integration_id = $1
       ORDER BY started_at DESC
       LIMIT $2 OFFSET $3`,
      [integrationId, limit, offset]
    );
    const total = rows[0] ? parseInt(rows[0].total_count) : 0;
    return { rows: rows.map(({ total_count, ...r }) => r), total };
  }
}

module.exports = IntegrationRepository;
