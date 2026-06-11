-- =====================================================================
-- Seed: Doanh nghiệp vận hành điểm du lịch "Khu du lịch Tam Chúc"
-- Mục tiêu: tạo 1 spot_operator business gắn với spot "Chùa Tam Chúc"
--           (spot duy nhất có nhiều ảnh 360 / has_vr_360 = TRUE),
--           kèm dữ liệu dashboard thật đầy đủ (services, ratings,
--           user_visit_history, business_activity_reports, vouchers).
--
-- An toàn: backup vào schema data_backups, idempotent (DELETE trước
--          INSERT, UUID cố định), chạy trong MỘT transaction. Trigger
--          tính rating của spot được tắt tạm thời để bulk-insert nhanh
--          và được tính lại 1 lần ở cuối -> không làm tụt rating_count.
--
-- Dữ liệu thật tham chiếu:
--   spot  Chùa Tam Chúc : b1111111-1111-4111-8111-111111111120 (tỉnh 37)
--                         has_vr_360 = TRUE, 13 scene 360 active,
--                         capacity hiện tại 10.600/106% (overloaded),
--                         rating hiển thị 4.75 / 1250.
--   admin           : f4f1919a-bc43-4266-8f7c-89045c58cd86
--   department (NB) : ff134c2d-5841-4181-8feb-395d14239930
--   operator mẫu    : trangan.site.operator@gmail.com (clone password_hash)
--
-- Định danh cố định:
--   user     : 550aa000-e29b-41d4-a716-000000000030  (tamchuc.site.operator@gmail.com)
--   business : 550ba000-e29b-41d4-a716-000000000030
-- =====================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS data_backups;

-- 0. Backup cấu trúc các bảng bị tác động (chỉ tạo 1 lần)
CREATE TABLE IF NOT EXISTS data_backups.businesses_before_tamchuc_operator_20260611 AS SELECT * FROM businesses WHERE FALSE;
CREATE TABLE IF NOT EXISTS data_backups.services_before_tamchuc_operator_20260611  AS SELECT * FROM services  WHERE FALSE;

-- Tắt trigger tự tính rating của spot trong suốt phiên seed (sẽ tính lại ở cuối)
ALTER TABLE ratings DISABLE TRIGGER trg_spot_rating_insert;

-- 1. Dọn dữ liệu seed cũ (idempotent) theo đúng thứ tự FK
DELETE FROM business_activity_reports WHERE business_id = '550ba000-e29b-41d4-a716-000000000030';
DELETE FROM vouchers                  WHERE business_id = '550ba000-e29b-41d4-a716-000000000030';
DELETE FROM ratings                   WHERE spot_id = 'b1111111-1111-4111-8111-111111111120'
                                          OR business_id = '550ba000-e29b-41d4-a716-000000000030';
DELETE FROM user_visit_history        WHERE spot_id = 'b1111111-1111-4111-8111-111111111120'
                                          AND source = 'seed_tamchuc';
DELETE FROM services                  WHERE business_id = '550ba000-e29b-41d4-a716-000000000030';
DELETE FROM businesses                WHERE id = '550ba000-e29b-41d4-a716-000000000030';
DELETE FROM auth.users                WHERE id = '550aa000-e29b-41d4-a716-000000000030'
                                          OR email = 'tamchuc.site.operator@gmail.com';

-- 2. User vận hành Tam Chúc (clone password_hash từ operator Tràng An)
INSERT INTO auth.users (
    id, role_id, email, password_hash, full_name,
    province_code, is_active, is_verified, created_at, updated_at
)
SELECT
    '550aa000-e29b-41d4-a716-000000000030', 4,
    'tamchuc.site.operator@gmail.com', u.password_hash, 'Vận hành Tam Chúc',
    '37', TRUE, TRUE, NOW() - INTERVAL '120 days', NOW()
FROM auth.users u
WHERE u.email = 'trangan.site.operator@gmail.com'
LIMIT 1;

