const { query, getClient } = require('../src/configs/database');
const crypto = require('crypto');

const MOCK_PROVINCES = [
    { code: '01', name: 'Hà Nội', lat: 21.0285, lng: 105.8542, spots: ['Hồ Hoàn Kiếm', 'Lăng Bác', 'Văn Miếu Quốc Tử Giám'] },
    { code: '22', name: 'Quảng Ninh', lat: 20.9599, lng: 107.0425, spots: ['Vịnh Hạ Long', 'Đảo Tuần Châu', 'Chùa Yên Tử'] },
    { code: '48', name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022, spots: ['Bà Nà Hills', 'Ngũ Hành Sơn', 'Cầu Rồng'] },
    { code: '68', name: 'Lâm Đồng', lat: 11.9404, lng: 108.4583, spots: ['Hồ Xuân Hương', 'Thung Lũng Tình Yêu', 'Thác Datanla'] },
    { code: '56', name: 'Khánh Hòa', lat: 12.2388, lng: 109.1967, spots: ['Vinpearl Nha Trang', 'Tháp Bà Ponagar', 'Đảo Hòn Tre'] },
    { code: '79', name: 'TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009, spots: ['Nhà thờ Đức Bà', 'Chợ Bến Thành', 'Dinh Độc Lập'] },
    { code: '91', name: 'Kiên Giang', lat: 10.2186, lng: 103.9607, spots: ['Bãi Sao Phú Quốc', 'VinWonders Phú Quốc', 'Chùa Hộ Quốc'] },
    { code: '46', name: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5908, spots: ['Đại Nội Huế', 'Chùa Thiên Mụ', 'Lăng Tự Đức'] },
    { code: '10', name: 'Lào Cai', lat: 22.3364, lng: 103.8438, spots: ['Đỉnh Fansipan', 'Bản Cát Cát', 'Thung lũng Mường Hoa'] }
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Number((Math.random() * (max - min) + min).toFixed(2));

async function run() {
    console.log('--- STARTING DATABASE SEEDING ---');
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // 1. Ensure mock role and user
        let roleRes = await client.query("SELECT id FROM auth.roles WHERE code = 'travel_company' LIMIT 1");
        if (roleRes.rows.length === 0) {
            roleRes = await client.query("INSERT INTO auth.roles (code, name_vi, description) VALUES ('travel_company', 'Công ty lữ hành (Mock)', 'Mock travel company role') RETURNING id");
        }
        const roleId = roleRes.rows[0].id;

        const mockUserEmail = 'mock_seeder_user@tourismpj.gov.vn';
        let userRes = await client.query('SELECT id FROM auth.users WHERE email = $1 LIMIT 1', [mockUserEmail]);
        let userId;
        if (userRes.rows.length === 0) {
            userRes = await client.query(`
                INSERT INTO auth.users (role_id, email, password_hash, full_name, is_active, is_verified)
                VALUES ($1, $2, '$2b$10$xyz', 'Mock Seeder Owner', TRUE, TRUE)
                RETURNING id
            `, [roleId, mockUserEmail]);
        }
        userId = userRes.rows[0].id;

        // 2. Ensure mock spot category
        let categoryRes = await client.query('SELECT id FROM spot_categories LIMIT 1');
        let categoryId;
        if (categoryRes.rows.length === 0) {
            categoryRes = await client.query(`
                INSERT INTO spot_categories (code, name_vi, name_en, is_active)
                VALUES ('mock_cat', '[MOCK] Thắng cảnh', 'Mock Category', TRUE)
                RETURNING id
            `);
        }
        categoryId = categoryRes.rows[0].id;

        // 3. Populate mock data for each province
        for (const prov of MOCK_PROVINCES) {
            console.log(`Seeding data for province: ${prov.name} (${prov.code})`);

            // Check if province exists in vn_units.provinces
            const checkProv = await client.query('SELECT code FROM vn_units.provinces WHERE code = $1', [prov.code]);
            if (checkProv.rows.length === 0) {
                await client.query(`
                    INSERT INTO vn_units.provinces (code, name, full_name)
                    VALUES ($1, $2, $3)
                `, [prov.code, prov.name, `Tỉnh/Thành phố ${prov.name}`]);
            }

            // Create spots
            const spotIds = [];
            for (let i = 0; i < prov.spots.length; i++) {
                const spotName = `[MOCK] ${prov.spots[i]}`;
                const lat = prov.lat + randomFloat(-0.05, 0.05);
                const lng = prov.lng + randomFloat(-0.05, 0.05);

                let spotRes = await client.query('SELECT id FROM tourism_spots WHERE name_vi = $1 LIMIT 1', [spotName]);
                if (spotRes.rows.length === 0) {
                    spotRes = await client.query(`
                        INSERT INTO tourism_spots (category_id, province_code, name_vi, geom, max_capacity, status, created_by)
                        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, 'active', $7)
                        RETURNING id
                    `, [categoryId, prov.code, spotName, lng, lat, randomInt(3000, 15000), userId]);
                }
                spotIds.push(spotRes.rows[0].id);
            }

            // Create business
            const bizName = `[MOCK] Công ty Du lịch ${prov.name} Service`;
            let bizRes = await client.query('SELECT id FROM businesses WHERE business_name = $1 LIMIT 1', [bizName]);
            let bizId;
            if (bizRes.rows.length === 0) {
                const lat = prov.lat + randomFloat(-0.02, 0.02);
                const lng = prov.lng + randomFloat(-0.02, 0.02);
                bizRes = await client.query(`
                    INSERT INTO businesses (owner_id, province_code, business_name, business_type, status, geom)
                    VALUES ($1, $2, $3, 'travel_company', 'approved', ST_SetSRID(ST_MakePoint($4, $5), 4326))
                    RETURNING id
                `, [userId, prov.code, bizName, lng, lat]);
            }
            bizId = bizRes.rows[0].id;

            // Create business activity reports for Jan - May 2026
            const months = [
                { from: '2026-01-01', to: '2026-01-31' },
                { from: '2026-02-01', to: '2026-02-28' },
                { from: '2026-03-01', to: '2026-03-31' },
                { from: '2026-04-01', to: '2026-04-30' },
                { from: '2026-05-01', to: '2026-05-31' }
            ];

            for (const month of months) {
                const checkReport = await client.query(`
                    SELECT id FROM business_activity_reports 
                    WHERE business_id = $1 AND period_from = $2 AND period_to = $3
                    LIMIT 1
                `, [bizId, month.from, month.to]);

                if (checkReport.rows.length === 0) {
                    await client.query(`
                        INSERT INTO business_activity_reports (
                            business_id, report_period, period_from, period_to,
                            total_revenue_vnd, total_bookings, total_visitors,
                            avg_capacity_pct, status, submitted_by
                        ) VALUES ($1, 'month', $2, $3, $4, $5, $6, $7, 'approved', $8)
                    `, [
                        bizId, month.from, month.to,
                        randomInt(150, 800) * 1000000,
                        randomInt(80, 400),
                        randomInt(300, 2000),
                        randomFloat(55.0, 92.5),
                        userId
                    ]);
                }
            }
        }

        await client.query('COMMIT');
        console.log('--- DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('--- DATABASE SEEDING FAILED ---', error);
        throw error;
    } finally {
        client.release();
    }
}

run().catch(() => process.exit(1));
