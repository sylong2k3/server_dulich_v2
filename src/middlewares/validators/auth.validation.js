const Joi = require("joi");
const patterns = require("./common/patterns");

const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(100).required().messages({
    "string.email": "Email không hợp lệ",
    "string.max": "Email không được quá 100 ký tự",
    "string.empty": "Email không được để trống",
    "any.required": "Email là bắt buộc",
  }),

  phone: Joi.string().trim().pattern(patterns.phone).optional().allow("", null).messages({
    "string.pattern.base": "Số điện thoại không hợp lệ",
  }),

  full_name: Joi.string().trim().min(2).max(100).optional().allow("", null).messages({
    "string.min": "Họ tên phải có ít nhất 2 ký tự",
    "string.max": "Họ tên không được quá 100 ký tự",
    "string.empty": "Họ tên không được để trống",
  }),

  password: Joi.string().min(8).max(128).pattern(patterns.password).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
    "string.max": "Mật khẩu không được quá 128 ký tự",
    "string.pattern.base": "Mật khẩu phải có chữ thường, chữ hoa, số và ký tự đặc biệt",
    "string.empty": "Mật khẩu không được để trống",
    "any.required": "Mật khẩu là bắt buộc",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Xác nhận mật khẩu không khớp",
    "string.empty": "Xác nhận mật khẩu không được để trống",
    "any.required": "Xác nhận mật khẩu là bắt buộc",
  }),
});

const loginSchema = Joi.object({
  login: Joi.string().trim().required().messages({
    "string.empty": "Email hoặc số điện thoại không được để trống",
    "any.required": "Email hoặc số điện thoại là bắt buộc",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Mật khẩu không được để trống",
    "any.required": "Mật khẩu là bắt buộc",
  }),

  remember: Joi.boolean().optional().default(false),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "string.empty": "Refresh token không được để trống",
    "any.required": "Refresh token là bắt buộc",
  }),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional().messages({
    "string.empty": "Refresh token không được để trống",
  }),
});

const passwordResetRequestSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.email": "Email không hợp lệ",
    "string.empty": "Email không được để trống",
    "any.required": "Email là bắt buộc",
  }),
});

const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Token reset không được để trống",
    "any.required": "Token reset là bắt buộc",
  }),

  password: Joi.string().min(8).max(128).pattern(patterns.password).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
    "string.max": "Mật khẩu không được quá 128 ký tự",
    "string.pattern.base": "Mật khẩu phải có chữ thường, chữ hoa, số và ký tự đặc biệt",
    "string.empty": "Mật khẩu không được để trống",
    "any.required": "Mật khẩu là bắt buộc",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Xác nhận mật khẩu không khớp",
    "string.empty": "Xác nhận mật khẩu không được để trống",
    "any.required": "Xác nhận mật khẩu là bắt buộc",
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Mật khẩu hiện tại không được để trống",
    "any.required": "Mật khẩu hiện tại là bắt buộc",
  }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(patterns.password)
    .disallow(Joi.ref("currentPassword"))
    .required()
    .messages({
      "string.min": "Mật khẩu mới phải có ít nhất 8 ký tự",
      "string.max": "Mật khẩu mới không được quá 128 ký tự",
      "string.pattern.base": "Mật khẩu mới phải có chữ thường, chữ hoa, số và ký tự đặc biệt",
      "any.invalid": "Mật khẩu mới phải khác mật khẩu hiện tại",
      "string.empty": "Mật khẩu mới không được để trống",
      "any.required": "Mật khẩu mới là bắt buộc",
    }),

  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Xác nhận mật khẩu mới không khớp",
    "string.empty": "Xác nhận mật khẩu mới không được để trống",
    "any.required": "Xác nhận mật khẩu mới là bắt buộc",
  }),
});

const updateProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "Họ tên phải có ít nhất 2 ký tự",
    "string.max": "Họ tên không được quá 100 ký tự",
    "string.empty": "Họ tên không được để trống",
  }),

  phone: Joi.string().trim().pattern(patterns.phone).optional().allow("", null).messages({
    "string.pattern.base": "Số điện thoại không hợp lệ",
  }),

  avatar_url: Joi.string().max(500).optional().allow("", null).messages({
    "string.max": "URL avatar không được quá 500 ký tự",
  }),

  date_of_birth: Joi.date().optional(),
  gender: Joi.string().max(10).optional().allow("", null),
  nationality: Joi.string().max(100).optional().allow("", null),
  preferred_language: Joi.string().max(10).optional(),
  preferred_currency: Joi.string().max(10).optional(),
  preferred_distance: Joi.string().max(10).optional(),
  fcm_token: Joi.string().max(2048).optional().allow("", null),
  apns_token: Joi.string().max(2048).optional().allow("", null),
  device_os: Joi.string().max(20).optional().allow("", null),
  app_version: Joi.string().max(20).optional().allow("", null),
});

const totpCodeSchema = Joi.object({
  totp_code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    "string.length": "Mã OTP phải có đúng 6 chữ số",
    "string.pattern.base": "Mã OTP chỉ gồm chữ số",
    "any.required": "Mã OTP là bắt buộc",
  }),
});

const verify2FALoginSchema = Joi.object({
  temp_token: Joi.string().required().messages({
    "any.required": "temp_token là bắt buộc",
  }),
  totp_code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    "string.length": "Mã OTP phải có đúng 6 chữ số",
    "string.pattern.base": "Mã OTP chỉ gồm chữ số",
    "any.required": "Mã OTP là bắt buộc",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  updateProfileSchema,
  totpCodeSchema,
  verify2FALoginSchema,
};
