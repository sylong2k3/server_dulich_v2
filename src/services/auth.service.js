const UserRepository = require("../models/repositories/user.repository");
const RefreshTokenRepository = require("../models/repositories/refresh-token.repository");
const PasswordResetRepository = require("../models/repositories/password-reset.repository");
const EmailVerificationRepository = require("../models/repositories/email-verification.repository");
const TokenManager = require("../utils/tokenManager");
const uploadService = require("../middlewares/upload");
const emailService = require("./email.service");
const { Api404Error, Api403Error, Api409Error, Api401Error, Api400Error, BusinessLogicError } = require("../core/error.response");
const { parseDurationToMs } = require("../utils/jwt");

class AuthService {
  async registerUser(userData) {
    const email = String(userData.email || "").trim().toLowerCase();
    const phone = userData.phone ? String(userData.phone).trim() : null;
    const full_name = userData.full_name ? String(userData.full_name).trim() : null;
    const { password } = userData;

    if (await UserRepository.checkEmailExists(email)) {
      throw new Api409Error("Email đã tồn tại");
    }

    if (phone && (await UserRepository.checkPhoneExists(phone))) {
      throw new Api409Error("Số điện thoại đã tồn tại");
    }

    const role_id = await UserRepository.getDefaultRoleId();
    if (!role_id) {
      throw new BusinessLogicError("Không tìm thấy role mặc định để đăng ký");
    }

    const newUser = await UserRepository.createUser({
      email,
      phone,
      password,
      full_name,
      role_id,
    });

    const tokens = TokenManager.generateTokens(newUser);

    await RefreshTokenRepository.createToken({
      token: tokens.refreshToken,
      userId: newUser.id,
      expiresAt: new Date(Date.now() + parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN)),
    });

    // Gửi email xác thực (không block đăng ký nếu gửi mail lỗi)
    this._sendVerificationEmailSilent(newUser.id, email).catch(() => { });

