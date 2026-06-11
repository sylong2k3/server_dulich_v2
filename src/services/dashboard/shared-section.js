/**
 * SharedDashboardSection — khối dữ liệu dùng chung cho MỌI variant.
 *
 * Trả về `{ business, period, reported_metrics }`. `reported_metrics` được tổng hợp
 * từ bảng `business_activity_reports` trong khoảng `period`. Mọi field số mặc định `0`.
 *
 * Read-only. Nếu truy vấn lỗi (bảng/cột thiếu), trả về metrics rỗng thay vì làm sập dashboard
 * (theo tiền lệ getConservationMonitoring trong governance.repository.js).
 */

const GovernanceRepository = require('../../models/repositories/governance.repository');

const EMPTY_REPORTED_METRICS = Object.freeze({
    total_revenue_vnd: 0,
    total_bookings: 0,
    total_visitors: 0,
    avg_capacity_pct: 0,
    report_count: 0,
    source: 'business_activity_reports',
    note: 'Số liệu doanh thu, lượt đặt và lượt khách là dữ liệu doanh nghiệp tự báo cáo trong cơ sở dữ liệu, không phải dữ liệu giao dịch phát sinh.',
});

const SharedDashboardSection = {
    /**
     * @param {{ businessId: string, business: object, period: { type?: string, year?: number, from: string, to: string } }} ctx
     * @returns {Promise<{ business: object, period: object, reported_metrics: object }>}
     */
    async build(ctx) {
        const { businessId, business, period } = ctx;

        let reported = EMPTY_REPORTED_METRICS;
        try {
            const rows = await GovernanceRepository.getReportedMetricsSummary(businessId, {
                dateFrom: period.from,
                dateTo: period.to,
            });
            reported = {
                total_revenue_vnd: Number(rows.total_revenue_vnd || 0),
                total_bookings: Number(rows.total_bookings || 0),
                total_visitors: Number(rows.total_visitors || 0),
                avg_capacity_pct: Number(rows.avg_capacity_pct || 0),
                report_count: Number(rows.report_count || 0),
                source: 'business_activity_reports',
                note: EMPTY_REPORTED_METRICS.note,
            };
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[SharedDashboardSection] reported metrics skipped:', err.message);
        }

        return {
            business,
            period,
            reported_metrics: reported,
        };
    },
};

module.exports = SharedDashboardSection;
