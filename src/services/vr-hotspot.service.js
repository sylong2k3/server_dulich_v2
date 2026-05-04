const SpotRepository = require('../models/repositories/spot.repository');
const VrHotspotRepository = require('../models/repositories/vr-hotspot.repository');
const { Api404Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');

class VrHotspotService {
    async _assertSpotAndMedia(spotId, mediaId) {
        const spot = await SpotRepository.findById(spotId);
        if (!spot) {
            throw new Api404Error('Điểm du lịch không tồn tại');
        }

        const media = await SpotRepository.findMediaById(mediaId);
        if (!media || String(media.spot_id) !== String(spotId)) {
            throw new Api404Error('Media không tồn tại hoặc không thuộc điểm du lịch này');
        }
    }

    async getVrHotspots(spotId, mediaId) {
        await this._assertSpotAndMedia(spotId, mediaId);
        return VrHotspotRepository.getByMediaId(mediaId);
    }

    async createVrHotspot(spotId, mediaId, data) {
        await this._assertSpotAndMedia(spotId, mediaId);

        // linked_spot_id optional, nhưng nếu có thì phải tồn tại để tránh lỗi FK từ DB.
        await FKValidator.spot(data.linked_spot_id);

        return VrHotspotRepository.create({ ...data, media_id: mediaId });
    }

    async updateVrHotspot(spotId, mediaId, hotspotId, data) {
        await this._assertSpotAndMedia(spotId, mediaId);

        const hotspot = await VrHotspotRepository.findById(hotspotId);
        if (!hotspot || String(hotspot.media_id) !== String(mediaId)) {
            throw new Api404Error('Hotspot không tồn tại');
        }

        await FKValidator.spot(data.linked_spot_id);

        return VrHotspotRepository.update(hotspotId, data);
    }

    async deleteVrHotspot(spotId, mediaId, hotspotId) {
        await this._assertSpotAndMedia(spotId, mediaId);

        const hotspot = await VrHotspotRepository.findById(hotspotId);
        if (!hotspot || String(hotspot.media_id) !== String(mediaId)) {
            throw new Api404Error('Hotspot không tồn tại');
        }

        return VrHotspotRepository.delete(hotspotId);
    }
}

module.exports = new VrHotspotService();
