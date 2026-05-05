-- Vouchers linked to actual businesses
-- Business IDs from insert_news_ocop_businesses.sql

BEGIN;

-- ============================================================
-- OCOP & PRODUCT VOUCHERS (linked to OCOP businesses)
-- ============================================================

-- HTX Cơm Cháy Thành Nhân
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000001'::uuid,
  'COMCHAY50',
  'Giảm 50k Cơm Cháy Thành Nhân',
  'Giảm 50.000 VND cho mỗi đơn mua cơm cháy tại HTX Cơm Cháy Thành Nhân. Áp dụng cho mua hàng từ 100k trở lên. Có thể dùng nhiều lần.',
  'fixed_amount',
  50000,
  100000,
  2000,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- Cơ Sở Mắm Tép Bà Quý Gia Viễn
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000002'::uuid,
  'MAMTEP40',
  'Giảm 40k Mắm Tép Gia Viễn',
  'Giảm 40.000 VND cho mỗi đơn mua mắm tép Gia Viễn (OCOP 4 sao). Giá tối thiểu 150k. Mỗi khách 2 lần.',
  'fixed_amount',
  40000,
  150000,
  1500,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- Công Ty TNHH Rượu Kim Sơn
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000003'::uuid,
  'RUOUKIM30',
  'Giảm 30% Rượu Kim Sơn',
  'Giảm 30% cho mua rượu Kim Sơn (OCOP 4 sao). Tối đa giảm 200k. Giá tối thiểu 200k. Áp dụng cả năm.',
  'percentage',
  30,
  200000,
  1000,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- Làng Nghề Thêu Ren Văn Lâm
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000004'::uuid,
  'THEUREM20',
  'Giảm 20% Thêu Ren Văn Lâm',
  'Giảm 20% cho mua tranh thêu, khăn, lót bàn, quà lưu niệm thêu ren Văn Lâm. Giá tối thiểu 300k. Không giới hạn lần sử dụng.',
  'percentage',
  20,
  300000,
  5000,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- HTX Mật Ong Rừng Nho Quan
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000005'::uuid,
  'MATONG35',
  'Giảm 35% Mật Ong Nho Quan',
  'Giảm 35% cho mua mật ong rừng Nho Quan (OCOP 4 sao). Tối đa giảm 150k. Giá tối thiểu 150k. Áp dụng cả năm.',
  'percentage',
  35,
  150000,
  800,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- ============================================================
-- RESTAURANT VOUCHERS
-- ============================================================

-- Nhà Hàng Dê Núi Cố Đô
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000006'::uuid,
  'DENUICO25',
  'Giảm 25% Dê Núi Cố Đô',
  'Giảm 25% cho các món ăn tại Nhà Hàng Dê Núi Cố Đô. Bao gồm tái dê, dê xào, lòng dê nướng. Giá tối thiểu 500k. Tối đa giảm 300k.',
  'percentage',
  25,
  500000,
  1500,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- Nhà Hàng Cơm Cháy Tam Cốc
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000008'::uuid,
  'COMCHAY25',
  'Giảm 25% Cơm Cháy Tam Cốc',
  'Giảm 25% cho các bữa ăn tại Nhà Hàng Cơm Cháy Tam Cốc. Bao gồm cơm cháy, dê núi, rau sắng. Giá tối thiểu 400k. Tối đa giảm 250k.',
  'percentage',
  25,
  400000,
  2000,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- ============================================================
-- TOURISM & TRAVEL COMPANY VOUCHERS
-- ============================================================