    return { user: newUser, tokens };
  }

  async _sendVerificationEmailSilent(userId, email) {
    try {
      const token = await EmailVerificationRepository.createToken(userId);
      await emailService.sendVerificationEmail(email, token);
    } catch {
      // ignore silently
    }
  }

  async loginUser(loginData) {
    const { login, password, ip } = loginData;
    const identity = String(login || "").trim();

    let user = await UserRepository.findUserByMail(identity.toLowerCase());
    if (!user) user = await UserRepository.findUserByPhone(identity);

    if (!user) {
      throw new Api401Error("Email/Số điện thoại hoặc mật khẩu không đúng");
    }

    if (user.is_active === false) {
      throw new Api403Error("Tài khoản đã bị vô hiệu hóa");
    }

    const isPasswordValid = await UserRepository.verifyPassword(user, password);
    if (!isPasswordValid) {
      throw new Api401Error("Email/Số điện thoại hoặc mật khẩu không đúng");
    }

    await UserRepository.updateLoginInfo(user.id, ip || null);

    // Nếu 2FA đang bật, không cấp token ngay — trả tín hiệu yêu cầu OTP
    if (user.two_factor_enabled) {
      const tempToken = TokenManager.generateTempToken(user);
      return { user, requires_2fa: true, temp_token: tempToken };
    }

    const tokens = TokenManager.generateTokens(user);

    await RefreshTokenRepository.createToken({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN)),
    });

    return { user, tokens };
  }

  // NV-06: Hoàn tất đăng nhập sau khi xác thực 2FA
  async loginWith2FA(userId, totpCode) {
    const TwoFAService = require("./twofa.service");
    await TwoFAService.verifyLoginToken(userId, totpCode);

    const user = await UserRepository.findUserById(userId);
    if (!user || !user.is_active) {
      throw new Api403Error("Tài khoản không hợp lệ");
    }

    const tokens = TokenManager.generateTokens(user);
    await RefreshTokenRepository.createToken({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN)),
    });

    return { user, tokens };
  }

  async refreshUserToken(token) {
    const storedToken = await RefreshTokenRepository.findValidToken(token);
    if (!storedToken) {
      throw new Api401Error("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    const decoded = await TokenManager.validateRefreshToken(token);
    const user = await UserRepository.findUserById(decoded.id);

    if (!user) {
      throw new Api404Error("Người dùng không tồn tại");
    }

    if (!user.is_active) {
      throw new Api403Error("Tài khoản đã bị vô hiệu hóa");
    }

    await RefreshTokenRepository.revokeByToken(token);
    const newTokens = TokenManager.generateTokens(user);

    await RefreshTokenRepository.createToken({
      token: newTokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN)),
    });

    return newTokens;
  }

  async logoutUser(refreshToken) {
    if (refreshToken) {
      await RefreshTokenRepository.revokeByToken(refreshToken);
    }
    return true;
  }

  async changeUserPassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findUserById(userId);
    if (!user) {
      throw new Api404Error("Người dùng không tồn tại");
    }

    const isCurrentPasswordValid = await UserRepository.verifyPassword(user, currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Api401Error("Mật khẩu hiện tại không đúng");
    }

    await UserRepository.updatePassword(userId, newPassword);
    await RefreshTokenRepository.revokeAllUserTokens(userId);
  }

  // NV-04: Quên mật khẩu — luôn trả success để không lộ email
  async forgotPassword(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await UserRepository.findUserByMailAny(normalizedEmail);
    if (user && user.is_active) {
      const token = await PasswordResetRepository.createToken(user.id);
      await emailService.sendPasswordResetEmail(normalizedEmail, token).catch(() => { });
    }
    return true;
  }

  // NV-04: Đặt lại mật khẩu bằng token
  async resetPassword(rawToken, newPassword) {
    const record = await PasswordResetRepository.findValidToken(rawToken);
    if (!record) {
      throw new Api400Error("Token không hợp lệ hoặc đã hết hạn");
    }

    const user = await UserRepository.findUserById(record.user_id);
    if (!user || !user.is_active) {
      throw new Api403Error("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa");
    }

    await UserRepository.updatePassword(user.id, newPassword);
    await PasswordResetRepository.markAsUsed(rawToken);
    await RefreshTokenRepository.revokeAllUserTokens(user.id);

    await emailService.sendPasswordChangedEmail(user.email).catch(() => { });
    return true;
  }

  // NV-01: Gửi lại email xác thực
  async resendVerificationEmail(userId) {
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Api404Error("Người dùng không tồn tại");
    if (user.is_verified) throw new Api409Error("Email đã được xác thực");

    const token = await EmailVerificationRepository.createToken(userId);
    try {
      await emailService.sendVerificationEmail(user.email, token);
    } catch {
      throw new BusinessLogicError("Không thể gửi email xác thực, vui lòng thử lại sau");
    }
    return true;
  }

  // NV-01: Xác thực email
  async verifyEmail(rawToken) {
    const record = await EmailVerificationRepository.findValidToken(rawToken);
    if (!record) {
      throw new Api400Error("Token xác thực không hợp lệ hoặc đã hết hạn");
    }

    await UserRepository.updateUser(record.user_id, { is_verified: true });
    await EmailVerificationRepository.markAsUsed(rawToken);
    return true;
  }

  async updateProfile(userId, updates) {
    const allowedFields = [
      "full_name",
      "phone",
      "avatar_url",
      "date_of_birth",
      "gender",
      "nationality",
      "preferred_language",
      "preferred_currency",
      "preferred_distance",
      "fcm_token",
      "apns_token",
      "device_os",
      "app_version",
    ];

    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );

    const user = await UserRepository.findUserById(userId);
    if (!user) {
      throw new Api404Error("USER_NOT_FOUND");
    }

    if (safeUpdates.avatar_url && user.avatar_url && safeUpdates.avatar_url !== user.avatar_url) {
      await uploadService.deleteFileByUrl(user.avatar_url);
    }

    return UserRepository.updateUser(userId, safeUpdates);
  }
}

module.exports = new AuthService();
