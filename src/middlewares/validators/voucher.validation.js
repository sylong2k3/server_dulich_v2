const Joi = require('joi');

const uuidSchema = Joi.string().guid({ version: ['uuidv4'] });

const businessVoucherParamSchema = Joi.object({
    businessId: uuidSchema.required(),
});

const voucherItemParamSchema = Joi.object({
    businessId: uuidSchema.required(),
    voucherId: uuidSchema.required(),
});

const voucherQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    is_active: Joi.boolean().optional(),
});

const createVoucherSchema = Joi.object({
    title_vi: Joi.string().trim().min(2).max(255).required(),
    description_vi: Joi.string().trim().optional().allow('', null),
    code: Joi.string().trim().min(4).max(50).uppercase().pattern(/^[A-Z0-9_-]+$/).required(),
    discount_type: Joi.string().valid('fixed', 'percentage').required(),
    discount_value: Joi.number().min(0).required(),
    min_order_value: Joi.number().min(0).optional().allow(null),
    max_uses: Joi.number().integer().min(1).optional().allow(null),
    valid_from: Joi.date().iso().required(),
    valid_until: Joi.date().iso().min(Joi.ref('valid_from')).required(),
    lng: Joi.number().min(-180).max(180).optional().allow(null),
    lat: Joi.number().min(-90).max(90).optional().allow(null),
    geo_radius_m: Joi.when('lng', {
        is: Joi.number().required(),
        then: Joi.number().integer().min(100).max(50000).required(),
        otherwise: Joi.number().integer().min(100).max(50000).optional().allow(null),
    }),
    is_active: Joi.boolean().default(true),
});

const updateVoucherSchema = Joi.object({
    title_vi: Joi.string().trim().min(2).max(255).optional(),
    description_vi: Joi.string().trim().optional().allow('', null),
    discount_value: Joi.number().min(0).optional(),
    min_order_value: Joi.number().min(0).optional().allow(null),
    max_uses: Joi.number().integer().min(1).optional().allow(null),
    valid_from: Joi.date().iso().optional(),
    valid_until: Joi.date().iso().optional(),
    lng: Joi.number().min(-180).max(180).optional().allow(null),
    lat: Joi.number().min(-90).max(90).optional().allow(null),
    geo_radius_m: Joi.number().integer().min(100).max(50000).optional().allow(null),
    is_active: Joi.boolean().optional(),
}).min(1);

const validateVoucherSchema = Joi.object({
    code: Joi.string().trim().min(1).max(50).required(),
    lng: Joi.number().min(-180).max(180).optional().allow(null),
    lat: Joi.number().min(-90).max(90).optional().allow(null),
    order_value: Joi.number().min(0).optional().allow(null),
});

const nearbyVoucherQuerySchema = Joi.object({
    lng: Joi.number().min(-180).max(180).required(),
    lat: Joi.number().min(-90).max(90).required(),
    radius_m: Joi.number().integer().min(100).max(50000).default(5000),
});

module.exports = {
    businessVoucherParamSchema,
    voucherItemParamSchema,
    voucherQuerySchema,
    createVoucherSchema,
    updateVoucherSchema,
    validateVoucherSchema,
    nearbyVoucherQuerySchema,
};
