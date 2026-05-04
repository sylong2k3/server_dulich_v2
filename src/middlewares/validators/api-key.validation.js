const Joi = require('joi');

const queryApiKeySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().allow('').optional(),
    status: Joi.string().valid('active', 'revoked', 'expired').optional(),
});

const createApiKeySchema = Joi.object({
    name: Joi.string().trim().min(2).max(255).required(),
    expires_at: Joi.date().iso().optional().allow(null),
    map_layer_api_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required(),
});

const revokeApiKeyParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

module.exports = {
    queryApiKeySchema,
    createApiKeySchema,
    revokeApiKeyParamSchema,
};