-- 3. Business spot_operator "Ban quản lý Khu du lịch Tam Chúc"
INSERT INTO businesses (
    id, owner_id, province_code, business_name, business_code, tax_id,
    license_number, business_type, description_vi, phone, email,
    address_vi, geom, status, approved_by, approved_at,
    rating_avg, rating_count, created_at, updated_at
) VALUES (
    '550ba000-e29b-41d4-a716-000000000030',
    '550aa000-e29b-41d4-a716-000000000030',
    '37',
    'Ban quản lý Khu du lịch Tam Chúc',
    'QL-TAM-CHUC', '3700001030', 'VT-NB-2026-030',
    'spot_operator',
    'Ban quản lý vận hành hoạt động tham quan, điều phối thuyền/xe điện và khai thác trải nghiệm thực tế ảo VR 360 tại Khu du lịch tâm linh Tam Chúc.',
    '0226 3868 999', 'tamchuc.site.operator@gmail.com',
    'Khu du lịch Tam Chúc, thị trấn Ba Sao, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.813644, 20.570221), 4326),
    'approved', 'f4f1919a-bc43-4266-8f7c-89045c58cd86', NOW() - INTERVAL '120 days',
    4.75, 18, NOW() - INTERVAL '120 days', NOW()
);

-- 4. Services gắn business -> spot Chùa Tam Chúc (nguồn managed_spots của dashboard)
INSERT INTO services (business_id, spot_id, service_name_vi, service_name_en, category, description_vi, price_from, price_to, currency, unit, is_active)
VALUES
('550ba000-e29b-41d4-a716-000000000030', 'b1111111-1111-4111-8111-111111111120',
 'Dịch vụ vé tham quan Khu du lịch Tam Chúc', 'Tam Chuc Sightseeing Ticket', 'spot_operator',
 'Vé tham quan tổng thể quần thể chùa Tam Chúc.', 90000, 90000, 'VND', 'vé', TRUE),
('550ba000-e29b-41d4-a716-000000000030', 'b1111111-1111-4111-8111-111111111120',
 'Dịch vụ thuyền & xe điện tham quan Tam Chúc', 'Tam Chuc Boat & Electric Car', 'spot_operator',
 'Dịch vụ thuyền tham quan hồ Tam Chúc và xe điện trung chuyển.', 200000, 270000, 'VND', 'lượt', TRUE),
('550ba000-e29b-41d4-a716-000000000030', 'b1111111-1111-4111-8111-111111111120',
 'Trải nghiệm tham quan thực tế ảo VR 360 Tam Chúc', 'Tam Chuc VR 360 Experience', 'spot_operator',
 'Trải nghiệm tham quan 360 độ các điện thờ và cảnh quan Tam Chúc qua nền tảng số.', 0, 0, 'VND', 'lượt', TRUE);

-- 5. Ratings THẬT cho spot Chùa Tam Chúc (published) — đủ 1250 dòng khớp số đang hiển thị,
--    phân bố sao để trung bình ~4.75 (16/20 = 5*, 3/20 = 4*, 1/20 = 3*).
--    user_id luân phiên qua các tài khoản hiện có (FK hợp lệ).
INSERT INTO ratings (user_id, spot_id, stars, title, content, status, is_verified_visit, helpful_count, visit_date, created_at, updated_at)
SELECT
    (ARRAY[
        '50637b3e-0a86-4795-96d6-608391a2b59a',
        '9a3f422e-1564-44f6-ac33-2f15bd2e65a3',
        '872e4d6e-158e-45f5-b760-390321a30c01',
        'ff134c2d-5841-4181-8feb-395d14239930',
        'c722a96e-24ad-4cea-89cd-5882573724f3',
        'd01b2107-83ae-4abb-ab29-9f24ef286876',
        'f4f1919a-bc43-4266-8f7c-89045c58cd86'
    ]::uuid[])[1 + (g % 7)],
    'b1111111-1111-4111-8111-111111111120',
    CASE WHEN (g % 20) < 16 THEN 5 WHEN (g % 20) < 19 THEN 4 ELSE 3 END,
    CASE (g % 5)
        WHEN 0 THEN 'Cảnh quan tuyệt đẹp'
        WHEN 1 THEN 'Không gian tâm linh thanh tịnh'
        WHEN 2 THEN 'Đáng để ghé thăm'
        WHEN 3 THEN 'Trải nghiệm VR 360 ấn tượng'
        ELSE 'Chuyến đi đáng nhớ'
    END,
    CASE (g % 4)
        WHEN 0 THEN 'Quần thể chùa rộng lớn, kiến trúc hoành tráng, đi thuyền trên hồ rất thư giãn.'
        WHEN 1 THEN 'Dịch vụ xe điện và thuyền tổ chức tốt, nhân viên thân thiện.'
        WHEN 2 THEN 'Tham quan 360 độ trước khi đi thực tế rất tiện, hình ảnh sắc nét.'
        ELSE 'Cảnh đẹp, không khí trong lành, phù hợp cho cả gia đình.'
    END,
    'published', TRUE, (g % 30),
    (DATE '2026-06-01' - ((g * 7) % 360))::date,
    NOW() - (((g * 7) % 360) || ' days')::interval,
    NOW() - (((g * 7) % 360) || ' days')::interval
