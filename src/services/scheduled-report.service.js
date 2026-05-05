/**
 * Scheduled Report Service — GAP 1 Fix
 *
 * Tự động tổng hợp báo cáo định kỳ và gửi thông báo cho Bộ/Sở VHTTDL.
 * Chạy trong worker có CLUSTER_WORKER_ID=0 để tránh chạy nhiều lần.
 *
 * Lịch mặc định (tuỳ chỉnh qua env):
 *   REPORT_CRON_WEEKLY  = '0 7 * * 1'   → 7h sáng thứ Hai hàng tuần
 *   REPORT_CRON_MONTHLY = '0 7 1 * *'   → 7h sáng ngày 1 hàng tháng
 */

const cron = require('node-cron');
const GovernanceService = require('./governance.service');
const NotificationService = require('./notification.service');
const { getTransporter } = require('../configs/email');
const UserRepository = require('../models/repositories/user.repository');
const { query: dbQuery } = require('../configs/database');

const WORKER_ID = process.env.CLUSTER_WORKER_ID ?? 'standalone';
const IS_SINGLETON_WORKER = WORKER_ID === '0' || WORKER_ID === 'standalone';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Lấy role IDs từ codes (query 1 lần)
 */
const getRoleIdsByCodes = async (codes = []) => {
  if (!codes.length) return [];
  const { rows } = await dbQuery(
    `SELECT id FROM roles WHERE lower(code) = ANY($1::text[])`,
    [codes.map((c) => String(c).toLowerCase())],
  );
  return rows.map((r) => Number(r.id)).filter(Boolean);
};

/**
 * Gửi email tóm tắt cho danh sách users
 */
const sendSummaryEmail = async (users, subject, htmlBody) => {
  if (!process.env.EMAIL_USER) return; // email chưa cấu hình

  const transporter = getTransporter();
  const emailList = users
    .map((u) => u.email)
    .filter(Boolean);

  if (!emailList.length) return;

  await transporter.sendMail({
    from: `"Du Lịch Ninh Bình" <${process.env.EMAIL_USER}>`,
    to: emailList.join(', '),
    subject,
    html: htmlBody,
  });
};

/**
 * Tạo HTML email tóm tắt báo cáo Bộ
 */
