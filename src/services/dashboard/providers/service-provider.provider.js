/**
 * ServiceProviderDashboardProvider — số liệu đặc trưng cho nhà cung cấp dịch vụ
 * (lưu trú/ăn uống/vận chuyển...). Tập trung vào danh mục dịch vụ, khuyến mãi & OCOP.
 *
 * Read-only. Bọc lỗi từng phần (Requirement 4.4); field số mặc định 0 (Requirement 4.3).
 * `voucher_redemption_rate` được tính an toàn (tránh chia 0) — Requirement 3.2.
 */

const GovernanceRepository = require('../../../models/repositories/governance.repository');
const {
    toNonNegativeNumber,
    toNullableNumber,
    safeQuery,
    safeRedemptionRate,
} = require('../dashboard-utils');

const ServiceProviderDashboardProvider = {
    variant: 'service_provider',

    async build(ctx) {
        const { businessId, period } = ctx;
        const range = { dateFrom: period.from, dateTo: period.to };

        const [stats, categoryRows, trendRows] = await Promise.all([
            safeQuery('getServiceProviderStats', GovernanceRepository.getServiceProviderStats(businessId), {}),
            safeQuery('getServiceCategoryBreakdown', GovernanceRepository.getServiceCategoryBreakdown(businessId), []),
            safeQuery('getReportedTrend', GovernanceRepository.getReportedTrend(businessId, range), []),
        ]);

        const voucher_used_count = toNonNegativeNumber(stats.voucher_used_count);
        const voucher_max_uses = toNonNegativeNumber(stats.voucher_max_uses);

        const service_category_breakdown = (Array.isArray(categoryRows) ? categoryRows : []).map((row) => ({
            category: row.category || 'uncategorized',
            count: toNonNegativeNumber(row.count),
        }));

        const summary = {
            service_count: toNonNegativeNumber(stats.service_count),
            active_service_count: toNonNegativeNumber(stats.active_service_count),
            service_category_breakdown,
            service_price_range: {
                min: toNullableNumber(stats.service_price_min),
                max: toNullableNumber(stats.service_price_max),
            },
            voucher_count: toNonNegativeNumber(stats.voucher_count),
            active_voucher_count: toNonNegativeNumber(stats.active_voucher_count),
            voucher_used_count,
            voucher_redemption_rate: safeRedemptionRate(voucher_used_count, voucher_max_uses),
            ocop_count: toNonNegativeNumber(stats.ocop_count),
            active_ocop_count: toNonNegativeNumber(stats.active_ocop_count),
            avg_ocop_stars: toNonNegativeNumber(stats.avg_ocop_stars),
            business_rating_avg: toNonNegativeNumber(stats.business_rating_avg),
            business_rating_count: toNonNegativeNumber(stats.business_rating_count),
        };

        const trend = (Array.isArray(trendRows) ? trendRows : []).map((row) => ({
            period: row.period,
            revenue_vnd: toNonNegativeNumber(row.revenue_vnd),
            bookings: toNonNegativeNumber(row.bookings),
            visitors: toNonNegativeNumber(row.visitors),
        }));

        const reported_revenue_vnd = trend.reduce((acc, row) => acc + row.revenue_vnd, 0);
        summary.reported_revenue_vnd = toNonNegativeNumber(reported_revenue_vnd);

        return { summary, trend };
    },
};

module.exports = ServiceProviderDashboardProvider;
