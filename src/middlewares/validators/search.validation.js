const Joi = require('joi');

const VALID_TYPES = ['spots', 'businesses', 'vlogs', 'cuisine', 'festivals', 'ocop', 'users'];

// GET /search?q=...&types=spots,cuisine
const searchQuerySchema = Joi.object({
    q: Joi.string().trim().min(1).max(200).required().messages({
        'string.empty': 'Từ khóa tìm kiếm không được để trống',
        'string.min': 'Từ khóa tìm kiếm phải có ít nhất 1 ký tự',
        'string.max': 'Từ khóa tìm kiếm không được vượt quá 200 ký tự',
        'any.required': 'Vui lòng nhập từ khóa tìm kiếm',
    }),
    types: Joi.string().trim().pattern(/^[a-z_,\s]+$/i).optional().messages({
        'string.pattern.base': 'Tham số types không hợp lệ',
    }),
});

// GET /search/:type?q=...
const searchByTypeQuerySchema = Joi.object({
    q: Joi.string().trim().min(1).max(200).required().messages({
        'string.empty': 'Từ khóa tìm kiếm không được để trống',
        'string.min': 'Từ khóa tìm kiếm phải có ít nhất 1 ký tự',
        'string.max': 'Từ khóa tìm kiếm không được vượt quá 200 ký tự',
        'any.required': 'Vui lòng nhập từ khóa tìm kiếm',
    }),
});

const searchTypeParamSchema = Joi.object({
    type: Joi.string().trim().lowercase().valid(...VALID_TYPES).required().messages({
        'any.only': `Loại tìm kiếm không hợp lệ. Hợp lệ: ${VALID_TYPES.join(', ')}`,
        'any.required': 'Vui lòng chọn loại tìm kiếm',
    }),
});

module.exports = {
    searchQuerySchema,
    searchByTypeQuerySchema,
    searchTypeParamSchema,
    VALID_TYPES,
};
