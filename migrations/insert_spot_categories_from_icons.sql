-- ============================================================
-- MIGRATION: Insert spot_categories from local icon set
-- Source icons: public/uploads/images
-- Parent groups:
--   1. Du lịch tự nhiên
--   2. Du lịch văn hóa
--   3. Cơ sở vật chất kỹ thuật
-- Notes:
--   - Idempotent via ON CONFLICT (code) DO UPDATE.
--   - icon_url uses relative path: uploads/images/<file_name>.
--   - Ambiguous/non-tourism icons are inserted as inactive
--     under "Cơ sở vật chất kỹ thuật" for business review.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PARENT CATEGORIES
-- ============================================================
INSERT INTO spot_categories (code, name_vi, name_en, icon_url, color_hex, sort_order, is_active)
VALUES
  ('du-lich-tu-nhien', 'Du lịch tự nhiên', 'Nature Tourism', 'uploads/images/nature_reserve.svg', '#16A34A', 1, TRUE),
  ('du-lich-van-hoa', 'Du lịch văn hóa', 'Cultural Tourism', 'uploads/images/historical_site.svg', '#D97706', 2, TRUE),
  ('co-so-vat-chat-ky-thuat', 'Cơ sở vật chất kỹ thuật', 'Tourism Infrastructure & Facilities', 'uploads/images/tourist_area.svg', '#2563EB', 3, TRUE)
ON CONFLICT (code) DO UPDATE SET
  parent_id  = NULL,
  name_vi    = EXCLUDED.name_vi,
  name_en    = EXCLUDED.name_en,
  icon_url   = EXCLUDED.icon_url,
  color_hex  = EXCLUDED.color_hex,
  sort_order = EXCLUDED.sort_order,
  is_active  = EXCLUDED.is_active;

