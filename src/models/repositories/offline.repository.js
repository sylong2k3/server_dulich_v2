const { query } = require('../../configs/database');

class OfflineRepository {
    static async createDownloadRequest(client, data) {
        const { rows } = await client.query(
            `INSERT INTO offline_downloads (
                user_id, area_name, province_code, geom_bounds, zoom_min, zoom_max, size_mb, tile_count
            ) VALUES (
                $1, $2, $3, ST_MakeEnvelope($4, $5, $6, $7, 4326), $8, $9, $10, $11
            ) RETURNING *`,
            [
                data.user_id,
                data.area_name,
                data.province_code,
                data.bounds.minLng, data.bounds.minLat,
                data.bounds.maxLng, data.bounds.maxLat,
                data.zoom_min,
                data.zoom_max,
                data.size_mb,
                data.tile_count,
            ]
        );
        return rows[0];
    }

    /**
     * FIX #1: Dùng query() từ database config thay vì truyền pool trực tiếp.
     * pool.query() hoạt động nhưng không nhất quán với pattern của toàn dự án.
     */
    static async getDownloadsByUser(userId) {
        const { rows } = await query(
            `SELECT id, area_name, province_code, zoom_min, zoom_max,
                    size_mb, tile_count, status, downloaded_at,
                    ST_AsGeoJSON(geom_bounds)::json AS bounds_geojson
             FROM offline_downloads
             WHERE user_id = $1
             ORDER BY downloaded_at DESC`,
            [userId]
        );
        return rows;
    }

    /**
     * Tìm 1 bản ghi theo ID — dùng cho GET /:id và ownership check trước DELETE.
     */
    static async findById(id) {
        const { rows } = await query(
            `SELECT id, user_id, area_name, province_code, zoom_min, zoom_max,
                    size_mb, tile_count, status, downloaded_at,
                    ST_AsGeoJSON(geom_bounds)::json AS bounds_geojson
             FROM offline_downloads
             WHERE id = $1`,
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Xóa bản ghi — chỉ gọi sau khi đã verify ownership tại service layer.
     */
    static async deleteById(id) {
        const { rows } = await query(
            `DELETE FROM offline_downloads WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = OfflineRepository;