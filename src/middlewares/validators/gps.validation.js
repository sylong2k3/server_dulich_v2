const Joi = require('joi');

const trackIdParamSchema = Joi.object({
  trackId: Joi.string().uuid().required(),
});

const startTrackSchema = Joi.object({
  track_type: Joi.string().valid('hike', 'bike', 'drive', 'walk', 'other').default('walk'),
});

const endTrackSchema = Joi.object({
  total_distance_m: Joi.number().min(0).optional().allow(null),
  geom_line: Joi.object().optional().allow(null),
});

const gpsPointSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  altitude_m: Joi.number().optional().allow(null),
  speed_kmh: Joi.number().min(0).optional().allow(null),
  accuracy_m: Joi.number().min(0).optional().allow(null),
  battery_pct: Joi.number().min(0).max(100).optional().allow(null),
  recorded_at: Joi.date().iso().optional().allow(null),
});

const syncPointsSchema = Joi.object({
  points: Joi.array().items(gpsPointSchema).min(1).max(500).required(),
});

module.exports = {
  trackIdParamSchema,
  startTrackSchema,
  endTrackSchema,
  syncPointsSchema,
};
