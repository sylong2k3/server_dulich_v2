const authService = require("../services/auth.service");
const twoFAService = require("../services/twofa.service");
const { OK, CREATED } = require("../core/success.response");
const { Api401Error } = require("../core/error.response");
const TokenManager = require("../utils/tokenManager");
const asyncHandler = require("../helpers/async-handler");
const RefreshTokenRepository = require("../models/repositories/refresh-token.repository");
const { parseDurationToMs } = require("../utils/jwt");

class AuthController {
  // ─── Đăng ký ────────────────────────────────────────────────────────────────
  static register = asyncHandler(async (req, res) => {
    const { email, phone, full_name, password } = req.body;
    const { user, tokens } = await authService.registerUser({ email, phone, full_name, password });

    return CREATED(res, "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực.", {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
    });
  });

  // ─── Đăng nhập ──────────────────────────────────────────────────────────────
  static login = asyncHandler(async (req, res) => {
    const { login, password, remember } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || null;
    const result = await authService.loginUser({ login, password, remember, ip });

    // Nếu tài khoản bật 2FA → trả tín hiệu yêu cầu OTP
    if (result.requires_2fa) {
      return OK(res, "Yêu cầu xác thực 2 yếu tố", {
        requires_2fa: true,
        temp_token: result.temp_token,
      });
    }

    return OK(res, "Đăng nhập thành công", {
      user: result.user.toJSON(),
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      tokenType: result.tokens.tokenType,
      expiresIn: result.tokens.expiresIn,
      refreshExpiresIn: result.tokens.refreshExpiresIn,
    });
  });

  // ─── Làm mới token ──────────────────────────────────────────────────────────
  static refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken || req.headers["x-refresh-token"];
    if (!refreshToken) throw new Api401Error("Thiếu refresh token", ["MISSING_REFRESH_TOKEN"]);

    const newTokens = await authService.refreshUserToken(refreshToken);

    return OK(res, "Làm mới token thành công", {
      accessToken: newTokens.accessToken,
      tokenType: newTokens.tokenType,
      expiresIn: newTokens.expiresIn,
      refreshExpiresIn: newTokens.refreshExpiresIn,
    });
  });

  // ─── Đăng xuất ──────────────────────────────────────────────────────────────
  static logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken || req.headers["x-refresh-token"];
    await authService.logoutUser(refreshToken);
    return OK(res, "Đăng xuất thành công", {});
  });

  // ─── Hồ sơ cá nhân ──────────────────────────────────────────────────────────
  static getProfile = asyncHandler(async (req, res) => {
    return OK(res, "Lấy thông tin người dùng thành công", { user: req.user.toJSON() });
  });

  static updateProfile = asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    const updatedUser = await authService.updateProfile(req.user.id, updates);
    return OK(res, "Cập nhật hồ sơ thành công", { user: updatedUser.toJSON() });
  });

  // ─── Đổi mật khẩu ───────────────────────────────────────────────────────────
  static changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changeUserPassword(req.user.id, currentPassword, newPassword);
    return OK(res, "Đổi mật khẩu thành công", {});
  });

  // ─── NV-04: Quên / Đặt lại mật khẩu ────────────────────────────────────────
  static forgotPassword = asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    return OK(res, "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.", {});
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    return OK(res, "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.", {});
  });

  // ─── NV-01: Xác thực email ──────────────────────────────────────────────────
  static sendVerificationEmail = asyncHandler(async (req, res) => {
    await authService.resendVerificationEmail(req.user.id);
    return OK(res, "Email xác thực đã được gửi lại.", {});
  });

  static verifyEmail = asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.params.token);
    return OK(res, "Xác thực email thành công.", {});
  });

  // ─── NV-02: Google OAuth callback ───────────────────────────────────────────
  static googleCallback = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) throw new Api401Error("Xác thực Google thất bại");

    const tokens = TokenManager.generateTokens(user);
    await RefreshTokenRepository.createToken({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN)),
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
    return res.redirect(redirectUrl);
  });

  // ─── NV-06: 2FA ─────────────────────────────────────────────────────────────
  static get2FAStatus = asyncHandler(async (req, res) => {
    const status = await twoFAService.getStatus(req.user.id);
    return OK(res, "Trạng thái 2FA", status);
  });

  static setup2FA = asyncHandler(async (req, res) => {
    const data = await twoFAService.generateSetup(req.user.id);
    return OK(res, "Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy...)", {
      qrCode: data.qrCode,
      secret: data.secret,
    });
  });

  static enable2FA = asyncHandler(async (req, res) => {
    await twoFAService.enableTwoFA(req.user.id, req.body.totp_code);
    return OK(res, "Xác thực 2 yếu tố đã được bật thành công.", {});
  });

  static disable2FA = asyncHandler(async (req, res) => {
    await twoFAService.disableTwoFA(req.user.id, req.body.totp_code);
    return OK(res, "Xác thực 2 yếu tố đã được tắt.", {});
  });

  // Hoàn tất đăng nhập sau khi xác thực OTP (2FA login flow)
  static verify2FALogin = asyncHandler(async (req, res) => {
    const { temp_token, totp_code } = req.body;
    if (!temp_token) throw new Api401Error("Thiếu temp_token");

    const decoded = await TokenManager.validateTempToken(temp_token);
    const { user, tokens } = await authService.loginWith2FA(decoded.id, totp_code);

    return OK(res, "Đăng nhập thành công", {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
    });
  });
}

module.exports = AuthController;
