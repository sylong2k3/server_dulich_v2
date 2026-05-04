const rateLimit = require("express-rate-limit");

// Rate limit cho login: 5 lần / 15 phút mỗi IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
    errors: ["TOO_MANY_LOGIN_ATTEMPTS"],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit cho register: 3 lần / 15 phút mỗi IP
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Quá nhiều lần đăng ký. Vui lòng thử lại sau 15 phút.",
    errors: ["TOO_MANY_REGISTER_ATTEMPTS"],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit cho refresh token: 10 lần / 15 phút mỗi IP
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu làm mới token. Vui lòng thử lại sau.",
    errors: ["TOO_MANY_REFRESH_ATTEMPTS"],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit cho forgot-password: 3 lần / 15 phút mỗi IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 15 phút.",
    errors: ["TOO_MANY_FORGOT_PASSWORD_ATTEMPTS"],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
};
