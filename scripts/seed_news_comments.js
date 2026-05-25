const path = require('path');

const serverSrc = path.join(__dirname, '..', 'src');
const { query } = require(path.join(serverSrc, 'configs', 'database'));

const randomElem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Nhóm role được phép viết ROOT comment (người dùng thực tế / du khách / doanh nghiệp)
const COMMENTER_ROLES = new Set(['tourist', 'travel_company', 'service_provider', 'spot_operator']);

// Nhóm role được phép REPLY (cấp quản lý trả lời phản hồi)
const RESPONDER_ROLES = new Set(['system_admin', 'ministry_manager', 'department_manager']);

// Nội dung root comment — giọng của du khách / doanh nghiệp
const COMMENT_POOL = [
    'Bài viết rất chi tiết, mình vừa đi về và chuẩn bị kỹ hơn rất nhiều nhờ đọc trước.',
    'Cảnh đẹp thật sự, chụp ảnh ở đây buổi sáng sớm ra màu rất đẹp.',
    'Lần đầu đến Ninh Bình, bài này giúp mình lên lịch trình thuận lợi hơn nhiều.',
    'Giá vé vào cổng khá hợp lý so với trải nghiệm nhận được. Rất đáng ghé thăm.',
    'Mình đã đến 2 lần rồi, mỗi mùa lại có vẻ đẹp khác nhau, rất thích.',
    'Cảm ơn đã chia sẻ, thông tin rất hữu ích cho chuyến đi sắp tới của mình.',
    'Đường vào hơi khó đi nếu đi xe máy, nên chú ý đoạn gần cổng vào.',
    'Buổi chiều tà nhìn cảnh hoàng hôn ở đây thơ mộng lắm, nên sắp xếp ở lại.',
    'Bài viết mô tả chân thực, không phóng đại như nhiều trang khác.',
    'Mình thích các gợi ý điểm đến ít phổ biến như thế này, tránh đám đông.',
    'Hướng dẫn chi tiết từng bước rất tiện, đặc biệt phần di chuyển nội địa.',
    'Mùa nước lên thuyền đi qua đây ngắm cảnh hai bên đẹp như tranh vậy.',
    'Nên đến vào sáng sớm tránh nắng và tránh đông người, mình khuyến nghị vậy.',
    'Trẻ em và người cao tuổi đi được không? Mong bài viết bổ sung thêm thông tin này.',
    'Cơm cháy ở đây ngon thật sự, mua về làm quà biếu ai cũng thích.',
    'Đặc sản Ninh Bình phong phú hơn mình nghĩ, bài viết giới thiệu hay lắm.',
    'Mắm tép ăn kèm thịt ba chỉ luộc là tuyệt vời, nhớ mãi vị đó.',
    'Lễ hội năm nay có gì mới không? Mình dự định đưa cả gia đình đến.',
    'Phần nghi lễ truyền thống rất trang nghiêm, con cái học được nhiều điều về lịch sử.',
    'Nên đặt khách sạn trước 2 tuần vì thời điểm lễ hội hay kín phòng lắm.',
    'Resort này giá có vẻ cao nhưng view đẹp và dịch vụ xứng đáng.',
    'Buổi sáng ăn sáng nhìn ra cánh đồng xanh mướt, rất thư thái.',
    'Gần các điểm tham quan chính, đi lại tiện lợi không cần xe riêng.',
    'Mùa thu Ninh Bình cánh đồng lúa chín vàng óng, ảnh ra cực đẹp.',
    'Tháng 5 mùa sen nở đi thuyền qua đầm sen thơm ngát, trải nghiệm rất đặc biệt.',
    'Mong địa phương giữ được chất lượng cảnh quan khi lượng khách tăng lên.',
    'Có dịch vụ hướng dẫn viên tại chỗ không hay phải đặt trước?',
    'Đi theo tour hay tự túc thì tiết kiệm hơn? Bạn nào đi rồi cho mình hỏi với.',
    'Các lưu ý an toàn cho tuyến ít phổ biến rất hữu ích, cảm ơn đã chia sẻ.',
    'Mình đã chia sẻ bài này cho nhóm bạn, cả hội đang lên kế hoạch đi cuối năm.',
    'Bài mô tả hang động và vườn chim khá hấp dẫn, mình sẽ ghé lần tới.',
    'Có bãi đỗ xe rộng không? Đi nhóm đông thường khó tìm chỗ đậu xe.',
    'Thông tin giờ mở cửa và giá vé nên được cập nhật thường xuyên hơn.',
];

