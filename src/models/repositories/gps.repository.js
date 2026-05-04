const { Api400Error } = require('../../core/error.response');

const normalizePoint = (point, index) => {
    if (!point || typeof point !== 'object') {
        throw new Api400Error(`Điểm GPS thứ ${index + 1} không hợp lệ`);
    }

    const lat = Number(point.lat);
    const lng = Number(point.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Api400Error(`Điểm GPS thứ ${index + 1} thiếu lat/lng hợp lệ`);
    }

    if (lat < -90 || lat > 90) {
        throw new Api400Error(`Điểm GPS thứ ${index + 1} có lat ngoài phạm vi [-90, 90]`);
    }

    if (lng < -180 || lng > 180) {
        throw new Api400Error(`Điểm GPS thứ ${index + 1} có lng ngoài phạm vi [-180, 180]`);
    }

    return { ...point, lat, lng };
};

class GpsRepository {
    static async createTrack(client, data) {
        const { track_type, user_id } = data;
        const { rows } = await client.query(
            `INSERT INTO gps_tracks (user_id, track_type)
             VALUES ($1, $2)
             RETURNING *`,
            [user_id, track_type]
        );
        return rows[0];
    }

    /**
     * Tìm track theo ID — dùng để kiểm tra ownership tại service layer.
     */
    static async findTrackById(client, trackId) {
        const { rows } = await client.query(
            `SELECT id, user_id, ended_at FROM gps_tracks WHERE id = $1`,
            [trackId]
        );
        return rows[0] || null;
    }

    static async endTrack(client, trackId, totalDistance, geomLine) {
        const { rows } = await client.query(
            `UPDATE gps_tracks
             SET ended_at = NOW(), total_distance_m = $1, geom_line = ST_GeomFromGeoJSON($2)
             WHERE id = $3
             RETURNING *`,
            [totalDistance, geomLine, trackId]
        );
        return rows[0] || null;
    }

    static async addTrackPoints(client, trackId, points) {
        if (!points || points.length === 0) return [];

        const normalizedPoints = points.map((point, index) => normalizePoint(point, index));

        const values = [];
        const placeholders = normalizedPoints.map((p, index) => {
            const base = index * 8;
            values.push(
                trackId,
                p.lng,
                p.lat,
                p.altitude_m ?? null,
                p.speed_kmh ?? null,
                p.accuracy_m ?? null,
                p.battery_pct ?? null,
                p.recorded_at ?? null
            );
            return `(
                $${base + 1},
                ST_SetSRID(ST_MakePoint($${base + 2}, $${base + 3}), 4326),
                $${base + 4},
                $${base + 5},
                $${base + 6},
                $${base + 7},
                $${base + 8}
            )`;
        }).join(',');

        const { rows } = await client.query(
            `INSERT INTO gps_track_points
                 (track_id, geom, altitude_m, speed_kmh, accuracy_m, battery_pct, recorded_at)
             VALUES ${placeholders}
             RETURNING id, ST_X(geom) AS lng, ST_Y(geom) AS lat, recorded_at`,
            values
        );
        return rows;
    }

    /**
     * FIX: Cast sang ::geography để ST_DWithin dùng đơn vị MÉT.
     * Trước đây dùng geometry → radius_m=50 thực chất là 50 độ (~5500 km).
     */
    static async detectGeofence(client, { lat, lng, radius_m = 50 }) {
        const { rows } = await client.query(
            `SELECT id, name_vi
             FROM tourism_spots
             WHERE status = 'active'
               AND ST_DWithin(
                   geom::geography,
                   ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                   $3
               )
             LIMIT 10`,
            [lng, lat, radius_m]
        );
        return rows;
    }

    static async recordUserVisit(client, userId, spotId) {
        // Placeholder — bảng user_visit_history chưa có trong migration hiện tại.
        // Khi bảng được tạo, bỏ comment:
        // await client.query(
        //     `INSERT INTO user_visit_history (user_id, spot_id, visited_at)
        //      VALUES ($1, $2, NOW())
        //      ON CONFLICT (user_id, spot_id) DO UPDATE SET visited_at = NOW()`,
        //     [userId, spotId]
        // );
        return null;
    }
}

module.exports = GpsRepository;
