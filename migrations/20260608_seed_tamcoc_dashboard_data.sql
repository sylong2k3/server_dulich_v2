SET search_path TO public, auth, vn_units;

BEGIN;

-- 1. Backup tables
CREATE SCHEMA IF NOT EXISTS data_backups;

CREATE TABLE IF NOT EXISTS data_backups.ratings_before_tamcoc_seeding_20260608 AS
SELECT * FROM ratings;

CREATE TABLE IF NOT EXISTS data_backups.vouchers_before_tamcoc_seeding_20260608 AS
SELECT * FROM vouchers;

CREATE TABLE IF NOT EXISTS data_backups.ocop_before_tamcoc_seeding_20260608 AS
SELECT * FROM ocop_products;

CREATE TABLE IF NOT EXISTS data_backups.spots_before_tamcoc_seeding_20260608 AS
SELECT * FROM tourism_spots;

-- 2. Clone ratings to business_id (setting spot_id to NULL to satisfy check constraint ratings_target)
-- Clean any previous cloned records if they exist to avoid duplicate keys on rerun
DELETE FROM ratings WHERE spot_id IS NULL AND business_id IN (
    'a30ac047-d7c8-4beb-a481-637f429ad06c',
    '550ba000-e29b-41d4-a716-000000000008',
    '295e24d5-c574-462e-bf59-345947412345',
    '6c6de155-675f-4f5c-90df-718240fe50a7',
    '550ba000-e29b-41d4-a716-000000000004',
    '550ba000-e29b-41d4-a716-000000000009',
    '2399ecbb-51d3-40be-b7bb-76f8020f841f',
    '550ba000-e29b-41d4-a716-000000000002',
    '550ba000-e29b-41d4-a716-000000000003',
    '550ba000-e29b-41d4-a716-000000000010',
    '550ba000-e29b-41d4-a716-000000000005',
    '550ba000-e29b-41d4-a716-000000000007',
    '9d9b1066-a944-4949-89a8-30f6b0502bad'
);

-- Clone ratings for target spots to businesses
INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, 'a30ac047-d7c8-4beb-a481-637f429ad06c', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = '1e393854-2a47-4d01-8679-4fef6b0d6765';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000008', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = 'b41fc495-e247-4bfd-8795-0eefa8ea70ee';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '295e24d5-c574-462e-bf59-345947412345', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = '1c7dff3b-7855-4478-a24b-f5998c17aa60';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '6c6de155-675f-4f5c-90df-718240fe50a7', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = '5adc4eae-320b-413f-892c-c9f08a2d6007';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000004', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = '00f39716-754c-48e3-a254-2f5f5d8593be';

-- Clone ratings for other 1-to-1 spots to businesses
INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000009', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = 'bf23dd39-7f14-4c70-893d-584bb616f4a0';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '2399ecbb-51d3-40be-b7bb-76f8020f841f', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = '7ffaf2c5-a665-4795-8fc3-8e5ec9060b4d';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000002', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = '33514304-3e28-433a-91e6-36b1385919fc';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000003', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = 'c42f8a59-1d20-4eb7-a859-eaf04ef051fa';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000010', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = 'f72921e4-5faa-426d-9f69-d9587e35a9d8';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000005', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = 'bb0ae9ba-9613-4a2d-8975-63a775e503dc';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000007', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = 'aeee9098-9540-4068-ab06-bc5faf0ecf8a';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '9d9b1066-a944-4949-89a8-30f6b0502bad', stars, title, content, status, created_at, updated_at FROM ratings WHERE spot_id = '45f85023-1702-429e-aaec-7ad41b429a8b';

