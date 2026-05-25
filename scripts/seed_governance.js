const path = require('path');
const crypto = require('crypto');

// Set relative path to the database config
const serverSrc = path.join(__dirname, '..', 'src');
const { query } = require(path.join(serverSrc, 'configs', 'database'));

const randomUUID = () => crypto.randomUUID();
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => Number((Math.random() * (max - min) + min).toFixed(decimals));
const randomElem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const FEEDBACK_TITLES = [
    { title: 'Tắc nghẽn nghiêm trọng vào giờ cao điểm', content: 'Khu vực này có lượng du khách tăng đột biến vào cuối tuần, thời gian xếp hàng kéo dài gây mệt mỏi cho các gia đình có trẻ nhỏ. Cần cải thiện bến bãi và phân luồng tốt hơn.', priority: 'high' },
    { title: 'Hạ tầng nhà vệ sinh cần nâng cấp', content: 'Nhà vệ sinh công cộng tại đây bốc mùi khó chịu và không có xà phòng rửa tay. Đề nghị ban quản lý dọn dẹp thường xuyên hơn để giữ gìn vệ sinh chung.', priority: 'high' },
    { title: 'Biển chỉ dẫn thông tin chưa rõ ràng', content: 'Lối đi nội bộ rất rộng nhưng các biển hướng dẫn đến khu dịch vụ, sơ đồ thoát hiểm hay các quầy vé xe điện còn khá thưa thớt và khó quan sát từ xa.', priority: 'normal' },
    { title: 'Thái độ phục vụ của nhân viên bãi giữ xe', content: 'Nhân viên trông giữ phương tiện bên ngoài khu du lịch có thái độ khá gắt gỏng, to tiếng với du khách và có dấu hiệu tự ý thu phí cao hơn quy định niêm yết.', priority: 'normal' },
    { title: 'Tình trạng chèo kéo khách mua đồ lưu niệm', content: 'Vẫn còn một số hộ kinh doanh tự phát chèo kéo du khách mua bản đồ, mũ nón và nước uống dọc lối đi bộ chính, tạo hình ảnh không đẹp cho khu du lịch.', priority: 'normal' },
    { title: 'Rác thải nhựa trôi nổi trên mặt nước', content: 'Khu vực danh thắng cảnh quan sông nước xuất hiện nhiều vỏ chai nước và túi nilon trôi nổi do ý thức kém của một bộ phận du khách. Cần tăng cường nhân viên vớt rác.', priority: 'high' }
];

