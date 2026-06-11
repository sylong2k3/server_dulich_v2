/**
 * TravelCompanyDashboardProvider — số liệu đặc trưng cho công ty lữ hành.
 * Tập trung vào tour & booking.
 *
 * Read-only. Bọc lỗi từng phần (Requirement 4.4); field số mặc định 0 (Requirement 4.3).
 */

const GovernanceRepository = require('../../../models/repositories/governance.repository');
const { toNonNegativeNumber, safeQuery } = require('../dashboard-utils');

const TravelCompanyDashboardProvider = {
    variant: 'travel_company',

    async build(ctx) {
        const { businessId, period } = ctx;
        const range = { dateFrom: period.from, dateTo: period.to };

        const [stats, trendRows, topRows] = await Promise.all([
            safeQuery('getTravelCompanyStats', GovernanceRepository.getTravelCompanyStats(businessId), {}),
            safeQuery('getReportedTrend', GovernanceRepository.getReportedTrend(businessId, range), []),
            safeQuery('getTopTours', GovernanceRepository.getTopTours(businessId, 5), []),
        ]);

        const trend = (Array.isArray(trendRows) ? trendRows : []).map((row) => ({
            period: row.period,
            revenue_vnd: toNonNegativeNumber(row.revenue_vnd),
            bookings: toNonNegativeNumber(row.bookings),
            visitors: toNonNegativeNumber(row.visitors),
        }));

        const reported_bookings = trend.reduce((acc, row) => acc + row.bookings, 0);
        const reported_revenue_vnd = trend.reduce((acc, row) => acc + row.revenue_vnd, 0);

        const summary = {
            tour_count: toNonNegativeNumber(stats.tour_count),
            active_tour_count: toNonNegativeNumber(stats.active_tour_count),
            featured_tour_count: toNonNegativeNumber(stats.featured_tour_count),
            avg_tour_price_vnd: toNonNegativeNumber(stats.avg_tour_price_vnd),
            total_listed_capacity: toNonNegativeNumber(stats.total_listed_capacity),
            avg_tour_duration_days: toNonNegativeNumber(stats.avg_tour_duration_days),
            tour_rating_avg: toNonNegativeNumber(stats.tour_rating_avg),
            tour_rating_count: toNonNegativeNumber(stats.tour_rating_count),
            reported_bookings: toNonNegativeNumber(reported_bookings),
            reported_revenue_vnd: toNonNegativeNumber(reported_revenue_vnd),
        };

        const highlights = (Array.isArray(topRows) ? topRows : []).map((row) => ({
            id: row.id,
            name_vi: row.name_vi,
            rating_avg: toNonNegativeNumber(row.rating_avg),
            rating_count: toNonNegativeNumber(row.rating_count),
            price_from_vnd: toNonNegativeNumber(row.price_from_vnd),
            status: row.status || null,
            is_featured: Boolean(row.is_featured),
        }));

        return { summary, trend, highlights };
    },
};

module.exports = TravelCompanyDashboardProvider;
