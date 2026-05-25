const Joi = require('joi');
const {
    uuid,
    uuidParam,
    emailField,
    phoneField,
    slugField,
    latField,
    lngField,
    provinceCodeField,
    paginationQuery,
    sortQuery,
} = require('./common/base-schemas');
const { SPOT_STATUS, MEDIA_TYPE, LIMITS } = require('./common/constants');

// ── Params ───────────────────────────────────────────────────────────────────

const idParamSchema = uuidParam('id');

const mediaParamSchema = Joi.object({
    id: uuid().required(),
    mediaId: uuid().required(),
});

const slugParamSchema = Joi.object({
    slug: Joi.string().trim().min(1).max(LIMITS.SLUG_MAX).required(),
});

// ── Query schemas ─────────────────────────────────────────────────────────────

const spotListQueryFields = {
    lang: Joi.string().valid('vi', 'en').default('vi'),
    search: Joi.string().trim().max(LIMITS.SEARCH_QUERY_MAX).optional(),
    category_id: Joi.number().integer().min(1).optional(),
    parent_category_id: Joi.number().integer().min(1).optional(),
    province_code: provinceCodeField(),
    status: Joi.string().valid(...SPOT_STATUS).optional(),
    is_featured: Joi.boolean().optional(),
    rating_min: Joi.number().min(0).max(5).optional(),
    capacity: Joi.boolean().optional(),
};

const gpsQueryFields = {
    lat: latField().optional(),
    lng: lngField().optional(),
    radius_km: Joi.number().min(0.1).max(100).optional(),
};

const spotQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20 }),
    ...sortQuery(
        ['created_at', 'name', 'name_vi', 'rating_avg', 'view_count', 'distance_m']
    ),
    ...spotListQueryFields,
    ...gpsQueryFields,
}).and('lat', 'lng');

const spotAdminQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20 }),
    ...sortQuery(
        ['created_at', 'name', 'name_vi', 'rating_avg', 'view_count']
    ),
    ...spotListQueryFields,
});

const spotMapQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 500, maxLimit: 1000 }),
    ...sortQuery(
        ['created_at', 'name', 'name_vi', 'rating_avg', 'view_count', 'distance_m']
    ),
    ...spotListQueryFields,
    ...gpsQueryFields,
}).and('lat', 'lng');

const nearbyQuerySchema = Joi.object({
    lang: Joi.string().valid('vi', 'en').default('vi'),
    lat: latField({ required: true }),
    lng: lngField({ required: true }),
    radius_km: Joi.number().min(0.1).max(100).default(10),
    limit: Joi.number().integer().min(1).max(200).default(50),
});

const bboxQuerySchema = Joi.object({
    lang: Joi.string().valid('vi', 'en').default('vi'),
    bbox: Joi.string().trim().required(),
    limit: Joi.number().integer().min(1).max(1000).default(500),
});

const geojsonQuerySchema = Joi.object({
    lang: Joi.string().valid('vi', 'en').default('vi'),
    category_id: Joi.number().integer().min(1).optional(),
    province_code: provinceCodeField(),
});

const featuredQuerySchema = Joi.object({
    lang: Joi.string().valid('vi', 'en').default('vi'),
    limit: Joi.number().integer().min(1).max(50).default(12),
    category_id: Joi.number().integer().min(1).optional(),
});

const mediaTypeQuerySchema = Joi.object({
    media_type: Joi.string().valid(...MEDIA_TYPE).optional(),
});

const audioGuideQuerySchema = Joi.object({
    language: Joi.string().trim().max(10).optional(),
});

const spotDetailQuerySchema = Joi.object({
    lang: Joi.string().valid('vi', 'en').default('vi'),
    ocop: Joi.boolean().optional(),
    radius_km: Joi.number().min(0.1).max(100).optional(),
});

// ── Body schemas (shared base fields) ─────────────────────────────────────────
// Định nghĩa fields chung không có required/default. Create thêm required+default
// còn update dùng nguyên (tự động optional, không inject default).

const spotBaseFields = {
    name_vi: Joi.string().trim().min(3).max(255),
    name_en: Joi.string().trim().max(255).allow('', null),
    slug: slugField(),
    description_vi: Joi.string().trim().allow('', null),
    description_en: Joi.string().trim().allow('', null),
    category_id: Joi.number().integer().min(1).allow(null),
    province_code: provinceCodeField(),
    ward_code: Joi.string().trim().max(20).allow(null),
    address_vi: Joi.string().trim().max(500).allow('', null),
    address_en: Joi.string().trim().max(500).allow('', null),
    longitude: lngField(),
    latitude: latField(),
    altitude_m: Joi.number().allow(null),
    opening_hours: Joi.object().allow(null),
    ticket_price_adult: Joi.number().min(0).allow(null),
    ticket_price_child: Joi.number().min(0).allow(null),
    ticket_currency: Joi.string().trim().max(10),
    phone: phoneField(),
    email: emailField({ required: false }),
    website: Joi.string().uri().allow('', null),
    max_capacity: Joi.number().integer().min(1).allow(null),
    alert_threshold_pct: Joi.number().min(1).max(100),
    has_vr_360: Joi.boolean(),
    has_ar_support: Joi.boolean(),
    has_audio_guide: Joi.boolean(),
    status: Joi.string().valid(...SPOT_STATUS),
    is_featured: Joi.boolean(),
};

const createSpotSchema = Joi.object({
    ...spotBaseFields,
    // overrides cho create: required + default
    name_vi: spotBaseFields.name_vi.required(),
    ticket_currency: spotBaseFields.ticket_currency.default('VND'),
    alert_threshold_pct: spotBaseFields.alert_threshold_pct.default(80),
    has_vr_360: spotBaseFields.has_vr_360.default(false),
    has_ar_support: spotBaseFields.has_ar_support.default(false),
    has_audio_guide: spotBaseFields.has_audio_guide.default(false),
    status: spotBaseFields.status.default('active'),
    is_featured: spotBaseFields.is_featured.default(false),
});

// Update: spread base fields nguyên gốc (không required, không default) + min(1)
const updateSpotSchema = Joi.object(spotBaseFields).min(1);

const updateMediaMetaSchema = Joi.object({
    title_vi: Joi.string().trim().max(255).optional().allow('', null),
    title_en: Joi.string().trim().max(255).optional().allow('', null),
    sort_order: Joi.number().integer().min(0).optional(),
    language: Joi.string().trim().max(10).optional().allow('', null),
}).min(1);

module.exports = {
    idParamSchema,
    mediaParamSchema,
    slugParamSchema,
    spotQuerySchema,
    spotAdminQuerySchema,
    spotMapQuerySchema,
    nearbyQuerySchema,
    bboxQuerySchema,
    geojsonQuerySchema,
    featuredQuerySchema,
    mediaTypeQuerySchema,
    audioGuideQuerySchema,
    spotDetailQuerySchema,
    createSpotSchema,
    updateSpotSchema,
    updateMediaMetaSchema,
};
