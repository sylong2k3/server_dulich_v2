-- Extended Seed Data: Lễ hội - Festival data
-- Realistic Vietnamese festivals with proper dates and details

BEGIN;

-- ============================================================
-- FESTIVALS NINH BÌNH & SURROUNDING AREAS
-- ============================================================

-- Lễ Hội Tết Trung Thu Tam Cốc
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, recurrence_rule, cover_image_url, website, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Hội Tết Trung Thu Tam Cốc',
  'Tam Coc Mid-Autumn Festival',
  'cultural',
  'Lễ hội Tết Trung Thu lớn nhất Ninh Bình với đèn lồng truyền thống, rước đuốc, múa sư tử, biểu diễn múa lân, và các hoạt động văn hoá dân gian. Có các khu chơi cho trẻ em, bán đồ chơi truyền thống, bánh trung thu, và ẩm thực địa phương.',
  id, 'NB', '2026-09-20'::DATE, '2026-10-05'::DATE, true, 'FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=20',
  '/uploads/festivals/tet-trung-thu-tam-coc.jpg',
  'https://tamcoc-festival.vn',
  true,
  'Bến thuyền Tam Cốc, Ninh Bình',
  NOW(), NOW()
FROM tourism_spots WHERE name_vi = 'Tam Cốc'
ON CONFLICT DO NOTHING;

-- Lễ Hội Mùa Thu Hang Múa
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, recurrence_rule, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Hội Mùa Thu Hang Múa - Trekking & Nhiếp Ảnh',
  'Hang Mua Autumn Festival',
  'nature',
  'Lễ hội kỷ niệm mùa thu với các hoạt động trekking vào sáng sớm, chạy bộ leo núi, và cuộc thi nhiếp ảnh khám phá cảnh đẹp mùa thu. Có các bài giảng từ các hướng dẫn viên leo núi chuyên nghiệp, buổi Yoga trên đỉnh núi vào lúc bình minh, và các workshop về nhiếp ảnh thiên nhiên.',
  id, 'NB', '2026-09-01'::DATE, '2026-11-30'::DATE, true, 'FREQ=YEARLY;BYMONTH=9',
  '/uploads/festivals/hang-mua-autumn.jpg',
  true,
  'Hang Múa, Tam Cốc, Ninh Bình',
  NOW(), NOW()
FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa'
ON CONFLICT DO NOTHING;

-- Lễ Phật Đản Bái Đính
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, recurrence_rule, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Phật Đản Bái Đính - Lễ Hội Tôn Giáo Lớn Nhất',
  'Bai Dinh Buddha Birthday Festival',
  'religious',
  'Lễ Phật Đản kéo dài 10 ngày tại Chùa Bái Đính với hàng chục ngàn người tham dự. Có các buổi lễ cầu nguyện, thắp nến dâng Phật, các bài giảng pháp từ các cao tăng nổi tiếng, múa mâm (múa cầu bình an), và những pháp hành thiêng liêng trong hang động. Có các gian hàng bán hương, hoa, lưu niệm tôn giáo và ẩm thực chay.',
  id, 'NB', '2026-05-15'::DATE, '2026-05-25'::DATE, true, 'FREQ=YEARLY;BYMONTH=5;BYMONTHDAY=15',
  '/uploads/festivals/bai-dinh-buddha.jpg',
  true,
  'Chùa Bái Đính Cổ, Nho Quan, Ninh Bình',
  NOW(), NOW()
FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ'
ON CONFLICT DO NOTHING;

-- Lễ Hội Xuân Tràng An
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, recurrence_rule, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Hội Xuân Tràng An - Du Lịch Golf & Lữ Hành',
  'Trang An Spring Festival',
  'cultural',
  'Lễ hội chào đón mùa xuân tại Tràng An với các hoạt động du thuyền trên các tuyến hè mở, giải golf quốc tế trên sân golf Hoàng Gia, các trình diễn múa từ các nhóm dân gian, ẩm thực cao cấp, và các gian triển lãm về lịch sử và văn hóa Tràng An. Có các tour du lịch đặc biệt kết hợp với các trải nghiệm thiên nhiên.',
  id, 'NB', '2026-01-20'::DATE, '2026-03-31'::DATE, true, 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=20',
  '/uploads/festivals/trang-an-spring.jpg',
  true,
  'Tràng An, Cúc Phương, Ninh Bình',
  NOW(), NOW()
FROM tourism_spots WHERE name_vi = 'Bến thuyền Tràng An'
ON CONFLICT DO NOTHING;

-- Lễ Hội Nước Tam Chúc
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, recurrence_rule, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Hội Nước & Sinh Thái Tam Chúc',
  'Tam Chuc Water & Eco Festival',
  'nature',
  'Lễ hội đặc biệt tại Tam Chúc với các hoạt động trên mặt nước như kayak, sup, chèo thuyền, bơi lội, cuộc thi bơi lội. Có các bài giảng về bảo tồn thiên nhiên, khám phá sinh vật hoang dã, quan sát chim, và những workshop về nhiếp ảnh thiên nhiên. Bán các sản phẩm sinh thái, hàng thủ công mỹ nghệ từ các cộng đồng địa phương.',
  id, 'NB', '2026-05-01'::DATE, '2026-08-31'::DATE, true, 'FREQ=YEARLY;BYMONTH=5',
  '/uploads/festivals/tam-chuc-water.jpg',
  true,
  'Tam Chúc, Cúc Phương, Ninh Bình',
  NOW(), NOW()
