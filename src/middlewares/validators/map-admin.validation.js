const Joi = require('joi');
const {
    uuid,
    numericId,
    numericIdParam,
    paginationQuery,
    sortQuery,
    slugField,
    makeOptional,
} = require('./common/base-schemas');
const { API_KEY_STATUS, MAP_LAYER_STATUS, MAP_RESOURCE_STATUS, LIMITS } = require('./common/constants');

const LAYER_TYPES = ['vector', 'raster', 'wms', 'wmts', 'geojson'];
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const PRINCIPAL_TYPES = ['user', 'role', 'public'];

const idParamSchema = numericIdParam('id');

const permissionIdParamSchema = Joi.object({
    id: numericId().required(),
    permissionId: numericId().required(),
});

const paginationQuerySchema = Joi.object({
    ...paginationQuery({ maxLimit: 100 }),
    search: Joi.string().trim().allow('').optional(),
    ...sortQuery([], { defaultSortOrder: 'DESC' }),
});

const categoryBaseFields = {
    code: Joi.string().trim().min(2).max(50),
    name_vi: Joi.string().trim().min(LIMITS.NAME_MIN).max(LIMITS.NAME_MAX),
    name_en: Joi.string().trim().allow('', null).optional(),
    description: Joi.string().trim().allow('', null).optional(),
    sort_order: Joi.number().integer().min(0),
    is_active: Joi.boolean(),
};

const createCategorySchema = Joi.object({
    ...categoryBaseFields,
    code: categoryBaseFields.code.required(),
    name_vi: categoryBaseFields.name_vi.required(),
    sort_order: categoryBaseFields.sort_order.default(0),
    is_active: categoryBaseFields.is_active.default(true),
});

const updateCategorySchema = makeOptional(Joi.object(categoryBaseFields));

const layerBaseFields = {
    category_id: numericId(),
    code: Joi.string().trim().min(2).max(100),
    name_vi: Joi.string().trim().min(LIMITS.NAME_MIN).max(LIMITS.NAME_MAX),
    name_en: Joi.string().trim().allow('', null).optional(),
    layer_type: Joi.string().valid(...LAYER_TYPES),
    source_url: Joi.string().trim().uri({ scheme: ['http', 'https'] }).optional().allow(null),
    style_json: Joi.object().optional().allow(null),
    min_zoom: Joi.number().integer().min(0).max(22),
    max_zoom: Joi.number().integer().min(0).max(22),
    is_default_visible: Joi.boolean(),
    sort_order: Joi.number().integer().min(0),
    status: Joi.string().valid(...MAP_RESOURCE_STATUS),
};

const createLayerSchema = Joi.object({
    ...layerBaseFields,
    category_id: layerBaseFields.category_id.required(),
    code: layerBaseFields.code.required(),
    name_vi: layerBaseFields.name_vi.required(),
    layer_type: layerBaseFields.layer_type.required(),
    min_zoom: layerBaseFields.min_zoom.default(0),
    max_zoom: layerBaseFields.max_zoom.default(22),
    is_default_visible: layerBaseFields.is_default_visible.default(true),
    sort_order: layerBaseFields.sort_order.default(0),
    status: layerBaseFields.status.default('active'),
});

const updateLayerSchema = makeOptional(Joi.object(layerBaseFields));

const endpointUrlSchema = Joi.alternatives().try(
    Joi.string().trim().uri({ scheme: ['http', 'https'] }),
    Joi.string().trim().pattern(/^\/[\S]*$/)
);

const mapApiBaseFields = {
    category_id: numericId().optional().allow(null),
    map_layer_id: numericId().optional().allow(null),
    name: Joi.string().trim().min(LIMITS.NAME_MIN).max(LIMITS.NAME_MAX),
    slug: slugField({ required: false, min: 2, max: LIMITS.NAME_MAX }),
    description: Joi.string().trim().allow('', null).optional(),
    endpoint_url: endpointUrlSchema,
    http_method: Joi.string().valid(...HTTP_METHODS),
    status: Joi.string().valid(...MAP_LAYER_STATUS),
};

const createMapApiSchema = Joi.object({
    ...mapApiBaseFields,
    name: mapApiBaseFields.name.required(),
    slug: slugField({ required: true, min: 2, max: LIMITS.NAME_MAX }),
    endpoint_url: mapApiBaseFields.endpoint_url.required(),
    http_method: mapApiBaseFields.http_method.default('GET'),
    status: mapApiBaseFields.status.default('draft'),
});

const updateMapApiSchema = makeOptional(Joi.object(mapApiBaseFields));

const upsertPermissionSchema = Joi.object({
    principal_type: Joi.string().valid(...PRINCIPAL_TYPES).required(),
    user_id: uuid().allow(null),
    role_id: numericId().allow(null),
    can_view: Joi.boolean().default(true),
    can_edit: Joi.boolean().default(false),
    can_delete: Joi.boolean().default(false),
}).custom((value, helpers) => {
    if (value.principal_type === 'user' && !value.user_id) {
        return helpers.error('any.invalid', { message: 'principal_type=user yêu cầu user_id' });
    }

    if (value.principal_type === 'role' && !value.role_id) {
        return helpers.error('any.invalid', { message: 'principal_type=role yêu cầu role_id' });
    }

    if (value.principal_type === 'public' && (value.user_id || value.role_id)) {
        return helpers.error('any.invalid', { message: 'principal_type=public không được truyền user_id/role_id' });
    }

    return value;
});

const apiKeyQuerySchema = Joi.object({
    ...paginationQuery({ maxLimit: 100 }),
    search: Joi.string().trim().allow('').optional(),
    status: Joi.string().valid(...API_KEY_STATUS).optional(),
});

const createApiKeySchema = Joi.object({
    name: Joi.string().trim().min(LIMITS.NAME_MIN).max(LIMITS.NAME_MAX).required(),
    expires_at: Joi.date().iso().optional().allow(null),
    issued_to_user_id: uuid().optional().allow(null),
    map_layer_api_ids: Joi.array().items(numericId()).min(1).required(),
});

module.exports = {
    idParamSchema,
    permissionIdParamSchema,
    paginationQuerySchema,
    createCategorySchema,
    updateCategorySchema,
    createLayerSchema,
    updateLayerSchema,
    createMapApiSchema,
    updateMapApiSchema,
    upsertPermissionSchema,
    apiKeyQuerySchema,
    createApiKeySchema,
};
