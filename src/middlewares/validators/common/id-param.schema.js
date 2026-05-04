const Joi = require('joi');

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là một số',
    'number.integer': 'ID phải là số nguyên',
    'number.positive': 'ID phải là số dương',
    'any.required': 'ID là bắt buộc',
  }),
});

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.base': 'ID phải là một chuỗi',
    'string.guid': 'ID phải là UUID hợp lệ',
    'any.required': 'ID là bắt buộc',
  }),
});

module.exports = { idParamSchema, uuidParamSchema };
