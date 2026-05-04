const AFrameRepository = require('../models/repositories/aframe.repository');
const SpotRepository = require('../models/repositories/spot.repository');
const FKValidator = require('../utils/fk-validator');
const { Api400Error, Api404Error, Api409Error } = require('../core/error.response');
const { invalidateByPrefix } = require('../utils/cache.utils');

function mapHotspot(row) {
  return {
    id: row.id,
    scene_id: row.scene_id,
    name: row.name,
    description: row.description,
    hotspot_type: row.hotspot_type,
    position: row.position,
    scale: row.scale,
    target_scene_id: row.target_scene_id,
    linked_spot_id: row.linked_spot_id,
    target_url: row.target_url,
    icon_type: row.icon_type,
    visible: row.visible,
    is_active: row.is_active,
  };
}

function mapSceneRow(scene) {
  return {
    id: scene.id,
    spot_id: scene.spot_id,
    name: scene.name,
    description: scene.description,
    equirectangular_image_url: scene.equirectangular_image_url,
    thumbnail_url: scene.thumbnail_url,
    camera_position: scene.camera_position,
    camera_rotation: scene.camera_rotation,
    camera_fov: scene.camera_fov === null ? null : Number(scene.camera_fov),
    fog_settings: scene.fog_settings,
    ambient_sound_url: scene.ambient_sound_url,
    ambient_sound_loop: scene.ambient_sound_loop,
    ambient_sound_volume: scene.ambient_sound_volume === null ? null : Number(scene.ambient_sound_volume),
    narration_audio_url: scene.narration_audio_url,
    auto_play_narration: scene.auto_play_narration,
    is_main: scene.is_main,
    is_active: scene.is_active,
    created_at: scene.created_at,
    updated_at: scene.updated_at,
  };
}

function mapSceneDetail(scene, hotspots = []) {
  return {
    id: scene.id,
    spot_id: scene.spot_id,
    name: scene.name,
    description: scene.description,
    equirectangular_image_url: scene.equirectangular_image_url,
    thumbnail_url: scene.thumbnail_url,
    camera: {
      position: scene.camera_position,
      rotation: scene.camera_rotation,
      fov: Number(scene.camera_fov),
    },
    fog_settings: scene.fog_settings,
    audio: {
      ambient: {
        url: scene.ambient_sound_url,
        loop: scene.ambient_sound_loop,
        volume: scene.ambient_sound_volume === null ? null : Number(scene.ambient_sound_volume),
      },
      narration: {
        url: scene.narration_audio_url,
        auto_play: scene.auto_play_narration,
      },
    },
    is_main: scene.is_main,
    is_active: scene.is_active,
    hotspots: hotspots.map(mapHotspot),
    created_at: scene.created_at,
    updated_at: scene.updated_at,
  };
}

class AFrameService {
  async _assertSpot(spotId) {
    const spot = await SpotRepository.findById(spotId);
    if (!spot) {
      throw new Api404Error('Điểm du lịch không tồn tại');
    }
    return spot;
  }

  async _assertScene(spotId, sceneId) {
    await this._assertSpot(spotId);
    const scene = await AFrameRepository.findSceneBySpot(sceneId, spotId);
    if (!scene) {
      throw new Api404Error('A-Frame scene không tồn tại');
    }
    return scene;
  }

  async _validateHotspotTargets(scene, data, existing = null) {
    const next = { ...(existing || {}), ...data };
    const targetSceneId = next.target_scene_id || null;
    const linkedSpotId = next.linked_spot_id || null;

    if (targetSceneId) {
      const targetScene = await AFrameRepository.findSceneById(targetSceneId);
      if (!targetScene || String(targetScene.spot_id) !== String(scene.spot_id)) {
        throw new Api400Error('target_scene_id phải thuộc cùng điểm du lịch');
      }
    }

    if (next.hotspot_type === 'navigation' && !targetSceneId && !linkedSpotId) {
      throw new Api400Error('hotspot_type navigation phải có target_scene_id hoặc linked_spot_id');
    }

    await FKValidator.spot(linkedSpotId);
  }

  async getScenes(spotId, options = {}) {
    await this._assertSpot(spotId);
    const scenes = await AFrameRepository.getScenesBySpotId(
      spotId,
      options.include_inactive === true || options.include_inactive === 'true',
    );
    return scenes.map(mapSceneRow);
  }

  async getScene(spotId, sceneId) {
    const scene = await this._assertScene(spotId, sceneId);
    const hotspots = await AFrameRepository.getHotspotsBySceneId(sceneId);
    return mapSceneDetail(scene, hotspots);
  }

  async getPreloadScenes(spotId, sceneId) {
    await this._assertScene(spotId, sceneId);
    const preloadScenes = await AFrameRepository.getPreloadScenes(sceneId, 3);
    return {
      scene_id: sceneId,
      preload_scenes: preloadScenes.map((scene) => ({
        id: scene.id,
        equirectangular_image_url: scene.equirectangular_image_url,
        thumbnail_url: scene.thumbnail_url,
        priority: scene.priority,
      })),
    };
  }

  async createScene(spotId, data, user) {
    await this._assertSpot(spotId);
    const scene = await AFrameRepository.createScene({
      ...data,
      spot_id: spotId,
      created_by: user?.id || null,
    });
    invalidateByPrefix('spots:');
    invalidateByPrefix(`spot:id:${spotId}`);
    return mapSceneRow(scene);
  }

