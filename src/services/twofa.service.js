const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const TwoFARepository = require("../models/repositories/twofa.repository");
const UserRepository = require("../models/repositories/user.repository");
const emailService = require("./email.service");
const { Api400Error, Api404Error, Api409Error } = require("../core/error.response");

const APP_NAME = process.env.APP_NAME || "Du Lịch Ninh Bình";

class TwoFAService {
  // Bước 1: Sinh secret + QR code để frontend hiển thị
  async generateSetup(userId) {
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Api404Error("Người dùng không tồn tại");
    if (user.two_factor_enabled) throw new Api409Error("2FA đã được bật");

    const secret = speakeasy.generateSecret({
      name: `${APP_NAME} (${user.email})`,
      length: 20,
    });

    // Lưu secret tạm (chưa enable, chờ verify)
    await TwoFARepository.saveSecret(userId, secret.base32);

    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret: secret.base32,
      otpauthUrl,
      qrCode: qrCodeDataUrl,
    };
  }

  // Bước 2: Xác nhận TOTP code → bật 2FA
  async enableTwoFA(userId, totpCode) {
    const secret = await TwoFARepository.getSecret(userId);
    if (!secret) throw new Api400Error("Chưa khởi tạo 2FA. Hãy gọi /2fa/setup trước");

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: totpCode,
      window: 1,
    });

    if (!isValid) throw new Api400Error("Mã OTP không hợp lệ");

    await UserRepository.updateUser(userId, { two_factor_enabled: true });

    const user = await UserRepository.findUserById(userId);
    await emailService.send2FAEnabledEmail(user.email).catch(() => {});

    return true;
  }

  // Tắt 2FA (yêu cầu xác nhận TOTP)
  async disableTwoFA(userId, totpCode) {
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Api404Error("Người dùng không tồn tại");
    if (!user.two_factor_enabled) throw new Api409Error("2FA chưa được bật");

    const secret = await TwoFARepository.getSecret(userId);
    if (!secret) throw new Api400Error("Không tìm thấy cấu hình 2FA");

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: totpCode,
      window: 1,
    });

    if (!isValid) throw new Api400Error("Mã OTP không hợp lệ");

    await UserRepository.updateUser(userId, { two_factor_enabled: false });
    await TwoFARepository.deleteSecret(userId);
    return true;
  }

  // Xác minh TOTP trong quá trình đăng nhập
  async verifyLoginToken(userId, totpCode) {
    const secret = await TwoFARepository.getSecret(userId);
    if (!secret) throw new Api400Error("2FA chưa được cấu hình cho tài khoản này");

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: totpCode,
      window: 1,
    });

    if (!isValid) throw new Api400Error("Mã OTP không hợp lệ hoặc đã hết hạn");
    return true;
  }

  async getStatus(userId) {
    const user = await UserRepository.findUserById(userId);
    if (!user) throw new Api404Error("Người dùng không tồn tại");
    const hasSecret = !!(await TwoFARepository.getSecret(userId));
    return {
      enabled: !!user.two_factor_enabled,
      setup_pending: hasSecret && !user.two_factor_enabled,
    };
  }
}

module.exports = new TwoFAService();
