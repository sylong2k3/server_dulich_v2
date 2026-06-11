-- =====================================================================
-- Seed/enrich: lấp các thẻ dashboard doanh nghiệp còn trống bằng dữ liệu
--              CÓ CƠ SỞ (lấy theo điểm/dịch vụ mà chính doanh nghiệp quản lý).
--
-- Phạm vi (đã xác minh trực tiếp trên DB live + qua GovernanceService):
--   A. Giá vé (spot_operator → thẻ "Giá vé"):
--      - Chùa Tam Chúc: ticket_price_adult 0 -> 90.000 (khớp giá dịch vụ vé đã seed)
--      - Tràng An & Khu DL sinh thái Tràng An: NULL -> 250.000 (khớp giá dịch vụ đò 250k)
--      - Bến thuyền Tràng An: giữ 100.000
--      => "Giá vé" Tràng An thành khoảng 100.000–250.000 (thật, có ý nghĩa).
--   B. Tour (travel_company → toàn bộ thẻ tour):
--      - "Công Ty Du Lịch Tràng An Xanh" (lu_hanh, 550ba000…0007): 0 tour -> 5 tour Tràng An/Hoa Lư
--      - "Công ty TNHH Du lịch Tràng An Xanh" (tour, 6b2ec58f…): 0 tour -> 4 tour Vân Long sinh thái
--      Cả 2 thuộc user trangan.heritage.travel@gmail.com (9a3f422e…), cùng tỉnh 37.
--
-- An toàn: backup vào schema data_backups; idempotent (UUID/slug cố định,
--          DELETE trước INSERT); chạy trong MỘT transaction; read/update tham số rõ ràng.
-- Lưu ý: cập nhật tourism_spots.ticket_price_adult cũng ảnh hưởng trang chi tiết
--        điểm công khai (không chỉ dashboard) — đây là chủ ý.
-- =====================================================================

SET search_path TO public, auth, vn_units;

BEGIN;

CREATE SCHEMA IF NOT EXISTS data_backups;

-- 0. Backup các bảng bị tác động (chỉ tạo 1 lần, lưu nguyên trạng các bản ghi liên quan)
CREATE TABLE IF NOT EXISTS data_backups.spots_ticket_before_enrich_20260611 AS
SELECT id, name_vi, ticket_price_adult, ticket_price_child, ticket_currency, updated_at
FROM tourism_spots
WHERE id IN (
    'b1111111-1111-4111-8111-111111111120', -- Chùa Tam Chúc
    'b208242f-b022-4472-b8dd-0b25d27f1c99',  -- Tràng An
    '179dbcbd-bc1d-422c-8588-050728111b1e',  -- Bến thuyền Tràng An
    'aeee9098-9540-4068-ab06-bc5faf0ecf8a'   -- Khu du lịch sinh thái Tràng An
);

CREATE TABLE IF NOT EXISTS data_backups.tour_packages_before_enrich_20260611 AS
SELECT * FROM tour_packages
WHERE business_id IN ('550ba000-e29b-41d4-a716-000000000007', '6b2ec58f-941f-47f3-bd76-ffb176e74b5c');

-- =====================================================================
-- A. GIÁ VÉ (Giá vé) — chỉ cập nhật đúng các spot do operator quản lý
-- =====================================================================

-- Chùa Tam Chúc: 0 -> 90.000 (vé tham quan tổng thể, khớp dịch vụ vé đã seed)
UPDATE tourism_spots
SET ticket_price_adult = 90000,
    ticket_price_child = 45000,
    ticket_currency    = 'VND',
    updated_at         = NOW()
WHERE id = 'b1111111-1111-4111-8111-111111111120';

-- Tràng An (đò chính) & Khu du lịch sinh thái Tràng An: NULL -> 250.000 (khớp dịch vụ đò 250k)
UPDATE tourism_spots
SET ticket_price_adult = 250000,
    ticket_price_child = 120000,
    ticket_currency    = 'VND',
    updated_at         = NOW()
WHERE id IN (
    'b208242f-b022-4472-b8dd-0b25d27f1c99',
    'aeee9098-9540-4068-ab06-bc5faf0ecf8a'
);

-- Bến thuyền Tràng An: giữ nguyên 100.000, chỉ bổ sung giá vé trẻ em đang NULL
UPDATE tourism_spots
SET ticket_price_child = 50000,
    ticket_currency    = 'VND',
    updated_at         = NOW()
WHERE id = '179dbcbd-bc1d-422c-8588-050728111b1e';

-- =====================================================================
-- B. TOUR (travel_company) — tạo tour thật cho 2 công ty đang có 0 tour
-- =====================================================================

