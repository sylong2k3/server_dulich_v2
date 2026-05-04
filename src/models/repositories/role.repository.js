const { query } = require('../../configs/database');
const { create, updateById, exists } = require("../../utils/database");
const Role = require('../role.model');

class RoleRepository {
    static cache = new Map();
    static cacheExpiry = 15 * 60 * 1000; // 15 minutes

    static getCachedRole(id) {
        const item = this.cache.get(id);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.cacheExpiry) {
            this.cache.delete(id);
            return null;
        }

        return item.role;
    }

    static setCachedRole(id, role) {
        this.cache.set(id, {
            role,
            timestamp: Date.now()
        });
    }

    /** 🔍 Tìm role theo ID với cache */
    static async findRoleById(id) {
        const cached = this.getCachedRole(id);
        if (cached) return cached;

        const sql = 'SELECT * FROM roles WHERE id = $1';
        const { rows } = await query(sql, [id]);

        if (rows[0]) {
            const role = new Role(rows[0]);
            this.setCachedRole(id, role);
            return role;
        }

        return null;
    }

    static async getAllRoles(options = {}) {
        const {
            page,
            limit,
            search,
            sortBy,
            sortOrder,
            sort_by,
            sort_order,
        } = options;
        const safeSortBy = sortBy || sort_by;
        const safeSortOrder = sortOrder || sort_order || "DESC";
        const values = [];
        let sql = `SELECT *, COUNT(*) OVER() as total_count FROM roles WHERE 1=1`;
        let paramCount = 1;

        if (search) {
            sql += ` AND (code ILIKE $${paramCount} OR name_vi ILIKE $${paramCount} OR name_en ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
            values.push(`%${search}%`);
            paramCount++;
        }
        const allowedSortFields = ["created_at", "code", "name_vi", "id"];
        const sortField = allowedSortFields.includes(safeSortBy) ? safeSortBy : "id";
        const order = safeSortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        sql += ` ORDER BY ${sortField} ${order}`;
        if (limit && page) {
            sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
            values.push(limit, (page - 1) * limit);
        }
        const { rows } = await query(sql, values);
        const roles = rows.map((row) => new Role(row));
        const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

        return { roles, totalCount };
    }

    static async createRole(roleData) {
        const newRole = await create("roles", roleData);
        return new Role(newRole);
    }

    static async updateRole(id, updates) {
        const cleanData = Object.fromEntries(
            Object.entries(updates).filter(([, v]) => v !== undefined)
        );
        if (!Object.keys(cleanData).length) throw new Error("No data to update");
        await updateById("roles", id, cleanData);
        this.cache.delete(id);
        return await this.findRoleById(id);
    }

    static async deleteRole(id) {
        const sql = 'DELETE FROM roles WHERE id = $1 RETURNING *';
        const { rows } = await query(sql, [id]);
        if (rows[0]) {
            this.cache.delete(id);
            return new Role(rows[0]);
        }
        return null;
    }

    static async roleExists(id) {
        return await exists("roles", { id });
    }

    static async findRoleByCode(code) {
        const sql = 'SELECT * FROM roles WHERE code = $1';
        const { rows } = await query(sql, [code]);
        return rows[0] ? new Role(rows[0]) : null;
    }

    static async existsByCode(code, excludeId = null) {
        let sql = 'SELECT COUNT(*) AS count FROM roles WHERE code ILIKE $1';
        const values = [code];

        if (excludeId) {
            sql += ' AND id != $2';
            values.push(excludeId);
        }

        const { rows } = await query(sql, values);
        return Number(rows[0].count) > 0;
    }

    static async existsByName(name, excludeId = null) {
        if (!name) return false;
        let sql = 'SELECT COUNT(*) AS count FROM roles WHERE name_vi ILIKE $1';
        const values = [name];

        if (excludeId) {
            sql += ' AND id != $2';
            values.push(excludeId);
        }

        const { rows } = await query(sql, values);
        return Number(rows[0].count) > 0;
    }
}

module.exports = RoleRepository;
