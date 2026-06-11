'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fc = require('fast-check');

const GovernanceRepository = require('../../models/repositories/governance.repository');
const spotProvider = require('./providers/spot-operator.provider');
const travelProvider = require('./providers/travel-company.provider');
const serviceProvider = require('./providers/service-provider.provider');

const CTX = {
    businessId: '00000000-0000-0000-0000-000000000001',
    business: { id: '00000000-0000-0000-0000-000000000001', business_type: 'hotel' },
    period: { type: 'year', year: 2026, from: '2026-01-01', to: '2026-12-31' },
};

// Hệ sinh giá trị "bẩn": số, chuỗi số, chuỗi rác, null, undefined, âm, NaN, Infinity.
const messyNumber = fc.oneof(
    fc.integer({ min: -1000, max: 1000 }),
    fc.double({ noDefaultInfinity: false, noNaN: false }),
    fc.constantFrom(null, undefined, '42', 'abc', -7, NaN, Infinity, -Infinity)
);

function stubRepo(overrides) {
    const original = {};
    for (const [key, value] of Object.entries(overrides)) {
        original[key] = GovernanceRepository[key];
        GovernanceRepository[key] = value;
    }
    return () => {
        for (const key of Object.keys(overrides)) {
            GovernanceRepository[key] = original[key];
        }
    };
}

function assertFiniteNonNeg(value, label) {
    assert.equal(typeof value, 'number', `${label} phải là number`);
    assert.ok(Number.isFinite(value), `${label} phải hữu hạn (nhận ${value})`);
    assert.ok(value >= 0, `${label} phải ≥ 0 (nhận ${value})`);
}

function assertNullableNumber(value, label) {
    if (value === null) {
        return;
    }
    assert.equal(typeof value, 'number', `${label} phải là number hoặc null`);
    assert.ok(Number.isFinite(value), `${label} phải hữu hạn (nhận ${value})`);
}

// ==================== Task 6.1: số mặc định & chia an toàn ====================
// Validates: Requirements 4.3, 3.2

test('PROPERTY spot_operator: mọi field số trong summary là số hữu hạn ≥ 0', async () => {
    await fc.assert(
        fc.asyncProperty(
            fc.dictionary(
                fc.constantFrom(
                    'managed_spot_count', 'current_visitors', 'avg_capacity_pct', 'peak_capacity_pct',
                    'capacity_alert_count', 'spot_rating_avg', 'spot_rating_count',
                    'ticket_price_min', 'ticket_price_max', 'feature_vr360', 'feature_ar', 'feature_audio'
                ),
                messyNumber
            ),
            async (stats) => {
                const restore = stubRepo({
                    getSpotOperatorStats: async () => stats,
                    getSpotVisitTrend: async () => [],
                    getTopSpotsByCapacity: async () => [],
                });
                try {
                    const { summary } = await spotProvider.build(CTX);
                    assertFiniteNonNeg(summary.managed_spot_count, 'managed_spot_count');
                    assertFiniteNonNeg(summary.current_visitors, 'current_visitors');
                    assertFiniteNonNeg(summary.avg_capacity_pct, 'avg_capacity_pct');
                    assertFiniteNonNeg(summary.peak_capacity_pct, 'peak_capacity_pct');
                    assertFiniteNonNeg(summary.capacity_alert_count, 'capacity_alert_count');
                    assertFiniteNonNeg(summary.spot_rating_avg, 'spot_rating_avg');
                    assertFiniteNonNeg(summary.spot_rating_count, 'spot_rating_count');
                    assertNullableNumber(summary.ticket_price_range.min, 'ticket_price_range.min');
                    assertNullableNumber(summary.ticket_price_range.max, 'ticket_price_range.max');
                    assertFiniteNonNeg(summary.experience_features.vr360, 'vr360');
                    assertFiniteNonNeg(summary.experience_features.ar, 'ar');
                    assertFiniteNonNeg(summary.experience_features.audio, 'audio');
                } finally {
                    restore();
                }
            }
        )
    );
});

