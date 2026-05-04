const { Api400Error, Api403Error, Api404Error } = require('../core/error.response');
const { withTransaction } = require('../utils/database');
const GpsRepository = require('../models/repositories/gps.repository');

class GpsService {
    static async startTrack(userId, data) {
        return await withTransaction(async (client) => {
            return await GpsRepository.createTrack(client, {
                user_id: userId,
                track_type: data.track_type,
            });
        });
    }

    /**
     * FIX: Kiểm tra ownership trước khi kết thúc track.
     * User chỉ được endTrack của chính mình.
     */
    static async endTrack(userId, trackId, data) {
        return await withTransaction(async (client) => {
            const track = await GpsRepository.findTrackById(client, trackId);
            if (!track) throw new Api404Error('Lộ trình GPS không tồn tại');
            if (String(track.user_id) !== String(userId)) {
                throw new Api403Error('Bạn không có quyền kết thúc lộ trình này');
            }
            if (track.ended_at) {
                throw new Api400Error('Lộ trình này đã kết thúc');
            }

            return await GpsRepository.endTrack(client, trackId, data.total_distance_m, data.geom_line);
        });
    }

    /**
     * FIX: Kiểm tra ownership trước khi đồng bộ điểm GPS.
     * User chỉ được syncPoints vào track của chính mình.
     */
    static async syncPoints(userId, trackId, data) {
        return await withTransaction(async (client) => {
            const track = await GpsRepository.findTrackById(client, trackId);
            if (!track) throw new Api404Error('Lộ trình GPS không tồn tại');
            if (String(track.user_id) !== String(userId)) {
                throw new Api403Error('Bạn không có quyền cập nhật lộ trình này');
            }
            if (track.ended_at) {
                throw new Api400Error('Lộ trình đã kết thúc, không thể thêm điểm');
            }

            const { points } = data;
            if (!points || !points.length) throw new Api400Error('Không có điểm GPS');

            const savedPoints = await GpsRepository.addTrackPoints(client, trackId, points);

            // Geofence: kiểm tra điểm mới nhất có gần điểm du lịch không
            const latestPoint = points[points.length - 1];
            if (latestPoint) {
                const spotsNearby = await GpsRepository.detectGeofence(client, {
                    lat: latestPoint.lat,
                    lng: latestPoint.lng,
                    radius_m: 50,
                });

                if (spotsNearby && spotsNearby.length > 0) {
                    for (const spot of spotsNearby) {
                        try {
                            await GpsRepository.recordUserVisit(client, userId, spot.id);
                        } catch (_) {
                            // ignore duplicate conflicts
                        }
                    }
                }
            }

            return savedPoints;
        });
    }
}

module.exports = GpsService;