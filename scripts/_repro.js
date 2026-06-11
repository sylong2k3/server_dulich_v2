const GovernanceService = require('../src/services/governance.service');
const user = { id: 'c722a96e-24ad-4cea-89cd-5882573724f3', role: { code: 'spot_operator' } };
const id = '550ba000-e29b-41d4-a716-000000000013';

async function run() {
    for (const q of [{ period: 'month', year: 2026 }, { period: 'year', year: 2026 }, {}]) {
        const res = await GovernanceService.getBusinessDashboard(id, q, user);
        console.log(`\n===== query=${JSON.stringify(q)} | period.from=${res.period.from} period.to=${res.period.to} =====`);
        console.log('summary:', JSON.stringify(res.summary));
        console.log('highlights count:', (res.highlights || []).length);
        console.log('trend count:', (res.trend || []).length);
    }
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
