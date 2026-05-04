const { query } = require('../../configs/database');

// Cấu hình các bảng và trường tìm kiếm cho Du Lịch Ninh Bình 2.0
const SEARCH_CONFIGS = {
    spots: {
        table: 'tourism_spots',
        label: 'Điểm du lịch',
        searchFields: ['name_vi', 'name_en', 'description_vi', 'address_vi', 'slug'],
        selectFields: `id, name_vi, name_en, slug, description_vi, address_vi, status, is_featured, rating_avg, created_at`,
        conditions: [`status = 'active'`],
        useFTS: true,
    },
    businesses: {
        table: 'businesses',
        label: 'Doanh nghiệp',
        searchFields: ['business_name', 'description_vi', 'address_vi', 'business_code'],
        selectFields: `id, business_name, business_type, description_vi, address_vi, status, rating_avg, created_at`,
        conditions: [`status = 'approved'`],
    },
    vlogs: {
        table: 'vlogs',
        label: 'Bài viết cộng đồng',
        searchFields: ['title', 'content', 'excerpt'],
        selectFields: `id, title, excerpt, cover_image_url, view_count, like_count, status, platform, created_at`,
        conditions: [`status = 'published'`],
    },
    cuisine: {
        table: 'cuisine_items',
        label: 'Ẩm thực',
        searchFields: ['name_vi', 'name_en', 'description_vi'],
        selectFields: `id, name_vi, name_en, category, description_vi, cover_image_url, is_speciality, rating_avg, created_at`,
        conditions: [],
    },
    festivals: {
        table: 'festivals',
        label: 'Lễ hội',
        searchFields: ['name_vi', 'name_en', 'description_vi'],
        selectFields: `id, name_vi, name_en, festival_type, description_vi, start_date, end_date, cover_image_url, created_at`,
        conditions: [`is_published = true`],
    },
    ocop: {
        table: 'ocop_products',
        label: 'Sản phẩm OCOP',
        searchFields: ['name_vi', 'name_en', 'description_vi'],
        selectFields: `id, name_vi, name_en, category, description_vi, star_rating, price_vnd, cover_image_url, created_at`,
        conditions: [`is_active = true`],
    },
    users: {
        table: 'users',
        label: 'Người dùng',
        searchFields: ['full_name', 'email', 'phone'],
        selectFields: `id, email, full_name, phone, avatar_url, is_active, created_at`,
        conditions: [`is_active = true`],
    },
};

class SearchRepository {

    static getConfig(type) {
        return SEARCH_CONFIGS[type] || null;
    }

    static getAvailableTypes() {
        return Object.entries(SEARCH_CONFIGS).map(([key, config]) => ({
            type: key,
            label: config.label,
            searchFields: config.searchFields,
        }));
    }

    static MAX_RESULTS = 20;

    /**
     * Tìm kiếm theo loại cụ thể
     */
    static async search(type, options = {}) {
        const config = SEARCH_CONFIGS[type];
        if (!config) return [];

        const { search } = options;
        const values = [];
        let p = 1;
        let where = 'WHERE 1=1';

        for (const cond of config.conditions) {
            where += ` AND ${cond}`;
        }

        if (search) {
            // Nếu table có full-text search (tourism_spots)
            if (config.useFTS) {
                where += ` AND (
                    search_vector @@ plainto_tsquery('simple', $${p})
                    OR name_vi ILIKE $${p + 1}
                    OR name_en ILIKE $${p + 1}
                )`;
                values.push(search, `%${search}%`);
                p += 2;
            } else {
                const ilikeConditions = config.searchFields
                    .map(field => `${field} ILIKE $${p}`)
                    .join(' OR ');
                where += ` AND (${ilikeConditions})`;
                values.push(`%${search}%`);
                p++;
            }
        }

        const sql = `
            SELECT ${config.selectFields}
            FROM ${config.table}
            ${where}
            ORDER BY created_at DESC
            LIMIT $${p}
        `;
        values.push(this.MAX_RESULTS);

        const result = await query(sql, values);
        return result.rows;
    }

    /**
     * Tìm kiếm toàn hệ thống (multi-type)
     */
    static async searchAll(searchTerm, types = null) {
        const searchTypes = (types || Object.keys(SEARCH_CONFIGS))
            .filter(type => SEARCH_CONFIGS[type]);

        const entries = await Promise.all(
            searchTypes.map(async (type) => {
                const config = SEARCH_CONFIGS[type];
                const items = await this.search(type, { search: searchTerm });
                return [type, { label: config.label, items }];
            })
        );

        return Object.fromEntries(entries);
    }
}

module.exports = SearchRepository;
