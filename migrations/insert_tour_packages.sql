-- ============================================================
-- MIGRATION: insert_tour_packages.sql
-- Mục đích : Thêm 6 gói tour tiêu biểu phục vụ du khách Ninh Bình
--             bao phủ các tuyến du lịch chính: Tràng An, Cố Đô, Bái Đính, Thung Nham.
-- Phụ thuộc: insert_news_ocop_businesses.sql (businesses phải tồn tại)
-- Tác giả  : auto-generated seed — 2026-05-03
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: TOUR PACKAGES (6 gói tour)
-- ============================================================

INSERT INTO tour_packages (
    id,
    business_id,
    province_code,
    name_vi,
    name_en,
    slug,
    description_vi,
    duration_days,
    price_from_vnd,
    max_guests,
    includes,
    excludes,
    start_location_vi,
    end_location_vi,
    cover_image_url,
    rating_avg,
    rating_count,
    status,
    is_featured,
    published_at
) VALUES

-- 1. Tour Tràng An Classic (1 ngày)
(
    '550ea000-e29b-41d4-a716-000000000001'::uuid,
    '550ba000-e29b-41d4-a716-000000000007'::uuid,
    '37',
    'Tour Tràng An Classic – Đi Thuyền Qua 3 Tuyến Hang Động',
    'Trang An Classic Tour – Boat Ride Through 3 Cave Routes',
    'tour-trang-an-classic-1-day',
    'Khám phá Quần thể Di Tích Tràng An qua 3 tuyến du lịch nổi tiếng: Hang Cả, Hang Hai, Hang Ba, Hang Địa Linh, Hang Tối và hệ thống nhũ đá hung vĩ. Đi thuyền trên dòng sông Sào Khê, chiêm ngưỡng cảnh quan karst huyền ảo. Tour này phù hợp với tất cả độ tuổi, không cần năng lực thể chất đặc biệt.',
    1,
    850000,
    30,
    '["Vé thuyền Tràng An (3 tuyến)", "Hướng dẫn viên tiếng Việt", "Nước uống & trái cây", "Bảo hiểm du lịch cơ bản"]'::jsonb,
    '["Ăn cơm trưa", "Đi tour thêm", "Đồ uống kỳ lạ"]'::jsonb,
    'Thành phố Ninh Bình hoặc Hoa Lư',
    'Bến Tràng An',
    'https://storage.example.com/tours/trang-an-classic.jpg',
    4.6,
    342,
    'published',
    TRUE,
    '2026-01-15 08:00:00'
),

-- 2. Tour Cố Đô Hoa Lư & Tâm Linh (1.5 ngày)
(
    '550ea000-e29b-41d4-a716-000000000002'::uuid,
    '550ba000-e29b-41d4-a716-000000000009'::uuid,
    '37',
    'Tour Cố Đô Hoa Lư & Tâm Linh – Kinh Đô Ngàn Năm',
    'Hoa Lu Ancient Capital & Spiritual Heritage – 1.5 Days',
    'tour-co-do-hoa-lu-tam-linh',
    'Hành trình khám phá Cố Đô Hoa Lư – kinh đô đầu tiên của nhà nước phong kiến Việt Nam và hệ thống đền thờ các vua triều Đinh – Tiền Lê. Viếng thăm Đền Vua Đinh, Đền Vua Lê, Đền Thái Vi trong không gian linh thiêng giữa lòng núi đá vôi. Thích hợp cho du khách yêu thích lịch sử và tâm linh.',
    1.5,
    1200000,
    25,
    '["Vé tham quan Cố Đô Hoa Lư", "Vé tham quan các đền thờ", "Hướng dẫn viên chuyên sâu về lịch sử", "Ăn cơm trưa tại nhà hàng dê núi", "1 đêm homestay/nhà nghỉ", "Nước uống & trái cây", "Bảo hiểm du lịch"]'::jsonb,
    '["Thêm tour ngoài hành trình", "Đồ uống riêng lẻ", "Chi phí cá nhân"]'::jsonb,
    'Thành phố Ninh Bình',
    'Khu Di Tích Cố Đô Hoa Lư',
    'https://storage.example.com/tours/co-do-hoa-lu-tam-linh.jpg',
    4.7,
    218,
    'published',
    TRUE,
    '2026-01-10 08:00:00'
),

