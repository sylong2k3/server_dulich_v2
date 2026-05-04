const Joi = require('joi');

const uuidSchema = Joi.string().guid({ version: ['uuidv4'] });

const mediaHotspotParamSchema = Joi.object({
    id: uuidSchema.required(),
    mediaId: uuidSchema.required(),
});

const hotspotParamSchema = Joi.object({
    id: uuidSchema.required(),
    mediaId: uuidSchema.required(),
    hotspotId: uuidSchema.required(),
});

const createHotspotSchema = Joi.object({
    pitch: Joi.number().min(-90).max(90).default(0),
    yaw: Joi.number().min(-180).max(180).default(0),
    label_vi: Joi.string().trim().max(200).optional().allow('', null),
    label_en: Joi.string().trim().max(200).optional().allow('', null),
    linked_spot_id: uuidSchema.optional().allow(null),
    target_url: Joi.string().uri().max(500).optional().allow('', null),
    icon_type: Joi.string().valid('info', 'link', 'spot', 'audio').default('info'),
});

const updateHotspotSchema = Joi.object({
    pitch: Joi.number().min(-90).max(90).optional(),
    yaw: Joi.number().min(-180).max(180).optional(),
    label_vi: Joi.string().trim().max(200).optional().allow('', null),
    label_en: Joi.string().trim().max(200).optional().allow('', null),
    linked_spot_id: uuidSchema.optional().allow(null),
    target_url: Joi.string().uri().max(500).optional().allow('', null),
    icon_type: Joi.string().valid('info', 'link', 'spot', 'audio').optional(),
}).min(1);

module.exports = {
    mediaHotspotParamSchema,
    hotspotParamSchema,
    createHotspotSchema,
    updateHotspotSchema,
};
