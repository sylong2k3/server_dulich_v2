const { query, getClient } = require('../../configs/database');
const MapCategory = require('../map-category.model');
const MapLayer = require('../map-layer.model');
const MapLayerApi = require('../map-layer-api.model');
const MapLayerApiPermission = require('../map-layer-api-permission.model');
const ApiKey = require('../api-key.model');

class MapAdminRepository {
    static resolveOrder(sortBy, sortOrder, allowedFields = [], fallback = 'created_at') {
        const field = allowedFields.includes(sortBy) ? sortBy : fallback;
        const direction = String(sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        return { field, direction };
    }

    // ==================== MAP CATEGORIES ====================
    static async listCategories({ page = 1, limit = 10, search, sortBy, sortOrder }) {
        const { field, direction } = this.resolveOrder(sortBy, sortOrder, ['id', 'code', 'name_vi', 'sort_order', 'created_at'], 'sort_order');
        const offset = (page - 1) * limit;
        const values = [];
        let p = 1;
        let whereClause = 'WHERE 1=1';

        if (search) {
            whereClause += ` AND (mc.code ILIKE $${p} OR mc.name_vi ILIKE $${p} OR COALESCE(mc.name_en, '') ILIKE $${p})`;
            values.push(`%${search}%`);
            p++;
        }

        const sql = `
      SELECT mc.*, COUNT(*) OVER() AS total_count
      FROM map_categories mc
      ${whereClause}
      ORDER BY mc.${field} ${direction}
      LIMIT $${p} OFFSET $${p + 1}
    `;

        values.push(limit, offset);
        const { rows } = await query(sql, values);
        const total = rows.length ? Number(rows[0].total_count) : 0;

        return {
            rows: rows.map(({ total_count, ...item }) => new MapCategory(item)),
            total,
        };
    }

    static async createCategory(data) {
        const sql = `
      INSERT INTO map_categories (code, name_vi, name_en, description, sort_order, is_active)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `;
        const { rows } = await query(sql, [
            data.code,
            data.name_vi,
            data.name_en || null,
            data.description || null,
            data.sort_order ?? 0,
            data.is_active ?? true,
        ]);
        return rows[0] ? new MapCategory(rows[0]) : null;
    }

    static async updateCategory(id, fields = {}) {
        const allowed = ['code', 'name_vi', 'name_en', 'description', 'sort_order', 'is_active'];
        const sets = [];
        const values = [];
        let p = 1;

        for (const field of allowed) {
            if (fields[field] !== undefined) {
                sets.push(`${field} = $${p}`);
                values.push(fields[field]);
                p++;
            }
        }

        if (!sets.length) {
            const { rows } = await query('SELECT * FROM map_categories WHERE id = $1', [id]);
            return rows[0] ? new MapCategory(rows[0]) : null;
        }

        values.push(id);
        const sql = `
      UPDATE map_categories
      SET ${sets.join(', ')}
      WHERE id = $${p}
      RETURNING *
    `;

        const { rows } = await query(sql, values);
        return rows[0] ? new MapCategory(rows[0]) : null;
    }

    static async deactivateCategory(id) {
        const sql = `
      UPDATE map_categories
      SET is_active = FALSE
      WHERE id = $1
      RETURNING *
    `;
        const { rows } = await query(sql, [id]);
        return rows[0] ? new MapCategory(rows[0]) : null;
    }

    // ==================== MAP LAYERS ====================
    static async listLayers({ page = 1, limit = 10, search, sortBy, sortOrder, category_id, status }) {
        const { field, direction } = this.resolveOrder(sortBy, sortOrder, ['id', 'code', 'name_vi', 'created_at', 'updated_at', 'sort_order'], 'updated_at');
        const offset = (page - 1) * limit;
        const values = [];
        let p = 1;
        const conditions = ['1=1'];

        if (search) {
            conditions.push(`(ml.code ILIKE $${p} OR ml.name_vi ILIKE $${p} OR COALESCE(ml.name_en, '') ILIKE $${p})`);
            values.push(`%${search}%`);
            p++;
        }

        if (category_id) {
            conditions.push(`ml.category_id = $${p}`);
            values.push(category_id);
            p++;
        }

        if (status) {
            conditions.push(`ml.status = $${p}`);
            values.push(status);
            p++;
        }

        const sql = `
      SELECT
        ml.*,
        mc.name_vi AS category_name,
        COUNT(*) OVER() AS total_count
      FROM map_layers ml
      LEFT JOIN map_categories mc ON mc.id = ml.category_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ml.${field} ${direction}
      LIMIT $${p} OFFSET $${p + 1}
    `;

        values.push(limit, offset);
        const { rows } = await query(sql, values);
        const total = rows.length ? Number(rows[0].total_count) : 0;

        return {
            rows: rows.map(({ total_count, ...item }) => new MapLayer(item)),
            total,
        };
    }

    static async createLayer(data) {
        const sql = `
      INSERT INTO map_layers (
        category_id,
        code,
        name_vi,
        name_en,
        layer_type,
        source_url,
        style_json,
        min_zoom,
        max_zoom,
        is_default_visible,
        sort_order,
        status,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `;

        const { rows } = await query(sql, [
            data.category_id,
            data.code,
            data.name_vi,
            data.name_en || null,
            data.layer_type,
            data.source_url || null,
            data.style_json ? JSON.stringify(data.style_json) : null,
            data.min_zoom ?? 0,
            data.max_zoom ?? 22,
            data.is_default_visible ?? true,
            data.sort_order ?? 0,
            data.status || 'active',
            data.created_by || null,
        ]);

        return rows[0] ? new MapLayer(rows[0]) : null;
    }

    static async updateLayer(id, fields = {}) {
        const allowed = [
            'category_id',
            'code',
            'name_vi',
            'name_en',
            'layer_type',
            'source_url',
            'style_json',
            'min_zoom',
            'max_zoom',
            'is_default_visible',
            'sort_order',
            'status',
        ];

        const sets = [];
        const values = [];
        let p = 1;

        for (const field of allowed) {
            if (fields[field] !== undefined) {
                if (field === 'style_json') {
                    sets.push(`${field} = $${p}::jsonb`);
                    values.push(fields[field] ? JSON.stringify(fields[field]) : null);
                } else {
                    sets.push(`${field} = $${p}`);
                    values.push(fields[field]);
                }
                p++;
            }
        }

        if (!sets.length) {
            const { rows } = await query('SELECT * FROM map_layers WHERE id = $1', [id]);
            return rows[0] ? new MapLayer(rows[0]) : null;
        }

        sets.push('updated_at = NOW()');
        values.push(id);

        const sql = `
      UPDATE map_layers
      SET ${sets.join(', ')}
      WHERE id = $${p}
      RETURNING *
    `;

        const { rows } = await query(sql, values);
        return rows[0] ? new MapLayer(rows[0]) : null;
    }

    static async deactivateLayer(id) {
        const sql = `
      UPDATE map_layers
      SET status = 'inactive', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const { rows } = await query(sql, [id]);
        return rows[0] ? new MapLayer(rows[0]) : null;
    }

    static async toggleLayerStatus(id) {
        const sql = `
      UPDATE map_layers
      SET
        status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const { rows } = await query(sql, [id]);
        return rows[0] ? new MapLayer(rows[0]) : null;
    }

    // ==================== MAP APIS ====================
    static async listMapApis({ page = 1, limit = 10, search, sortBy, sortOrder, category_id, map_layer_id, status }) {
        const { field, direction } = this.resolveOrder(sortBy, sortOrder, ['id', 'name', 'slug', 'created_at', 'updated_at', 'published_at'], 'updated_at');
        const offset = (page - 1) * limit;
        const values = [];
        let p = 1;
        const conditions = ['1=1'];

        if (search) {
            conditions.push(`(mla.name ILIKE $${p} OR mla.slug ILIKE $${p} OR COALESCE(mla.description, '') ILIKE $${p})`);
            values.push(`%${search}%`);
            p++;
        }

        if (category_id) {
            conditions.push(`mla.category_id = $${p}`);
            values.push(category_id);
            p++;
        }

        if (map_layer_id) {
            conditions.push(`mla.map_layer_id = $${p}`);
            values.push(map_layer_id);
            p++;
        }

        if (status) {
            conditions.push(`mla.status = $${p}`);
            values.push(status);
            p++;
        }

        const sql = `
      SELECT
        mla.*,
        mc.name_vi AS category_name,
        ml.name_vi AS map_layer_name,
        COUNT(*) OVER() AS total_count
      FROM map_layer_apis mla
      LEFT JOIN map_categories mc ON mc.id = mla.category_id
      LEFT JOIN map_layers ml ON ml.id = mla.map_layer_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY mla.${field} ${direction}
      LIMIT $${p} OFFSET $${p + 1}
    `;

        values.push(limit, offset);
        const { rows } = await query(sql, values);
        const total = rows.length ? Number(rows[0].total_count) : 0;

        return {
            rows: rows.map(({ total_count, ...item }) => new MapLayerApi(item)),
            total,
        };
    }

    static async createMapApi(data) {
        const sql = `
      INSERT INTO map_layer_apis (
        category_id,
        map_layer_id,
        name,
        slug,
        description,
        endpoint_url,
        http_method,
        status,
        published_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
        CASE WHEN $8 = 'published' THEN NOW() ELSE NULL END
      )
      RETURNING *
    `;

        const { rows } = await query(sql, [
            data.category_id || null,
            data.map_layer_id || null,
            data.name,
            data.slug,
            data.description || null,
            data.endpoint_url,
            data.http_method || 'GET',
            data.status || 'draft',
        ]);

        return rows[0] ? new MapLayerApi(rows[0]) : null;
    }

    static async updateMapApi(id, fields = {}) {
        const allowed = ['category_id', 'map_layer_id', 'name', 'slug', 'description', 'endpoint_url', 'http_method', 'status'];
        const sets = [];
        const values = [];
        let p = 1;

        for (const field of allowed) {
            if (fields[field] !== undefined) {
                sets.push(`${field} = $${p}`);
                values.push(fields[field]);
                p++;
            }
        }

        if (!sets.length) {
            const { rows } = await query('SELECT * FROM map_layer_apis WHERE id = $1', [id]);
            return rows[0] ? new MapLayerApi(rows[0]) : null;
        }

        if (fields.status === 'published') {
            sets.push('published_at = COALESCE(published_at, NOW())');
        }

        sets.push('updated_at = NOW()');
        values.push(id);

        const sql = `
      UPDATE map_layer_apis
      SET ${sets.join(', ')}
      WHERE id = $${p}
      RETURNING *
    `;

        const { rows } = await query(sql, values);
        return rows[0] ? new MapLayerApi(rows[0]) : null;
    }

    static async deleteMapApi(id) {
        const { rows } = await query('DELETE FROM map_layer_apis WHERE id = $1 RETURNING *', [id]);
        return rows[0] ? new MapLayerApi(rows[0]) : null;
    }

    // ==================== API PERMISSIONS ====================
    static async listApiPermissions(mapApiId) {
        const sql = `
      SELECT
        p.*,
        u.full_name AS user_name,
        r.name_vi AS role_name
      FROM map_layer_api_permissions p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN roles r ON r.id = p.role_id
      WHERE p.map_layer_api_id = $1
      ORDER BY p.id DESC
    `;

        const { rows } = await query(sql, [mapApiId]);
        return rows.map((row) => new MapLayerApiPermission(row));
    }

    static async upsertApiPermission(mapApiId, data) {
        const findSql = `
      SELECT id
      FROM map_layer_api_permissions
      WHERE map_layer_api_id = $1
        AND principal_type = $2
        AND (
          ($2 = 'user' AND user_id = $3::uuid) OR
          ($2 = 'role' AND role_id = $4::int) OR
          ($2 = 'public' AND user_id IS NULL AND role_id IS NULL)
        )
      LIMIT 1
    `;

        const existing = await query(findSql, [mapApiId, data.principal_type, data.user_id || null, data.role_id || null]);
        const existingId = existing.rows[0]?.id;

        if (existingId) {
            const updateSql = `
        UPDATE map_layer_api_permissions
        SET
          can_view = $1,
          can_edit = $2,
          can_delete = $3
        WHERE id = $4
        RETURNING *
      `;
            const { rows } = await query(updateSql, [
                data.can_view ?? true,
                data.can_edit ?? false,
                data.can_delete ?? false,
                existingId,
            ]);
            return rows[0] ? new MapLayerApiPermission(rows[0]) : null;
        }

        const insertSql = `
      INSERT INTO map_layer_api_permissions (
        map_layer_api_id,
        principal_type,
        user_id,
        role_id,
        can_view,
        can_edit,
        can_delete
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `;

        const { rows } = await query(insertSql, [
            mapApiId,
            data.principal_type,
            data.user_id || null,
            data.role_id || null,
            data.can_view ?? true,
            data.can_edit ?? false,
            data.can_delete ?? false,
        ]);

        return rows[0] ? new MapLayerApiPermission(rows[0]) : null;
    }

    static async deleteApiPermission(permissionId) {
        const { rows } = await query('DELETE FROM map_layer_api_permissions WHERE id = $1 RETURNING *', [permissionId]);
        return rows[0] ? new MapLayerApiPermission(rows[0]) : null;
    }

    // ==================== API KEYS ====================
    static async listApiKeys({ page = 1, limit = 10, search, status }) {
        const offset = (page - 1) * limit;
        const values = [];
        let p = 1;
        const conditions = ['1=1'];

        if (search) {
            conditions.push(`k.name ILIKE $${p}`);
            values.push(`%${search}%`);
            p++;
        }

        const effectiveStatusSql = `
      CASE
        WHEN k.status = 'active' AND k.expires_at IS NOT NULL AND k.expires_at < NOW() THEN 'expired'
        ELSE k.status
      END
    `;

        if (status) {
            conditions.push(`${effectiveStatusSql} = $${p}`);
            values.push(status);
            p++;
        }

        const sql = `
      SELECT
        k.*,
        ${effectiveStatusSql} AS effective_status,
        COUNT(amka.map_layer_api_id) AS api_count,
        COUNT(*) OVER() AS total_count
      FROM api_keys k
      LEFT JOIN api_key_map_layer_apis amka ON amka.api_key_id = k.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY k.id
      ORDER BY k.created_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `;

        values.push(limit, offset);

        const { rows } = await query(sql, values);
        const total = rows.length ? Number(rows[0].total_count) : 0;

        return {
            rows: rows.map(({ total_count, ...item }) => new ApiKey(item)),
            total,
        };
    }

    static async createApiKey({ name, key_hash, expires_at, issued_to_user_id, map_layer_api_ids = [] }) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            const insertKeySql = `
        INSERT INTO api_keys (name, key_hash, expires_at, issued_to_user_id, status)
        VALUES ($1,$2,$3,$4,'active')
        RETURNING *
      `;

            const keyResult = await client.query(insertKeySql, [
                name,
                key_hash,
                expires_at || null,
                issued_to_user_id || null,
            ]);

            const createdKey = keyResult.rows[0];

            const uniqueApiIds = [...new Set(map_layer_api_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];

            if (uniqueApiIds.length > 0) {
                const mapSql = `
          INSERT INTO api_key_map_layer_apis (api_key_id, map_layer_api_id)
          SELECT $1, unnest($2::int[])
          ON CONFLICT (api_key_id, map_layer_api_id) DO NOTHING
        `;

                await client.query(mapSql, [createdKey.id, uniqueApiIds]);
            }

            await client.query('COMMIT');
            return new ApiKey(createdKey);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async revokeApiKey(id) {
        const sql = `
      UPDATE api_keys
      SET status = 'revoked', revoked_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

        const { rows } = await query(sql, [id]);
        return rows[0] ? new ApiKey(rows[0]) : null;
    }
}

module.exports = MapAdminRepository;