  async updateScene(spotId, sceneId, data) {
    const existing = await this._assertScene(spotId, sceneId);
    if (existing.is_main && data.is_active === false) {
      throw new Api409Error('Không thể tắt scene chính. Hãy set scene khác làm main trước');
    }
    if (data.is_main === true && existing.is_active === false && data.is_active !== true) {
      throw new Api400Error('Không thể set main cho scene đang tắt');
    }
    const scene = await AFrameRepository.updateScene(sceneId, data);
    if (Object.prototype.hasOwnProperty.call(data, 'is_active')) {
      await AFrameRepository.refreshSpotVrFlag(spotId);
    }
    invalidateByPrefix('spots:');
    invalidateByPrefix(`spot:id:${spotId}`);
    return mapSceneRow(scene);
  }

  async deleteScene(spotId, sceneId) {
    const scene = await this._assertScene(spotId, sceneId);
    if (scene.is_main) {
      throw new Api409Error('Không thể xóa scene chính. Hãy set scene khác làm main trước');
    }
    const inboundNavigationCount = await AFrameRepository.countInboundNavigation(sceneId);
    if (inboundNavigationCount > 0) {
      throw new Api409Error('Scene đang được hotspot navigation khác trỏ tới');
    }
    const deleted = await AFrameRepository.deleteScene(sceneId);
    await AFrameRepository.refreshSpotVrFlag(spotId);
    invalidateByPrefix('spots:');
    invalidateByPrefix(`spot:id:${spotId}`);
    return deleted;
  }

  async setMainScene(spotId, sceneId) {
    const scene = await this._assertScene(spotId, sceneId);
    if (!scene.is_active) {
      throw new Api400Error('Không thể set main cho scene đang tắt');
    }
    const updated = await AFrameRepository.setMainScene(spotId, sceneId);
    invalidateByPrefix('spots:');
    invalidateByPrefix(`spot:id:${spotId}`);
    return mapSceneRow(updated);
  }

  async activateScene(spotId, sceneId) {
    return this._setSceneActive(spotId, sceneId, true);
  }

  async deactivateScene(spotId, sceneId) {
    return this._setSceneActive(spotId, sceneId, false);
  }

  async _setSceneActive(spotId, sceneId, isActive) {
    const scene = await this._assertScene(spotId, sceneId);
    if (!isActive) {
      if (scene.is_main) {
        throw new Api409Error('Không thể tắt scene chính. Hãy set scene khác làm main trước');
      }
      const inboundNavigationCount = await AFrameRepository.countInboundNavigation(sceneId);
      if (inboundNavigationCount > 0) {
        throw new Api409Error('Scene đang được hotspot navigation khác trỏ tới');
      }
    }
    const updated = await AFrameRepository.setSceneActive(sceneId, isActive);
    await AFrameRepository.refreshSpotVrFlag(spotId);
    invalidateByPrefix('spots:');
    invalidateByPrefix(`spot:id:${spotId}`);
    return mapSceneRow(updated);
  }

  async getHotspots(spotId, sceneId, options = {}) {
    await this._assertScene(spotId, sceneId);
    const hotspots = await AFrameRepository.getHotspotsBySceneId(
      sceneId,
      options.include_inactive === true || options.include_inactive === 'true',
    );
    return hotspots.map(mapHotspot);
  }

  async createHotspot(spotId, sceneId, data, user) {
    const scene = await this._assertScene(spotId, sceneId);
    await this._validateHotspotTargets(scene, data);
    const hotspot = await AFrameRepository.createHotspot({
      ...data,
      scene_id: sceneId,
      created_by: user?.id || null,
    });
    return mapHotspot(hotspot);
  }

  async updateHotspot(spotId, sceneId, hotspotId, data) {
    const scene = await this._assertScene(spotId, sceneId);
    const hotspot = await AFrameRepository.findHotspotById(hotspotId);
    if (!hotspot || String(hotspot.scene_id) !== String(sceneId)) {
      throw new Api404Error('A-Frame hotspot không tồn tại');
    }
    await this._validateHotspotTargets(scene, data, hotspot);
    const updated = await AFrameRepository.updateHotspot(hotspotId, data);
    return mapHotspot(updated);
  }

  async deleteHotspot(spotId, sceneId, hotspotId) {
    await this._assertScene(spotId, sceneId);
    const hotspot = await AFrameRepository.findHotspotById(hotspotId);
    if (!hotspot || String(hotspot.scene_id) !== String(sceneId)) {
      throw new Api404Error('A-Frame hotspot không tồn tại');
    }
    return AFrameRepository.deleteHotspot(hotspotId);
  }

  async activateHotspot(spotId, sceneId, hotspotId) {
    return this._setHotspotActive(spotId, sceneId, hotspotId, true);
  }

  async deactivateHotspot(spotId, sceneId, hotspotId) {
    return this._setHotspotActive(spotId, sceneId, hotspotId, false);
  }

  async _setHotspotActive(spotId, sceneId, hotspotId, isActive) {
    await this._assertScene(spotId, sceneId);
    const hotspot = await AFrameRepository.findHotspotById(hotspotId);
    if (!hotspot || String(hotspot.scene_id) !== String(sceneId)) {
      throw new Api404Error('A-Frame hotspot không tồn tại');
    }
    const updated = await AFrameRepository.setHotspotActive(hotspotId, isActive);
    return mapHotspot(updated);
  }
}

module.exports = new AFrameService();
