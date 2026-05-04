const Joi = require('joi');

const principalSchema = Joi.string().valid('user', 'role', 'public').required();
const endpointUrlSchema = Joi.alternatives().try(
  Joi.string().trim().uri({ scheme: ['http', 'https'] }),
  Joi.string().trim().pattern(/^\/[^\s]*$/)
).messages({
  'alternatives.match': 'endpoint_url phải là URL hợp lệ (http/https) hoặc đường dẫn tương đối bắt đầu bằng /',
  'string.pattern.base': 'endpoint_url phải là URL hợp lệ (http/https) hoặc đường dẫn tương đối bắt đầu bằng /',
});

const createApiSchema = Joi.object({
  category_id: Joi.number().integer().min(1).required(),
  name: Joi.string().trim().min(2).max(255).required(),
  slug: Joi.string().trim().min(2).max(255).required(),
  description: Joi.string().trim().allow('', null).optional(),
  endpoint_url: endpointUrlSchema.required(),
  http_method: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE').default('GET'),
  status: Joi.string().valid('draft', 'published').default('draft'),
});

const updateApiSchema = Joi.object({
  category_id: Joi.number().integer().min(1).optional(),
  name: Joi.string().trim().min(2).max(255).optional(),
  slug: Joi.string().trim().min(2).max(255).optional(),
  description: Joi.string().trim().allow('', null).optional(),
  endpoint_url: endpointUrlSchema.optional(),
  http_method: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE').optional(),
  status: Joi.string().valid('draft', 'published').optional(),
}).min(1);

const queryApiSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category_id: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('draft', 'published').optional(),
  search: Joi.string().trim().allow('').optional(),
  sortBy: Joi.string().valid('id', 'name', 'slug', 'created_at', 'updated_at', 'published_at').default('created_at'),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
});

const upsertPermissionSchema = Joi.object({
  principal_type: principalSchema,
  user_id: Joi.string().guid({ version: ['uuidv4'] }).allow(null),
  role_id: Joi.number().integer().min(1).allow(null),
  can_view: Joi.boolean().optional(),
  can_edit: Joi.boolean().optional(),
  can_delete: Joi.boolean().optional(),
});

const apiPermissionParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  permissionId: Joi.number().integer().positive().required(),
});


const slugParamSchema = Joi.object({
  slug: Joi.string().trim().min(2).max(255).required(),
});

module.exports = {
  createApiSchema,
  updateApiSchema,
  queryApiSchema,
  upsertPermissionSchema,
  apiPermissionParamSchema,
  slugParamSchema,
};