test('PROPERTY travel_company: mọi field số trong summary là số hữu hạn ≥ 0', async () => {
    await fc.assert(
        fc.asyncProperty(
            fc.dictionary(
                fc.constantFrom(
                    'tour_count', 'active_tour_count', 'featured_tour_count', 'avg_tour_price_vnd',
                    'total_listed_capacity', 'avg_tour_duration_days', 'tour_rating_avg', 'tour_rating_count'
                ),
                messyNumber
            ),
            async (stats) => {
                const restore = stubRepo({
                    getTravelCompanyStats: async () => stats,
                    getReportedTrend: async () => [],
                    getTopTours: async () => [],
                });
                try {
                    const { summary } = await travelProvider.build(CTX);
                    for (const key of [
                        'tour_count', 'active_tour_count', 'featured_tour_count', 'avg_tour_price_vnd',
                        'total_listed_capacity', 'avg_tour_duration_days', 'tour_rating_avg', 'tour_rating_count',
                        'reported_bookings', 'reported_revenue_vnd',
                    ]) {
                        assertFiniteNonNeg(summary[key], key);
                    }
                } finally {
                    restore();
                }
            }
        )
    );
});

test('PROPERTY service_provider: voucher_redemption_rate luôn hữu hạn kể cả khi max_uses = 0', async () => {
    await fc.assert(
        fc.asyncProperty(
            messyNumber, // used_count
            fc.oneof(fc.constant(0), fc.constant(null), fc.constant(undefined), messyNumber), // max_uses (bao gồm 0)
            async (used, max) => {
                const restore = stubRepo({
                    getServiceProviderStats: async () => ({
                        voucher_used_count: used,
                        voucher_max_uses: max,
                    }),
                    getServiceCategoryBreakdown: async () => [],
                    getReportedTrend: async () => [],
                });
                try {
                    const { summary } = await serviceProvider.build(CTX);
                    assertFiniteNonNeg(summary.voucher_redemption_rate, 'voucher_redemption_rate');
                    for (const key of [
                        'service_count', 'active_service_count', 'voucher_count', 'active_voucher_count',
                        'voucher_used_count', 'ocop_count', 'active_ocop_count', 'avg_ocop_stars',
                        'business_rating_avg', 'business_rating_count', 'reported_revenue_vnd',
                    ]) {
                        assertFiniteNonNeg(summary[key], key);
                    }
                    assertNullableNumber(summary.service_price_range.min, 'service_price_range.min');
                    assertNullableNumber(summary.service_price_range.max, 'service_price_range.max');
                } finally {
                    restore();
                }
            }
        )
    );
});

// ==================== Task 6.2: tính đặc trưng giữa các variant ====================
// Validates: Requirements 1.2

test('PROPERTY: tập khoá summary của 3 variant đôi một khác nhau', async () => {
    const restore = stubRepo({
        getSpotOperatorStats: async () => ({}),
        getSpotVisitTrend: async () => [],
        getTopSpotsByCapacity: async () => [],
        getTravelCompanyStats: async () => ({}),
        getReportedTrend: async () => [],
        getTopTours: async () => [],
        getServiceProviderStats: async () => ({}),
        getServiceCategoryBreakdown: async () => [],
    });
    try {
        const variants = [
            await spotProvider.build(CTX),
            await travelProvider.build(CTX),
            await serviceProvider.build(CTX),
        ];
        const keySets = variants.map((v) => Object.keys(v.summary).sort().join('|'));
        for (let i = 0; i < keySets.length; i++) {
            for (let j = i + 1; j < keySets.length; j++) {
                assert.notEqual(keySets[i], keySets[j], `summary keys của variant ${i} và ${j} không được giống nhau`);
            }
        }
    } finally {
        restore();
    }
});
