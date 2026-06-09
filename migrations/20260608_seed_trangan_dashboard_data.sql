SET search_path TO public, auth, vn_units;

BEGIN;

-- 1. Backup tables before modifications
CREATE TABLE IF NOT EXISTS data_backups.businesses_before_trangan_seeding_20260608 AS
SELECT * FROM businesses WHERE province_code = '37';

CREATE TABLE IF NOT EXISTS data_backups.services_before_trangan_seeding_20260608 AS
SELECT * FROM services;

-- 2. Create Spot Operator Business for Vận hành Tràng An (trangan.site.operator@gmail.com)
-- ID: 550ba000-e29b-41d4-a716-000000000013
DELETE FROM services WHERE business_id = '550ba000-e29b-41d4-a716-000000000013';
DELETE FROM businesses WHERE id = '550ba000-e29b-41d4-a716-000000000013';

INSERT INTO businesses (id, owner_id, province_code, business_name, business_code, tax_id, license_number, business_type, description_vi, phone, email, address_vi, status, approved_by, approved_at, created_at, updated_at)
VALUES (
    '550ba000-e29b-41d4-a716-000000000013',
    'c722a96e-24ad-4cea-89cd-5882573724f3', -- Vận hành Tràng An user ID
    '37', -- Ninh Bình
    'Ban quản lý Quần thể danh thắng Tràng An',
    'QL-TRANG-AN',
    '3700001013',
    'VT-NB-2026-013',
    'spot_operator',
    'Ban quản lý vận hành hoạt động tham quan, điều phối đò và bảo tồn Di sản văn hóa và thiên nhiên thế giới Quần thể danh thắng Tràng An.',
    '0229 3862 888',
    'trangan.site.operator@gmail.com',
    'Khu du lịch sinh thái Tràng An, Trường Yên, Hoa Lư, Ninh Bình',
    'approved',
    'f4f1919a-bc43-4266-8f7c-89045c58cd86',
    NOW(),
    NOW(),
    NOW()
);

-- 3. Create Services for the Spot Operator Business linking to Tràng An spots
INSERT INTO services (business_id, spot_id, service_name_vi, category, price_from, price_to, currency, is_active)
VALUES 
('550ba000-e29b-41d4-a716-000000000013', 'b208242f-b022-4472-b8dd-0b25d27f1c99', 'Dịch vụ đò tham quan danh thắng Tràng An', 'spot_operator', 250000, 250000, 'VND', TRUE),
('550ba000-e29b-41d4-a716-000000000013', '179dbcbd-bc1d-422c-8588-050728111b1e', 'Dịch vụ bến thuyền Tràng An', 'spot_operator', 250000, 250000, 'VND', TRUE),
('550ba000-e29b-41d4-a716-000000000013', 'aeee9098-9540-4068-ab06-bc5faf0ecf8a', 'Dịch vụ vé tham quan Khu du lịch sinh thái Tràng An', 'spot_operator', 250000, 250000, 'VND', TRUE);

-- 4. Clone ratings of Tràng An/Vân Long spots to businesses (setting spot_id to NULL to avoid constraint violation)
DELETE FROM ratings WHERE spot_id IS NULL AND business_id IN (
    '550ba000-e29b-41d4-a716-000000000013',
    'e7a5a7ad-6e1a-4d71-8baf-eafe7a6812ed',
    '6b2ec58f-941f-47f3-bd76-ffb176e74b5c'
);

-- Clone ratings for Tràng An Site Operator business
INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '550ba000-e29b-41d4-a716-000000000013', stars, title, content, status, created_at, updated_at 
FROM ratings WHERE spot_id IN ('179dbcbd-bc1d-422c-8588-050728111b1e', 'aeee9098-9540-4068-ab06-bc5faf0ecf8a');

-- Clone ratings for Lữ hành Tràng An businesses (Vân Long spot)
INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, 'e7a5a7ad-6e1a-4d71-8baf-eafe7a6812ed', stars, title, content, status, created_at, updated_at 
FROM ratings WHERE spot_id = 'ab632684-bc10-4750-ad0f-fc04ccc715d1';

INSERT INTO ratings (id, user_id, spot_id, business_id, stars, title, content, status, created_at, updated_at)
SELECT gen_random_uuid(), user_id, NULL, '6b2ec58f-941f-47f3-bd76-ffb176e74b5c', stars, title, content, status, created_at, updated_at 
FROM ratings WHERE spot_id = 'ab632684-bc10-4750-ad0f-fc04ccc715d1';

