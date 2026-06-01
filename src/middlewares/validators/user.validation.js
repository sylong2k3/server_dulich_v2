const Joi = require("joi");
const patterns = require("./common/patterns");
const { WebPath } = require("./common/file.schemas");

const uuidSchema = Joi.string()
  .guid({ version: ["uuidv4", "uuidv5"] })
  .required()
  .messages({
    "string.guid": "ID phải là UUID hợp lệ",
    "any.required": "ID là bắt buộc",
  });

const createUserSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(255).required().messages({
    "string.email": "Email không hợp lệ",
    "string.max": "Email không được quá 255 ký tự",
    "string.empty": "Email không được để trống",
    "any.required": "Email là bắt buộc",
  }),

  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
    "string.max": "Mật khẩu không được quá 128 ký tự",
    "string.empty": "Mật khẩu không được để trống",
    "any.required": "Mật khẩu là bắt buộc",
  }),

  full_name: Joi.string().min(2).max(255).required().messages({
    "string.min": "Họ tên phải có ít nhất 2 ký tự",
    "string.max": "Họ tên không được quá 255 ký tự",
    "string.empty": "Họ tên không được để trống",
    "any.required": "Họ tên là bắt buộc",
  }),

  phone: Joi.string().pattern(patterns.phone).optional().allow("", null).messages({
    "string.pattern.base": "Số điện thoại không hợp lệ",
  }),

  avatar_url: Joi.alternatives()
    .try(WebPath, Joi.string().pattern(patterns.uploadsWebPath))
    .optional()
    .allow("", null),

  role_id: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional().default(true),
  is_verified: Joi.boolean().optional(),
  sso_provider: Joi.string().max(30).optional().allow("", null),
  sso_uid: Joi.string().max(255).optional().allow("", null),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().max(10).optional().allow("", null),
  nationality: Joi.string().max(100).optional().allow("", null),
  province_code: Joi.string().trim().max(20).optional().allow("", null),
  preferred_language: Joi.string().max(10).optional().allow("", null),
  preferred_currency: Joi.string().max(10).optional().allow("", null),
  preferred_distance: Joi.string().max(10).optional().allow("", null),
  fcm_token: Joi.string().max(2048).optional().allow("", null),
  apns_token: Joi.string().max(2048).optional().allow("", null),
  device_os: Joi.string().max(20).optional().allow("", null),
  app_version: Joi.string().max(20).optional().allow("", null),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(255).optional(),
  full_name: Joi.string().min(2).max(255).optional(),
  phone: Joi.string().pattern(patterns.phone).optional().allow("", null),
  avatar_url: WebPath.allow("", null),
  role_id: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional(),
  is_verified: Joi.boolean().optional(),
  sso_provider: Joi.string().max(30).optional().allow("", null),
  sso_uid: Joi.string().max(255).optional().allow("", null),
  date_of_birth: Joi.date().optional().allow(null),
  gender: Joi.string().max(10).optional().allow("", null),
  nationality: Joi.string().max(100).optional().allow("", null),
  province_code: Joi.string().trim().max(20).optional().allow("", null),
  preferred_language: Joi.string().max(10).optional().allow("", null),
  preferred_currency: Joi.string().max(10).optional().allow("", null),
  preferred_distance: Joi.string().max(10).optional().allow("", null),
  fcm_token: Joi.string().max(2048).optional().allow("", null),
  apns_token: Joi.string().max(2048).optional().allow("", null),
  device_os: Joi.string().max(20).optional().allow("", null),
  app_version: Joi.string().max(20).optional().allow("", null),
})
  .min(1)
  .messages({
    "object.min": "Phải có ít nhất một trường để cập nhật",
  });

const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  search: Joi.string().max(200).optional().allow(""),
  role_id: Joi.number().integer().min(1).optional(),
  province_code: Joi.string().trim().max(20).optional().allow("", null),
  is_active: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("id", "created_at", "updated_at", "email", "full_name", "phone", "last_login_at")
    .optional()
    .default("created_at"),
  sortOrder: Joi.string().valid("ASC", "DESC", "asc", "desc").optional().default("DESC"),
});

const userIdParamSchema = Joi.object({
  id: uuidSchema,
});

const batchDeleteUsersSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().guid({ version: ["uuidv4", "uuidv5"] })).min(1).max(100).required(),
});

const adminUpdatePasswordSchema = Joi.object({
  password: Joi.string().min(8).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

const lockUserSchema = Joi.object({
  reason: Joi.string().max(255).optional().allow("", null),
});

const assignRoleSchema = Joi.object({
  role_id: Joi.number().integer().min(1).required().messages({
    "number.base": "role_id phải là số",
    "number.integer": "role_id phải là số nguyên",
    "number.min": "role_id không hợp lệ",
    "any.required": "role_id là bắt buộc",
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  userIdParamSchema,
  batchDeleteUsersSchema,
  adminUpdatePasswordSchema,
  lockUserSchema,
  assignRoleSchema,
};
