const { withTransaction } = require('../utils/database');
const OfflineRepository = require('../models/repositories/offline.repository');
const FKValidator = require('../utils/fk-validator');
const { Api404Error, Api403Error } = require('../core/error.response');

/**
 * Tính số lượng tile ước tính theo công thức chuẩn z/x/y.
 * Với mỗi zoom level z: số tile trong bbox = ceil(dx/360 * 2^z) * ceil(dy/180 * 2^(z-1))
 *
 * @param {number} minLng
 * @param {number} minLat
 * @param {number} maxLng
 * @param {number} maxLat
 * @param {number} zoomMin
 * @param {number} zoomMax
 * @returns {{ tile_count: number, size_mb: number }}
 */
function estimateTiles(minLng, minLat, maxLng, maxLat, zoomMin, zoomMax) {
    const TILE_SIZE_KB = 15; // ước tính trung bình ~15KB/tile (vector tiles)
    let totalTiles = 0;

    for (let z = zoomMin; z <= zoomMax; z++) {
        const n = Math.pow(2, z);
        // Chuyển lat/lng sang tile index
        const xMin = Math.floor((minLng + 180) / 360 * n);
        const xMax = Math.ceil((maxLng + 180) / 360 * n);

        const latMinRad = minLat * Math.PI / 180;
        const latMaxRad = maxLat * Math.PI / 180;
        const yMax = Math.floor((1 - Math.log(Math.tan(latMinRad) + 1 / Math.cos(latMinRad)) / Math.PI) / 2 * n);
        const yMin = Math.floor((1 - Math.log(Math.tan(latMaxRad) + 1 / Math.cos(latMaxRad)) / Math.PI) / 2 * n);

        const tilesInLevel = Math.max(0, xMax - xMin) * Math.max(0, yMax - yMin + 1);
        totalTiles += tilesInLevel;
    }

    const size_mb = parseFloat(((totalTiles * TILE_SIZE_KB) / 1024).toFixed(2));
    return { tile_count: totalTiles, size_mb };
}

class OfflineService {
    static async requestDownload(userId, data) {
        // Kiểm tra province_code hợp lệ (trả lỗi 400 sớm, ngoài transaction)
        await FKValidator.province(data.province_code);

        return await withTransaction(async (client) => {
            const zoom_min = data.zoom_min ?? 10;
            const zoom_max = data.zoom_max ?? 16;
            const { bounds } = data;

            // FIX #2: Công thức tile count chuẩn
            const { tile_count, size_mb } = estimateTiles(
                bounds.minLng, bounds.minLat,
                bounds.maxLng, bounds.maxLat,
                zoom_min, zoom_max
            );

            const downloadReq = {
                user_id: userId,
                area_name: data.area_name || 'Vùng bản đồ',
                province_code: data.province_code || null,
                bounds,
                zoom_min,
                zoom_max,
                size_mb,
                tile_count,
            };

            return await OfflineRepository.createDownloadRequest(client, downloadReq);
        });
    }

    /**
     * FIX #1: Bỏ tham số pool — repository dùng query() nội bộ.
     */
    static async getUserDownloads(userId) {
        return await OfflineRepository.getDownloadsByUser(userId);
    }

    /**
     * FIX #4: Xem chi tiết 1 bản ghi với ownership check.
     */
    static async getDownloadById(id, userId) {
        const record = await OfflineRepository.findById(id);
        if (!record) throw new Api404Error('Bản đồ offline không tồn tại');
        if (String(record.user_id) !== String(userId)) {
            throw new Api403Error('Bạn không có quyền xem bản đồ offline này');
        }
        return record;
    }

    /**
     * FIX #4: Xóa bản ghi với ownership check.
     */
    static async deleteDownload(id, userId) {
        const record = await OfflineRepository.findById(id);
        if (!record) throw new Api404Error('Bản đồ offline không tồn tại');
        if (String(record.user_id) !== String(userId)) {
            throw new Api403Error('Bạn không có quyền xóa bản đồ offline này');
        }
        return await OfflineRepository.deleteById(id);
    }
}

module.exports = OfflineService;