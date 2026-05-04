const Joi = require('joi');

const provinceCodeParamSchema = Joi.object({
    province_code: Joi.string().trim().max(20).required(),
});

const codeParamSchema = Joi.object({
    code: Joi.string().trim().max(20).required(),
});

const searchProvinceSchema = Joi.object({
    q: Joi.string().trim().min(1).max(100).required(),
});

const searchWardSchema = Joi.object({
    q: Joi.string().trim().min(1).max(100).required(),
    province_code: Joi.string().trim().max(20).optional(),
});

module.exports = {
    provinceCodeParamSchema,
    codeParamSchema,
    searchProvinceSchema,
    searchWardSchema,
};