-- 3. Tour Ninh Bình Toàn Tuyến (3 ngày, 2 đêm)
(
    '550ea000-e29b-41d4-a716-000000000003'::uuid,
    '550ba000-e29b-41d4-a716-000000000007'::uuid,
    '37',
    'Tour Ninh Bình Toàn Tuyến – Khám Phá Di Sản Thế Giới',
    'Comprehensive Ninh Binh Tour – World Heritage Discovery – 3D2N',
    'tour-ninh-binh-toan-tuyen-3d2n',
    'Chương trình du lịch toàn tuyến 3 ngày 2 đêm bao quát tất cả các điểm du lịch chính của Ninh Bình: Tràng An (Hang Múa), Cố Đô Hoa Lư (Đền Đinh, Đền Lê), Chùa Bái Đính Cổ, Thung Nham (Động Vái Giời), Cánh Đồng Sen và các làng nghề thủ công. Tour đi sâu vào lịch sử, văn hóa, tâm linh và thiên nhiên của vùng đất cổ kính này.',
    3,
    3500000,
    35,
    '["Vé thuyền Tràng An", "Vé tham quan Cố Đô Hoa Lư & các đền", "Vé Chùa Bái Đính Cổ", "Vé Thung Nham", "Hướng dẫn viên tiếng Việt/Anh 3 ngày", "2 đêm lưu trú 3 sao", "Ăn 3 bữa sáng, 3 bữa trưa, 2 bữa tối", "Đi lại bằng xe du lịch", "Bảo hiểm du lịch", "Nước uống & trái cây"]'::jsonb,
    '["Uống rượu/bia thêm", "Tipping hướng dẫn viên", "Chi phí cá nhân"]'::jsonb,
    'Thành phố Ninh Bình hoặc Hà Nội',
    'Thành phố Ninh Bình',
    'https://storage.example.com/tours/ninh-binh-toan-tuyen-3d2n.jpg',
    4.8,
    567,
    'published',
    TRUE,
    '2026-01-05 08:00:00'
),

-- 4. Tour Thung Nham Sinh Thái (1 ngày)
(
    '550ea000-e29b-41d4-a716-000000000004'::uuid,
    '550ba000-e29b-41d4-a716-000000000009'::uuid,
    '37',
    'Tour Thung Nham – Thiên Đường Chim Hoang Dã & Hang Động Ba Tầng',
    'Thung Nham Eco Tour – Wild Birds Paradise & 3-Level Cave',
    'tour-thung-nham-eco-1-day',
    'Trải nghiệm độc đáo tại Khu Du Lịch Sinh Thái Thung Nham: Quan sát hàng chục nghìn con cò, vạc, le le bay về tổ vào chiều tà (16:00–17:30). Khám phá Động Vái Giời ba tầng kỳ bí trên độ cao 400 bậc đá. Tìm hiểu về hệ sinh thái rừng nguyên sinh Cúc Phương. Tour lý tưởng cho những người yêu thiên nhiên và chim hoang dã.',
    1,
    950000,
    30,
    '["Vé vào Thung Nham", "Vé Động Vái Giời", "Hướng dẫn viên sinh thái", "Ăn cơm trưa tại Thung Nham", "Nước uống & trái cây", "Ống nhòm quan sát chim", "Bảo hiểm du lịch"]'::jsonb,
    '["Ăn cơm chiều", "Thêm tour", "Chi phí cá nhân"]'::jsonb,
    'Thành phố Ninh Bình',
    'Khu Du Lịch Sinh Thái Thung Nham',
    'https://storage.example.com/tours/thung-nham-eco-tour.jpg',
    4.6,
    189,
    'published',
    FALSE,
    '2026-02-01 08:00:00'
),

