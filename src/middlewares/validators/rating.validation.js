const Joi = require('joi');
const { uuid, uuidParam, paginationQuery, sortQuery } = require('./common/base-schemas');
const { RATING_STATUS } = require('./common/constants');

// Cho phép alias cũ approved→published, rejected→hidden để backward compatible
const ratingStatusSchema = Joi.string()
    .replace(/^approved$/, 'published')
    .replace(/^rejected$/, 'hidden')
    .valid(...RATING_STATUS);

const idParamSchema = uuidParam('id');

// ── Body ─────────────────────────────────────────────────────────────────────

const ratingBaseFields = {
    stars: Joi.number().integer().min(1).max(5),
    title: Joi.string().trim().min(3).max(255).allow('', null),
    content: Joi.string().trim().min(10).allow('', null),
    pros: Joi.string().trim().max(1000).allow('', null),
    cons: Joi.string().trim().max(1000).allow('', null),
    visit_date: Joi.date().iso().max('now').allow(null),
    photo_urls: Joi.array().items(Joi.string().uri()).max(10).allow(null),
};

const createRatingSchema = Joi.object({
    spot_id: uuid().allow(null),
    business_id: uuid().allow(null),
    ...ratingBaseFields,
    stars: ratingBaseFields.stars.required(),
}).custom((value, helpers) => {
    const hasBoth = value.spot_id && value.business_id;
    const hasNone = !value.spot_id && !value.business_id;
    if (hasBoth || hasNone) {
        return helpers.error('any.invalid', { message: 'Phải cung cấp đúng một trong spot_id hoặc business_id' });
    }
    return value;
});

const updateRatingSchema = Joi.object(ratingBaseFields).min(1);

const addReplySchema = Joi.object({
    reply_text: Joi.string().trim().min(5).max(2000).required(),
});

const updateStatusSchema = Joi.object({
    status: ratingStatusSchema.required(),
});

const getRatingsQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20, maxLimit: 50 }),
    ...sortQuery(
        ['created_at', 'stars', 'helpful_count'],
        { defaultSortBy: 'created_at' }
    ),
    spot_id: uuid().optional(),
    business_id: uuid().optional(),
    status: ratingStatusSchema.optional(),
});

module.exports = {
    idParamSchema,
    createRatingSchema,
    updateRatingSchema,
    addReplySchema,
    updateStatusSchema,
    getRatingsQuerySchema,
};
