const express = require("express");
const passport = require("passport");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const upload = require("../middlewares/upload");
const { authenticateToken, optionalAuth } = require("../middlewares/auth.middleware");
const { validateBody } = require("../middlewares/validation");
const {
  registerSchema,
  loginSchema,
  logoutSchema,
  changePasswordSchema,
  updateProfileSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  totpCodeSchema,
  verify2FALoginSchema,
} = require("../middlewares/validators/auth.validation");
const {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
} = require("../middlewares/rate-limiter");

// ─── Xác thực cơ bản ────────────────────────────────────────────────────────
// ROUTE: POST /register - Tạo mới xác thực tài khoản. Xử lý bởi authController.register. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post("/register", registerLimiter, validateBody(registerSchema), authController.register);
// ROUTE: POST /login - Đăng nhập xác thực tài khoản. Xử lý bởi authController.login. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post("/login", loginLimiter, validateBody(loginSchema), authController.login);
// ROUTE: POST /refresh - Làm mới phiên đăng nhập/token xác thực tài khoản. Xử lý bởi authController.refreshToken. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post("/refresh", refreshLimiter, authController.refreshToken);
// ROUTE: POST /logout - Đăng xuất xác thực tài khoản. Xử lý bởi authController.logout. Truy cập: cho phép đăng nhập tùy chọn.
router.post("/logout", optionalAuth, validateBody(logoutSchema), authController.logout);

// ─── Hồ sơ cá nhân ──────────────────────────────────────────────────────────
// ROUTE: GET /me - Truy vấn xác thực tài khoản. Xử lý bởi authController.getProfile. Truy cập: yêu cầu đăng nhập.
router.get("/me", authenticateToken, authController.getProfile);
// ROUTE: PUT /me - Cập nhật xác thực tài khoản. Xử lý bởi authController.updateProfile. Truy cập: yêu cầu đăng nhập.
router.put("/me", authenticateToken, upload.single("avatar_url"), upload.process(), validateBody(updateProfileSchema), authController.updateProfile);
// ROUTE: POST /change-password - Đổi mật khẩu xác thực tài khoản. Xử lý bởi authController.changePassword. Truy cập: yêu cầu đăng nhập.
router.post("/change-password", authenticateToken, validateBody(changePasswordSchema), authController.changePassword);

// ─── NV-04: Quên / Đặt lại mật khẩu ────────────────────────────────────────
// ROUTE: POST /forgot-password - Khôi phục/đặt lại mật khẩu xác thực tài khoản. Xử lý bởi authController.forgotPassword. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post("/forgot-password", forgotPasswordLimiter, validateBody(passwordResetRequestSchema), authController.forgotPassword);
// ROUTE: POST /reset-password - Khôi phục/đặt lại mật khẩu xác thực tài khoản. Xử lý bởi authController.resetPassword. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post("/reset-password", validateBody(passwordResetSchema), authController.resetPassword);

// ─── NV-01: Xác thực email ──────────────────────────────────────────────────
// ROUTE: POST /verify-email/send - Gửi dữ liệu/thông báo xác thực tài khoản. Xử lý bởi authController.sendVerificationEmail. Truy cập: yêu cầu đăng nhập.
router.post("/verify-email/send", authenticateToken, authController.sendVerificationEmail);
// ROUTE: GET /verify-email/:token - Xác minh xác thực tài khoản. Xử lý bởi authController.verifyEmail. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get("/verify-email/:token", authController.verifyEmail);

// ─── NV-02: Google OAuth ────────────────────────────────────────────────────
// ROUTE: GET /google -> handler
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
// ROUTE: GET /google/callback - Truy vấn xác thực tài khoản. Xử lý bởi authController.googleCallback. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get( "/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login?error=oauth_failed" }), authController.googleCallback );

// ─── NV-06: 2FA (TOTP) ──────────────────────────────────────────────────────
// ROUTE: GET /2fa/status - Truy vấn xác thực tài khoản. Xử lý bởi authController.get2FAStatus. Truy cập: yêu cầu đăng nhập.
router.get("/2fa/status", authenticateToken, authController.get2FAStatus);
// ROUTE: POST /2fa/setup - Thiết lập xác thực tài khoản. Xử lý bởi authController.setup2FA. Truy cập: yêu cầu đăng nhập.
router.post("/2fa/setup", authenticateToken, authController.setup2FA);
// ROUTE: POST /2fa/enable - Kích hoạt xác thực tài khoản. Xử lý bởi authController.enable2FA. Truy cập: yêu cầu đăng nhập.
router.post("/2fa/enable", authenticateToken, validateBody(totpCodeSchema), authController.enable2FA);
// ROUTE: POST /2fa/disable - Vô hiệu hóa xác thực tài khoản. Xử lý bởi authController.disable2FA. Truy cập: yêu cầu đăng nhập.
router.post("/2fa/disable", authenticateToken, validateBody(totpCodeSchema), authController.disable2FA);
// ROUTE: POST /2fa/verify-login - Xác minh xác thực tài khoản. Xử lý bởi authController.verify2FALogin. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post("/2fa/verify-login", validateBody(verify2FALoginSchema), authController.verify2FALogin);

module.exports = router;
