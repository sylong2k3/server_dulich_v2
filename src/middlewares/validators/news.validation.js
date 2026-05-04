const Joi = require('joi');
const {
    uuid, uuidParam,
    slugField,
    paginationQuery, sortQuery,
} = require('./common/base-schemas');
const { LIMITS } = require('./common/constants');

// ── Body shared fields ───────────────────────────────────────────────────────

const newsBaseFields = {
    title: Joi.string().trim().min(5).max(500).messages({
        'string.empty': 'Tiêu đề không được để trống',
        'string.min': 'Tiêu đề phải có ít nhất 5 ký tự',
        'string.max': 'Tiêu đề không được vượt quá 500 ký tự',
    }),
    slug: slugField({ max: 500 }).allow('', null).messages({
        'string.max': 'Slug không được vượt quá 500 ký tự',
        'string.pattern.base': 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
    }),
    author_name: Joi.string().trim().max(100).messages({
        'string.max': 'Tên tác giả không được vượt quá 100 ký tự',
    }),
    summary: Joi.string().trim().max(1000).allow('', null).messages({
        'string.max': 'Tóm tắt không được vượt quá 1000 ký tự',
    }),
    content: Joi.string().trim().messages({
        'string.empty': 'Nội dung không được để trống',
    }),
    thumbnail_url: Joi.string().max(500).allow('').messages({
        'string.max': 'URL avatar không được quá 500 ký tự',
    }),
    is_published: Joi.boolean().messages({
        'boolean.base': 'Trạng thái xuất bản phải là true hoặc false',
    }),
    is_featured: Joi.boolean().messages({
        'boolean.base': 'Trạng thái nổi bật phải là true hoặc false',
    }),
    published_at: Joi.date().iso().allow(null).messages({
        'date.format': 'Ngày xuất bản không đúng định dạng',
    }),
    tags: Joi.array().items(Joi.string()).messages({
        'array.base': 'Tags phải là mảng',
    }),
};

const createNewsSchema = Joi.object({
    ...newsBaseFields,
    title: newsBaseFields.title.required().messages({
        'string.empty': 'Tiêu đề không được để trống',
        'string.min': 'Tiêu đề phải có ít nhất 5 ký tự',
        'string.max': 'Tiêu đề không được vượt quá 500 ký tự',
        'any.required': 'Tiêu đề là bắt buộc',
    }),
    content: newsBaseFields.content.required().messages({
        'string.empty': 'Nội dung không được để trống',
        'any.required': 'Nội dung là bắt buộc',
    }),
});

const updateNewsSchema = Joi.object(newsBaseFields).min(1).messages({
    'object.min': 'Phải cung cấp ít nhất một trường để cập nhật',
});

// ── Query ────────────────────────────────────────────────────────────────────

const queryNewsSchema = Joi.object({
    ...paginationQuery({ maxLimit: 100 }),
    ...sortQuery(
        ['id', 'title', 'view_count', 'published_at', 'created_at', 'updated_at'],
        { defaultSortBy: 'created_at' }
    ),
    is_published: Joi.boolean().optional(),
    is_featured: Joi.boolean().optional(),
    search: Joi.string().trim().max(LIMITS.SEARCH_QUERY_MAX).allow('').optional(),
    tag: Joi.string().trim().max(100).allow('').optional(),
});

const queryNewsCommentsSchema = Joi.object({
    ...paginationQuery({ defaultLimit: 20, maxLimit: 100 }),
});

// ── Comments ─────────────────────────────────────────────────────────────────

const createCommentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(5000).required().messages({
        'string.empty': 'Nội dung bình luận không được để trống',
        'string.min': 'Nội dung bình luận phải có ít nhất 1 ký tự',
        'string.max': 'Nội dung bình luận không được vượt quá 5000 ký tự',
        'any.required': 'Nội dung bình luận là bắt buộc',
    }),
    parent_comment_id: uuid().allow(null).optional().messages({
        'string.guid': 'ID bình luận cha không hợp lệ',
    }),
    user_name: Joi.string().trim().max(100).allow('', null).optional().messages({
        'string.max': 'Tên người dùng không được vượt quá 100 ký tự',
    }),
    user_email: Joi.string().trim().email().max(100).allow('', null).optional().messages({
        'string.email': 'Email không hợp lệ',
        'string.max': 'Email không được vượt quá 100 ký tự',
    }),
});

const updateCommentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(5000).required().messages({
        'string.empty': 'Nội dung bình luận không được để trống',
        'string.min': 'Nội dung bình luận phải có ít nhất 1 ký tự',
        'string.max': 'Nội dung bình luận không được vượt quá 5000 ký tự',
        'any.required': 'Nội dung bình luận là bắt buộc',
    }),
});

// ── Params ───────────────────────────────────────────────────────────────────

const newsIdParamSchema = uuidParam('id');

const newsCommentParamSchema = Joi.object({
    id: uuid().required().messages({
        'string.guid': 'ID tin tức không hợp lệ',
        'any.required': 'ID tin tức là bắt buộc',
    }),
    commentId: uuid().required().messages({
        'string.guid': 'ID bình luận không hợp lệ',
        'any.required': 'ID bình luận là bắt buộc',
    }),
});

// ── Status body ──────────────────────────────────────────────────────────────

const publishStatusSchema = Joi.object({
    is_published: Joi.boolean().required().messages({
        'boolean.base': 'Trạng thái xuất bản phải là true hoặc false',
        'any.required': 'Trạng thái xuất bản là bắt buộc',
    }),
});

const approvalStatusSchema = Joi.object({
    is_approved: Joi.boolean().required().messages({
        'boolean.base': 'Trạng thái duyệt phải là true hoặc false',
        'any.required': 'Trạng thái duyệt là bắt buộc',
    }),
});

module.exports = {
    createNewsSchema,
    updateNewsSchema,
    queryNewsSchema,
    queryNewsCommentsSchema,
    createCommentSchema,
    updateCommentSchema,
    newsIdParamSchema,
    newsCommentParamSchema,
    publishStatusSchema,
    approvalStatusSchema,
};
