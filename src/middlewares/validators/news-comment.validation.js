const Joi = require('joi');

const createCommentSchema = Joi.object({
    news_id: Joi.string().guid({ version: ['uuidv4'] }).required().messages({
        'string.guid': 'ID bài viết không hợp lệ',
        'any.required': 'ID bài viết là bắt buộc'
    }),
    content: Joi.string().trim().min(1).max(2000).required().messages({
        'string.empty': 'Nội dung bình luận không được để trống',
        'string.min': 'Nội dung bình luận phải có ít nhất 1 ký tự',
        'string.max': 'Nội dung bình luận không được vượt quá 2000 ký tự',
        'any.required': 'Nội dung bình luận là bắt buộc'
    }),
    parent_comment_id: Joi.string().guid({ version: ['uuidv4'] }).allow(null).optional().messages({
        'string.guid': 'ID comment cha không hợp lệ'
    }),
    user_name: Joi.string().trim().max(100).allow('', null).optional().messages({
        'string.max': 'Tên người dùng không được vượt quá 100 ký tự'
    }),
    user_email: Joi.string().trim().email().max(100).allow('', null).optional().messages({
        'string.email': 'Email không đúng định dạng',
        'string.max': 'Email không được vượt quá 100 ký tự'
    })
});

const updateCommentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(2000).required().messages({
        'string.empty': 'Nội dung bình luận không được để trống',
        'string.min': 'Nội dung bình luận phải có ít nhất 1 ký tự',
        'string.max': 'Nội dung bình luận không được vượt quá 2000 ký tự',
        'any.required': 'Nội dung bình luận là bắt buộc'
    })
});

const getCommentsByNewsIdSchema = Joi.object({
    news_id: Joi.string().guid({ version: ['uuidv4'] }).required().messages({
        'string.guid': 'ID bài viết không hợp lệ',
        'any.required': 'ID bài viết là bắt buộc'
    })
});

const getAllCommentsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Trang phải là số',
        'number.integer': 'Trang phải là số nguyên',
        'number.min': 'Trang phải lớn hơn hoặc bằng 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Số lượng phải là số',
        'number.integer': 'Số lượng phải là số nguyên',
        'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
        'number.max': 'Số lượng không được vượt quá 100'
    }),
    news_id: Joi.string().guid({ version: ['uuidv4'] }).optional().messages({
        'string.guid': 'ID bài viết không hợp lệ'
    }),
    is_approved: Joi.boolean().optional().messages({
        'boolean.base': 'Trạng thái duyệt phải là true hoặc false'
    }),
    sortBy: Joi.string().valid('created_at', 'updated_at').default('created_at').messages({
        'any.only': 'Chỉ được sắp xếp theo created_at hoặc updated_at'
    }),
    sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').messages({
        'any.only': 'Thứ tự sắp xếp phải là ASC hoặc DESC'
    })
});

const commentIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID bình luận phải là số',
        'number.integer': 'ID bình luận phải là số nguyên',
        'number.positive': 'ID bình luận phải là số dương',
        'any.required': 'ID bình luận là bắt buộc'
    })
});

module.exports = {
    createCommentSchema,
    updateCommentSchema,
    getCommentsByNewsIdSchema,
    getAllCommentsQuerySchema,
    commentIdParamSchema
};