-- Công Ty Du Lịch Tràng An Xanh
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000007'::uuid,
  'TRANGAN20',
  'Giảm 20% Tour Tràng An',
  'Giảm 20% cho tất cả các tour du lịch của Công Ty Du Lịch Tràng An Xanh. Bao gồm tour 1 ngày, tour lưu trú. Giá tối thiểu 1 triệu. Tối đa giảm 500k.',
  'percentage',
  20,
  1000000,
  1500,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
),
(
  '550ba000-e29b-41d4-a716-000000000007'::uuid,
  'TOURGROUPS25',
  'Giảm 25% Tour Nhóm Tràng An',
  'Giảm 25% cho các tour nhóm từ 10 người trở lên. Giá tối thiểu 5 triệu. Tối đa giảm 1 triệu. Cần đặt trước 7 ngày.',
  'percentage',
  25,
  5000000,
  500,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- Công Ty TNHH Du Lịch Tâm Linh Bái Đính
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000009'::uuid,
  'BAIDINH25',
  'Giảm 25% Tour Bái Đính',
  'Giảm 25% cho các tour Chùa Bái Đính của Công Ty Du Lịch Tâm Linh Bái Đính. Bao gồm tour 1 ngày, tour lưu trú, tour lễ Phật Đản. Giá tối thiểu 800k.',
  'percentage',
  25,
  800000,
  1200,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
),
(
  '550ba000-e29b-41d4-a716-000000000009'::uuid,
  'BUDDHATEM30',
  'Giảm 30% Lễ Phật Đản',
  'Giảm 30% cho các tour tham dự Lễ Phật Đản tại Chùa Bái Đính (tháng 5). Giá tối thiểu 600k. Tối đa giảm 300k. Cần đặt trước 14 ngày.',
  'percentage',
  30,
  600000,
  800,
  '2026-04-15'::TIMESTAMP,
  '2026-05-31'::TIMESTAMP,
  true,
  NOW()
);

-- ============================================================
-- SPECIALTY PRODUCT STORE VOUCHERS
-- ============================================================

-- Cửa Hàng Đặc Sản Ninh Bình Sạch
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000010'::uuid,
  'DACSANGIF100',
  'Giảm 100k Đặc Sản Ninh Bình',
  'Giảm 100.000 VND cho mỗi đơn mua đặc sản tại Cửa Hàng Đặc Sản Ninh Bình Sạch. Áp dụng cho cơm cháy, mắm tép, rượu Kim Sơn, mật ong, bánh gai, etc. Giá tối thiểu 300k.',
  'fixed_amount',
  100000,
  300000,
  1500,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
),
(
  '550ba000-e29b-41d4-a716-000000000010'::uuid,
  'DACSANSET15',
  'Giảm 15% Gói Quà Đặc Sản',
  'Giảm 15% cho gói quà kết hợp đặc sản (cơm cháy + mắm tép + rượu + mật ong). Giá tối thiểu 800k. Hoàn hảo cho quà tặng, tặng công ty.',
  'percentage',
  15,
  800000,
  2000,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
),
(
  '550ba000-e29b-41d4-a716-000000000010'::uuid,
  'SOUVENIRPACK20',
  'Giảm 20% Gói Lưu Niệm',
  'Giảm 20% cho gói lưu niệm đa dạng: đặc sản, thêu ren, bánh, candy, nước hoa. Giá tối thiểu 500k. Tối đa giảm 200k. Bao gồm lưu niệm từ cửa hàng đối tác.',
  'percentage',
  20,
  500000,
  1200,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

-- ============================================================
-- COMBO & PACKAGE VOUCHERS (Multi-business)
-- ============================================================

-- Package Tour + Eat + Shop
INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000007'::uuid,
  'FULLDAY50',
  'Giảm 50% Gói Full Day - Tour + Ăn + Mua',
  'Gói combo Full Day bao gồm: Tour Tràng An (Công Ty Du Lịch Tràng An) + Ăn cơm cháy/dê (Nhà Hàng Cố Đô) + Mua đặc sản (Cửa Hàng). Giảm 50% tổng giá. Giá tối thiểu 2 triệu. Cần đặt trước 7 ngày.',
  'percentage',
  50,
  2000000,
  500,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

INSERT INTO vouchers (business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
VALUES (
  '550ba000-e29b-41d4-a716-000000000009'::uuid,
  'SPIRITUAL3DAYS35',
  'Giảm 35% Tour 3 Ngày Tâm Linh - Bái Đính + Cố Đô + Mua Đặc Sản',
  'Tour 3 ngày tâm linh bao gồm: Chùa Bái Đính + Cố Đô Hoa Lư + ăn dê núi + mua đặc sản OCOP. Giảm 35% tổng giá tour. Giá tối thiểu 3 triệu. Tối đa giảm 1.5 triệu.',
  'percentage',
  35,
  3000000,
  400,
  '2026-01-01'::TIMESTAMP,
  '2026-12-31'::TIMESTAMP,
  true,
  NOW()
);

COMMIT;
