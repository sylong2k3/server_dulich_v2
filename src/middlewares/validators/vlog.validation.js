const Joi = require('joi');
const {
    uuid,
    latField, lngField,
    provinceCodeField,
    paginationQuery, sortQuery,
} = require('./common/base-schemas');
const { VLOG_PLATFORM, VLOG_STATUS, VLOG_MODERATE_STATUS } = require('./common/constants');

const vlogQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 12, maxLimit: 50 }),
    ...sortQuery(
        ['title', 'view_count', 'like_count', 'created_at'],
        { defaultSortBy: 'created_at' }
    ),
    search: Joi.string().trim().max(100).optional(),
    platform: Joi.string().valid(...VLOG_PLATFORM).optional(),
    user_id: uuid().optional(),
});

const savedVlogQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 12, maxLimit: 50 }),
});

const vlogCommentsQuerySchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20, maxLimit: 100 }),
});

const adminVlogQuerySchema = vlogQuerySchema.keys({
    status: Joi.string().valid(...VLOG_STATUS).optional(),
});

const vlogBaseFields = {
    title: Joi.string().trim().min(5).max(500),
    excerpt: Joi.string().trim().max(1000).allow('', null),
    content: Joi.string().trim().allow('', null),
    cover_image_url: Joi.string().uri().allow('', null),
    media_urls: Joi.array().items(Joi.string().uri()).max(10).allow(null),
    video_url: Joi.string().uri().allow('', null),
    video_duration_sec: Joi.number().integer().min(0).allow(null),
    platform: Joi.string().valid(...VLOG_PLATFORM),
    spot_id: uuid().allow(null),
    province_code: provinceCodeField(),
    lng: lngField(),
    lat: latField(),
};

const createVlogSchema = Joi.object({
    ...vlogBaseFields,
    title: vlogBaseFields.title.required(),
    platform: vlogBaseFields.platform.default('web'),
});

const updateVlogSchema = Joi.object(vlogBaseFields).min(1);

const moderateVlogSchema = Joi.object({
    status: Joi.string().valid(...VLOG_MODERATE_STATUS).required(),
    rejection_note: Joi.when('status', {
        is: 'rejected',
        then: Joi.string().trim().min(5).max(1000).required(),
        otherwise: Joi.string().trim().max(1000).optional().allow('', null),
    }),
});

const createVlogCommentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(2000).required(),
    parent_id: uuid().optional().allow(null),
});

const vlogCommentParamSchema = Joi.object({
    id: uuid().required(),
    commentId: uuid().required(),
});

module.exports = {
    vlogQuerySchema,
    savedVlogQuerySchema,
    vlogCommentsQuerySchema,
    adminVlogQuerySchema,
    createVlogSchema,
    updateVlogSchema,
    moderateVlogSchema,
    createVlogCommentSchema,
    vlogCommentParamSchema,
};