-- 5. Seed Vouchers (using unique codes: QLTA26, LHTA10, TAX15)
DELETE FROM vouchers WHERE id IN (
    '550cc000-e29b-41d4-a716-000000000013',
    '550cc000-e29b-41d4-a716-000000000014',
    '550cc000-e29b-41d4-a716-000000000015'
);

-- Ban quản lý Tràng An
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES 
('550cc000-e29b-41d4-a716-000000000013', '550ba000-e29b-41d4-a716-000000000013', 'QLTA26', 'Ưu đãi 20k vé đò học sinh', 'Giảm 20.000 VND trực tiếp cho các đoàn học sinh, sinh viên tham quan.', 'fixed', 20000, 1000000, 1000, 85, NOW() - INTERVAL '30 days', NOW() + INTERVAL '180 days', TRUE, NOW());

-- Lữ hành Tràng An (e7a5a7ad-6e1a-4d71-8baf-eafe7a6812ed)
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES 
('550cc000-e29b-41d4-a716-000000000014', 'e7a5a7ad-6e1a-4d71-8baf-eafe7a6812ed', 'LHTA10', 'Giảm 10% Tour Vân Long', 'Ưu đãi giảm giá 10% cho khách hàng đặt tour Vân Long trọn gói.', 'percentage', 10, 500000, 200, 24, NOW() - INTERVAL '10 days', NOW() + INTERVAL '120 days', TRUE, NOW());

-- Công ty TNHH Du lịch Tràng An Xanh (6b2ec58f-941f-47f3-bd76-ffb176e74b5c)
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES 
('550cc000-e29b-41d4-a716-000000000015', '6b2ec58f-941f-47f3-bd76-ffb176e74b5c', 'TAX15', 'Giảm 15% đặt tour sớm', 'Giảm giá 15% khi đặt tour tham quan Vân Long trước 15 ngày.', 'percentage', 15, 800000, 150, 12, NOW() - INTERVAL '10 days', NOW() + INTERVAL '120 days', TRUE, NOW());

-- 6. Seed business activity reports for the new Ban quản lý Tràng An business
DELETE FROM business_activity_reports WHERE id IN (
    '550cd000-e29b-41d4-a716-000000000013',
    '550cd000-e29b-41d4-a716-000000000014',
    '550cd000-e29b-41d4-a716-000000000015',
    '550cd000-e29b-41d4-a716-000000000016'
);

INSERT INTO business_activity_reports (id, business_id, report_period, period_from, period_to, total_revenue_vnd, total_bookings, total_visitors, avg_capacity_pct, notes, status, submitted_by, reviewed_by, reviewed_at, created_at, updated_at)
VALUES 
('550cd000-e29b-41d4-a716-000000000013', '550ba000-e29b-41d4-a716-000000000013', 'month', '2026-03-01', '2026-03-31', 2500000000, 5000, 20000, 60.00, 'Báo cáo hoạt động bán vé đò Tràng An tháng 3 năm 2026', 'approved', 'c722a96e-24ad-4cea-89cd-5882573724f3', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000014', '550ba000-e29b-41d4-a716-000000000013', 'month', '2026-04-01', '2026-04-30', 3200000000, 6500, 26000, 75.00, 'Báo cáo hoạt động bán vé đò Tràng An tháng 4 năm 2026', 'approved', 'c722a96e-24ad-4cea-89cd-5882573724f3', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000015', '550ba000-e29b-41d4-a716-000000000013', 'month', '2026-05-01', '2026-05-31', 2800000000, 5800, 23200, 68.00, 'Báo cáo hoạt động bán vé đò Tràng An tháng 5 năm 2026', 'approved', 'c722a96e-24ad-4cea-89cd-5882573724f3', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000016', '550ba000-e29b-41d4-a716-000000000013', 'month', '2026-06-01', '2026-06-30', 3500000000, 7200, 28800, 82.00, 'Báo cáo hoạt động bán vé đò Tràng An tháng 6 năm 2026', 'approved', 'c722a96e-24ad-4cea-89cd-5882573724f3', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW(), NOW(), NOW());

-- 7. Update max capacity configs for Tràng An spots
UPDATE tourism_spots SET max_capacity = 5000 WHERE id = '179dbcbd-bc1d-422c-8588-050728111b1e'; -- Bến thuyền Tràng An
UPDATE tourism_spots SET max_capacity = 10000 WHERE id = 'b208242f-b022-4472-b8dd-0b25d27f1c99'; -- Tràng An
UPDATE tourism_spots SET max_capacity = 8000 WHERE id = 'aeee9098-9540-4068-ab06-bc5faf0ecf8a'; -- Khu du lịch sinh thái Tràng An

COMMIT;
