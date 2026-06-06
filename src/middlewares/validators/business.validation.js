const Joi = require('joi');
const {
    uuid,
    emailField, phoneField,
    latField, lngField,
    provinceCodeField,
    paginationQuery, sortQuery,
} = require('./common/base-schemas');
const { BUSINESS_STATUS, BUSINESS_TYPE, LIMITS } = require('./common/constants');

// ── Query ────────────────────────────────────────────────────────────────────

const businessQuerySchema = Joi.object({
    ...paginationQuery({ maxLimit: 50 }),
    ...sortQuery(
        ['business_name', 'status', 'rating_avg', 'created_at'],
        { defaultSortBy: 'created_at' }
    ),
    search: Joi.string().trim().max(100).optional(),
    status: Joi.string().valid(...BUSINESS_STATUS).optional(),
    business_type: Joi.string().trim().max(50).optional(),
    province_code: provinceCodeField(),
});

// ── Business body (shared base) ──────────────────────────────────────────────

const businessBaseFields = {
    business_name: Joi.string().trim().min(2).max(LIMITS.NAME_MAX),
    business_type: Joi.string().valid(...BUSINESS_TYPE),
    business_code: Joi.string().trim().max(50).allow('', null),
    tax_id: Joi.string().trim().max(20).allow('', null),
    license_number: Joi.string().trim().max(100).allow('', null),
    description_vi: Joi.string().trim().allow('', null),
    description_en: Joi.string().trim().allow('', null),
    logo_url: Joi.string().uri().allow('', null),
    phone: phoneField(),
    email: emailField({ required: false }),
    website: Joi.string().uri().allow('', null),
    address_vi: Joi.string().trim().max(500).allow('', null),
    province_code: provinceCodeField(),
    lng: lngField(),
    lat: latField(),
};

const registerBusinessSchema = Joi.object({
    ...businessBaseFields,
    business_name: businessBaseFields.business_name.required(),
    business_type: businessBaseFields.business_type.required(),
});

const updateBusinessSchema = Joi.object(businessBaseFields).min(1);

// ── Params ───────────────────────────────────────────────────────────────────

const businessIdParamSchema = Joi.object({
    businessId: uuid().required(),
});

const businessServiceParamSchema = Joi.object({
    businessId: uuid().required(),
    serviceId: uuid().required(),
});

// ── Status ───────────────────────────────────────────────────────────────────

const updateBusinessStatusSchema = Joi.object({
    status: Joi.string().valid(...BUSINESS_STATUS).required(),
    rejection_note: Joi.when('status', {
        is: 'rejected',
        then: Joi.string().trim().min(5).max(500).required(),
        otherwise: Joi.string().trim().max(500).optional().allow('', null),
    }),
});

// ── Service ──────────────────────────────────────────────────────────────────

const serviceQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20, maxLimit: 50 }),
    spot_id: uuid().optional(),
    category: Joi.string().trim().max(50).optional(),
    is_active: Joi.boolean().optional(),
});

const serviceBaseFields = {
    service_name_vi: Joi.string().trim().min(2).max(LIMITS.NAME_MAX),
    service_name_en: Joi.string().trim().max(LIMITS.NAME_MAX).allow('', null),
    category: Joi.string().trim().max(50),
    description_vi: Joi.string().trim().allow('', null),
    price_from: Joi.number().min(0).allow(null),
    price_to: Joi.number().min(0).allow(null),
    currency: Joi.string().valid('VND', 'USD'),
    unit: Joi.string().trim().max(50).allow('', null),
    booking_url: Joi.string().uri().allow('', null),
    spot_id: uuid().allow(null),
    is_active: Joi.boolean(),
};

const createServiceSchema = Joi.object({
    ...serviceBaseFields,
    service_name_vi: serviceBaseFields.service_name_vi.required(),
    category: serviceBaseFields.category.required(),
    // Khi tạo: price_to phải >= price_from (nếu có)
    price_to: Joi.number().min(Joi.ref('price_from')).optional().allow(null),
    currency: serviceBaseFields.currency.default('VND'),
});

const updateServiceSchema = Joi.object(serviceBaseFields).min(1);

const getMyBusinessQuerySchema = Joi.object({
    status: Joi.string().valid(...BUSINESS_STATUS).optional(),
});

module.exports = {
    businessQuerySchema,
    registerBusinessSchema,
    updateBusinessSchema,
    updateBusinessStatusSchema,
    getMyBusinessQuerySchema,
    businessIdParamSchema,
    businessServiceParamSchema,
    serviceQuerySchema,
    createServiceSchema,
    updateServiceSchema,
};
