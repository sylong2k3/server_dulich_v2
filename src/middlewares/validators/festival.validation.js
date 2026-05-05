const Joi = require('joi');
const {
    uuid,
    latField, lngField,
    provinceCodeField,
    paginationQuery, sortQuery,
} = require('./common/base-schemas');
const { LIMITS } = require('./common/constants');

const festivalQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 12, maxLimit: 50 }),
    ...sortQuery(
        ['name_vi', 'name', 'start_date', 'end_date', 'created_at'],
        { defaultSortBy: 'start_date', defaultSortOrder: 'ASC' }
    ),
    search: Joi.string().trim().max(100).optional(),
    festival_type: Joi.string().trim().max(50).optional(),
    upcoming: Joi.boolean().optional(),
    is_published: Joi.boolean().optional(),
    lang: Joi.string().valid('vi', 'en').optional(),
});

// Admin query — cho phép xem cả is_published=false
const festivalAdminQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20, maxLimit: 100 }),
    ...sortQuery(
        ['name_vi', 'name', 'start_date', 'end_date', 'created_at', 'updated_at'],
        { defaultSortBy: 'created_at', defaultSortOrder: 'DESC' }
    ),
    search: Joi.string().trim().max(100).optional(),
    festival_type: Joi.string().trim().max(50).optional(),
    upcoming: Joi.boolean().optional(),
    is_published: Joi.boolean().optional(),
    province_code: provinceCodeField(),
    lang: Joi.string().valid('vi', 'en').optional(),
});

const calendarQuerySchema = Joi.object({
    from: Joi.date().iso().required(),
    to: Joi.date().iso().min(Joi.ref('from')).required(),
    province_code: provinceCodeField(),
    festival_type: Joi.string().trim().max(50).optional(),
});

// Lưu ý: createFestivalSchema có Joi.when phụ thuộc is_recurring → KHÔNG dùng
// shared base fields cho recurrence_rule. Các field còn lại vẫn share được.

const festivalBaseFields = {
    name_vi: Joi.string().trim().min(2).max(LIMITS.NAME_MAX),
    name_en: Joi.string().trim().max(LIMITS.NAME_MAX).allow('', null),
    festival_type: Joi.string().trim().max(50).allow('', null),
    description_vi: Joi.string().trim().allow('', null),
    is_recurring: Joi.boolean(),
    lng: lngField(),
    lat: latField(),
    cover_image_url: Joi.string().uri().allow('', null),
    website: Joi.string().uri().allow('', null),
    location_name: Joi.string().trim().max(LIMITS.NAME_MAX).allow('', null),
    province_code: provinceCodeField(),
    spot_id: uuid().allow(null),
    is_published: Joi.boolean(),
};

const createFestivalSchema = Joi.object({
    ...festivalBaseFields,
    name_vi: festivalBaseFields.name_vi.required(),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).optional().allow(null),
    is_recurring: festivalBaseFields.is_recurring.default(false),
    recurrence_rule: Joi.when('is_recurring', {
        is: true,
        then: Joi.string().trim().max(100).required(),
        otherwise: Joi.string().trim().max(100).optional().allow('', null),
    }),
    is_published: festivalBaseFields.is_published.default(false),
});

const updateFestivalSchema = Joi.object({
    ...festivalBaseFields,
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional().allow(null),
    recurrence_rule: Joi.string().trim().max(100).optional().allow('', null),
}).min(1);

module.exports = { festivalQuerySchema, festivalAdminQuerySchema, calendarQuerySchema, createFestivalSchema, updateFestivalSchema };
