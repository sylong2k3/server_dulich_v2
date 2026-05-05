-- Extended Seed Data: Vlogs
-- Realistic Vietnamese travel vloggers and content

BEGIN;

-- ============================================================
-- POPULAR TRAVEL VLOGS
-- ============================================================

-- Khám Phá Việt Nam Channel - Tam Cốc
INSERT INTO vlogs (title, content, excerpt, spot_id, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Du lịch Tam Cốc 2 ngày 1 đêm - Thiên Đường Du Thuyền Ninh Bình',
  'Vlog tường thuật chi tiết 2 ngày khám phá Tam Cốc với du thuyền qua 3 tuyến hang động, leo Hang Múa ngắm hoàng hôn, ăn cơm cháy, ở khách sạn 4 sao, và những trải nghiệm thú vị khác. Bao gồm giá vé, chi phí, và tips du lịch hữu ích.',
  'Khám phá Tam Cốc - thiên đường du thuyền ở Ninh Bình',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Tam Cốc' LIMIT 1),
  'NB',
  'https://youtu.be/abc123def456',
  '/uploads/vlogs/tam-coc-discovery.jpg',
  458000, 12300, 2100, 1850,
  'published', 'youtube',
  NOW(), NOW()
);

-- Du Lịch Việt Channel - Hang Múa
INSERT INTO vlogs (title, content, excerpt, spot_id, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Leo Hang Múa 500 bậc đá - Cảnh 360 độ hùng vĩ ở Ninh Bình',
  'Video ghi lại quá trình leo 500 bậc đá từ dưới chân lên đỉnh Hang Múa, ngắm cảnh toàn Tam Cốc, Ninh Bình từ trên cao. Kèm theo lời khuyên về giày leo, thời gian tốt nhất, và an toàn khi leo núi. Footage cảnh hoàng hôn rất đẹp.',
  'Leo Hang Múa - cảnh 360 độ tuyệt đẹp',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa' LIMIT 1),
  'NB',
  'https://youtu.be/xyz789uvw012',
  '/uploads/vlogs/hang-mua-conquest.jpg',
  325000, 8900, 1450, 980,
  'published', 'youtube',
  NOW(), NOW()
);

-- Văn Hóa Việt - Chùa Bái Đính
INSERT INTO vlogs (title, content, excerpt, spot_id, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Chùa Bái Đính - Di Tích Phật Giáo Lớn Nhất Đông Nam Á',
  'Video tài liệu về Chùa Bái Đính lâu đời 1000 năm, gồm: lịch sử, kiến trúc, tượng Phật cao 80m, hang động bên trong, các công trình chạm khắc, và ý nghĩa tâm linh. Phỏng vấn các cao tăng và du khách. Footage chất lượng 4K.',
  'Chùa Bái Đính - di tích lớn nhất Đông Nam Á',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ' LIMIT 1),
  'NB',
  'https://youtu.be/qrs345tuv678',
  '/uploads/vlogs/bai-dinh-discovery.jpg',
  587000, 15600, 3200, 2450,
  'published', 'youtube',
  NOW(), NOW()
);

-- Tràng An UNESCO - Vlogger Quốc Tế
INSERT INTO vlogs (title, content, excerpt, spot_id, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Trang An UNESCO World Heritage - Most Beautiful River Valley in Vietnam',
  'English-language vlog about Trang An UNESCO World Heritage Site, featuring boat tours through karst landscape, caves, and local villages. Beautiful cinematography of sunrise, sunset, and golden hour. Tips for international travelers on how to visit and best time to go.',
  'Explore Trang An - UNESCO World Heritage Vietnam',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Tràng An' LIMIT 1),
  'NB',
  'https://youtu.be/klm901nop234',
  '/uploads/vlogs/trang-an-heritage.jpg',
  245000, 6800, 1200, 890,
  'published', 'youtube',
  NOW(), NOW()
);

-- Hotel & Resort Review - Ninh Bình
INSERT INTO vlogs (title, content, excerpt, cover_image_url, province_code, video_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Top 5 Khách Sạn Cao Cấp Tốt Nhất Ở Ninh Bình 2026 - Review Chi Tiết',
  'Review chi tiết 5 khách sạn 4-5 sao tốt nhất ở Ninh Bình: Emeralda Tam Cốc, Wyndham Grand Vedana, The Reed, Hoàng Sơn, Legend. Bao gồm phòng, tiện nghi, dịch vụ, giá cả, vị trí. Video tour phòng, bữa sáng, hồ bơi, spa, nhà hàng.',
  'Top 5 khách sạn cao cấp ở Ninh Bình',
  '/uploads/vlogs/hotels-ninh-binh.jpg',
  'NB',
  'https://youtu.be/pqr567stu890',
  156000, 4200, 680, 520,
  'published', 'youtube',
  NOW(), NOW()
);

