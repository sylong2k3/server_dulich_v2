'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const GovernanceService = require('../governance.service');
const GovernanceRepository = require('../../models/repositories/governance.repository');

const BUSINESS_ID = '11111111-1111-1111-1111-111111111111';
const OWNER_ID = '22222222-2222-2222-2222-222222222222';

// Các method GHI — nếu bị gọi trong luồng dashboard là sai (dashboard phải read-only).
const WRITE_METHODS = [
    'updateBusinessInfo',
    'updateBusinessRegistration',
    'updateSpotRegistration',
    'createBusinessActivityReport',
    'createDepartmentReport',
    'createPermission',
    'replaceRolePermissions',
];

function installStubs({ business }) {
    const original = {};
    const writeCalls = [];

    const set = (key, fn) => {
        original[key] = GovernanceRepository[key];
        GovernanceRepository[key] = fn;
    };

    set('findBusinessById', async () => business);

    // Read stubs cho providers + shared section.
    set('getReportedMetricsSummary', async () => ({
        total_revenue_vnd: 1000, total_bookings: 10, total_visitors: 100, avg_capacity_pct: 50, report_count: 2,
    }));
    set('getSpotOperatorStats', async () => ({ managed_spot_count: 2, current_visitors: 50 }));
    set('getSpotVisitTrend', async () => [{ period: '2026-01', visits: 5 }]);
    set('getTopSpotsByCapacity', async () => [{ spot_id: 's1', name_vi: 'Spot', capacity_pct: 80, status: 'busy' }]);
    set('getTravelCompanyStats', async () => ({ tour_count: 3, active_tour_count: 2 }));
    set('getReportedTrend', async () => [{ period: '2026-01', revenue_vnd: 500, bookings: 5, visitors: 50 }]);
    set('getTopTours', async () => [{ id: 't1', name_vi: 'Tour', rating_avg: 4.5, rating_count: 10 }]);
    set('getServiceProviderStats', async () => ({ service_count: 4, voucher_used_count: 10, voucher_max_uses: 100 }));
    set('getServiceCategoryBreakdown', async () => [{ category: 'food', count: 2 }]);

    // Bẫy mọi method ghi.
    for (const key of WRITE_METHODS) {
        if (typeof GovernanceRepository[key] === 'function') {
            original[key] = GovernanceRepository[key];
            GovernanceRepository[key] = async (...args) => {
                writeCalls.push(key);
                return original[key].apply(GovernanceRepository, args);
            };
        }
    }

    const restore = () => {
        for (const key of Object.keys(original)) {
            GovernanceRepository[key] = original[key];
        }
    };

    return { restore, writeCalls };
}

const ownedBusiness = (type) => ({
    id: BUSINESS_ID,
    owner_id: OWNER_ID,
    business_type: type,
    business_name: 'Test Co',
});

const enterpriseUser = (code) => ({ id: OWNER_ID, role: { code } });
const adminUser = { id: 'admin-1', role: { code: 'system_admin' } };

test('404 khi không tìm thấy doanh nghiệp (độc lập variant)', async () => {
    const { restore } = installStubs({ business: null });
    try {
        await assert.rejects(
            () => GovernanceService.getBusinessDashboard(BUSINESS_ID, {}, enterpriseUser('spot_operator')),
            (err) => err.status === 404
        );
    } finally {
        restore();
    }
});

test('403 khi user không phải admin và không sở hữu doanh nghiệp', async () => {
    const { restore } = installStubs({ business: { ...ownedBusiness('hotel'), owner_id: 'someone-else' } });
    try {
        await assert.rejects(
            () => GovernanceService.getBusinessDashboard(BUSINESS_ID, {}, enterpriseUser('service_provider')),
            (err) => err.status === 403
        );
    } finally {
        restore();
    }
});

test('happy-path spot_operator: variant đúng + period/business hiện diện', async () => {
    const { restore, writeCalls } = installStubs({ business: ownedBusiness('hotel') });
    try {
        const res = await GovernanceService.getBusinessDashboard(
            BUSINESS_ID, { period: 'year', year: 2026 }, enterpriseUser('spot_operator')
        );
        assert.equal(res.variant, 'spot_operator');
        assert.ok(res.period && res.period.type === 'year');
        assert.ok(res.business && res.business.id === BUSINESS_ID);
        assert.ok(res.summary && typeof res.summary.managed_spot_count === 'number');
        assert.ok(res.reported_metrics);
        assert.equal(writeCalls.length, 0, 'dashboard không được gọi method ghi');
    } finally {
        restore();
    }
});

test('happy-path travel_company', async () => {
    const { restore } = installStubs({ business: ownedBusiness('travel_company') });
    try {
        const res = await GovernanceService.getBusinessDashboard(
            BUSINESS_ID, {}, enterpriseUser('travel_company')
        );
        assert.equal(res.variant, 'travel_company');
        assert.ok(typeof res.summary.tour_count === 'number');
    } finally {
        restore();
    }
});

test('happy-path service_provider', async () => {
    const { restore } = installStubs({ business: ownedBusiness('hotel') });
    try {
        const res = await GovernanceService.getBusinessDashboard(
            BUSINESS_ID, {}, enterpriseUser('service_provider')
        );
        assert.equal(res.variant, 'service_provider');
        assert.ok(typeof res.summary.service_count === 'number');
        assert.ok(typeof res.summary.voucher_redemption_rate === 'number');
    } finally {
        restore();
    }
});

test('override variant chỉ áp dụng cho admin', async () => {
    // Admin xem business hotel nhưng override travel_company
    const adminStub = installStubs({ business: ownedBusiness('hotel') });
    try {
        const res = await GovernanceService.getBusinessDashboard(
            BUSINESS_ID, { variant: 'travel_company' }, adminUser
        );
        assert.equal(res.variant, 'travel_company');
    } finally {
        adminStub.restore();
    }

    // Enterprise user spot_operator: override bị bỏ qua, role thắng
    const entStub = installStubs({ business: ownedBusiness('hotel') });
    try {
        const res = await GovernanceService.getBusinessDashboard(
            BUSINESS_ID, { variant: 'travel_company' }, enterpriseUser('spot_operator')
        );
        assert.equal(res.variant, 'spot_operator');
    } finally {
        entStub.restore();
    }
});

test('admin truy cập business của role khác → resolve theo business_type', async () => {
    const { restore } = installStubs({ business: ownedBusiness('travel_company') });
    try {
        const res = await GovernanceService.getBusinessDashboard(BUSINESS_ID, {}, adminUser);
        assert.equal(res.variant, 'travel_company');
    } finally {
        restore();
    }
});
