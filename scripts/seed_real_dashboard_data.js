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

const getMetricsForBusinessType = (businessType) => {
    const type = String(businessType || '').toLowerCase();
    if (type.includes('tour') || type.includes('travel') || type.includes('lữ hành')) {
        return {
            revenue: randomInt(500, 2500) * 1000000,
            bookings: randomInt(15, 60),
            visitors: randomInt(200, 1000),
            capacity: randomFloat(40.0, 75.0)
        };
    } else if (type.includes('hotel') || type.includes('service') || type.includes('dịch vụ') || type.includes('cung cấp')) {
        return {
            revenue: randomInt(100, 600) * 1000000,
            bookings: randomInt(100, 500),
            visitors: randomInt(300, 1500),
            capacity: randomFloat(50.0, 90.0)
        };
    } else { // other, spot_operator, etc.
        return {
            revenue: randomInt(200, 1200) * 1000000,
            bookings: randomInt(50, 300),
            visitors: randomInt(1000, 8000),
            capacity: randomFloat(40.0, 95.0)
        };
    }
};

async function run() {
    console.log('--- STARTING DATABASE SEEDING ---');
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Declare months globally in the run() function scope to fix ReferenceError
        const months = [
            { from: '2026-01-01', to: '2026-01-31' },
            { from: '2026-02-01', to: '2026-02-28' },
            { from: '2026-03-01', to: '2026-03-31' },
            { from: '2026-04-01', to: '2026-04-30' },
            { from: '2026-05-01', to: '2026-05-31' }
        ];

        // 1. Ensure mock roles and users
        const rolesToEnsure = [
            { code: 'travel_company', name_vi: 'Công ty lữ hành (Mock)', desc: 'Mock travel company role' },
            { code: 'service_provider', name_vi: 'Đơn vị cung cấp dịch vụ (Mock)', desc: 'Mock service provider role' },
            { code: 'spot_operator', name_vi: 'Đơn vị vận hành điểm du lịch (Mock)', desc: 'Mock spot operator role' }
        ];
        const roleIds = {};
        for (const r of rolesToEnsure) {
            let roleRes = await client.query("SELECT id FROM auth.roles WHERE code = $1 LIMIT 1", [r.code]);
            if (roleRes.rows.length === 0) {
                roleRes = await client.query("INSERT INTO auth.roles (code, name_vi, description) VALUES ($1, $2, $3) RETURNING id", [r.code, r.name_vi, r.desc]);
            }
            roleIds[r.code] = roleRes.rows[0].id;
        }

        const usersToEnsure = [
            { email: 'mock_travel_company@tourismpj.gov.vn', role: 'travel_company', name: 'Mock Travel Company Owner' },
            { email: 'mock_service_provider@tourismpj.gov.vn', role: 'service_provider', name: 'Mock Service Provider Owner' },
            { email: 'mock_spot_operator@tourismpj.gov.vn', role: 'spot_operator', name: 'Mock Spot Operator Owner' }
        ];
        const userIds = {};
        for (const u of usersToEnsure) {
            let userRes = await client.query('SELECT id FROM auth.users WHERE email = $1 LIMIT 1', [u.email]);
            if (userRes.rows.length === 0) {
                userRes = await client.query(`
                    INSERT INTO auth.users (role_id, email, password_hash, full_name, is_active, is_verified)
                    VALUES ($1, $2, '$2b$10$xyz', $3, TRUE, TRUE)
                    RETURNING id
                `, [roleIds[u.role], u.email, u.name]);
            }
            userIds[u.role] = userRes.rows[0].id;
        }
        const userId = userIds['travel_company']; // Keep userId for spot creation reference

        // Ensure tourist role exists (if not, insert it)
        let touristRoleRes = await client.query("SELECT id FROM auth.roles WHERE code = 'tourist' LIMIT 1");
        let touristRoleId;
        if (touristRoleRes.rows.length === 0) {
            touristRoleRes = await client.query("INSERT INTO auth.roles (code, name_vi, description) VALUES ('tourist', 'Khách du lịch (Mock)', 'Tourist/Citizen mock role') RETURNING id");
        }
        touristRoleId = touristRoleRes.rows[0].id;

        // Ensure 3 mock tourist users exist for submitting citizen feedbacks
        const touristEmails = [
            'mock_tourist_1@tourismpj.gov.vn',
            'mock_tourist_2@tourismpj.gov.vn',
            'mock_tourist_3@tourismpj.gov.vn'
        ];
        const touristUserIds = [];
        for (let idx = 0; idx < touristEmails.length; idx++) {
            const email = touristEmails[idx];
            const name = `Mock Tourist ${idx + 1}`;
            let userRes = await client.query('SELECT id FROM auth.users WHERE email = $1 LIMIT 1', [email]);
            if (userRes.rows.length === 0) {
                userRes = await client.query(`
                    INSERT INTO auth.users (role_id, email, password_hash, full_name, is_active, is_verified)
                    VALUES ($1, $2, '$2b$10$xyz', $3, TRUE, TRUE)
                    RETURNING id
                `, [touristRoleId, email, name]);
            }
            touristUserIds.push(userRes.rows[0].id);
        }

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

            // Create businesses for each role
            const businessesToCreate = [
                { name: `[MOCK] Công ty Du lịch ${prov.name} Service`, type: 'tour', role: 'travel_company', ownerId: userIds['travel_company'] },
                { name: `[MOCK] Dịch vụ Du lịch ${prov.name} Service`, type: 'hotel', role: 'service_provider', ownerId: userIds['service_provider'] },
                { name: `[MOCK] Ban Quản lý Điểm Du lịch ${prov.name} Service`, type: 'other', role: 'spot_operator', ownerId: userIds['spot_operator'] }
            ];

            const currentBizIds = [];
            for (const bizSpec of businessesToCreate) {
                let bizRes = await client.query('SELECT id FROM businesses WHERE business_name = $1 LIMIT 1', [bizSpec.name]);
                let bizId;
                if (bizRes.rows.length === 0) {
                    const lat = prov.lat + randomFloat(-0.02, 0.02);
                    const lng = prov.lng + randomFloat(-0.02, 0.02);
                    bizRes = await client.query(`
                        INSERT INTO businesses (owner_id, province_code, business_name, business_type, status, geom)
                        VALUES ($1, $2, $3, $4, 'approved', ST_SetSRID(ST_MakePoint($5, $6), 4326))
                        RETURNING id
                    `, [bizSpec.ownerId, prov.code, bizSpec.name, bizSpec.type, lng, lat]);
                }
                bizId = bizRes.rows[0].id;
                currentBizIds.push(bizId);
            }

            // Create business activity reports for Jan - May 2026 for each business

            for (const bizId of currentBizIds) {
                // Find owner/submitted_by
                const ownerRes = await client.query('SELECT owner_id, business_type FROM businesses WHERE id = $1', [bizId]);
                const submitterId = ownerRes.rows[0]?.owner_id || userIds['travel_company'];
                const bizType = ownerRes.rows[0]?.business_type;

                for (const month of months) {
                    // Delete existing reports for this business and month to ensure new differentiated metrics are applied
                    await client.query(`
                        DELETE FROM business_activity_reports 
                        WHERE business_id = $1 AND period_from = $2 AND period_to = $3
                    `, [bizId, month.from, month.to]);

                    const metrics = getMetricsForBusinessType(bizType);
                    await client.query(`
                        INSERT INTO business_activity_reports (
                            business_id, report_period, period_from, period_to,
                            total_revenue_vnd, total_bookings, total_visitors,
                            avg_capacity_pct, status, submitted_by
                        ) VALUES ($1, 'month', $2, $3, $4, $5, $6, $7, 'approved', $8)
                    `, [
                        bizId, month.from, month.to,
                        metrics.revenue,
                        metrics.bookings,
                        metrics.visitors,
                        metrics.capacity,
                        submitterId
                    ]);
                }
            }
        }

        // 4. Seed reports for ALL existing businesses in the database so testers can see dashboard data
        const allBizRes = await client.query('SELECT id, owner_id, business_type FROM businesses');
        console.log(`Seeding activity reports for all ${allBizRes.rows.length} existing businesses...`);
        for (const biz of allBizRes.rows) {
            for (const month of months) {
                // Delete existing reports for this business and month to ensure new differentiated metrics are applied
                await client.query(`
                    DELETE FROM business_activity_reports 
                    WHERE business_id = $1 AND period_from = $2 AND period_to = $3
                `, [biz.id, month.from, month.to]);

                const metrics = getMetricsForBusinessType(biz.business_type);
                await client.query(`
                    INSERT INTO business_activity_reports (
                        business_id, report_period, period_from, period_to,
                        total_revenue_vnd, total_bookings, total_visitors,
                        avg_capacity_pct, status, submitted_by
                    ) VALUES ($1, 'month', $2, $3, $4, $5, $6, $7, 'approved', $8)
                `, [
                    biz.id, month.from, month.to,
                    metrics.revenue,
                    metrics.bookings,
                    metrics.visitors,
                    metrics.capacity,
                    biz.owner_id || userId
                ]);
            }
        }

        // 5. Seed mock citizen feedbacks (50 records)
        console.log('Seeding 50 mock citizen feedbacks...');
        
        // Templates representing common citizen feedbacks
        const feedbackTemplates = [
            { title: 'Báo cáo xả rác bừa bãi tại điểm du lịch', content: 'Tôi thấy rất nhiều rác thải nhựa và túi nilon chưa được thu gom xung quanh khu vực tham quan, gây mất mỹ quan đô thị và ô nhiễm môi trường nghiêm trọng.', locText: 'Khu vực bãi đỗ xe và lối đi bộ chính' },
            { title: 'Cơ sở kinh doanh chèo kéo, ép khách mua hàng', content: 'Một số cửa hàng bán đồ lưu niệm ở đây có tình trạng chèo kéo khách quyết liệt, thậm chí giữ xe và ép du khách phải mua hàng hóa với giá đắt đỏ.', locText: 'Dãy ki-ốt bán hàng lưu niệm gần cổng vào' },
            { title: 'Đèn chiếu sáng khu vực đi bộ bị hỏng', content: 'Hệ thống đèn đường chiếu sáng tại khu vực này bị tắt hoàn toàn vào buổi tối, gây khó khăn cho việc đi lại của du khách và tiềm ẩn nguy cơ an ninh.', locText: 'Đoạn đường ven hồ chỉ dẫn đi bộ' },
            { title: 'Nhà vệ sinh công cộng xuống cấp, mất vệ sinh', content: 'Nhà vệ sinh công cộng bốc mùi hôi thối dữ dội, không có nước sạch để dội rửa và giấy vệ sinh. Đề nghị cơ quan chức năng kiểm tra xử lý.', locText: 'Nhà vệ sinh công cộng phía sau đài phun nước' },
            { title: 'Biển báo giao thông, biển chỉ dẫn du lịch bị mờ', content: 'Các biển báo chỉ dẫn hướng đi đến điểm tham quan và bản đồ du lịch tại ngã tư bị bạc màu, bong tróc không thể đọc được nội dung.', locText: 'Ngã tư đường chính dẫn vào khu du lịch' },
            { title: 'Xe ôm, taxi dù thu giá quá cao so với quy định', content: 'Tôi bị một tài xế xe ôm tự phát hét giá gấp 3 lần bình thường cho quãng đường ngắn. Không có bảng niêm yết giá công khai tại bến xe.', locText: 'Khu vực bến xe khách trước khu di tích' },
            { title: 'Tình trạng lấn chiếm lòng lề đường làm bãi đỗ xe trái phép', content: 'Lối đi dành cho người đi bộ bị các hộ kinh doanh lấn chiếm hoàn toàn để trông giữ xe máy và bày bán quán ăn, du khách phải đi dưới lòng đường.', locText: 'Vỉa hè dọc theo đường bờ sông chính' },
            { title: 'Hạ tầng đường sá hư hỏng, xuất hiện nhiều ổ gà', content: 'Đoạn đường đi vào điểm tham quan xuất hiện nhiều hố sâu nguy hiểm, trời mưa ngập nước dễ gây tai nạn cho xe máy và xe đạp của khách.', locText: 'Đoạn đường đất liên tỉnh nối vào khu du lịch' },
            { title: 'Thái độ phục vụ của nhân viên soát vé thiếu văn minh', content: 'Nhân viên soát vé tại cổng chính có thái độ gắt gỏng, nói năng cộc lốc và thiếu tôn trọng đối với khách du lịch lớn tuổi.', locText: 'Quầy kiểm soát vé cổng số 2' },
            { title: 'Tình trạng ô nhiễm tiếng ồn từ loa kéo hát karaoke', content: 'Các nhóm khách tự mang loa kéo công suất lớn hát karaoke inh ỏi từ trưa đến đêm muộn tại khu vực cắm trại, làm ảnh hưởng nghiêm trọng đến không gian yên tĩnh chung.', locText: 'Khu vực bãi cắm trại ven rừng tự nhiên' }
        ];

        // Clean existing mock feedbacks first to allow re-runs of the seeder without duplicates
        await client.query("DELETE FROM citizen_feedbacks WHERE title LIKE '[MOCK]%'");

        const priorities = ['low', 'normal', 'high', 'urgent'];
        const statuses = ['pending', 'in_progress', 'resolved', 'closed'];
        const moderationStatuses = ['approved', 'approved', 'approved', 'pending', 'rejected']; // mostly approved

        for (let i = 0; i < 50; i++) {
            const template = feedbackTemplates[i % feedbackTemplates.length];
            const prov = MOCK_PROVINCES[i % MOCK_PROVINCES.length];
            const uId = touristUserIds[i % touristUserIds.length];
            
            const lat = prov.lat + randomFloat(-0.04, 0.04);
            const lng = prov.lng + randomFloat(-0.04, 0.04);
            
            const title = `[MOCK] ${template.title} tại ${prov.name} #${i + 1}`;
            const content = `${template.content} Đây là báo cáo phản ánh tại tỉnh/thành phố ${prov.name}. Mong sớm nhận được phản hồi giải quyết từ Sở Du lịch địa phương.`;
            const locText = `${template.locText}, tỉnh ${prov.name}`;
            
            const priority = priorities[i % priorities.length];
            const status = statuses[i % statuses.length];
            const moderationStatus = moderationStatuses[i % moderationStatuses.length];

            const images = [
                `https://picsum.photos/800/600?random=${i}`,
                `https://picsum.photos/800/600?random=${i + 100}`
            ];

            let adminResponse = null;
            let resolutionNote = null;
            let respondedAt = null;
            if (status === 'resolved' || status === 'closed') {
                adminResponse = `Cảm ơn bạn đã phản ánh. Cơ quan quản lý đã tiến hành kiểm tra địa bàn tại ${template.locText} và xử lý triệt để tình trạng nêu trên.`;
                resolutionNote = 'Đã bàn giao cho đơn vị quản lý địa phương xử lý và lập biên bản xử phạt hành chính đối với các bên vi phạm.';
                respondedAt = new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000);
            }

            const createdAt = new Date(Date.now() - randomInt(2, 60) * 24 * 60 * 60 * 1000);
            const updatedAt = new Date(createdAt.getTime() + randomInt(1, 10) * 24 * 60 * 60 * 1000);

            await client.query(`
                INSERT INTO citizen_feedbacks (
                    user_id, title, content, latitude, longitude, location_text,
                    priority, status, moderation_status, images,
                    admin_response, resolution_note, responded_at,
                    is_location_verified, forest_loss_area_estimate_m2,
                    created_at, updated_at, geom
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
                )
            `, [
                uId, title, content, lat, lng, locText,
                priority, status, moderationStatus, JSON.stringify(images),
                adminResponse, resolutionNote, respondedAt,
                Math.random() > 0.3,
                Math.random() > 0.8 ? randomInt(50, 500) : null,
                createdAt, updatedAt
            ]);
        }
        console.log('Seeded 50 citizen feedbacks successfully.');

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

run().catch((err) => {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
});
