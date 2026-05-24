const Joi = require('joi');

const uuidSchema = Joi.string().guid({ version: ['uuidv4'] });

const spotIdParamSchema = Joi.object({
    spotId: uuidSchema.required(),
});

const logCapacitySchema = Joi.object({
    visitor_count: Joi.number().integer().min(0).required(),
    data_source: Joi.string().valid('manual', 'iot', 'api', 'realtime').default('manual'),
});

// Cấu hình sức chứa tối đa của điểm du lịch
const spotCapacitySettingsSchema = Joi.object({
    max_capacity: Joi.number().integer().min(1).optional(),
    alert_threshold_pct: Joi.number().integer().min(1).max(100).optional(),
});

const alertConfigSchema = Joi.object({
    spot_id: uuidSchema.optional().allow(null),
    province_code: Joi.string().trim().max(20).optional().allow(null),
    threshold_busy: Joi.number().integer().min(1).max(100).default(70),
    threshold_near: Joi.number().integer().min(1).max(100).default(85),
    threshold_over: Joi.number().integer().min(1).max(100).default(100),
    notify_roles: Joi.array().items(Joi.number().integer().positive()).optional().allow(null),
    is_active: Joi.boolean().default(true),
});

const historyQuerySchema = Joi.object({
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(100),
});

const statsQuerySchema = Joi.object({
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
    group_by: Joi.string().valid('day', 'week', 'month').default('day'),
});

const alternativesQuerySchema = Joi.object({
    radius_km: Joi.number().min(0.5).max(50).default(10),
    limit: Joi.number().integer().min(1).max(20).default(5),
    max_capacity_pct: Joi.number().min(0).max(100).default(80),
});

module.exports = {
    spotIdParamSchema,
    logCapacitySchema,
    spotCapacitySettingsSchema,
    alertConfigSchema,
    historyQuerySchema,
    statsQuerySchema,
    alternativesQuerySchema,
};