-- Ẩm Thực Ninh Bình
INSERT INTO vlogs (title, content, excerpt, spot_id, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Ẩm Thực Ninh Bình - Đặc Sản Dê Núi & Cơm Cháy',
  'Video review các món ăn đặc sản Ninh Bình: dê núi (tái, xào, lòng nướng), cơm cháy, nem chua, bánh gai, ốc. Phỏng vấn chủ nhà hàng về nguyên liệu địa phương, phương pháp nấu nướng truyền thống. Thử ăn các món và phản ứng chân thực.',
  'Ẩm thực Ninh Bình - dê núi và cơm cháy',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Nhà hàng Tre Xanh' LIMIT 1),
  'NB',
  'https://youtu.be/vwx123yza456',
  178000, 5100, 890, 620,
  'published', 'youtube',
  NOW(), NOW()
);

-- Photography Tour
INSERT INTO vlogs (title, content, excerpt, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Photography Tour Ninh Bình - Bình Minh & Hoàng Hôn Tuyệt Đẹp',
  'Vlog chuyên về nhiếp ảnh du lịch tại Ninh Bình. Hướng dẫn cách chụp bình minh tại Cố Đô Hoa Lư, hoàng hôn tại Hang Múa, cánh đồng lúa chín, chim bay về tổ. Tips về thiết lập máy ảnh, góc độ, bộ lọc, và chỉnh sửa hình ảnh. Showcase những bức ảnh đẹp nhất được chụp.',
  'Photography tour Ninh Bình',
  '/uploads/vlogs/photography-tour.jpg',
  'NB',
  'https://youtu.be/abc789xyz123',
  98000, 2800, 450, 380,
  'published', 'youtube',
  NOW(), NOW()
);

-- Vlog Cố Đô Hoa Lư
INSERT INTO vlogs (title, content, excerpt, spot_id, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Cố Đô Hoa Lư - Kinh Đô 1000 Năm Của Nước Việt',
  'Video tài liệu về Cố Đô Hoa Lư, kinh đô đầu tiên của nhà nước phong kiến Việt Nam. Khám phá Đền Vua Đinh, Đền Vua Lê, Đền Thái Vi, lịch sử các triều đại Đinh-Tiền Lê. Phỏng vấn các chuyên gia lịch sử. Hình ảnh tuyệt đẹp của núi đá vôi.',
  'Cố Đô Hoa Lư - kinh đô 1000 năm',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Cố đô Hoa Lư' LIMIT 1),
  'NB',
  'https://youtu.be/def456ghi789',
  267000, 7200, 1500, 980,
  'published', 'youtube',
  NOW(), NOW()
);

-- OCOP & Sản Phẩm Địa Phương
INSERT INTO vlogs (title, content, excerpt, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'OCOP Ninh Bình - Sản Phẩm 4 Sao Nổi Tiếng',
  'Vlog khám phá các sản phẩm OCOP 4 sao nổi tiếng của Ninh Bình: cơm cháy, mắm tép Gia Viễn, rượu Kim Sơn, mật ong Nho Quan, thêu ren Văn Lâm. Thăm các cơ sở sản xuất, gặp gỡ nghệ nhân, và thử các sản phẩm. Tips mua lưu niệm chất lượng.',
  'OCOP Ninh Bình - sản phẩm 4 sao',
  '/uploads/vlogs/ocop-products.jpg',
  'NB',
  'https://youtu.be/jkl012mno345',
  142000, 3800, 720, 580,
  'published', 'youtube',
  NOW(), NOW()
);

-- Thung Nham - Chim Bay Về Tổ
INSERT INTO vlogs (title, content, excerpt, spot_id, province_code, video_url, cover_image_url, view_count, like_count, comment_count, save_count, status, platform, created_at, updated_at)
VALUES (
  'Thung Nham - Thiên Đường Chim Hoang Dã - Hàng Vạn Con Cò Bay Về Tổ',
  'Video ghi lại cảnh hàng vạn con cò, vạc, le le bay về tổ vào chiều tà tại Thung Nham. Kèm theo khám phá Động Vái Giờ ba tầng, tìm hiểu về hệ sinh thái rừng Cúc Phương. Footage đẹp của chim bay, cảnh hoàng hôn, và thiên nhiên nguyên sinh.',
  'Thung Nham - hàng vạn con chim bay về tổ',
  (SELECT id FROM tourism_spots WHERE name_vi = 'Quần thể Chùa Tam Chúc' LIMIT 1),
  'NB',
  'https://youtu.be/pqr678stu901',
  267000, 7100, 1400, 950,
  'published', 'youtube',
  NOW(), NOW()
);

COMMIT;