// Nội dung reply — giọng chính thức của ban quản lý / cơ quan nhà nước
const OFFICIAL_REPLY_POOL = [
    'Cảm ơn bạn đã phản hồi tích cực. Ban quản lý ghi nhận và sẽ tiếp tục nâng cao chất lượng dịch vụ.',
    'Xin chào bạn! Thông tin giờ mở cửa và giá vé đã được cập nhật trong bài viết. Cảm ơn bạn đã quan tâm.',
    'Cảm ơn bạn đã chia sẻ trải nghiệm. Chúng tôi sẽ chuyển phản hồi đến đơn vị vận hành để cải thiện.',
    'Ban tổ chức xin ghi nhận góp ý của bạn và sẽ bổ sung thông tin chi tiết trong thời gian sớm nhất.',
    'Cảm ơn câu hỏi của bạn! Dịch vụ hướng dẫn viên tại chỗ hiện có sẵn, bạn có thể đặt trước qua hotline của khu du lịch.',
    'Xin chào! Khu vực có bãi đỗ xe rộng có thể chứa xe ô tô và xe du lịch lớn. Rất vui được đón tiếp bạn.',
    'Cảm ơn phản hồi của bạn. Đây là thông tin quý báu giúp chúng tôi hoàn thiện nội dung và dịch vụ.',
    'Ban quản lý du lịch tỉnh luôn nỗ lực bảo tồn cảnh quan và nâng cao trải nghiệm cho du khách. Cảm ơn bạn!',
    'Xin chào bạn! Trẻ em dưới 1m2 và người cao tuổi trên 60 tuổi được miễn/giảm vé. Chi tiết xem tại quầy vé.',
    'Cảm ơn bạn đã tin tưởng và ủng hộ du lịch Ninh Bình. Chúc bạn có chuyến đi thật trọn vẹn!',
    'Sở Văn hóa – Thể thao và Du lịch tỉnh Ninh Bình ghi nhận phản hồi này và sẽ làm việc với đơn vị liên quan.',
    'Thông tin lịch trình lễ hội 2026 đã được cập nhật trên cổng thông tin chính thức. Cảm ơn bạn đã quan tâm.',
    'Chúng tôi sẽ tăng cường kiểm tra và đảm bảo chất lượng dịch vụ trong mùa du lịch cao điểm. Cảm ơn!',
];

