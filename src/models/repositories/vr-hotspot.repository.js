const { query } = require('../../configs/database');

class VrHotspotRepository {
    static async getByMediaId(mediaId) {
        const sql = `
            SELECT vh.*,
                ts.slug AS linked_spot_slug, ts.name_vi AS linked_spot_name
            FROM vr_hotspots vh
            LEFT JOIN tourism_spots ts ON ts.id = vh.linked_spot_id
            WHERE vh.media_id = $1
            ORDER BY vh.created_at ASC
        `;
        const { rows } = await query(sql, [mediaId]);
        return rows;
    }

    static async findById(id) {
        const { rows } = await query('SELECT * FROM vr_hotspots WHERE id = $1', [id]);
        return rows[0] || null;
    }

    static async create(data) {
        const sql = `
            INSERT INTO vr_hotspots (media_id, pitch, yaw, label_vi, label_en, linked_spot_id, target_url, icon_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const { rows } = await query(sql, [
            data.media_id,
            data.pitch ?? 0,
            data.yaw ?? 0,
            data.label_vi || null,
            data.label_en || null,
            data.linked_spot_id || null,
            data.target_url || null,
            data.icon_type || 'info',
        ]);
        return rows[0];
    }

    static async update(id, data) {
        const allowed = ['pitch', 'yaw', 'label_vi', 'label_en', 'linked_spot_id', 'target_url', 'icon_type'];
        const fields = Object.entries(data).filter(([k]) => allowed.includes(k) && data[k] !== undefined);
        if (!fields.length) return this.findById(id);
        const sets = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
        const values = [id, ...fields.map(([, v]) => v)];
        const { rows } = await query(
            `UPDATE vr_hotspots SET ${sets} WHERE id = $1 RETURNING *`,
            values
        );
        return rows[0] || null;
    }

    static async delete(id) {
        const { rowCount } = await query('DELETE FROM vr_hotspots WHERE id = $1', [id]);
        return rowCount > 0;
    }
}

module.exports = VrHotspotRepository;