FROM generate_series(1, 1250) AS g;

-- 6. Ratings cấp doanh nghiệp (business_id set, spot_id NULL) — 18 dòng, ~4.75 sao
INSERT INTO ratings (user_id, business_id, stars, title, content, status, is_verified_visit, helpful_count, created_at, updated_at)
SELECT
    (ARRAY[
        '50637b3e-0a86-4795-96d6-608391a2b59a',
        '9a3f422e-1564-44f6-ac33-2f15bd2e65a3',
        '872e4d6e-158e-45f5-b760-390321a30c01'
    ]::uuid[])[1 + (g % 3)],
    '550ba000-e29b-41d4-a716-000000000030',
    CASE WHEN (g % 4) = 0 THEN 4 ELSE 5 END,
    'Ban quản lý chuyên nghiệp',
    'Tổ chức vận hành tham quan quy củ, hỗ trợ du khách nhanh chóng.',
    'published', TRUE, (g % 10),
    NOW() - ((g * 5) || ' days')::interval,
    NOW() - ((g * 5) || ' days')::interval
FROM generate_series(1, 18) AS g;

-- 7. user_visit_history cho spot Tam Chúc — trải đều 01/2026 -> 10/06/2026 (3 lượt/ngày)
--    để dashboard dựng biểu đồ trend lượt khách theo tháng.
INSERT INTO user_visit_history (user_id, spot_id, visited_at, platform, source)
SELECT
    (ARRAY[
        '50637b3e-0a86-4795-96d6-608391a2b59a',
        '9a3f422e-1564-44f6-ac33-2f15bd2e65a3',
        '872e4d6e-158e-45f5-b760-390321a30c01',
        'ff134c2d-5841-4181-8feb-395d14239930'
    ]::uuid[])[1 + (g % 4)],
    'b1111111-1111-4111-8111-111111111120',
    d + ((g * 5 + 7) || ' hours')::interval,
    (ARRAY['android', 'ios', 'web'])[1 + (g % 3)],
    'seed_tamchuc'
FROM generate_series(DATE '2026-01-01', DATE '2026-06-10', INTERVAL '1 day') AS d
CROSS JOIN generate_series(0, 2) AS g;

