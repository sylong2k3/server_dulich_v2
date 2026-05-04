const Joi = require('joi');
const { hexColor } = require('./common/patterns');
const { numericId, numericIdParam, paginationQuery, sortQuery, makeOptional } = require('./common/base-schemas');
const { LIMITS } = require('./common/constants');
const msg = require('./common/messages');

// ── Query ─────────────────────────────────────────────────────────────────────

const categoryQuerySchema = Joi.object({
  ...paginationQuery({ defaultLimit: 50, maxLimit: 100 }),
  search: Joi.string().trim().max(100).optional(),
  parent_id: numericId().optional().allow(null),
  is_active: Joi.boolean().optional(),
  ...sortQuery(['name_vi', 'sort_order', 'created_at'], {
    defaultSortBy: 'sort_order',
    defaultSortOrder: 'ASC',
  }),
});

// /tree — public chỉ lấy danh mục đang active
const categoryTreeQuerySchema = Joi.object({});

// ── Body ──────────────────────────────────────────────────────────────────────

const codeSchema = Joi.string().trim().min(2).max(50).pattern(/^[a-z0-9_]+$/).messages({
  'string.pattern.base': 'code chỉ được chứa chữ thường, số và dấu gạch dưới',
});

const colorHexSchema = Joi.string().trim().pattern(hexColor).optional().allow('', null).messages({
  'string.pattern.base': 'color_hex phải có định dạng #RRGGBB hoặc #RGB',
});

const categoryBaseFields = {
  code: codeSchema,
  name_vi: Joi.string().trim().min(LIMITS.NAME_MIN).max(100),
  name_en: Joi.string().trim().max(100).optional().allow('', null),
  parent_id: numericId().optional().allow(null),
  icon_url: Joi.string().uri().optional().allow('', null),
  color_hex: colorHexSchema,
  sort_order: Joi.number().integer().min(0),
  is_active: Joi.boolean(),
};

const createCategorySchema = Joi.object({
  ...categoryBaseFields,
  code: categoryBaseFields.code.required().messages({
    'string.pattern.base': 'code chỉ được chứa chữ thường, số và dấu gạch dưới',
    'any.required': msg.required('code'),
  }),
  name_vi: categoryBaseFields.name_vi.required().messages({
    'string.empty': msg.empty('Tên tiếng Việt'),
    'string.min': msg.min('Tên tiếng Việt', LIMITS.NAME_MIN),
    'string.max': msg.max('Tên tiếng Việt', 100),
    'any.required': msg.required('Tên tiếng Việt'),
  }),
  sort_order: categoryBaseFields.sort_order.default(0),
  is_active: categoryBaseFields.is_active.default(true),
});

const updateCategorySchema = makeOptional(Joi.object(categoryBaseFields));

// ── Param ─────────────────────────────────────────────────────────────────────

const idParamSchema = numericIdParam('id');

module.exports = {
  categoryQuerySchema,
  categoryTreeQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
};