FROM tourism_spots WHERE name_vi = 'Quần thể Chùa Tam Chúc'
ON CONFLICT DO NOTHING;

-- Lễ Hội Cố Đô Hoa Lư
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, recurrence_rule, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Hội Cố Đô Hoa Lư - Lịch Sử & Văn Hóa',
  'Hoa Lu Ancient Capital Festival',
  'historical',
  'Lễ hội kỷ niệm 1000 năm lịch sử Cố Đô Hoa Lư với các cuộc diễu hành tái hiện lịch sử triều Đinh - Tiền Lê, các buổi hát ru truyền thống, múa dân gian, cầu Phật, cầu tổ tiên. Có các gian triển lãm về di vật lịch sử, trang phục cổ, và ẩm thực cơm dân gian. Các lễ tế rối và cầu bình an tại các đền thờ vua.'
  ,
  (SELECT id FROM tourism_spots WHERE name_vi = 'Cố đô Hoa Lư' LIMIT 1), 'NB', '2026-04-10'::DATE, '2026-04-20'::DATE, true, 'FREQ=YEARLY;BYMONTH=4;BYMONTHDAY=10',
  '/uploads/festivals/co-do-hoa-lu.jpg',
  true,
  'Cố Đô Hoa Lư, Hoa Lư, Ninh Bình',
  NOW(), NOW()
ON CONFLICT DO NOTHING;

-- Lễ Hội Chùa Tam Chúc - Tết Nguyên Đán
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, recurrence_rule, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Chùa Tam Chúc Đầu Năm Mới',
  'Tam Chuc Temple New Year Ceremony',
  'religious',
  'Lễ chùa Tam Chúc vào dịp Tết Nguyên Đán với hàng vạn người tham dự cầu bình an cho năm mới. Có các pháp hành cầu an, thắp nến dâng Phật, cơm chay miễn phí, lễ rối tại chùa. Có các khu vực bán hương, hoa, lưu niệm tôn giáo, và các trò chơi dân gian Tết.',
  id, 'NB', '2026-02-10'::DATE, '2026-02-17'::DATE, true, 'FREQ=YEARLY;BYMONTH=2',
  '/uploads/festivals/tam-chuc-tet.jpg',
  true,
  'Tam Chúc, Cúc Phương, Ninh Bình',
  NOW(), NOW()
FROM tourism_spots WHERE name_vi = 'Quần thể Chùa Tam Chúc'
ON CONFLICT DO NOTHING;

-- Lễ Hội Đền Đinh Tiên Hoàng
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, recurrence_rule, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Hội Đền Đinh - Tế Vua Đinh',
  'Dinh King Festival',
  'religious',
  'Lễ tế Vua Đinh Tiên Hoàng tại Đền Đinh với các lễ cầu bình an, trí tuệ, và sức khỏe. Có các buổi hát ru, múa dân gian, rước kiệu Vua Đinh, và các buổi cầu cơm. Bán các loại lễ vật, hương, hoa, và ẩm thực truyền thống cơm dân gian.',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Đền Vua Đinh' LIMIT 1), 'NB', '2026-10-17'::DATE, '2026-10-19'::DATE, true, 'FREQ=YEARLY;BYMONTH=10;BYMONTHDAY=17',
  '/uploads/festivals/den-dinh.jpg',
  true,
  'Đền Vua Đinh, Hoa Lư, Ninh Bình',
  NOW(), NOW()
ON CONFLICT DO NOTHING;

-- Lễ Hội Lịch Sử Hoàng Gia - Tái Hiện
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Lễ Hội Tái Hiện Lịch Sử Hoàng Gia',
  'Royal History Reenactment Festival',
  'historical',
  'Lễ hội tái hiện lịch sử hoàng gia với các màn diễu hành tái hiện lịch sử các triều đại, các nghi lễ cổ xưa, cưỡi ngựa theo lối cũ, và các buổi hát ru truyền thống. Có các gian triển lãm về trang phục cổ, vũ khí cổ, và đồ dùng hoàng gia. Bán lưu niệm lịch sử và ẩm thực hoàng gia.',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm' LIMIT 1), 'NB', '2026-06-15'::DATE, '2026-06-20'::DATE, false, NULL,
  '/uploads/festivals/royal-history.jpg',
  true,
  'Hành cung Vũ Lâm, Hoa Lư, Ninh Bình',
  NOW(), NOW()
ON CONFLICT DO NOTHING;

-- Festival Du Thuyền & Âm Nhạc
INSERT INTO festivals (name_vi, name_en, festival_type, description_vi, spot_id, province_code, start_date, end_date, is_recurring, cover_image_url, is_published, location_name, created_at, updated_at)
SELECT
  'Festival Âm Nhạc & Du Thuyền Tràng An',
  'Music & Boat Festival Trang An',
  'cultural',
  'Festival kết hợp âm nhạc truyền thống và hiện đại với các buổi biểu diễn trên du thuyền, hát rong, các ban nhạc truyền thống, và nhạc sống từ các nghệ sĩ nổi tiếng. Có các cuộc thi hát, múa, và các workshop về âm nhạc truyền thống Việt Nam. Ăn uống cao cấp trên thuyền.',
  id, 'NB', '2026-07-01'::DATE, '2026-07-10'::DATE, false, NULL,
  '/uploads/festivals/music-boat.jpg',
  true,
  'Bến thuyền Tràng An, Cúc Phương, Ninh Bình',
  NOW(), NOW()
FROM tourism_spots WHERE name_vi = 'Bến thuyền Tràng An'
ON CONFLICT DO NOTHING;

COMMIT;
