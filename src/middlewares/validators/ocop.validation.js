const Joi = require('joi');
const {
    uuid,
    latField, lngField,
    provinceCodeField,
    paginationQuery, sortQuery,
} = require('./common/base-schemas');
const { LIMITS } = require('./common/constants');

const ocopQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 12, maxLimit: 50 }),
    ...sortQuery(
        ['name_vi', 'star_rating', 'price_vnd', 'created_at'],
        { defaultSortBy: 'created_at' }
    ),
    search: Joi.string().trim().max(100).optional(),
    category: Joi.string().trim().max(50).optional(),
    star_rating: Joi.number().integer().min(3).max(5).optional(),
    province_code: provinceCodeField(),
    spot_id: uuid().optional(),
    by_distance: Joi.boolean().optional(),
    radius_km: Joi.number().min(1).max(50).optional(),
    lang: Joi.string().valid('vi', 'en').optional(),
});

// Admin query — cho phép xem cả is_active=false, filter mở rộng
const ocopAdminQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20, maxLimit: 100 }),
    ...sortQuery(
        ['name_vi', 'star_rating', 'price_vnd', 'created_at', 'updated_at'],
        { defaultSortBy: 'created_at', defaultSortOrder: 'DESC' }
    ),
    search: Joi.string().trim().max(100).optional(),
    category: Joi.string().trim().max(50).optional(),
    star_rating: Joi.number().integer().min(3).max(5).optional(),
    province_code: provinceCodeField(),
    is_active: Joi.boolean().optional(),
    spot_id: uuid().optional(),
    by_distance: Joi.boolean().optional(),
    radius_km: Joi.number().min(1).max(50).optional(),
    lang: Joi.string().valid('vi', 'en').optional(),
});

const ocopBaseFields = {
    name_vi: Joi.string().trim().min(2).max(LIMITS.NAME_MAX),
    name_en: Joi.string().trim().max(LIMITS.NAME_MAX).allow('', null),
    category: Joi.string().trim().max(50).allow('', null),
    description_vi: Joi.string().trim().allow('', null),
    star_rating: Joi.number().integer().min(3).max(5),
    certification_no: Joi.string().trim().max(100).allow('', null),
    certified_at: Joi.date().iso().allow(null),
    cover_image_url: Joi.string().uri().allow('', null),
    media_urls: Joi.array().items(Joi.string().uri()).max(20).allow(null),
    price_vnd: Joi.number().min(0).allow(null),
    unit: Joi.string().trim().max(50).allow('', null),
    shop_url: Joi.string().uri().allow('', null),
    lng: lngField(),
    lat: latField(),
    producer_name: Joi.string().trim().max(LIMITS.NAME_MAX).allow('', null),
    province_code: provinceCodeField(),
    business_id: uuid().allow(null),
    spot_id: uuid().allow(null),
    is_active: Joi.boolean(),
};

const createOcopSchema = Joi.object({
    ...ocopBaseFields,
    name_vi: ocopBaseFields.name_vi.required(),
    star_rating: ocopBaseFields.star_rating.required(),
    province_code: provinceCodeField({ required: true }),
    is_active: ocopBaseFields.is_active.default(true),
});

const updateOcopSchema = Joi.object(ocopBaseFields).min(1);

module.exports = { ocopQuerySchema, ocopAdminQuerySchema, createOcopSchema, updateOcopSchema };