-- ============================================================
-- 2. CHILD CATEGORIES
-- ============================================================
WITH parent_ids AS (
  SELECT
    MAX(id) FILTER (WHERE code = 'du-lich-tu-nhien') AS natural_id,
    MAX(id) FILTER (WHERE code = 'du-lich-van-hoa') AS cultural_id,
    MAX(id) FILTER (WHERE code = 'co-so-vat-chat-ky-thuat') AS facility_id
  FROM spot_categories
  WHERE code IN (
    'du-lich-tu-nhien',
    'du-lich-van-hoa',
    'co-so-vat-chat-ky-thuat'
  )
), child_rows AS (
  -- Du lịch tự nhiên
  SELECT natural_id AS parent_id, 'bien' AS code, 'Biển' AS name_vi, 'Beach' AS name_en, 'uploads/images/beach.svg' AS icon_url, '#0EA5E9' AS color_hex, 1 AS sort_order, TRUE AS is_active FROM parent_ids
  UNION ALL SELECT natural_id, 'hang-dong', 'Hang động', 'Cave', 'uploads/images/cave.svg', '#7C3AED', 2, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'rung', 'Rừng', 'Forest', 'uploads/images/forest.svg', '#15803D', 3, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'ho', 'Hồ', 'Lake', 'uploads/images/lake.svg', '#0284C7', 4, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'suoi-khoang', 'Suối khoáng', 'Mineral Spring', 'uploads/images/mineral source.svg', '#06B6D4', 5, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'nui', 'Núi', 'Mountain', 'uploads/images/mountain.svg', '#65A30D', 6, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'vuon-quoc-gia', 'Vườn quốc gia', 'National Park', 'uploads/images/national_park.svg', '#166534', 7, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'khu-bao-ton-thien-nhien', 'Khu bảo tồn thiên nhiên', 'Nature Reserve', 'uploads/images/nature_reserve.svg', '#047857', 8, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'cong-vien', 'Công viên', 'Park', 'uploads/images/park.svg', '#22C55E', 9, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'deo', 'Đèo', 'Mountain Pass', 'uploads/images/pass.svg', '#84CC16', 10, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'song-suoi', 'Sông, suối', 'River & Stream', 'uploads/images/river_stream.svg', '#0891B2', 11, TRUE FROM parent_ids
  UNION ALL SELECT natural_id, 'thac-nuoc', 'Thác nước', 'Waterfall', 'uploads/images/waterfall.svg', '#38BDF8', 12, TRUE FROM parent_ids

  -- Du lịch văn hóa
  UNION ALL SELECT cultural_id, 'thanh-co', 'Thành cổ', 'Ancient Citadel', 'uploads/images/ancient_citadel.svg', '#B45309', 1, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'thap-co', 'Tháp cổ', 'Ancient Tower', 'uploads/images/ancient_tower.svg', '#A16207', 2, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'thap-cham', 'Tháp Chăm', 'Cham Tower', 'uploads/images/cham_tower.svg', '#92400E', 3, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'nha-tho', 'Nhà thờ', 'Church', 'uploads/images/church.svg', '#CA8A04', 4, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'le-hoi-nghi-le', 'Lễ hội, nghi lễ', 'Festival & Ceremony', 'uploads/images/festival_ceremony.svg', '#EA580C', 5, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'di-tich-lich-su', 'Di tích lịch sử', 'Historical Site', 'uploads/images/historical_site.svg', '#DC2626', 6, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'lang-den-tuong-niem', 'Lăng, đền tưởng niệm', 'Mausoleum & Memorial', 'uploads/images/mausoleum.svg', '#991B1B', 7, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'bao-tang', 'Bảo tàng', 'Museum', 'uploads/images/museum.svg', '#9333EA', 8, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'den-chua', 'Đền, chùa', 'Temple & Pagoda', 'uploads/images/temple_pagoda.svg', '#F59E0B', 9, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'nha-hat-nha-van-hoa', 'Nhà hát, nhà văn hóa', 'Theater & Cultural House', 'uploads/images/theater_cultural_house.svg', '#DB2777', 10, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'lang-nghe-truyen-thong', 'Làng nghề truyền thống', 'Traditional Craft Village', 'uploads/images/traditional_village.svg', '#795548', 11, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'lang-que', 'Làng quê', 'Village', 'uploads/images/village.svg', '#78716C', 12, TRUE FROM parent_ids
  UNION ALL SELECT cultural_id, 'thu-vien', 'Thư viện', 'Library', 'uploads/images/library.svg', '#4F46E5', 13, TRUE FROM parent_ids

  -- Cơ sở vật chất kỹ thuật
  UNION ALL SELECT facility_id, 'san-bay', 'Sân bay', 'Airport', 'uploads/images/airport.svg', '#2563EB', 1, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'ngan-hang', 'Ngân hàng', 'Bank', 'uploads/images/bank.svg', '#0F766E', 2, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'nha-thuyen', 'Nhà thuyền', 'Boathouse', 'uploads/images/boathouse.svg', '#0284C7', 3, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'cau', 'Cầu', 'Bridge', 'uploads/images/bridge.svg', '#64748B', 4, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'ben-xe', 'Bến xe', 'Bus Station', 'uploads/images/bus_station.svg', '#475569', 5, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'rap-chieu-phim', 'Rạp chiếu phim', 'Cinema', 'uploads/images/cinema.svg', '#7C3AED', 6, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'cau-lac-bo', 'Câu lạc bộ', 'Club', 'uploads/images/club.svg', '#DB2777', 7, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'pha', 'Phà', 'Ferry', 'uploads/images/ferry.svg', '#0891B2', 8, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'san-golf', 'Sân golf', 'Golf Course', 'uploads/images/golf.svg', '#16A34A', 9, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'cang-ben-cang', 'Cảng, bến cảng', 'Harbor & Port', 'uploads/images/harbor_port.svg', '#0369A1', 10, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'benh-vien', 'Bệnh viện', 'Hospital', 'uploads/images/hospital.svg', '#DC2626', 11, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'khach-san', 'Khách sạn', 'Hotel', 'uploads/images/hotel.svg', '#9333EA', 12, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'cho', 'Chợ', 'Market', 'uploads/images/market.svg', '#F97316', 13, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'buu-dien', 'Bưu điện', 'Post Office', 'uploads/images/post_office.svg', '#EAB308', 14, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'khu-nghi-duong', 'Khu nghỉ dưỡng', 'Resort', 'uploads/images/resort.svg', '#14B8A6', 15, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'nha-hang', 'Nhà hàng', 'Restaurant', 'uploads/images/restaurant.svg', '#EF4444', 16, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'cang-bien', 'Cảng biển', 'Seaport', 'uploads/images/seaport.svg', '#0E7490', 17, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'cua-hang-luu-niem', 'Cửa hàng lưu niệm', 'Souvenir Shop', 'uploads/images/souvenir_shop.svg', '#EC4899', 18, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'trung-tam-the-thao', 'Trung tâm thể thao', 'Sports Center', 'uploads/images/sports_center.svg', '#22C55E', 19, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'san-van-dong', 'Sân vận động', 'Stadium', 'uploads/images/stadium.svg', '#4ADE80', 20, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'sieu-thi', 'Siêu thị', 'Supermarket', 'uploads/images/supermarket.svg', '#F59E0B', 21, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'khu-du-lich', 'Khu du lịch', 'Tourist Area', 'uploads/images/tourist_area.svg', '#2563EB', 22, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'ga-tau', 'Ga tàu', 'Train Station', 'uploads/images/train_station.svg', '#334155', 23, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'cong-ty-du-lich', 'Công ty du lịch', 'Travel Company', 'uploads/images/travel_company.svg', '#0D9488', 24, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'vuon-thu', 'Vườn thú', 'Zoo', 'uploads/images/zoo.svg', '#65A30D', 25, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'cua-khau', 'Cửa khẩu', 'Border Gate', 'uploads/images/border_gate.svg', '#64748B', 26, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'thap-vien-thong', 'Tháp viễn thông', 'Communication Tower', 'uploads/images/communication_tower.svg', '#64748B', 27, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'dai-su-quan-lanh-su-quan', 'Đại sứ quán, lãnh sự quán', 'Embassy & Consulate', 'uploads/images/embassy_consulate.svg', '#64748B', 28, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'khu-cong-nghiep', 'Khu công nghiệp', 'Industrial Zone', 'uploads/images/industrial_zone.svg', '#64748B', 29, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'khu-dan-cu', 'Khu dân cư', 'Residential Area', 'uploads/images/residential_area.svg', '#64748B', 30, TRUE FROM parent_ids
  UNION ALL SELECT facility_id, 'truong-hoc', 'Trường học', 'School', 'uploads/images/school.svg', '#64748B', 31, TRUE FROM parent_ids
)
INSERT INTO spot_categories (parent_id, code, name_vi, name_en, icon_url, color_hex, sort_order, is_active)
SELECT parent_id, code, name_vi, name_en, icon_url, color_hex, sort_order, is_active
FROM child_rows
ON CONFLICT (code) DO UPDATE SET
  parent_id  = EXCLUDED.parent_id,
  name_vi    = EXCLUDED.name_vi,
  name_en    = EXCLUDED.name_en,
  icon_url   = EXCLUDED.icon_url,
  color_hex  = EXCLUDED.color_hex,
  sort_order = EXCLUDED.sort_order,
  is_active  = EXCLUDED.is_active;

-- Keep SERIAL sequence safe after inserts/updates.
SELECT setval(
  'spot_categories_id_seq',
  COALESCE((SELECT MAX(id) FROM spot_categories), 1),
  TRUE
);

COMMIT;
