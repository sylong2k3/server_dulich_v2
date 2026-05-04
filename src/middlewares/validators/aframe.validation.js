const Joi = require('joi');

const uuidSchema = Joi.string().guid({ version: ['uuidv4'] });

const vector3Schema = Joi.object({
  x: Joi.number().required(),
  y: Joi.number().required(),
  z: Joi.number().required(),
}).required();

const positionSchema = Joi.object({
  x: Joi.number().required(),
  y: Joi.number().required(),
  z: Joi.number().required(),
  pitch: Joi.number().min(-90).max(90).required(),
  yaw: Joi.number().min(-180).max(180).required(),
}).required();

const optionalPositionSchema = Joi.object({
  x: Joi.number().required(),
  y: Joi.number().required(),
  z: Joi.number().required(),
  pitch: Joi.number().min(-90).max(90).required(),
  yaw: Joi.number().min(-180).max(180).required(),
}).optional();

const optionalVector3Schema = Joi.object({
  x: Joi.number().required(),
  y: Joi.number().required(),
  z: Joi.number().required(),
}).optional();

const includeInactiveQuerySchema = Joi.object({
  include_inactive: Joi.boolean().optional(),
});

const sceneParamSchema = Joi.object({
  id: uuidSchema.required(),
  sceneId: uuidSchema.required(),
});

const hotspotParamSchema = Joi.object({
  id: uuidSchema.required(),
  sceneId: uuidSchema.required(),
  hotspotId: uuidSchema.required(),
});

const createSceneSchema = Joi.object({
  name: Joi.string().trim().max(200).optional().allow('', null),
  description: Joi.string().trim().optional().allow('', null),
  equirectangular_image_url: Joi.string().trim().max(1000).required(),
  thumbnail_url: Joi.string().trim().max(1000).optional().allow('', null),
  camera_position: optionalVector3Schema.default({ x: 0, y: 1.6, z: 0 }),
  camera_rotation: optionalVector3Schema.default({ x: 0, y: 0, z: 0 }),
  camera_fov: Joi.number().min(1).max(180).precision(2).default(80),
  fog_settings: Joi.object().optional().allow(null),
  ambient_sound_url: Joi.string().trim().max(1000).optional().allow('', null),
  ambient_sound_loop: Joi.boolean().default(true),
  ambient_sound_volume: Joi.number().min(0).max(1).precision(2).default(0.5),
  narration_audio_url: Joi.string().trim().max(1000).optional().allow('', null),
  auto_play_narration: Joi.boolean().default(false),
  is_main: Joi.boolean().default(false),
  is_active: Joi.boolean().default(true),
});

const updateSceneSchema = Joi.object({
  name: Joi.string().trim().max(200).optional().allow('', null),
  description: Joi.string().trim().optional().allow('', null),
  equirectangular_image_url: Joi.string().trim().max(1000).optional(),
  thumbnail_url: Joi.string().trim().max(1000).optional().allow('', null),
  camera_position: optionalVector3Schema,
  camera_rotation: optionalVector3Schema,
  camera_fov: Joi.number().min(1).max(180).precision(2).optional(),
  fog_settings: Joi.object().optional().allow(null),
  ambient_sound_url: Joi.string().trim().max(1000).optional().allow('', null),
  ambient_sound_loop: Joi.boolean().optional(),
  ambient_sound_volume: Joi.number().min(0).max(1).precision(2).optional(),
  narration_audio_url: Joi.string().trim().max(1000).optional().allow('', null),
  auto_play_narration: Joi.boolean().optional(),
  is_main: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

const createHotspotSchema = Joi.object({
  name: Joi.string().trim().max(100).optional().allow('', null),
  description: Joi.string().trim().optional().allow('', null),
  hotspot_type: Joi.string().valid('navigation', 'info', 'link', 'media').default('info'),
  position: positionSchema,
  scale: optionalVector3Schema.default({ x: 1, y: 1, z: 1 }),
  target_scene_id: uuidSchema.optional().allow(null),
  linked_spot_id: uuidSchema.optional().allow(null),
  target_url: Joi.string().trim().max(1000).optional().allow('', null),
  icon_type: Joi.string().trim().max(30).optional().allow('', null),
  visible: Joi.boolean().default(true),
  is_active: Joi.boolean().default(true),
});

const updateHotspotSchema = Joi.object({
  name: Joi.string().trim().max(100).optional().allow('', null),
  description: Joi.string().trim().optional().allow('', null),
  hotspot_type: Joi.string().valid('navigation', 'info', 'link', 'media').optional(),
  position: optionalPositionSchema,
  scale: optionalVector3Schema,
  target_scene_id: uuidSchema.optional().allow(null),
  linked_spot_id: uuidSchema.optional().allow(null),
  target_url: Joi.string().trim().max(1000).optional().allow('', null),
  icon_type: Joi.string().trim().max(30).optional().allow('', null),
  visible: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

module.exports = {
  includeInactiveQuerySchema,
  sceneParamSchema,
  hotspotParamSchema,
  createSceneSchema,
  updateSceneSchema,
  createHotspotSchema,
  updateHotspotSchema,
};