-- 5. Tour OCOP & Ẩm Thực Ninh Bình (1 ngày)
(
    '550ea000-e29b-41d4-a716-000000000010'::uuid,
    '550ba000-e29b-41d4-a716-000000000010'::uuid,
    '37',
    'Tour OCOP & Ẩm Thực Ninh Bình – Khám Phá Đặc Sản & Làng Nghề',
    'Ninh Binh OCOP & Culinary Experience – Specialty Tour',
    'tour-ocop-am-thuc-1-day',
    'Khám phá các sản phẩm OCOP 4 sao nổi tiếng của Ninh Bình: Cơm cháy, Mắm tép Gia Viễn, Rượu Kim Sơn, Mật ong Nho Quan, Thêu ren Văn Lâm. Tham quan các cơ sở sản xuất truyền thống, gặp gỡ các nghệ nhân lành nghề. Thưởng thức ẩm thực đặc sản: dê núi, nem chua, bánh gai. Mua quà lưu niệm thêu ren, cói mỹ nghệ. Tour này kết hợp du lịch với trải nghiệm văn hóa địa phương sâu sắc.',
    1,
    1100000,
    25,
    '["Vé thăm các cơ sở OCOP", "Hướng dẫn viên tiếng Việt", "Ăn sáng tại cơ sở cơm cháy", "Ăn trưa dê núi Ninh Bình", "Nước uống & trái cây", "1 voucher mua OCOP trị giá 300k", "Bảo hiểm du lịch"]'::jsonb,
    '["Mua sắm thêm hàng hóa", "Chi phí cá nhân", "Tip hướng dẫn viên"]'::jsonb,
    'Thành phố Ninh Bình',
    'Thành phố Ninh Bình',
    'https://storage.example.com/tours/ocop-am-thuc-ninh-binh.jpg',
    4.5,
    134,
    'published',
    FALSE,
    '2026-02-10 08:00:00'
),

-- 6. Tour Nhiếp Ảnh Ninh Bình (2 ngày)
(
    '550ea000-e29b-41d4-a716-000000000006'::uuid,
    '550ba000-e29b-41d4-a716-000000000007'::uuid,
    '37',
    'Tour Nhiếp Ảnh Ninh Bình – Bình Minh & Hoàng Hôn Tuyệt Đẹp',
    'Photography Tour Ninh Binh – Golden Hour Magic – 2 Days',
    'tour-nhiep-anh-ninh-binh-2d',
    'Chuyên biệt dành cho các nhiếp ảnh gia chuyên nghiệp và sở thích: Chụp bình minh tại Cố Đô Hoa Lư, hoàng hôn tại Hang Múa, cánh đồng lúa chín vàng, các đàn cò bay về tổ tại Thung Nham. Hướng dẫn viên là nhiếp ảnh gia kinh nghiệm sẽ chia sẻ bí kíp chụp ảnh đẹp. Tour có lịch trình linh hoạt để bắt tốt nhất các thời điểm sáng tạo.',
    2,
    2800000,
    15,
    '["Vé tham quan các điểm scenic", "Hướng dẫn viên photo chuyên nghiệp", "1 đêm lưu trú 3 sao", "Ăn 2 bữa sáng, 2 bữa trưa, 1 bữa tối", "Xe du lịch riêng nhóm", "Bảo hiểm du lịch", "Nước uống & trái cây"]'::jsonb,
    '["Tipping", "Chi phí cá nhân", "Lưu trữ ảnh đặc biệt"]'::jsonb,
    'Thành phố Ninh Bình',
    'Thành phố Ninh Bình',
    'https://storage.example.com/tours/thenp-anh-ninh-binh.jpg',
    4.9,
    89,
    'published',
    TRUE,
    '2026-02-20 08:00:00'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 2: TOUR PACKAGE STOPS (Chi tiết từng ngày/dừng chân)
-- ============================================================

INSERT INTO tour_package_stops (
    id,
    tour_package_id,
    day_number,
    stop_order,
    title_vi,
    description_vi,
    planned_duration_min
) VALUES

-- Tour 1: Tràng An Classic (1 ngày, 5 dừng chân)
(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000001'::uuid, 1, 1,
 'Bến Thuyền Tràng An – Khởi Hành',
 'Tập trung tại bến thuyền Tràng An lúc 8:00. Nhận hướng dẫn viên, chuẩn bị đi thuyền.',
 30),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000001'::uuid, 1, 2,
 'Tuyến 1 Tràng An – Hang Địa Linh & Hang Tối',
 'Đi thuyền tuyến 1 (dài nhất, ~2.5 giờ). Chiêm ngưỡng Hang Cả, Hang Hai, Hang Ba, Hang Địa Linh, Hang Tối. Chụp ảnh nhũ đá lung linh giữa dòng sông Sào Khê.',
 150),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000001'::uuid, 1, 3,
 'Nhà Hàng Cơm Cháy Tam Cốc – Ăn Trưa',
 'Ăn trưa đặc sản cơm cháy Ninh Bình kèm thịt dê núi, rau sắng địa phương. Nghỉ ngơi khoảng 1.5 giờ.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000001'::uuid, 1, 4,
 'Hang Múa – Leo Núi & Ngắm Cảnh Hoàng Hôn',
 'Lên Hang Múa (500 bậc đá, ~25 phút). Ngắm toàn cảnh Ninh Bình từ trên cao lúc hoàng hôn (16:00–17:30). Chụp ảnh đẹp với nền trời cam đỏ.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000001'::uuid, 1, 5,
 'Trở Về & Kết Thúc',
 'Xuống núi, trở về điểm tập trung. Chia tay lúc 18:00. Kết thúc tour.',
 30),

