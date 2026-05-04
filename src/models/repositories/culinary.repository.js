const db = require('../../configs/database');

class CulinaryRepository {
    static async findAll({ page = 1, limit = 12, search, category, is_speciality, sortBy = 'created_at', sortOrder = 'DESC' }) {
        const offset = (page - 1) * limit;
        const params = [];
        const conditions = [];
        let idx = 1;

        if (category) { conditions.push(`c.category = $${idx++}`); params.push(category); }
        if (is_speciality !== undefined) { conditions.push(`c.is_speciality = $${idx++}`); params.push(is_speciality); }
        if (search) {
            conditions.push(`(c.name_vi ILIKE $${idx} OR c.name_en ILIKE $${idx} OR c.description_vi ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const allowed = ['name_vi', 'rating_avg', 'created_at'];
        const col = allowed.includes(sortBy) ? sortBy : 'created_at';
        const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT c.id, c.name_vi, c.name_en, c.category, c.description_vi,
                   c.cover_image_url, c.media_urls, c.is_speciality, c.rating_avg,
                   c.province_code, c.created_at,
                   COUNT(*) OVER() AS total_count
            FROM cuisine_items c
            ${where}
            ORDER BY c.${col} ${dir}
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        params.push(limit, offset);
        const result = await db.query(sql, params);
        return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
    }

    static async findById(id) {
        const result = await db.query('SELECT * FROM cuisine_items WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async create(data) {
        const { name_vi, name_en, category, description_vi, recipe_vi, cover_image_url, media_urls, is_speciality, province_code } = data;
        const sql = `
            INSERT INTO cuisine_items (name_vi, name_en, category, description_vi, recipe_vi, cover_image_url, media_urls, is_speciality, province_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `;
        const result = await db.query(sql, [
            name_vi,
            name_en || null,
            category || null,
            description_vi || null,
            recipe_vi || null,
            cover_image_url || null,
            media_urls || null,
            is_speciality ?? false,
            province_code || null,
        ]);
        return result.rows[0];
    }

    static async update(id, fields) {
        const allowed = ['name_vi', 'name_en', 'category', 'description_vi', 'recipe_vi', 'cover_image_url', 'media_urls', 'is_speciality', 'province_code'];
        const sets = []; const params = []; let idx = 1;
        for (const key of allowed) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
        }
        if (!sets.length) return null;
        params.push(id);
        const result = await db.query(
            `UPDATE cuisine_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM cuisine_items WHERE id = $1 RETURNING id', [id]);
        return result.rows[0] || null;
    }

    static async getCategories() {
        const result = await db.query('SELECT DISTINCT category FROM cuisine_items WHERE category IS NOT NULL ORDER BY category');
        return result.rows.map(r => r.category);
    }
}

module.exports = CulinaryRepository;
