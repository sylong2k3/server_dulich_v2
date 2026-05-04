const { query, getClient } = require('../../configs/database');

const SCENE_FIELDS = [
  'name',
  'description',
  'equirectangular_image_url',
  'thumbnail_url',
  'camera_position',
  'camera_rotation',
  'camera_fov',
  'fog_settings',
  'ambient_sound_url',
  'ambient_sound_loop',
  'ambient_sound_volume',
  'narration_audio_url',
  'auto_play_narration',
  'is_main',
  'is_active',
];

const HOTSPOT_FIELDS = [
  'name',
  'description',
  'hotspot_type',
  'position',
  'scale',
  'target_scene_id',
  'linked_spot_id',
  'target_url',
  'icon_type',
  'visible',
  'is_active',
];

const jsonFields = new Set([
  'camera_position',
  'camera_rotation',
  'fog_settings',
  'position',
  'scale',
]);

function normalizeValue(key, value) {
  if (jsonFields.has(key) && value !== null && value !== undefined && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

class AFrameRepository {
  static async getScenesBySpotId(spotId, includeInactive = false) {
    const sql = `
      SELECT afs.*
      FROM aframe_scenes afs
      WHERE afs.spot_id = $1
        AND ($2::boolean = TRUE OR afs.is_active = TRUE)
      ORDER BY afs.is_main DESC, afs.created_at ASC
    `;
    const { rows } = await query(sql, [spotId, includeInactive]);
    return rows;
  }

  static async findSceneById(sceneId) {
    const { rows } = await query('SELECT * FROM aframe_scenes WHERE id = $1', [sceneId]);
    return rows[0] || null;
  }

  static async findSceneBySpot(sceneId, spotId) {
    const { rows } = await query(
      'SELECT * FROM aframe_scenes WHERE id = $1 AND spot_id = $2',
      [sceneId, spotId],
    );
    return rows[0] || null;
  }

  static async createScene(data) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      if (data.is_main === true) {
        await client.query('UPDATE aframe_scenes SET is_main = FALSE WHERE spot_id = $1', [data.spot_id]);
      }

      const sql = `
        INSERT INTO aframe_scenes (
          spot_id, name, description, equirectangular_image_url, thumbnail_url,
          camera_position, camera_rotation, camera_fov, fog_settings,
          ambient_sound_url, ambient_sound_loop, ambient_sound_volume,
          narration_audio_url, auto_play_narration, is_main, is_active, created_by
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6::jsonb, $7::jsonb, $8, $9::jsonb,
          $10, $11, $12,
          $13, $14, $15, $16, $17
        )
        RETURNING *
      `;
      const values = [
        data.spot_id,
        data.name || null,
        data.description || null,
        data.equirectangular_image_url,
        data.thumbnail_url || null,
        normalizeValue('camera_position', data.camera_position || { x: 0, y: 1.6, z: 0 }),
        normalizeValue('camera_rotation', data.camera_rotation || { x: 0, y: 0, z: 0 }),
        data.camera_fov ?? 80,
        normalizeValue('fog_settings', data.fog_settings || null),
        data.ambient_sound_url || null,
        data.ambient_sound_loop ?? true,
        data.ambient_sound_volume ?? 0.5,
        data.narration_audio_url || null,
        data.auto_play_narration ?? false,
        data.is_main ?? false,
        data.is_active ?? true,
        data.created_by || null,
      ];

      const { rows } = await client.query(sql, values);
      await client.query(
        'UPDATE tourism_spots SET has_vr_360 = TRUE, updated_at = NOW() WHERE id = $1',
        [data.spot_id],
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async updateScene(sceneId, data) {
    const fields = Object.entries(data).filter(([key, value]) => SCENE_FIELDS.includes(key) && value !== undefined);
    if (!fields.length) return this.findSceneById(sceneId);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      if (data.is_main === true) {
        const scene = await this.findSceneById(sceneId);
        if (scene) {
          await client.query(
            'UPDATE aframe_scenes SET is_main = FALSE WHERE spot_id = $1 AND id <> $2',
            [scene.spot_id, sceneId],
          );
        }
      }

      const sets = fields.map(([key], index) => `${key} = $${index + 2}`).join(', ');
      const values = [sceneId, ...fields.map(([key, value]) => normalizeValue(key, value))];
      const { rows } = await client.query(
        `UPDATE aframe_scenes SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values,
      );

      await client.query('COMMIT');
      return rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async setMainScene(spotId, sceneId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE aframe_scenes SET is_main = FALSE WHERE spot_id = $1', [spotId]);
      const { rows } = await client.query(
        `UPDATE aframe_scenes
         SET is_main = TRUE, is_active = TRUE, updated_at = NOW()
         WHERE id = $1 AND spot_id = $2
         RETURNING *`,
        [sceneId, spotId],
      );
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async setSceneActive(sceneId, isActive) {
    const { rows } = await query(
      `UPDATE aframe_scenes
       SET is_active = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [sceneId, isActive],
    );
    return rows[0] || null;
  }

  static async countInboundNavigation(sceneId) {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS count
       FROM aframe_hotspots
       WHERE target_scene_id = $1
         AND hotspot_type = 'navigation'
         AND is_active = TRUE`,
      [sceneId],
    );
    return rows[0]?.count || 0;
  }

  static async deleteScene(sceneId) {
    const { rowCount } = await query('DELETE FROM aframe_scenes WHERE id = $1', [sceneId]);
    return rowCount > 0;
  }

  static async getPreloadScenes(sceneId, limit = 3) {
    const sql = `
      SELECT
        target.id,
        target.equirectangular_image_url,
        target.thumbnail_url,
        ROW_NUMBER() OVER (
          ORDER BY
            SQRT(
              POWER(COALESCE((afh.position->>'x')::numeric, 0), 2) +
              POWER(COALESCE((afh.position->>'y')::numeric, 0), 2) +
              POWER(COALESCE((afh.position->>'z')::numeric, 0), 2)
            ) ASC,
            afh.created_at ASC
        )::int AS priority
      FROM aframe_hotspots afh
      JOIN aframe_scenes current_scene ON current_scene.id = afh.scene_id
      JOIN aframe_scenes target ON target.id = afh.target_scene_id
      WHERE afh.scene_id = $1
        AND afh.hotspot_type = 'navigation'
        AND afh.target_scene_id IS NOT NULL
        AND afh.is_active = TRUE
        AND afh.visible = TRUE
        AND target.is_active = TRUE
        AND target.spot_id = current_scene.spot_id
      ORDER BY priority ASC
      LIMIT $2
    `;
    const { rows } = await query(sql, [sceneId, limit]);
    return rows;
  }

  static async refreshSpotVrFlag(spotId) {
    const sql = `
      UPDATE tourism_spots ts
      SET has_vr_360 = EXISTS (
          SELECT 1
          FROM aframe_scenes afs
          WHERE afs.spot_id = ts.id
            AND afs.is_active = TRUE
      ),
      updated_at = NOW()
      WHERE ts.id = $1
      RETURNING has_vr_360
    `;
    const { rows } = await query(sql, [spotId]);
    return rows[0] || null;
  }

  static async getHotspotsBySceneId(sceneId, includeInactive = false) {
    const sql = `
      SELECT afh.*,
        target.name AS target_scene_name,
        linked.slug AS linked_spot_slug,
        linked.name_vi AS linked_spot_name
      FROM aframe_hotspots afh
      LEFT JOIN aframe_scenes target ON target.id = afh.target_scene_id
      LEFT JOIN tourism_spots linked ON linked.id = afh.linked_spot_id
      WHERE afh.scene_id = $1
        AND ($2::boolean = TRUE OR afh.is_active = TRUE)
      ORDER BY afh.created_at ASC
    `;
    const { rows } = await query(sql, [sceneId, includeInactive]);
    return rows;
  }

  static async findHotspotById(hotspotId) {
    const { rows } = await query('SELECT * FROM aframe_hotspots WHERE id = $1', [hotspotId]);
    return rows[0] || null;
  }

  static async createHotspot(data) {
    const sql = `
      INSERT INTO aframe_hotspots (
        scene_id, name, description, hotspot_type, position, scale,
        target_scene_id, linked_spot_id, target_url, icon_type,
        visible, is_active, created_by
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.scene_id,
      data.name || null,
      data.description || null,
      data.hotspot_type || 'info',
      normalizeValue('position', data.position),
      normalizeValue('scale', data.scale || { x: 1, y: 1, z: 1 }),
      data.target_scene_id || null,
      data.linked_spot_id || null,
      data.target_url || null,
      data.icon_type || data.hotspot_type || 'info',
      data.visible ?? true,
      data.is_active ?? true,
      data.created_by || null,
    ]);
    return rows[0];
  }

  static async updateHotspot(hotspotId, data) {
    const fields = Object.entries(data).filter(([key, value]) => HOTSPOT_FIELDS.includes(key) && value !== undefined);
    if (!fields.length) return this.findHotspotById(hotspotId);

    const sets = fields.map(([key], index) => `${key} = $${index + 2}`).join(', ');
    const values = [hotspotId, ...fields.map(([key, value]) => normalizeValue(key, value))];
    const { rows } = await query(
      `UPDATE aframe_hotspots SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
    return rows[0] || null;
  }

  static async setHotspotActive(hotspotId, isActive) {
    const { rows } = await query(
      `UPDATE aframe_hotspots
       SET is_active = $2, visible = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [hotspotId, isActive],
    );
    return rows[0] || null;
  }

  static async deleteHotspot(hotspotId) {
    const { rowCount } = await query('DELETE FROM aframe_hotspots WHERE id = $1', [hotspotId]);
    return rowCount > 0;
  }
}

module.exports = AFrameRepository;