-- Tour 2: Cố Đô Hoa Lư & Tâm Linh (1.5 ngày, 6 dừng chân)
(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 1, 1,
 'Khởi Hành & Di Chuyển Đến Cố Đô',
 'Tập trung lúc 8:00 tại Ninh Bình City. Di chuyển đến Cố Đô Hoa Lư (~15 phút lái xe). Lên kế hoạch chi tiết.',
 30),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 1, 2,
 'Đền Vua Đinh Tiên Hoàng – Tham Quan Kiến Trúc Cổ',
 'Viếng Đền Vua Đinh, chiêm ngưỡng tượng Đinh Tiên Hoàng bằng đồng đen, các hàng cột chạm khắc hình rồng cổ. Nghe hướng dẫn viên kể chuyện lịch sử.',
 60),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 1, 3,
 'Đền Vua Lê & Tâm Linh Hoàng Hậu Dương Vân Nga',
 'Tham quan Đền Vua Lê, nghe chuyện tình yêu giữa Lê Hoàn và Dương Vân Nga. Thắp nhang cầu nguyện (tùy chọn). Đi bộ khám phá khu vực Cố Đô.',
 60),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 1, 4,
 'Nhà Hàng Dê Núi Cố Đô – Ăn Trưa',
 'Ăn trưa đặc sản dê núi: tái dê, dê xào lăn, lòng dê nướng, cháo dê. Thưởng thức rượu Kim Sơn truyền thống.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 1, 5,
 'Đền Thái Vi Tam Cốc – Tâm Linh Các Vua Trần',
 'Khám phá Đền Thái Vi tọa lạc giữa thung lũng Tam Cốc, nơi thờ các vua và hoàng hậu nhà Trần. Cảnh quan thiên nhiên hùng vĩ giữa lòng núi đá vôi.',
 75),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 1, 6,
 'Nhận Phòng & Tự Do Buổi Tối',
 'Check-in nhà nghỉ/homestay 3 sao. Buổi tối tự do khám phá khu ẩm thực Ninh Bình.',
 180),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 2, 1,
 'Ăn Sáng & Chuẩn Bị',
 'Ăn sáng tại nhà lưu trú. Chuẩn bị cho hành trình ngày thứ 2.',
 60),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 2, 2,
 'Chùa Bái Đính Cổ – Leo Núi & Chiêm Bái',
 'Lên Chùa Bái Đính Cổ (300 bậc đá). Tham quan Hang Phật rộng ~2.500m², Hang Sáng. Chiêm bái Phật, thắp nến cầu an. Nghe hướng dẫn kể chuyện lịch sử 1000 năm tuổi.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000002'::uuid, 2, 3,
 'Trở Về & Chia Tay',
 'Xuống núi, trở về điểm tập trung. Chia tay lúc 12:00. Kết thúc tour.',
 45),

