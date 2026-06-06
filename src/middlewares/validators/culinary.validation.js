const Joi = require('joi');
const { provinceCodeField, paginationQuery, sortQuery } = require('./common/base-schemas');
const { LIMITS } = require('./common/constants');

const culinaryQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 12, maxLimit: 50 }),
    ...sortQuery(
        ['name_vi', 'rating_avg', 'created_at'],
        { defaultSortBy: 'created_at' }
    ),
    search: Joi.string().trim().max(100).allow('').optional(),
    category: Joi.string().trim().max(50).optional(),
    is_speciality: Joi.boolean().optional(),
});

const culinaryBaseFields = {
    name_vi: Joi.string().trim().min(2).max(LIMITS.NAME_MAX),
    name_en: Joi.string().trim().max(LIMITS.NAME_MAX).allow('', null),
    category: Joi.string().trim().max(50).allow('', null),
    description_vi: Joi.string().trim().allow('', null),
    recipe_vi: Joi.string().trim().allow('', null),
    cover_image_url: Joi.string().uri().allow('', null),
    media_urls: Joi.array().items(Joi.string().uri()).max(20).allow(null),
    is_speciality: Joi.boolean(),
    province_code: provinceCodeField(),
};

const createCulinarySchema = Joi.object({
    ...culinaryBaseFields,
    name_vi: culinaryBaseFields.name_vi.required(),
    is_speciality: culinaryBaseFields.is_speciality.default(false),
});

const updateCulinarySchema = Joi.object(culinaryBaseFields).min(1);

module.exports = { culinaryQuerySchema, createCulinarySchema, updateCulinarySchema };