-- 3. Seed some additional high-quality ratings (spot_id must be NULL)
-- Emeralda Tam Cốc Resort ratings
INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
VALUES 
('295e24d5-c574-462e-bf59-000000000001', NULL, NULL, '295e24d5-c574-462e-bf59-345947412345', 5, 'Resort tuyệt hảo', 'Khuôn viên tuyệt đẹp, không gian yên tĩnh và trong lành. Phòng ốc sang trọng chuẩn 5 sao.', 'published', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('295e24d5-c574-462e-bf59-000000000002', NULL, NULL, '295e24d5-c574-462e-bf59-345947412345', 5, 'Dịch vụ hoàn hảo', 'Nhân viên cực kỳ thân thiện và chu đáo. Đồ ăn sáng phong phú, hồ bơi rất sạch.', 'published', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('295e24d5-c574-462e-bf59-000000000003', NULL, NULL, '295e24d5-c574-462e-bf59-345947412345', 4, 'Trải nghiệm đáng nhớ', 'Không gian nghỉ dưỡng tuyệt vời cho gia đình, tuy nhiên giá đồ ăn tối hơi cao một chút.', 'published', NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days');

-- Tam Cốc Lamontagne Resort & spa ratings
INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
VALUES 
('6c6de155-675f-4f5c-90df-000000000001', NULL, NULL, '6c6de155-675f-4f5c-90df-718240fe50a7', 5, 'Khách sạn rất đẹp', 'View nhìn thẳng ra cánh đồng lúa rất thơ mộng. Nhân viên phục vụ rất nhiệt tình.', 'published', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('6c6de155-675f-4f5c-90df-000000000002', NULL, NULL, '6c6de155-675f-4f5c-90df-718240fe50a7', 4, 'Ấm cúng & Tiện nghi', 'Phòng ốc sạch sẽ, spa thư giãn rất tốt, vị trí thuận lợi đi các điểm xung quanh.', 'published', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Làng Nghề Thêu Ren Văn Lâm ratings
INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
VALUES 
('550ba000-e29b-41d4-a716-000000000041', NULL, NULL, '550ba000-e29b-41d4-a716-000000000004', 5, 'Tranh thêu cực kỳ đẹp', 'Được tận mắt xem các nghệ nhân thêu tranh rất tỉ mỉ. Sản phẩm thêu tay tinh xảo, đậm đà bản sắc.', 'published', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550ba000-e29b-41d4-a716-000000000042', NULL, NULL, '550ba000-e29b-41d4-a716-000000000004', 4, 'Nét văn hóa độc đáo', 'Nên ghé thăm làng nghề để mua các món đồ thêu ren thủ công làm quà lưu niệm.', 'published', NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days');

-- 4. Align unlinked OCOP Products to correct business owners
UPDATE ocop_products SET business_id = '550ba000-e29b-41d4-a716-000000000003' WHERE id IN ('550cb000-e29b-41d4-a716-000000000008', '550cb000-e29b-41d4-a716-000000000011'); -- Giỏ Cói Mỹ Nghệ Kim Sơn, Muối Hạt Kim Sơn -> Rượu Kim Sơn
UPDATE ocop_products SET business_id = '550ba000-e29b-41d4-a716-000000000010' WHERE id IN ('550cb000-e29b-41d4-a716-000000000010', '550cb000-e29b-41d4-a716-000000000009', '550cb000-e29b-41d4-a716-000000000007'); -- Bánh Gai, Trà Hoa Sen, Nem Chua -> Đặc Sản Ninh Bình Sạch
UPDATE ocop_products SET business_id = '550ba000-e29b-41d4-a716-000000000005' WHERE id = '550cb000-e29b-41d4-a716-000000000012'; -- Tinh Dầu Tràm -> Mật Ong Rừng Nho Quan

-- Insert new OCOP product for Nhà Hàng Cơm Cháy Tam Cốc
DELETE FROM ocop_products WHERE id = '550cb000-e29b-41d4-a716-000000000020';
INSERT INTO ocop_products (id, business_id, name_vi, name_en, category, description_vi, star_rating, price_vnd, is_active, spot_id, province_code, created_at, updated_at)
VALUES (
    '550cb000-e29b-41d4-a716-000000000020',
    '550ba000-e29b-41d4-a716-000000000008', -- Nhà Hàng Cơm Cháy Tam Cốc
    'Cơm cháy dê núi Tam Cốc',
    'Tam Coc Mountain Goat Crispy Rice',
    'Sản phẩm từ lúa gạo',
    'Cơm cháy truyền thống giòn rụm kết hợp với chà bông từ thịt dê núi Ninh Bình thơm ngon đặc trưng.',
    4,
    90000,
    TRUE,
    'b41fc495-e247-4bfd-8795-0eefa8ea70ee', -- Tam Cốc spot
    '37', -- Ninh Bình province code
    NOW(),
    NOW()
);

-- 5. Seed vouchers for target businesses
-- Delete existing seed vouchers if any to prevent duplicates
DELETE FROM vouchers WHERE id IN (
    '550cc000-e29b-41d4-a716-000000000001',
    '550cc000-e29b-41d4-a716-000000000002',
    '550cc000-e29b-41d4-a716-000000000003',
    '550cc000-e29b-41d4-a716-000000000004',
    '550cc000-e29b-41d4-a716-000000000005',
    '550cc000-e29b-41d4-a716-000000000006'
);

-- Trung tâm dịch vụ du lịch Tam Cốc
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES 
('550cc000-e29b-41d4-a716-000000000001', 'a30ac047-d7c8-4beb-a481-637f429ad06c', 'TAMCOC10', 'Giảm 10% vé đò Tam Cốc', 'Giảm 10% trực tiếp trên tổng tiền vé đò tham quan Tam Cốc - Bích Động.', 'percentage', 10, 200000, 500, 32, NOW() - INTERVAL '30 days', NOW() + INTERVAL '180 days', TRUE, NOW()),
('550cc000-e29b-41d4-a716-000000000002', 'a30ac047-d7c8-4beb-a481-637f429ad06c', 'TAMCOC50K', 'Giảm 50k cho nhóm đông', 'Giảm 50.000 VND cho đoàn từ 4 vé đò trở lên.', 'fixed', 50000, 600000, 200, 15, NOW() - INTERVAL '30 days', NOW() + INTERVAL '180 days', TRUE, NOW());

-- Emeralda Tam Cốc Resort
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES 
('550cc000-e29b-41d4-a716-000000000003', '295e24d5-c574-462e-bf59-345947412345', 'EMERALDA15', 'Giảm 15% đặt phòng trực tiếp', 'Ưu đãi giảm giá 15% cho khách hàng đặt phòng trực tiếp qua hệ thống.', 'percentage', 15, 2000000, 100, 5, NOW() - INTERVAL '10 days', NOW() + INTERVAL '120 days', TRUE, NOW());

-- Tam Cốc Lamontagne Resort & spa
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES 
('550cc000-e29b-41d4-a716-000000000004', '6c6de155-675f-4f5c-90df-718240fe50a7', 'LAMONTAGNE10', 'Giảm 10% dịch vụ Spa', 'Giảm giá 10% cho tất cả các liệu trình chăm sóc sức khỏe tại Spa của resort.', 'percentage', 10, 400000, 150, 18, NOW() - INTERVAL '10 days', NOW() + INTERVAL '120 days', TRUE, NOW());

-- Nhà Hàng Cơm Cháy Tam Cốc
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES 
('550cc000-e29b-41d4-a716-000000000005', '550ba000-e29b-41d4-a716-000000000008', 'COMCHAY50K', 'Giảm 50k cho bàn từ 500k', 'Khuyến mãi giảm ngay 50.000 VND trên hóa đơn ăn uống từ 500k trở lên.', 'fixed', 50000, 500000, 300, 42, NOW() - INTERVAL '30 days', NOW() + INTERVAL '180 days', TRUE, NOW());

-- Làng Nghề Thêu Ren Văn Lâm
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES 
('550cc000-e29b-41d4-a716-000000000006', '550ba000-e29b-41d4-a716-000000000004', 'VANLAM15', 'Giảm 15% quà lưu niệm', 'Giảm 15% cho hóa đơn mua sắm tranh thêu tay lưu niệm từ 300k.', 'percentage', 15, 300000, 100, 11, NOW() - INTERVAL '15 days', NOW() + INTERVAL '150 days', TRUE, NOW());

-- 6. Seed business activity reports for Emeralda Tam Cốc Resort and Tam Cốc Lamontagne Resort & spa
-- Delete existing reports if any to prevent duplicates
DELETE FROM business_activity_reports WHERE id IN (
    '550cd000-e29b-41d4-a716-000000000001',
    '550cd000-e29b-41d4-a716-000000000002',
    '550cd000-e29b-41d4-a716-000000000003',
    '550cd000-e29b-41d4-a716-000000000004',
    '550cd000-e29b-41d4-a716-000000000005',
    '550cd000-e29b-41d4-a716-000000000006',
    '550cd000-e29b-41d4-a716-000000000007',
    '550cd000-e29b-41d4-a716-000000000008'
);

-- Emeralda Tam Cốc Resort reports
INSERT INTO business_activity_reports (id, business_id, report_period, period_from, period_to, total_revenue_vnd, total_bookings, total_visitors, avg_capacity_pct, notes, status, submitted_by, reviewed_by, reviewed_at, created_at, updated_at)
VALUES 
('550cd000-e29b-41d4-a716-000000000001', '295e24d5-c574-462e-bf59-345947412345', 'month', '2026-03-01', '2026-03-31', 1500000000, 300, 800, 75.00, 'Báo cáo hoạt động kinh doanh tháng 3 năm 2026 của Emeralda Tam Cốc Resort', 'approved', '872e4d6e-158e-45f5-b760-390321a30c01', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000002', '295e24d5-c574-462e-bf59-345947412345', 'month', '2026-04-01', '2026-04-30', 1800000000, 350, 950, 85.00, 'Báo cáo hoạt động kinh doanh tháng 4 năm 2026 của Emeralda Tam Cốc Resort', 'approved', '872e4d6e-158e-45f5-b760-390321a30c01', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000003', '295e24d5-c574-462e-bf59-345947412345', 'month', '2026-05-01', '2026-05-31', 1600000000, 320, 900, 80.00, 'Báo cáo hoạt động kinh doanh tháng 5 năm 2026 của Emeralda Tam Cốc Resort', 'approved', '872e4d6e-158e-45f5-b760-390321a30c01', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000004', '295e24d5-c574-462e-bf59-345947412345', 'month', '2026-06-01', '2026-06-30', 1900000000, 380, 1050, 90.00, 'Báo cáo hoạt động kinh doanh tháng 6 năm 2026 của Emeralda Tam Cốc Resort', 'approved', '872e4d6e-158e-45f5-b760-390321a30c01', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW());

-- Tam Cốc Lamontagne Resort & spa reports
INSERT INTO business_activity_reports (id, business_id, report_period, period_from, period_to, total_revenue_vnd, total_bookings, total_visitors, avg_capacity_pct, notes, status, submitted_by, reviewed_by, reviewed_at, created_at, updated_at)
VALUES 
('550cd000-e29b-41d4-a716-000000000005', '6c6de155-675f-4f5c-90df-718240fe50a7', 'month', '2026-03-01', '2026-03-31', 800000000, 200, 500, 65.00, 'Báo cáo hoạt động kinh doanh tháng 3 năm 2026 của Tam Cốc Lamontagne Resort & spa', 'approved', '872e4d6e-158e-45f5-b760-390321a30c01', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000006', '6c6de155-675f-4f5c-90df-718240fe50a7', 'month', '2026-04-01', '2026-04-30', 950000000, 240, 600, 75.00, 'Báo cáo hoạt động kinh doanh tháng 4 năm 2026 của Tam Cốc Lamontagne Resort & spa', 'approved', '872e4d6e-158e-45f5-b760-390321a30c01', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000007', '6c6de155-675f-4f5c-90df-718240fe50a7', 'month', '2026-05-01', '2026-05-31', 900000000, 220, 550, 70.00, 'Báo cáo hoạt động kinh doanh tháng 5 năm 2026 của Tam Cốc Lamontagne Resort & spa', 'approved', '872e4d6e-158e-45f5-b760-390321a30c01', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000008', '6c6de155-675f-4f5c-90df-718240fe50a7', 'month', '2026-06-01', '2026-06-30', 1100000000, 280, 700, 80.00, 'Báo cáo hoạt động kinh doanh tháng 6 năm 2026 của Tam Cốc Lamontagne Resort & spa', 'approved', '872e4d6e-158e-45f5-b760-390321a30c01', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW());

-- 7. Update max capacity configs and seed live capacity logs
UPDATE tourism_spots SET max_capacity = 400 WHERE id = '1c7dff3b-7855-4478-a24b-f5998c17aa60'; -- Emeralda Tam Cốc Resort
UPDATE tourism_spots SET max_capacity = 300 WHERE id = '5adc4eae-320b-413f-892c-c9f08a2d6007'; -- Tam Cốc Lamontagne Resort & spa
UPDATE tourism_spots SET max_capacity = 2000 WHERE id = '1e393854-2a47-4d01-8679-4fef6b0d6765'; -- Bến thuyền Trung tâm Tam Cốc
UPDATE tourism_spots SET max_capacity = 3000 WHERE id = 'b41fc495-e247-4bfd-8795-0eefa8ea70ee'; -- Tam Cốc

-- Seed capacity log for Làng nghề thêu ren Văn Lâm to resolve NULL capacity
-- First clean previous logs if any on the same timestamp to make rerun safe
DELETE FROM capacity_logs WHERE spot_id = '00f39716-754c-48e3-a254-2f5f5d8593be' AND data_source = 'manual' AND recorded_by = '872e4d6e-158e-45f5-b760-390321a30c01';

INSERT INTO capacity_logs (spot_id, recorded_at, visitor_count, capacity_pct, status, data_source, recorded_by)
VALUES (
    '00f39716-754c-48e3-a254-2f5f5d8593be',
    NOW(),
    450,
    30.00,
    'normal',
    'manual',
    '872e4d6e-158e-45f5-b760-390321a30c01'
);

COMMIT;