-- Tour 3: Ninh Bình Toàn Tuyến (3 ngày, 12 dừng chân)
(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 1, 1,
 'Khởi Hành từ Hà Nội/Ninh Bình',
 'Tập trung 7:00 sáng. Lái xe đến Ninh Bình, nhận phòng tại khách sạn. Ăn sáng & chuẩn bị tour.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 1, 2,
 'Bến Thuyền Tràng An – Đi Thuyền Tuyến 2',
 'Khởi hành lúc 9:00. Đi thuyền Tràng An tuyến 2 (~2 giờ). Tham quan Hang Lấm, Hang Vạng, Hang Trống. Chiêm ngưỡng cảnh sắc hùng vĩ.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 1, 3,
 'Ăn Trưa Cơm Cháy Ninh Bình',
 'Ăn trưa tại nhà hàng cơm cháy Tam Cốc. Nghỉ ngơi 1.5 giờ.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 1, 4,
 'Hang Múa – Ngắm Hoàng Hôn',
 'Lên Hang Múa lúc 16:00. Ngắm toàn cảnh và hoàng hôn tuyệt đẹp. Chụp ảnh đẹp.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 1, 5,
 'Ăn Tối & Nghỉ Ngơi Đêm 1',
 'Ăn tối dê núi. Trở về khách sạn, nghỉ ngơi.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 2, 1,
 'Ăn Sáng & Cố Đô Hoa Lư',
 'Ăn sáng. Đến Cố Đô Hoa Lư, tham quan Đền Vua Đinh & Đền Vua Lê.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 2, 2,
 'Đền Thái Vi & Làng Thêu Ren Văn Lâm',
 'Thăm Đền Thái Vi, khám phá làng thêu ren Văn Lâm. Gặp gỡ nghệ nhân, mua quà thêu ren handmade.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 2, 3,
 'Ăn Trưa & Chùa Bái Đính Cổ',
 'Ăn trưa. Lên Chùa Bái Đính Cổ (300 bậc đá). Tham quan hang động, chiêm bái Phật.',
 150),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 2, 4,
 'Ăn Tối & Nghỉ Ngơi Đêm 2',
 'Ăn tối. Trở về khách sạn nghỉ ngơi.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 3, 1,
 'Ăn Sáng & Thung Nham Sinh Thái',
 'Ăn sáng. Đến Thung Nham, tham quan khu sinh thái, quan sát chim hoang dã.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 3, 2,
 'Động Vái Giờ & Cánh Đồng Sen',
 'Lên Động Vái Giờ (400 bậc đá). Ghé cánh đồng sen (nếu mùa sen nở tháng 5–7).',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000003'::uuid, 3, 3,
 'Ăn Trưa & Trở Về',
 'Ăn trưa. Trở về Ninh Bình/Hà Nội lúc 14:00–15:00. Kết thúc tour lúc 17:00.',
 180),

-- Tour 4: Thung Nham Sinh Thái (1 ngày, 4 dừng chân)
(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000004'::uuid, 1, 1,
 'Khởi Hành & Đến Thung Nham',
 'Tập trung 8:00. Lái xe đến Thung Nham (~15 phút từ Ninh Bình City). Đăng ký vào khu sinh thái.',
 30),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000004'::uuid, 1, 2,
 'Quan Sát Chim & Khám Phá Khu Sinh Thái',
 'Đi thuyền nhẹ trong khu Thung Nham, quan sát hàng chục loài chim hoang dã (cò, vạc, le le...). Nghe hướng dẫn viên sinh thái giải thích về hệ sinh thái rừng Cúc Phương.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000004'::uuid, 1, 3,
 'Ăn Trưa & Leo Động Vái Giờ Ba Tầng',
 'Ăn cơm trưa tại Thung Nham. Lên Động Vái Giờ (400 bậc đá, ~45 phút). Tham quan 3 hang động liên thông trong lòng núi.',
 150),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000004'::uuid, 1, 4,
 'Quan Sát Cò Về Tổ & Trở Về',
 'Lúc 16:00–17:30, quan sát chiêu tác của hàng vạn con cò bay về tổ. Trở về điểm tập trung, kết thúc tour lúc 18:00.',
 90),

