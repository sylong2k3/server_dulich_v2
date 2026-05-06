const Joi = require('joi');
const {
    uuid, uuidParam,
    slugField,
    provinceCodeField,
    paginationQuery, sortQuery,
} = require('./common/base-schemas');
const { TOUR_STATUS, LIMITS } = require('./common/constants');

// ── Params ───────────────────────────────────────────────────────────────────

const idParamSchema = uuidParam('id');

const stopIdParamSchema = Joi.object({
    id: uuid().required(),
    stopId: uuid().required(),
});

// ── Query ────────────────────────────────────────────────────────────────────

const tourQuerySchema = Joi.object({
    ...paginationQuery({ maxLimit: 50 }),
    ...sortQuery(
        ['created_at', 'price_from_vnd', 'duration_days', 'rating_avg', 'published_at'],
        { defaultSortBy: 'created_at' }
    ),
    search: Joi.string().trim().max(LIMITS.SEARCH_QUERY_MAX).optional(),
    status: Joi.string().valid(...TOUR_STATUS).optional(),
    province_code: provinceCodeField(),
    business_id: uuid().optional(),
    is_featured: Joi.boolean().optional(),
    duration_days: Joi.number().integer().min(1).optional(),
    price_min: Joi.number().min(0).optional(),
    price_max: Joi.number().min(0).optional(),
    lang: Joi.string().valid('vi', 'en').optional(),
});

// Admin query — cho phép xem cả draft/archived, filter mở rộng hơn
const tourAdminQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20, maxLimit: 100 }),
    ...sortQuery(
        ['created_at', 'price_from_vnd', 'duration_days', 'rating_avg', 'published_at', 'updated_at'],
        { defaultSortBy: 'created_at', defaultSortOrder: 'DESC' }
    ),
    search: Joi.string().trim().max(LIMITS.SEARCH_QUERY_MAX).optional(),
    status: Joi.string().valid(...TOUR_STATUS).optional(),
    province_code: provinceCodeField(),
    business_id: uuid().optional(),
    is_featured: Joi.boolean().optional(),
    duration_days: Joi.number().integer().min(1).optional(),
    price_min: Joi.number().min(0).optional(),
    price_max: Joi.number().min(0).optional(),
    lang: Joi.string().valid('vi', 'en').optional(),
});

// ── Tour body (shared base fields) ───────────────────────────────────────────

const tourBaseFields = {
    business_id: uuid().allow(null),
    province_code: provinceCodeField(),
    name_vi: Joi.string().trim().min(3).max(255),
    name_en: Joi.string().trim().max(255).allow('', null),
    slug: slugField(),
    description_vi: Joi.string().trim().allow('', null),
    duration_days: Joi.number().integer().min(1).allow(null),
    price_from_vnd: Joi.number().min(0).allow(null),
    max_guests: Joi.number().integer().min(1).allow(null),
    includes: Joi.array().items(Joi.string()),
    excludes: Joi.array().items(Joi.string()),
    start_location_vi: Joi.string().trim().max(255).allow('', null),
    end_location_vi: Joi.string().trim().max(255).allow('', null),
    cover_image_url: Joi.string().uri().allow('', null),
    status: Joi.string().valid(...TOUR_STATUS),
    is_featured: Joi.boolean(),
};

const createTourSchema = Joi.object({
    ...tourBaseFields,
    name_vi: tourBaseFields.name_vi.required(),
    slug: tourBaseFields.slug.required(),
    includes: tourBaseFields.includes.default([]),
    excludes: tourBaseFields.excludes.default([]),
    status: tourBaseFields.status.default('draft'),
    is_featured: tourBaseFields.is_featured.default(false),
});

const updateTourSchema = Joi.object(tourBaseFields).min(1);

// ── Tour stop body (shared base fields) ──────────────────────────────────────

const stopBaseFields = {
    day_number: Joi.number().integer().min(1),
    stop_order: Joi.number().integer().min(1),
    spot_id: uuid().allow(null),
    business_id: uuid().allow(null),
    title_vi: Joi.string().trim().max(255).allow('', null),
    description_vi: Joi.string().trim().allow('', null),
    planned_duration_min: Joi.number().integer().min(1).allow(null),
};

const createStopSchema = Joi.object({
    ...stopBaseFields,
    day_number: stopBaseFields.day_number.required(),
    stop_order: stopBaseFields.stop_order.required(),
});

const updateStopSchema = Joi.object(stopBaseFields).min(1);

module.exports = {
    idParamSchema,
    stopIdParamSchema,
    tourQuerySchema,
    tourAdminQuerySchema,
    createTourSchema,
    updateTourSchema,
    createStopSchema,
    updateStopSchema,
};
