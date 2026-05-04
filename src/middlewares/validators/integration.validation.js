const Joi = require('joi');

const integrationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow('').optional(),
  is_active: Joi.boolean().optional(),
});

const integrationIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const syncLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const createIntegrationSchema = Joi.object({
  provider_code: Joi.string().trim().max(50).required(),
  provider_name: Joi.string().trim().max(255).required(),
  integration_type: Joi.string().trim().max(30).required(),
  base_url: Joi.string().uri().optional().allow(null, ''),
  auth_type: Joi.string().valid('api_key', 'oauth2', 'basic', 'bearer', 'none').optional().allow(null),
  credentials: Joi.object().optional().allow(null),
  webhook_secret: Joi.string().optional().allow(null, ''),
  is_active: Joi.boolean().default(true),
});

const updateIntegrationSchema = Joi.object({
  provider_name: Joi.string().trim().max(255).optional(),
  base_url: Joi.string().uri().optional().allow(null, ''),
  auth_type: Joi.string().valid('api_key', 'oauth2', 'basic', 'bearer', 'none').optional().allow(null),
  credentials: Joi.object().optional().allow(null),
  webhook_secret: Joi.string().optional().allow(null, ''),
  is_active: Joi.boolean().optional(),
}).min(1);

module.exports = {
  integrationQuerySchema,
  integrationIdParamSchema,
  syncLogsQuerySchema,
  createIntegrationSchema,
  updateIntegrationSchema,
};
