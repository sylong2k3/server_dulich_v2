const Joi = require('joi');

const uuidSchema = Joi.string().guid({ version: ['uuidv4'] });

const recordArSessionSchema = Joi.object({
    spot_id: uuidSchema.optional().allow(null),
    ar_type: Joi.string().valid('overlay', 'marker', 'navigation', 'info').required(),
    lng: Joi.number().min(-180).max(180).optional().allow(null),
    lat: Joi.number().min(-90).max(90).optional().allow(null),
    duration_sec: Joi.number().integer().min(0).optional().allow(null),
    qr_scanned: Joi.boolean().default(false),
    spots_viewed: Joi.array().items(uuidSchema).optional().allow(null),
    device_os: Joi.string().valid('ios', 'android', 'web').optional().allow(null),
    app_version: Joi.string().max(20).optional().allow(null),
});

const arSessionQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    spot_id: uuidSchema.optional(),
});

const spotIdParamSchema = Joi.object({
    spotId: uuidSchema.required(),
});

module.exports = {
    recordArSessionSchema,
    arSessionQuerySchema,
    spotIdParamSchema,
};
