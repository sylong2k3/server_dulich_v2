/**
 * SpotOperatorDashboardProvider — số liệu đặc trưng cho nhà điều hành điểm tham quan.
 * Tập trung vào lượng khách & sức chứa điểm đến.
 *
 * Read-only. Mỗi truy vấn con được bọc lỗi riêng (Requirement 4.4) để một phần lỗi
 * không làm sập toàn bộ dashboard. Mọi field số mặc định 0 (Requirement 4.3).
 */

const GovernanceRepository = require('../../../models/repositories/governance.repository');
const { toNonNegativeNumber, toNullableNumber, safeQuery } = require('../dashboard-utils');

const SpotOperatorDashboardProvider = {
    variant: 'spot_operator',

    async build(ctx) {
        const { businessId, period } = ctx;
        const range = { dateFrom: period.from, dateTo: period.to };

        const [stats, trendRows, topRows, vrSpotRows] = await Promise.all([
            safeQuery('getSpotOperatorStats', GovernanceRepository.getSpotOperatorStats(businessId), {}),
            safeQuery('getSpotVisitTrend', GovernanceRepository.getSpotVisitTrend(businessId, range), []),
            safeQuery('getTopSpotsByCapacity', GovernanceRepository.getTopSpotsByCapacity(businessId, 5), []),
            safeQuery('getVrSpots', GovernanceRepository.getVrSpots(businessId), []),
        ]);

        const summary = {
            managed_spot_count: toNonNegativeNumber(stats.managed_spot_count),
            current_visitors: toNonNegativeNumber(stats.current_visitors),
            avg_capacity_pct: toNonNegativeNumber(stats.avg_capacity_pct),
            peak_capacity_pct: toNonNegativeNumber(stats.peak_capacity_pct),
            capacity_alert_count: toNonNegativeNumber(stats.capacity_alert_count),
            spot_rating_avg: toNonNegativeNumber(stats.spot_rating_avg),
            spot_rating_count: toNonNegativeNumber(stats.spot_rating_count),
            ticket_price_range: {
                min: toNullableNumber(stats.ticket_price_min),
                max: toNullableNumber(stats.ticket_price_max),
            },
            experience_features: {
                vr360: toNonNegativeNumber(stats.feature_vr360),
                ar: toNonNegativeNumber(stats.feature_ar),
                audio: toNonNegativeNumber(stats.feature_audio),
            },
            vr_spots: (Array.isArray(vrSpotRows) ? vrSpotRows : []).map((row) => ({
                spot_id: row.spot_id,
                name_vi: row.name_vi,
                slug: row.slug || null,
                active_scene_count: toNonNegativeNumber(row.active_scene_count),
            })),
        };

        const trend = (Array.isArray(trendRows) ? trendRows : []).map((row) => ({
            period: row.period,
            visits: toNonNegativeNumber(row.visits),
        }));

        const highlights = (Array.isArray(topRows) ? topRows : []).map((row) => ({
            spot_id: row.spot_id,
            name_vi: row.name_vi,
            visitor_count: toNonNegativeNumber(row.visitor_count),
            capacity_pct: toNullableNumber(row.capacity_pct),
            status: row.status || null,
            recorded_at: row.recorded_at || null,
        }));

        return { summary, trend, highlights };
    },
};

module.exports = SpotOperatorDashboardProvider;