-- 8. business_activity_reports tháng 1..5/2026 (approved) -> reported_metrics phần dùng chung
INSERT INTO business_activity_reports (
    id, business_id, report_period, period_from, period_to,
    total_revenue_vnd, total_bookings, total_visitors, avg_capacity_pct,
    notes, status, submitted_by, reviewed_by, reviewed_at, created_at, updated_at
) VALUES
('550cd000-e29b-41d4-a716-000000000301', '550ba000-e29b-41d4-a716-000000000030', 'month', '2026-01-01', '2026-01-31', 6800000000, 42000, 96000, 72.00, 'Báo cáo hoạt động Khu du lịch Tam Chúc tháng 01/2026', 'approved', '550aa000-e29b-41d4-a716-000000000030', 'ff134c2d-5841-4181-8feb-395d14239930', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000302', '550ba000-e29b-41d4-a716-000000000030', 'month', '2026-02-01', '2026-02-28', 9500000000, 61000, 138000, 91.00, 'Cao điểm lễ hội đầu xuân tháng 02/2026', 'approved', '550aa000-e29b-41d4-a716-000000000030', 'ff134c2d-5841-4181-8feb-395d14239930', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000303', '550ba000-e29b-41d4-a716-000000000030', 'month', '2026-03-01', '2026-03-31', 8100000000, 53000, 121000, 84.00, 'Lượng khách hành hương ổn định tháng 03/2026', 'approved', '550aa000-e29b-41d4-a716-000000000030', 'ff134c2d-5841-4181-8feb-395d14239930', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000304', '550ba000-e29b-41d4-a716-000000000030', 'month', '2026-04-01', '2026-04-30', 5400000000, 36000, 82000, 64.00, 'Báo cáo hoạt động tháng 04/2026', 'approved', '550aa000-e29b-41d4-a716-000000000030', 'ff134c2d-5841-4181-8feb-395d14239930', NOW(), NOW(), NOW()),
('550cd000-e29b-41d4-a716-000000000305', '550ba000-e29b-41d4-a716-000000000030', 'month', '2026-05-01', '2026-05-31', 5900000000, 39000, 89000, 68.00, 'Báo cáo hoạt động tháng 05/2026', 'approved', '550aa000-e29b-41d4-a716-000000000030', 'ff134c2d-5841-4181-8feb-395d14239930', NOW(), NOW(), NOW());

-- 9. Vouchers cho business
INSERT INTO vouchers (id, business_id, code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, used_count, valid_from, valid_until, is_active, created_at)
VALUES
('550cc000-e29b-41d4-a716-000000000301', '550ba000-e29b-41d4-a716-000000000030', 'TAMCHUC15', 'Giảm 15% combo thuyền + xe điện', 'Ưu đãi 15% cho combo dịch vụ thuyền và xe điện tham quan Tam Chúc.', 'percentage', 15, 300000, 500, 132, NOW() - INTERVAL '30 days', NOW() + INTERVAL '150 days', TRUE, NOW()),
('550cc000-e29b-41d4-a716-000000000302', '550ba000-e29b-41d4-a716-000000000030', 'VR360TC', 'Miễn phí trải nghiệm VR 360', 'Tặng lượt trải nghiệm thực tế ảo VR 360 khi mua vé tham quan.', 'fixed', 0, 90000, 1000, 410, NOW() - INTERVAL '20 days', NOW() + INTERVAL '160 days', TRUE, NOW());

-- 10. Tính lại rating tổng hợp cho spot Tam Chúc (vì trigger đang tắt) rồi bật lại trigger
UPDATE tourism_spots ts
SET rating_avg   = sub.avg_stars,
    rating_count = sub.cnt,
    updated_at   = NOW()
FROM (
    SELECT ROUND(AVG(stars)::numeric, 2) AS avg_stars, COUNT(*)::int AS cnt
    FROM ratings
    WHERE spot_id = 'b1111111-1111-4111-8111-111111111120' AND status = 'published'
) sub
WHERE ts.id = 'b1111111-1111-4111-8111-111111111120';

ALTER TABLE ratings ENABLE TRIGGER trg_spot_rating_insert;

COMMIT;

-- =====================================================================
-- Kiểm tra nhanh sau khi chạy (chạy tay nếu cần):
--   SELECT business_name, business_type, status FROM businesses WHERE id='550ba000-e29b-41d4-a716-000000000030';
--   SELECT COUNT(*) FROM services WHERE business_id='550ba000-e29b-41d4-a716-000000000030';
--   SELECT rating_avg, rating_count FROM tourism_spots WHERE id='b1111111-1111-4111-8111-111111111120';
-- =====================================================================
