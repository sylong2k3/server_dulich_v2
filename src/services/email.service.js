const { getTransporter } = require("../configs/email");

const APP_NAME = process.env.APP_NAME || "Du Lịch Ninh Bình";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM = process.env.EMAIL_FROM || `"${APP_NAME}" <noreply@dulichninhbinh.vn>`;

class EmailService {
  async send({ to, subject, html }) {
    const transporter = getTransporter();
    await transporter.sendMail({ from: FROM, to, subject, html });
  }

  async sendPasswordResetEmail(to, token) {
    const link = `${APP_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1a73e8">Đặt lại mật khẩu</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <b>${APP_NAME}</b>.</p>
        <p>Nhấn vào nút bên dưới để đặt lại mật khẩu. Liên kết có hiệu lực trong <b>15 phút</b>.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#fff;border-radius:4px;text-decoration:none;margin:16px 0">Đặt lại mật khẩu</a>
        <p style="color:#666;font-size:13px">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">${APP_NAME} &mdash; ${APP_URL}</p>
      </div>`;
    await this.send({ to, subject: `[${APP_NAME}] Đặt lại mật khẩu`, html });
  }

  async sendVerificationEmail(to, token) {
    const link = `${APP_URL}/verify-email?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1a73e8">Xác thực địa chỉ email</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>${APP_NAME}</b>!</p>
        <p>Nhấn vào nút bên dưới để xác thực email. Liên kết có hiệu lực trong <b>24 giờ</b>.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#34a853;color:#fff;border-radius:4px;text-decoration:none;margin:16px 0">Xác thực email</a>
        <p style="color:#666;font-size:13px">Nếu bạn không tạo tài khoản này, hãy bỏ qua email này.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">${APP_NAME} &mdash; ${APP_URL}</p>
      </div>`;
    await this.send({ to, subject: `[${APP_NAME}] Xác thực địa chỉ email`, html });
  }

  async sendPasswordChangedEmail(to) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#ea4335">Mật khẩu đã được thay đổi</h2>
        <p>Mật khẩu tài khoản <b>${APP_NAME}</b> của bạn vừa được thay đổi thành công.</p>
        <p>Nếu đây không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay lập tức.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">${APP_NAME} &mdash; ${APP_URL}</p>
      </div>`;
    await this.send({ to, subject: `[${APP_NAME}] Mật khẩu đã được thay đổi`, html });
  }

  async send2FAEnabledEmail(to) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#34a853">Xác thực 2 yếu tố đã được bật</h2>
        <p>Xác thực 2 yếu tố (2FA) đã được kích hoạt cho tài khoản <b>${APP_NAME}</b> của bạn.</p>
        <p>Từ bây giờ, mỗi lần đăng nhập bạn sẽ cần nhập mã OTP từ ứng dụng xác thực.</p>
        <p style="color:#666;font-size:13px">Nếu đây không phải bạn thực hiện, hãy đặt lại mật khẩu ngay.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">${APP_NAME} &mdash; ${APP_URL}</p>
      </div>`;
    await this.send({ to, subject: `[${APP_NAME}] Xác thực 2 yếu tố đã được bật`, html });
  }
}

module.exports = new EmailService();
