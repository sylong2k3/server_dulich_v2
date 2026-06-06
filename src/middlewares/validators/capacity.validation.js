const Joi = require('joi');
const { paginationQuery, sortQuery, provinceCodeField } = require('./common/base-schemas');

const uuidSchema = Joi.string().guid({ version: ['uuidv4'] });

const spotIdParamSchema = Joi.object({
    spotId: uuidSchema.required(),
});

const tourIdParamSchema = Joi.object({
    tourId: uuidSchema.required(),
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
});const adminCapacityQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20 }),
    ...sortQuery(
        ['capacity_pct', 'visitor_count', 'max_capacity', 'name_vi', 'recorded_at'],
        { defaultSortBy: 'capacity_pct', defaultSortOrder: 'DESC' }
    ),
    search: Joi.string().trim().max(100).optional(),
    status: Joi.string().valid('normal', 'busy', 'near_full', 'overloaded').optional(),
    province_code: provinceCodeField(),
});

const tourCapacitySettingsSchema = Joi.object({
    max_guests: Joi.number().integer().min(1).required(),
});

module.exports = {
    spotIdParamSchema,
    tourIdParamSchema,
    logCapacitySchema,
    spotCapacitySettingsSchema,
    tourCapacitySettingsSchema,
    alertConfigSchema,
    historyQuerySchema,
    statsQuerySchema,
    alternativesQuerySchema,
    adminCapacityQuerySchema,
};

