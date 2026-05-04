const crypto = require('crypto');
const MapAdminRepository = require('../models/repositories/map-admin.repository');
const { Api403Error, Api404Error, Api409Error } = require('../core/error.response');

class MapAdminService {
    static ADMIN_CODES = ['system_admin'];

    static ensureAdmin(user) {
        const code = String(user?.role?.code || '').toLowerCase();

        // Nếu chưa có role code trong profile, cho phép để không phá luồng quản trị nội bộ.
        if (!code) return;

        if (!this.ADMIN_CODES.includes(code)) {
            throw new Api403Error('Bạn không có quyền quản trị API bản đồ');
        }
    }

    static normalizePagination(query = {}) {
        return {
            page: Math.max(1, Number(query.page) || 1),
            limit: Math.max(1, Math.min(100, Number(query.limit) || 10)),
        };
    }

    static buildPagination(total, page, limit) {
        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ==================== CATEGORIES ====================
    static async listCategories(query, user) {
        this.ensureAdmin(user);
        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await MapAdminRepository.listCategories({ ...query, page, limit });
        return { items: rows, pagination: this.buildPagination(total, page, limit) };
    }

    static async createCategory(body, user) {
        this.ensureAdmin(user);
        try {
            return await MapAdminRepository.createCategory(body);
        } catch (error) {
            if (error?.code === '23505') {
                throw new Api409Error('Mã danh mục bản đồ đã tồn tại');
            }
            throw error;
        }
    }

    static async updateCategory(id, body, user) {
        this.ensureAdmin(user);
        try {
            const updated = await MapAdminRepository.updateCategory(id, body);
            if (!updated) throw new Api404Error('Không tìm thấy danh mục bản đồ');
            return updated;
        } catch (error) {
            if (error?.code === '23505') {
                throw new Api409Error('Mã danh mục bản đồ đã tồn tại');
            }
            throw error;
        }
    }

    static async deleteCategory(id, user) {
        this.ensureAdmin(user);
        const deleted = await MapAdminRepository.deactivateCategory(id);
        if (!deleted) throw new Api404Error('Không tìm thấy danh mục bản đồ');
        return deleted;
    }

    // ==================== LAYERS ====================
    static async listLayers(query, user) {
        this.ensureAdmin(user);
        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await MapAdminRepository.listLayers({ ...query, page, limit });
        return { items: rows, pagination: this.buildPagination(total, page, limit) };
    }

    static async createLayer(body, user) {
        this.ensureAdmin(user);

        try {
            return await MapAdminRepository.createLayer({
                ...body,
                created_by: user?.id || null,
            });
        } catch (error) {
            if (error?.code === '23505') {
                throw new Api409Error('Mã lớp bản đồ đã tồn tại');
            }
            throw error;
        }
    }

    static async updateLayer(id, body, user) {
        this.ensureAdmin(user);

        try {
            const updated = await MapAdminRepository.updateLayer(id, body);
            if (!updated) throw new Api404Error('Không tìm thấy lớp bản đồ');
            return updated;
        } catch (error) {
            if (error?.code === '23505') {
                throw new Api409Error('Mã lớp bản đồ đã tồn tại');
            }
            throw error;
        }
    }

    static async deleteLayer(id, user) {
        this.ensureAdmin(user);
        const deleted = await MapAdminRepository.deactivateLayer(id);
        if (!deleted) throw new Api404Error('Không tìm thấy lớp bản đồ');
        return deleted;
    }

    static async toggleLayerStatus(id, user) {
        this.ensureAdmin(user);
        const updated = await MapAdminRepository.toggleLayerStatus(id);
        if (!updated) throw new Api404Error('Không tìm thấy lớp bản đồ');
        return updated;
    }

    // ==================== MAP APIS ====================
    static async listMapApis(query, user) {
        this.ensureAdmin(user);
        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await MapAdminRepository.listMapApis({ ...query, page, limit });
        return { items: rows, pagination: this.buildPagination(total, page, limit) };
    }

    static async createMapApi(body, user) {
        this.ensureAdmin(user);

        try {
            return await MapAdminRepository.createMapApi(body);
        } catch (error) {
            if (error?.code === '23505') {
                throw new Api409Error('Slug API đã tồn tại');
            }
            throw error;
        }
    }

    static async updateMapApi(id, body, user) {
        this.ensureAdmin(user);

        try {
            const updated = await MapAdminRepository.updateMapApi(id, body);
            if (!updated) throw new Api404Error('Không tìm thấy API lớp bản đồ');
            return updated;
        } catch (error) {
            if (error?.code === '23505') {
                throw new Api409Error('Slug API đã tồn tại');
            }
            throw error;
        }
    }

    static async deleteMapApi(id, user) {
        this.ensureAdmin(user);
        const deleted = await MapAdminRepository.deleteMapApi(id);
        if (!deleted) throw new Api404Error('Không tìm thấy API lớp bản đồ');
        return deleted;
    }

    // ==================== PERMISSIONS ====================
    static async listApiPermissions(apiId, user) {
        this.ensureAdmin(user);
        const items = await MapAdminRepository.listApiPermissions(apiId);
        return { items, total: items.length };
    }

    static async upsertApiPermission(apiId, body, user) {
        this.ensureAdmin(user);
        return MapAdminRepository.upsertApiPermission(apiId, body);
    }

    static async deleteApiPermission(permissionId, user) {
        this.ensureAdmin(user);
        const deleted = await MapAdminRepository.deleteApiPermission(permissionId);
        if (!deleted) throw new Api404Error('Không tìm thấy cấu hình phân quyền API');
        return deleted;
    }

    // ==================== API KEYS ====================
    static async listApiKeys(query, user) {
        this.ensureAdmin(user);
        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await MapAdminRepository.listApiKeys({ ...query, page, limit });

        return {
            items: rows,
            pagination: this.buildPagination(total, page, limit),
        };
    }

    static async createApiKey(body, user) {
        this.ensureAdmin(user);

        const rawApiKey = `nb_${crypto.randomBytes(24).toString('hex')}`;
        const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

        const created = await MapAdminRepository.createApiKey({
            name: body.name,
            key_hash: keyHash,
            expires_at: body.expires_at || null,
            issued_to_user_id: body.issued_to_user_id || null,
            map_layer_api_ids: body.map_layer_api_ids,
            created_by: user?.id || null,
        });

        return {
            ...created,
            api_key: rawApiKey,
            warning: 'API key chỉ hiển thị một lần duy nhất. Hãy lưu trữ an toàn.',
        };
    }

    static async revokeApiKey(id, user) {
        this.ensureAdmin(user);
        const revoked = await MapAdminRepository.revokeApiKey(id);
        if (!revoked) throw new Api404Error('Không tìm thấy API key');
        return revoked;
    }
}

module.exports = MapAdminService;
