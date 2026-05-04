const Joi = require('joi');

const filenameParamSchema = Joi.object({
    filename: Joi.string()
        .max(255)
        .pattern(/^[^/\\]+$/, 'filename không được chứa ký tự / hoặc \\')
        .required()
        .messages({
            'string.base': 'Tên file phải là chuỗi',
            'string.max': 'Tên file quá dài',
            'string.pattern.name': 'Tên file không hợp lệ',
            'any.required': 'Tên file là bắt buộc',
        }),
});

module.exports = {
    filenameParamSchema,
};