const buildMinistryEmailHtml = (overview, period) => {
  const ag = overview.aggregate;
  return `
    <h2>📊 Báo cáo tổng quan du lịch — ${period}</h2>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><td><b>Tổng điểm du lịch</b></td><td>${ag.total_spots.toLocaleString('vi')}</td></tr>
      <tr><td><b>Đơn vị dịch vụ</b></td><td>${ag.total_service_units.toLocaleString('vi')}</td></tr>
      <tr><td><b>Đơn vị mới</b></td><td>${ag.new_businesses.toLocaleString('vi')}</td></tr>
      <tr><td><b>Doanh thu báo cáo</b></td><td>${Number(ag.reported_revenue_vnd).toLocaleString('vi')} VND</td></tr>
      <tr><td><b>Cảnh báo quá tải</b></td><td>${overview.overload_alerts.total}</td></tr>
    </table>
    <p>Truy cập hệ thống để xem chi tiết từng địa phương.</p>
  `;
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * Gửi báo cáo tuần cho Bộ + Sở
 * Chạy: 7h sáng thứ Hai hàng tuần
 */
const runWeeklyReport = async () => {
  try {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const period = `Tuần ${weekAgo.toLocaleDateString('vi-VN')} – ${now.toLocaleDateString('vi-VN')}`;

    // Tổng hợp dữ liệu (admin role giả lập để bypass ensureAccess)
    const overview = await GovernanceService.getMinistryOverview(
      { from_date: weekAgo.toISOString(), to_date: now.toISOString() },
      { role: { code: 'system_admin' } },
    );

    const subject = `[Báo cáo tuần] ${period}`;
    const html = buildMinistryEmailHtml(overview, period);

    // Gửi notification trong app
    const roleIds = await getRoleIdsByCodes(['ministry_manager', 'department_manager']);
    if (roleIds.length > 0) {
      await NotificationService.createNotificationForRoleIds({
        type: 'system_report',
        title_vi: `📊 ${subject}`,
        body_vi: `Báo cáo tổng quan du lịch ${period} đã sẵn sàng. Tổng điểm DL: ${overview.aggregate.total_spots}, Cảnh báo quá tải: ${overview.overload_alerts.total}.`,
        data: { period_type: 'weekly', from: weekAgo.toISOString(), to: now.toISOString() },
      }, roleIds);
    }

    // Gửi email
    const targetUsers = await UserRepository.getUsersByRoleCodes(['ministry_manager', 'department_manager']);
    await sendSummaryEmail(targetUsers, subject, html);

    console.log(`[ScheduledReport] Weekly report sent to ${roleIds.length} roles, ${targetUsers.length} users`);
  } catch (err) {
    console.error('[ScheduledReport] Weekly report failed:', err.message);
  }
};

/**
 * Gửi báo cáo tháng cho Bộ + Sở
 * Chạy: 7h sáng ngày 1 hàng tháng
 */
const runMonthlyReport = async () => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const period = `Tháng ${firstDay.getMonth() + 1}/${firstDay.getFullYear()}`;

    const overview = await GovernanceService.getMinistryOverview(
      { from_date: firstDay.toISOString(), to_date: lastDay.toISOString() },
      { role: { code: 'system_admin' } },
    );

    const subject = `[Báo cáo tháng] ${period}`;
    const html = buildMinistryEmailHtml(overview, period);

    const roleIds = await getRoleIdsByCodes(['ministry_manager', 'department_manager']);
    if (roleIds.length > 0) {
      await NotificationService.createNotificationForRoleIds({
        type: 'system_report',
        title_vi: `📈 ${subject}`,
        body_vi: `Báo cáo tổng quan du lịch ${period} đã sẵn sàng. Doanh thu: ${Number(overview.aggregate.reported_revenue_vnd).toLocaleString('vi')} VND.`,
        data: { period_type: 'monthly', from: firstDay.toISOString(), to: lastDay.toISOString() },
      }, roleIds);
    }

    const targetUsers = await UserRepository.getUsersByRoleCodes(['ministry_manager', 'department_manager']);
    await sendSummaryEmail(targetUsers, subject, html);

    console.log(`[ScheduledReport] Monthly report sent for ${period}`);
  } catch (err) {
    console.error('[ScheduledReport] Monthly report failed:', err.message);
  }
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const WEEKLY_CRON  = process.env.REPORT_CRON_WEEKLY  || '0 7 * * 1'; // Thứ Hai 7h
const MONTHLY_CRON = process.env.REPORT_CRON_MONTHLY || '0 7 1 * *'; // Ngày 1 hàng tháng 7h

let weeklyJob  = null;
let monthlyJob = null;

const start = () => {
  // Chỉ chạy trên worker 0 (singleton) để tránh gửi báo cáo trùng lặp trong cluster
  if (!IS_SINGLETON_WORKER) {
    console.log(`[ScheduledReport] Skipped — worker ${WORKER_ID} is not singleton`);
    return;
  }

  weeklyJob = cron.schedule(WEEKLY_CRON, runWeeklyReport, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  monthlyJob = cron.schedule(MONTHLY_CRON, runMonthlyReport, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  console.log(`[ScheduledReport] Started — weekly: "${WEEKLY_CRON}", monthly: "${MONTHLY_CRON}" (worker ${WORKER_ID})`);
};

const stop = () => {
  weeklyJob?.destroy();
  monthlyJob?.destroy();
  weeklyJob  = null;
  monthlyJob = null;
};

module.exports = { start, stop, runWeeklyReport, runMonthlyReport };