-- Dọn dữ liệu seed cũ (idempotent) theo đúng UUID cố định
DELETE FROM tour_packages WHERE id IN (
    '550ea000-e29b-41d4-a716-200000000001',
    '550ea000-e29b-41d4-a716-200000000002',
    '550ea000-e29b-41d4-a716-200000000003',
    '550ea000-e29b-41d4-a716-200000000004',
    '550ea000-e29b-41d4-a716-200000000005',
    '550ea000-e29b-41d4-a716-300000000001',
    '550ea000-e29b-41d4-a716-300000000002',
    '550ea000-e29b-41d4-a716-300000000003',
    '550ea000-e29b-41d4-a716-300000000004'
);

-- B1. "Công Ty Du Lịch Tràng An Xanh" (lu_hanh) — cụm Tràng An / Hoa Lư
INSERT INTO tour_packages (
    id, business_id, province_code, name_vi, name_en, slug, description_vi,
    duration_days, price_from_vnd, max_guests, includes, excludes,
    start_location_vi, end_location_vi, rating_avg, rating_count,
    status, is_featured, published_at, created_at, updated_at
) VALUES
('550ea000-e29b-41d4-a716-200000000001', '550ba000-e29b-41d4-a716-000000000007', '37',
 'Tour Tràng An - Bái Đính 1 ngày', 'Trang An - Bai Dinh Day Tour', 'tax-tour-trang-an-bai-dinh-1-ngay',
 'Tham quan di sản Tràng An đi thuyền và chùa Bái Đính trong ngày, có hướng dẫn viên.',
 1, 850000, 25,
 '["Vé tham quan theo lịch trình","Hướng dẫn viên","Nước uống","Xe đưa đón trong lịch trình"]'::jsonb,
 '["Chi phí cá nhân","Bữa ăn ngoài chương trình","VAT"]'::jsonb,
 'Bến thuyền Tràng An', 'Chùa Bái Đính', 4.72, 58, 'published', TRUE, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', NOW()),

('550ea000-e29b-41d4-a716-200000000002', '550ba000-e29b-41d4-a716-000000000007', '37',
 'Tour Tràng An - Tam Cốc - Hang Múa 1 ngày', 'Trang An - Tam Coc - Mua Cave Day Tour', 'tax-tour-trang-an-tam-coc-hang-mua-1-ngay',
 'Hành trình đi thuyền Tràng An, ngắm lúa Tam Cốc và leo Hang Múa trong một ngày.',
 1, 920000, 25,
 '["Vé tham quan","Hướng dẫn viên","Nước uống","Xe đưa đón trong lịch trình"]'::jsonb,
 '["Chi phí cá nhân","Bữa trưa","VAT"]'::jsonb,
 'Bến thuyền Tràng An', 'Đường lên Hang Múa', 4.80, 71, 'published', TRUE, NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days', NOW()),

('550ea000-e29b-41d4-a716-200000000003', '550ba000-e29b-41d4-a716-000000000007', '37',
 'Tour Cố đô Hoa Lư - Tràng An 1 ngày', 'Hoa Lu - Trang An Day Tour', 'tax-tour-co-do-hoa-lu-trang-an-1-ngay',
 'Khám phá Cố đô Hoa Lư và đi thuyền danh thắng Tràng An trong ngày.',
 1, 690000, 20,
 '["Vé tham quan","Hướng dẫn viên","Nước uống"]'::jsonb,
 '["Chi phí cá nhân","Bữa ăn ngoài chương trình","VAT"]'::jsonb,
 'Cố đô Hoa Lư', 'Bến thuyền Tràng An', 4.61, 39, 'published', FALSE, NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days', NOW()),

('550ea000-e29b-41d4-a716-200000000004', '550ba000-e29b-41d4-a716-000000000007', '37',
 'Tour khám phá Tràng An 2 ngày 1 đêm', 'Trang An Discovery 2D1N', 'tax-tour-kham-pha-trang-an-2n1d',
 'Trải nghiệm trọn vẹn quần thể Tràng An - Hoa Lư - Tam Cốc với 1 đêm lưu trú tiêu chuẩn.',
 2, 1750000, 18,
 '["Vé tham quan","Hướng dẫn viên","Xe đưa đón trong lịch trình","1 đêm lưu trú tiêu chuẩn"]'::jsonb,
 '["Chi phí cá nhân","Phụ thu phòng đơn","VAT"]'::jsonb,
 'Bến thuyền Tràng An', 'Đền Thái Vi', 4.77, 46, 'published', TRUE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW()),

('550ea000-e29b-41d4-a716-200000000005', '550ba000-e29b-41d4-a716-000000000007', '37',
 'Tour Tràng An nửa ngày', 'Trang An Half-day Tour', 'tax-tour-trang-an-nua-ngay',
 'Đi thuyền tham quan các hang động và đền trên tuyến Tràng An trong nửa ngày.',
 1, 480000, 25,
 '["Vé tham quan","Hướng dẫn viên","Nước uống"]'::jsonb,
 '["Chi phí cá nhân","VAT"]'::jsonb,
 'Bến thuyền Tràng An', 'Hành cung Vũ Lâm', 0, 0, 'draft', FALSE, NULL, NOW() - INTERVAL '20 days', NOW());

-- B2. "Công ty TNHH Du lịch Tràng An Xanh" (tour) — cụm sinh thái Vân Long
INSERT INTO tour_packages (
    id, business_id, province_code, name_vi, name_en, slug, description_vi,
    duration_days, price_from_vnd, max_guests, includes, excludes,
    start_location_vi, end_location_vi, rating_avg, rating_count,
    status, is_featured, published_at, created_at, updated_at
) VALUES
('550ea000-e29b-41d4-a716-300000000001', '6b2ec58f-941f-47f3-bd76-ffb176e74b5c', '37',
 'Tour sinh thái Vân Long ngắm Voọc 1 ngày', 'Van Long Eco & Langur Watching Day Tour', 'tnhh-tax-tour-van-long-ngam-vooc-1-ngay',
 'Đi thuyền trên đầm Vân Long ngắm Voọc mông trắng và cảnh quan đất ngập nước.',
 1, 690000, 20,
 '["Vé tham quan","Hướng dẫn viên","Nước uống","Thuyền tham quan"]'::jsonb,
 '["Chi phí cá nhân","Bữa ăn ngoài chương trình","VAT"]'::jsonb,
 'Bến thuyền Vân Long', 'Đầm Vân Long', 4.66, 41, 'published', TRUE, NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days', NOW()),

('550ea000-e29b-41d4-a716-300000000002', '6b2ec58f-941f-47f3-bd76-ffb176e74b5c', '37',
 'Tour Vân Long - Kênh Gà 1 ngày', 'Van Long - Kenh Ga Day Tour', 'tnhh-tax-tour-van-long-kenh-ga-1-ngay',
 'Kết hợp tham quan đầm Vân Long và suối khoáng nóng Kênh Gà trong ngày.',
 1, 760000, 20,
 '["Vé tham quan","Hướng dẫn viên","Nước uống","Thuyền tham quan"]'::jsonb,
 '["Chi phí cá nhân","Bữa trưa","VAT"]'::jsonb,
 'Bến thuyền Vân Long', 'Suối Kênh Gà', 4.58, 33, 'published', FALSE, NOW() - INTERVAL '75 days', NOW() - INTERVAL '75 days', NOW()),

('550ea000-e29b-41d4-a716-300000000003', '6b2ec58f-941f-47f3-bd76-ffb176e74b5c', '37',
 'Tour Vân Long - Động Vân Trình 1 ngày', 'Van Long - Van Trinh Cave Day Tour', 'tnhh-tax-tour-van-long-dong-van-trinh-1-ngay',
 'Tham quan đầm Vân Long và khám phá động Vân Trình kỳ vĩ trong ngày.',
 1, 820000, 18,
 '["Vé tham quan","Hướng dẫn viên","Nước uống","Thuyền tham quan"]'::jsonb,
 '["Chi phí cá nhân","Bữa ăn ngoài chương trình","VAT"]'::jsonb,
 'Bến thuyền Vân Long', 'Động Vân Trình', 4.71, 28, 'published', TRUE, NOW() - INTERVAL '65 days', NOW() - INTERVAL '65 days', NOW()),

('550ea000-e29b-41d4-a716-300000000004', '6b2ec58f-941f-47f3-bd76-ffb176e74b5c', '37',
 'Tour sinh thái Vân Long 2 ngày 1 đêm', 'Van Long Eco 2D1N', 'tnhh-tax-tour-sinh-thai-van-long-2n1d',
 'Nghỉ dưỡng sinh thái Vân Long với 1 đêm lưu trú và trải nghiệm đầm lầy ngập nước.',
 2, 1650000, 16,
 '["Vé tham quan","Hướng dẫn viên","Thuyền tham quan","1 đêm lưu trú tiêu chuẩn"]'::jsonb,
 '["Chi phí cá nhân","Phụ thu phòng đơn","VAT"]'::jsonb,
 'Bến thuyền Vân Long', 'Khu nghỉ Vân Long', 4.63, 22, 'published', FALSE, NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days', NOW());

COMMIT;

-- =====================================================================
-- Kiểm tra nhanh sau khi chạy:
--   SELECT name_vi, ticket_price_adult, ticket_price_child
--   FROM tourism_spots
--   WHERE id IN ('b1111111-1111-4111-8111-111111111120','b208242f-b022-4472-b8dd-0b25d27f1c99',
--                '179dbcbd-bc1d-422c-8588-050728111b1e','aeee9098-9540-4068-ab06-bc5faf0ecf8a');
--   SELECT business_id, COUNT(*) FILTER (WHERE status IN ('published','active')) AS active, COUNT(*) AS total
--   FROM tour_packages
--   WHERE business_id IN ('550ba000-e29b-41d4-a716-000000000007','6b2ec58f-941f-47f3-bd76-ffb176e74b5c')
--   GROUP BY business_id;
-- =====================================================================