async function seed() {
    console.log('================ SEEDING NEWS COMMENTS ================');

    try {
        // 1. Fetch users, phân loại theo role
        console.log('Fetching existing users by role...');
        const userRes = await query(`
            SELECT u.id, u.full_name, u.email, r.code AS role_code
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LIMIT 50
        `);
        const allUsers = userRes.rows;

        const commenters = allUsers.filter(u => COMMENTER_ROLES.has(u.role_code));
        const responders = allUsers.filter(u => RESPONDER_ROLES.has(u.role_code));

        if (commenters.length === 0) throw new Error('Không có user với role tourist/travel_company/service_provider/spot_operator.');
        if (responders.length === 0) throw new Error('Không có user với role system_admin/ministry_manager/department_manager.');

        console.log(`Commenters (${commenters.map(u => u.role_code).join(', ')}): ${commenters.length} users`);
        console.log(`Responders (${responders.map(u => u.role_code).join(', ')}): ${responders.length} users`);

        // 2. Fetch all published news
        console.log('\nFetching published news...');
        const newsRes = await query('SELECT id, title FROM news WHERE is_published = true ORDER BY created_at');
        const newsList = newsRes.rows;
        if (newsList.length === 0) throw new Error('Không tìm thấy bài viết nào đã xuất bản.');
        console.log(`Found ${newsList.length} published news articles.`);

        // 3. Xóa toàn bộ comment cũ (cả NULL user_id lẫn seeded) để re-seed sạch
        console.log('\nClearing all existing seeded comments...');
        const delRes = await query('DELETE FROM news_comments');
        console.log(`Deleted ${delRes.rowCount} existing comments.`);

        // 4. Seed comments theo đúng phân vai
        console.log('\nSeeding comments with role-aware logic...');
        let commentCount = 0;
        let replyCount = 0;

        // baseDate trải từ 2026-03-01 → 2026-05-25 để dữ liệu trải đều theo thời gian
        const startMs = new Date('2026-03-01T08:00:00Z').getTime();
        const endMs   = new Date('2026-05-25T20:00:00Z').getTime();

        for (const news of newsList) {
            const numRootComments = randomInt(3, 5);

            // Trộn commenters mỗi bài để tránh cùng thứ tự
            const shuffledCommenters = [...commenters].sort(() => Math.random() - 0.5);

            for (let i = 0; i < numRootComments; i++) {
                const commenter = shuffledCommenters[i % shuffledCommenters.length];
                const content = randomElem(COMMENT_POOL);
                // Phân bổ ngẫu nhiên trong khoảng 3 tháng
                const createdAt = new Date(startMs + Math.random() * (endMs - startMs));

                const res = await query(
                    `INSERT INTO news_comments (news_id, user_id, content, is_approved, created_at)
                     VALUES ($1, $2, $3, true, $4) RETURNING id`,
                    [news.id, commenter.id, content, createdAt]
                );
                const rootId = res.rows[0].id;
                commentCount++;

                // 50% xác suất cấp trên trả lời — reply sau root 15 phút → 3 giờ
                if (Math.random() < 0.5 && responders.length > 0) {
                    const responder = randomElem(responders);
                    const replyContent = randomElem(OFFICIAL_REPLY_POOL);
                    const replyCreatedAt = new Date(createdAt.getTime() + randomInt(15, 180) * 60 * 1000);

                    await query(
                        `INSERT INTO news_comments (news_id, user_id, parent_comment_id, content, is_approved, created_at)
                         VALUES ($1, $2, $3, $4, true, $5)`,
                        [news.id, responder.id, rootId, replyContent, replyCreatedAt]
                    );
                    replyCount++;
                }
            }
        }

        console.log(`\nSeeded ${commentCount} root comments + ${replyCount} official replies = ${commentCount + replyCount} total.`);

        // 5. Xác minh kết quả
        console.log('\n--- Verification ---');
        const statsRes = await query(`
            SELECT
                COUNT(*) AS total,
                COUNT(user_id) AS with_user_id,
                COUNT(*) FILTER (WHERE user_id IS NULL) AS null_user_id,
                COUNT(*) FILTER (WHERE parent_comment_id IS NOT NULL) AS replies
            FROM news_comments
        `);
        console.log('Final stats:', statsRes.rows[0]);

        const roleStatsRes = await query(`
            SELECT
                CASE WHEN c.parent_comment_id IS NULL THEN 'root' ELSE 'reply' END AS type,
                r.code AS role_code,
                COUNT(*) AS cnt
            FROM news_comments c
            JOIN users u ON c.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            GROUP BY type, r.code
            ORDER BY type, cnt DESC
        `);
        console.log('\nBreakdown by role:');
        roleStatsRes.rows.forEach(r =>
            console.log(`  [${r.type.padEnd(5)}] ${r.role_code.padEnd(20)} → ${r.cnt}`)
        );

        console.log('\n================ SEEDING COMPLETED ================');
    } catch (err) {
        console.error('\nSeeding failed:', err.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

seed();