-- Tour 5: OCOP & Ẩm Thực (1 ngày, 5 dừng chân)
(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000010'::uuid, 1, 1,
 'Khởi Hành & Cơ Sở Cơm Cháy',
 'Tập trung 7:30. Viếng thăm HTX Cơm Cháy Thành Nhân ở Gia Viễn. Học cách làm cơm cháy, nếm cơm cháy tươi nóng.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000010'::uuid, 1, 2,
 'Ăn Sáng Cơm Cháy & Mắm Tép',
 'Ăn sáng cơm cháy kèm mắm tép Gia Viễn truyền thống. Thưởng thức 2 sản phẩm OCOP 4 sao cùng lúc.',
 60),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000010'::uuid, 1, 3,
 'Làng Nghề Thêu Ren Văn Lâm',
 'Thăm làng thêu ren Văn Lâm (xã Ninh Hải). Gặp gỡ các nghệ nhân lành nghề. Xem trực tiếp quá trình thêu ren tinh xảo. Mua tranh thêu, khăn trải bàn hoặc quà lưu niệm.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000010'::uuid, 1, 4,
 'Ăn Trưa Dê Núi & Rượu Kim Sơn',
 'Ăn trưa đặc sản dê núi Ninh Bình: tái dê, dê xào, lòng dê nướng. Thưởng thức rượu Kim Sơn 4 sao. Mua rượu và đặc sản khác về làm quà.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000010'::uuid, 1, 5,
 'Cửa Hàng Đặc Sản & Trở Về',
 'Ghé Cửa Hàng Đặc Sản Ninh Bình Sạch. Mua thêm cơm cháy, mắm tép, mật ong, bánh gai, muối hạt... làm quà. Trở về lúc 17:00.',
 90),

-- Tour 6: Nhiếp Ảnh Ninh Bình (2 ngày, 7 dừng chân)
(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000006'::uuid, 1, 1,
 'Khởi Hành & Chuẩn Bị Thiết Bị',
 'Tập trung 5:00 sáng tại Ninh Bình City. Chuẩn bị máy ảnh, ống kính, tripod. Lái xe đến Cố Đô Hoa Lư.',
 45),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000006'::uuid, 1, 2,
 'Bình Minh Tại Cố Đô Hoa Lư',
 'Chụp bình minh tại Cố Đô (5:30–6:30). Ánh sáng vàng em, khu di tích yên tĩnh, núi đá vôi hùng vĩ. Hướng dẫn viên photo chuyên nghiệp sẽ gợi ý composition & settings.',
 60),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000006'::uuid, 1, 3,
 'Ăn Sáng & Làng Thêu Ren',
 'Ăn sáng tại nhà hàng. Lên Làng Thêu Ren Văn Lâm. Chụp ảnh các nghệ nhân đang thêu ren, các sản phẩm tinh xảo với ánh sáng buổi sáng.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000006'::uuid, 1, 4,
 'Cánh Đồng Lúa Chín & Ăn Trưa',
 'Chụp cánh đồng lúa chín vàng ôm chân núi đá vôi (nếu mùa lúa). Ăn trưa đặc sản địa phương.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000006'::uuid, 1, 5,
 'Hoàng Hôn Tại Hang Múa',
 'Lên Hang Múa lúc 15:30. Chụp hoàng hôn tuyệt đẹp trên đỉnh núi (16:30–17:30). Ánh sáng cam đỏ, bóng tím trên cánh đồng. Đây là "golden hour" đẹp nhất của Ninh Bình.',
 90),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000006'::uuid, 1, 6,
 'Nhận Phòng & Tối Tự Do',
 'Nhận phòng khách sạn 3 sao. Tối tự do khám phá khu ẩm thực Ninh Bình. Sắp xếp ảnh ngày hôm sau.',
 120),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000006'::uuid, 2, 1,
 'Ăn Sáng & Thung Nham Cò Bay Về Tổ',
 'Ăn sáng. Lên Thung Nham lúc 15:00. Chỉ định vị trí tốt. Lúc 16:00–17:30, chụp hàng vạn con cò bay về tổ (chiêu tác tuyệt đẹp). Chế độ continuous shooting để bắt chuyển động.',
 180),

(gen_random_uuid(), '550ea000-e29b-41d4-a716-000000000006'::uuid, 2, 2,
 'Trở Về & Chia Tay',
 'Xuống núi, ăn chiều nhẹ. Trở về Ninh Bình lúc 18:30. Kết thúc tour & chia tay lúc 19:00.',
 90)

ON CONFLICT (id) DO NOTHING;

COMMIT;