async function seed() {
    console.log('================ STARTING POSTGRESQL DATABASE SEEDER ================');

    try {
        // 1. Fetch existing users
        console.log('Fetching existing users...');
        const userRes = await query('SELECT id, full_name FROM users LIMIT 50');
        const users = userRes.rows;
        if (users.length === 0) {
            throw new Error('No users found in database. Please register some users first before seeding dashboard data.');
        }
        console.log(`Found ${users.length} users in database.`);

        // 2. Fetch existing businesses
        console.log('Fetching existing businesses...');
        // Query geom safely using ST_AsText or longitude/latitude extraction if geom is present
        let businessRes;
        try {
            businessRes = await query(`
                SELECT id, business_name, owner_id, province_code, ward_code, status,
                       ST_X(geom::geometry) AS lon, ST_Y(geom::geometry) AS lat
                FROM businesses
            `);
        } catch (e) {
            console.warn('PostGIS functions not supported or geom column missing, fetching standard fields...');
            businessRes = await query('SELECT id, business_name, owner_id, province_code, ward_code, status FROM businesses');
        }
        const businesses = businessRes.rows;
        if (businesses.length === 0) {
            throw new Error('No businesses found in database. Please register some approved businesses first.');
        }
        console.log(`Found ${businesses.length} businesses in database.`);

        // 3. Fetch existing tourism spots
        console.log('Fetching existing tourism spots...');
        let spotRes;
        try {
            spotRes = await query(`
                SELECT id, name_vi, province_code, COALESCE(max_capacity, 10000) AS max_capacity,
                       ST_X(geom::geometry) AS lon, ST_Y(geom::geometry) AS lat
                FROM tourism_spots
            `);
        } catch (e) {
            spotRes = await query('SELECT id, name_vi, province_code, COALESCE(max_capacity, 10000) AS max_capacity FROM tourism_spots');
        }
        const spots = spotRes.rows;
        console.log(`Found ${spots.length} tourism spots in database.`);

        // 4. Seed Business Activity Reports (Span 6 months for each business)
        console.log('\n--- Seeding Business Activity Reports (6 months per business) ---');
        let barCount = 0;
        const months = [
            { from: '2025-12-01', to: '2025-12-28', period: '2025-12' },
            { from: '2026-01-01', to: '2026-01-28', period: '2026-01' },
            { from: '2026-02-01', to: '2026-02-28', period: '2026-02' },
            { from: '2026-03-01', to: '2026-03-28', period: '2026-03' },
            { from: '2026-04-01', to: '2026-04-28', period: '2026-04' },
            { from: '2026-05-01', to: '2026-05-28', period: '2026-05' }
        ];

        // Clear old mock reports first to prevent duplicates
        await query("DELETE FROM business_activity_reports WHERE notes LIKE '%[MOCK-SEEDER]%'");

        for (const biz of businesses) {
            const ownerId = biz.owner_id || users[0].id;
            for (const month of months) {
                const total_revenue_vnd = randomInt(80, 600) * 1000000;
                const total_bookings = randomInt(40, 180);
                const total_visitors = randomInt(150, 750);
                const avg_capacity_pct = randomFloat(55.0, 92.0);

                const sql = `
                    INSERT INTO business_activity_reports (
                        business_id, report_period, period_from, period_to,
                        total_revenue_vnd, total_bookings, total_visitors, avg_capacity_pct,
                        notes, status, submitted_by, created_at
                    ) VALUES ($1, 'month', $2, $3, $4, $5, $6, $7, $8, 'approved', $9, $10)
                `;
                const notes = `[MOCK-SEEDER] Báo cáo tháng tự động cho doanh nghiệp ${biz.business_name}`;
                const createdAt = new Date(month.to + 'T18:00:00Z');

                await query(sql, [
                    biz.id, month.from, month.to, total_revenue_vnd,
                    total_bookings, total_visitors, avg_capacity_pct,
                    notes, ownerId, createdAt
                ]);
                barCount++;
            }
        }
        console.log(`Successfully seeded ${barCount} business activity reports.`);

        // 5. Seed Citizen Feedbacks (Positioned close to actual businesses or spots)
        console.log('\n--- Seeding Citizen Feedbacks near actual spots/businesses ---');
        let fbCount = 0;
        await query("DELETE FROM citizen_feedbacks WHERE content LIKE '%[MOCK-SEEDER]%'");

        for (let i = 0; i < Math.max(10, businesses.length * 2); i++) {
            const user = randomElem(users);
            const fbTemplate = randomElem(FEEDBACK_TITLES);
            const biz = randomElem(businesses);

            // Fetch coordinates (either from business geom or default Ninh Binh center coordinates)
            const lon = Number(biz.lon) || 105.975 + randomFloat(-0.04, 0.04, 6);
            const lat = Number(biz.lat) || 20.25 + randomFloat(-0.04, 0.04, 6);

            const title = `${fbTemplate.title} tại khu dịch vụ ${biz.business_name}`;
            const content = `${fbTemplate.content} [MOCK-SEEDER]`;
            const locationText = `${biz.business_name}, tỉnh Ninh Bình`;
            const priority = fbTemplate.priority;
            const status = i % 2 === 0 ? 'resolved' : 'pending';
            const createdAt = new Date(Date.now() - i * 1.5 * 24 * 3600 * 1000);

            let sql;
            let params;

            // Check if ST_MakePoint coordinate geography is supported
            try {
                sql = `
                    INSERT INTO citizen_feedbacks (
                        id, user_id, title, content, location_text, priority, status, moderation_status, geom, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', ST_SetSRID(ST_MakePoint($8, $9), 4326)::geometry, $10)
                `;
                params = [randomUUID(), user.id, title, content, locationText, priority, status, lon, lat, createdAt];
                await query(sql, params);
            } catch (e) {
                // Fail-safe simple query without geometry
                sql = `
                    INSERT INTO citizen_feedbacks (
                        id, user_id, title, content, location_text, priority, status, moderation_status, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8)
                `;
                params = [randomUUID(), user.id, title, content, locationText, priority, status, createdAt];
                await query(sql, params);
            }
            fbCount++;
        }
        console.log(`Successfully seeded ${fbCount} citizen feedbacks.`);

        // 6. Seed Department Generated Reports
        console.log('\n--- Seeding Department Generated Reports ---');
        let repCount = 0;
        await query("DELETE FROM generated_reports WHERE title LIKE '%[MOCK-SEEDER]%'");

        for (let i = 1; i <= 6; i++) {
            const reportMonth = i;
            const year = 2026;
            const creator = users[0].id;
            const fromDate = `${year}-${String(reportMonth).padStart(2, '0')}-01`;
            const toDate = `${year}-${String(reportMonth).padStart(2, '0')}-28`;
            const generatedAt = new Date(year, reportMonth - 1, 28, 17, 30, 0);

            const sql = `
                INSERT INTO generated_reports (
                    created_by, report_type, period_from, period_to,
                    title, file_url, file_format, file_size_kb, sent_to_roles, generated_at
                ) VALUES ($1, 'monthly', $2, $3, $4, $5, 'pdf', $6, $7, $8)
            `;

            const title = `[MOCK-SEEDER] Báo cáo thống kê du lịch Sở tháng ${reportMonth}/${year}`;
            const fileUrl = `https://storage.dulichninhbinh.vn/reports/thang-${reportMonth}-${year}.pdf`;
            const size = randomInt(1100, 3200);

            await query(sql, [creator, fromDate, toDate, title, fileUrl, size, [2, 3], generatedAt]);
            repCount++;
        }
        console.log(`Successfully seeded ${repCount} generated reports.`);

        // 7. Seed Traffic Analytics (Simulate user visit logs over 30 days)
        console.log('\n--- Seeding User Visit History (Past 30 days) ---');
        try {
            await query("DELETE FROM user_visit_history WHERE id IN (SELECT id FROM user_visit_history LIMIT 1000)"); // Limit clearing to save time
        } catch (e) {
            // Table might not exist or be empty
        }

        let trafficCount = 0;
        // Seed 100-300 visits for testing to keep it fast
        for (let i = 0; i < 200; i++) {
            const user = randomElem(users);
            const visitedAt = new Date(Date.now() - randomInt(0, 30) * 24 * 3600 * 1000 - randomInt(0, 23) * 3600 * 1000);

            try {
                await query('INSERT INTO user_visit_history (user_id, visited_at) VALUES ($1, $2)', [user.id, visitedAt]);
                trafficCount++;
            } catch (e) {
                // Table might not exist, skip traffic history
                break;
            }
        }
        if (trafficCount > 0) {
            console.log(`Successfully seeded ${trafficCount} website visit logs.`);
        } else {
            console.log('User visit history table not found or skipped.');
        }

        // 8. Seed Capacity Alert Configs at Province Level
        console.log('\n--- Seeding Province Capacity Alert Configs ---');
        let cacCount = 0;
        try {
            await query("DELETE FROM capacity_alert_configs WHERE spot_id IS NULL AND updated_by IS NOT NULL");
            const provRes = await query('SELECT code, name FROM vn_units.provinces');
            const provinces = provRes.rows;

            for (const prov of provinces) {
                const sql = `
                    INSERT INTO capacity_alert_configs (
                        spot_id, province_code, threshold_busy, threshold_near, threshold_over,
                        notify_roles, updated_by, is_active
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `;
                await query(sql, [
                    null,
                    prov.code,
                    70, // threshold_busy
                    85, // threshold_near
                    100, // threshold_over
                    [2, 3], // notify_roles
                    users[0].id,
                    true
                ]);
                cacCount++;
            }
            console.log(`Successfully seeded ${cacCount} province-level capacity alert configs.`);
        } catch (e) {
            console.warn('Capacity alert configs table not found or skipped:', e.message);
        }

        console.log('\n================ DATABASE SEEDING COMPLETED SUCCESSFULLY! ================');
    } catch (error) {
        console.error('\nSeeding failed with error:', error.message);
    }
}

seed();
