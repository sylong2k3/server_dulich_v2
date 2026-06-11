-- =====================================================================
-- Seed: Sản phẩm OCOP cho 3 đơn vị dịch vụ của user tamcoc.tourism.service@gmail.com
--       (lấp thẻ dashboard "Sản phẩm OCOP = 0").
--
-- Đơn vị & bản chất sản phẩm (đặc sản địa phương bán làm quà — có cơ sở thực tế):
--   - Trung tâm dịch vụ du lịch Tam Cốc (a30ac047…, approved)  -> cơm cháy, trà sen
--   - Emeralda Tam Cốc Resort           (295e24d5…, suspended) -> mật ong, tinh dầu
--   - Tam Cốc Lamontagne Resort & spa   (6c6de155…, pending)   -> trà hoa sen, tinh dầu spa
--   Tất cả province_code = '37'. category dùng mã chuẩn đang có trong DB.
--   star_rating ∈ [3,5] (theo CHECK constraint). is_active = TRUE để hiện trên dashboard.
--
-- An toàn: backup vào data_backups; idempotent (UUID cố định, DELETE trước INSERT);
--          chạy trong MỘT transaction.
-- =====================================================================

SET search_path TO public, auth, vn_units;

BEGIN;

CREATE SCHEMA IF NOT EXISTS data_backups;

-- 0. Backup các bản ghi OCOP liên quan (nếu có) trước khi seed
CREATE TABLE IF NOT EXISTS data_backups.ocop_before_tamcoc_sp_20260611 AS
SELECT * FROM ocop_products
WHERE business_id IN (
    'a30ac047-d7c8-4beb-a481-637f429ad06c',
    '295e24d5-c574-462e-bf59-345947412345',
    '6c6de155-675f-4f5c-90df-718240fe50a7'
);

-- 1. Dọn dữ liệu seed cũ (idempotent) theo UUID cố định
DELETE FROM ocop_products WHERE id IN (
    '550cb000-e29b-41d4-a716-100000000001',
    '550cb000-e29b-41d4-a716-100000000002',
    '550cb000-e29b-41d4-a716-100000000003',
    '550cb000-e29b-41d4-a716-100000000004',
    '550cb000-e29b-41d4-a716-100000000005',
    '550cb000-e29b-41d4-a716-100000000006'
);

-- 2. INSERT sản phẩm OCOP
INSERT INTO ocop_products (
    id, business_id, spot_id, province_code, name_vi, name_en, category,
    description_vi, star_rating, certification_no, certified_at,
    price_vnd, unit, producer_name, is_active, created_at, updated_at
) VALUES
-- Trung tâm dịch vụ du lịch Tam Cốc (approved)
('550cb000-e29b-41d4-a716-100000000001', 'a30ac047-d7c8-4beb-a481-637f429ad06c', NULL, '37',
 'Cơm cháy Ninh Bình Tam Cốc', 'Tam Coc Ninh Binh Crispy Rice', 'thuc_pham',
 'Cơm cháy truyền thống Ninh Bình ăn kèm ruốc và sốt đặc trưng, đóng hộp làm quà.',
 4, 'OCOP-37-2025-TC01', DATE '2025-08-15', 85000, 'hộp 300g',
 'Trung tâm dịch vụ du lịch Tam Cốc', TRUE, NOW(), NOW()),

('550cb000-e29b-41d4-a716-100000000002', 'a30ac047-d7c8-4beb-a481-637f429ad06c', NULL, '37',
 'Trà sen Tràng An', 'Trang An Lotus Tea', 'do_uong',
 'Trà ướp hương sen vùng đầm Ninh Bình, đóng hộp tiện làm quà tặng du lịch.',
 4, 'OCOP-37-2025-TC02', DATE '2025-09-10', 150000, 'hộp 100g',
 'Trung tâm dịch vụ du lịch Tam Cốc', TRUE, NOW(), NOW()),

-- Emeralda Tam Cốc Resort (suspended)
('550cb000-e29b-41d4-a716-100000000003', '295e24d5-c574-462e-bf59-345947412345', NULL, '37',
 'Mật ong rừng Cúc Phương', 'Cuc Phuong Forest Honey', 'thuc_pham',
 'Mật ong rừng nguyên chất khai thác quanh vùng đệm Cúc Phương, bán tại quầy quà resort.',
 4, 'OCOP-37-2025-EM01', DATE '2025-07-20', 180000, 'chai 500ml',
 'Emeralda Tam Cốc Resort', TRUE, NOW(), NOW()),

('550cb000-e29b-41d4-a716-100000000004', '295e24d5-c574-462e-bf59-345947412345', NULL, '37',
 'Tinh dầu sả chanh Ninh Bình', 'Ninh Binh Lemongrass Essential Oil', 'thuoc_và_cskh',
 'Tinh dầu sả chanh chiết xuất tự nhiên, dùng thư giãn và khử mùi, bán tại quầy quà resort.',
 3, 'OCOP-37-2025-EM02', DATE '2025-10-05', 120000, 'lọ 50ml',
 'Emeralda Tam Cốc Resort', TRUE, NOW(), NOW()),

-- Tam Cốc Lamontagne Resort & spa (pending)
('550cb000-e29b-41d4-a716-100000000005', '6c6de155-675f-4f5c-90df-718240fe50a7', NULL, '37',
 'Trà hoa sen Tam Cốc', 'Tam Coc Lotus Flower Tea', 'do_uong',
 'Trà hoa sen sấy lạnh giữ hương, phục vụ và bán làm quà tại khu nghỉ dưỡng.',
 4, 'OCOP-37-2025-LM01', DATE '2025-08-28', 160000, 'hộp 100g',
 'Tam Cốc Lamontagne Resort & spa', TRUE, NOW(), NOW()),

('550cb000-e29b-41d4-a716-100000000006', '6c6de155-675f-4f5c-90df-718240fe50a7', NULL, '37',
 'Tinh dầu thảo mộc spa Ninh Bình', 'Ninh Binh Herbal Spa Essential Oil', 'thuoc_và_cskh',
 'Tinh dầu thảo mộc dùng trong trị liệu spa, chiết xuất từ dược liệu địa phương.',
 4, 'OCOP-37-2025-LM02', DATE '2025-09-30', 200000, 'lọ 50ml',
 'Tam Cốc Lamontagne Resort & spa', TRUE, NOW(), NOW());

COMMIT;

-- =====================================================================
-- Kiểm tra nhanh sau khi chạy:
--   SELECT business_id, COUNT(*) AS ocop, ROUND(AVG(star_rating),1) AS avg_star
--   FROM ocop_products
--   WHERE business_id IN ('a30ac047-d7c8-4beb-a481-637f429ad06c',
--                         '295e24d5-c574-462e-bf59-345947412345',
--                         '6c6de155-675f-4f5c-90df-718240fe50a7')
--   GROUP BY business_id;
-- =====================================================================
