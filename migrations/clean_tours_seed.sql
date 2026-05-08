BEGIN;

DO $$
DECLARE
  missing_names text;
BEGIN
  SELECT string_agg(required.name_vi, ', ' ORDER BY required.name_vi)
  INTO missing_names
  FROM unnest(ARRAY[
    'Bến thuyền Tràng An',
    'Hang Sáng',
    'Hang Tối',
    'Hang Nấu Rượu',
    'Hành cung Vũ Lâm',
    'Đường lên Hang Múa',
    'Cố đô Hoa Lư',
    'Đền Vua Đinh',
    'Đền Vua Lê',
    'Chùa Bái Đính cổ',
    'Đền Trình',
    'Bến thuyền Trung tâm Tam Cốc',
    'Tam Cốc',
    'Đền Thái Vi'
  ]) AS required(name_vi)
  WHERE NOT EXISTS (
    SELECT 1
    FROM tourism_spots ts
    WHERE ts.name_vi = required.name_vi
      AND ts.status = 'active'
  );

  IF missing_names IS NOT NULL THEN
    RAISE EXCEPTION 'Missing active tourism_spots: %', missing_names;
  END IF;
END $$;

DELETE FROM tour_packages;

INSERT INTO tour_packages (
  id,
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
  status,
  is_featured,
  published_at,
  rating_avg,
  rating_count
) VALUES
(
  '550ea000-e29b-41d4-a716-100000000001',
  '37',
  'Tour Tràng An - Hang Múa - Cố đô Hoa Lư 1 ngày',
  'Trang An - Hang Mua - Hoa Lu Ancient Capital Day Tour',
  'tour-trang-an-hang-mua-hoa-lu-1-ngay',
  'Lịch trình 1 ngày kết nối các điểm nổi bật đang có trong hệ thống: bến thuyền Tràng An, các hang tiêu biểu, Hành cung Vũ Lâm, Hang Múa và Cố đô Hoa Lư.',
  1,
  950000,
  25,
  '["Vé tham quan theo lịch trình", "Hướng dẫn viên", "Nước uống", "Xe đưa đón trong lịch trình"]'::jsonb,
  '["Chi phí cá nhân", "Bữa ăn ngoài chương trình", "VAT"]'::jsonb,
  'Bến thuyền Tràng An',
  'Cố đô Hoa Lư',
  NULL,
  'published',
  TRUE,
  NOW(),
  0,
  0
),
(
  '550ea000-e29b-41d4-a716-100000000002',
  '37',
  'Tour Bái Đính - Tam Cốc - Đền Thái Vi 2 ngày 1 đêm',
  'Bai Dinh - Tam Coc - Thai Vi Temple 2D1N Tour',
  'tour-bai-dinh-tam-coc-den-thai-vi-2n1d',
  'Lịch trình 2 ngày đi qua các điểm active có sẵn: Chùa Bái Đính cổ, Đền Trình, bến thuyền Tam Cốc, Tam Cốc và Đền Thái Vi.',
  2,
  1850000,
  20,
  '["Vé tham quan theo lịch trình", "Hướng dẫn viên", "Xe đưa đón trong lịch trình", "1 đêm lưu trú tiêu chuẩn"]'::jsonb,
  '["Chi phí cá nhân", "Phụ thu phòng đơn", "VAT"]'::jsonb,
  'Chùa Bái Đính cổ',
  'Đền Thái Vi',
  NULL,
  'published',
  TRUE,
  NOW(),
  0,
  0
);

WITH stop_mapping(tour_package_id, day_number, stop_order, spot_name, description_vi, planned_duration_min) AS (
  VALUES
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 1, 'Bến thuyền Tràng An', 'Khởi hành tại bến thuyền Tràng An, nhận vé và nghe giới thiệu tuyến tham quan.', 45),
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 2, 'Hang Sáng', 'Đi thuyền qua Hang Sáng, trải nghiệm cảnh quan núi đá vôi và mặt nước Tràng An.', 35),
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 3, 'Hang Tối', 'Tiếp tục tuyến hang nước Tràng An, tham quan Hang Tối.', 35),
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 4, 'Hang Nấu Rượu', 'Dừng tham quan Hang Nấu Rượu và nghe giới thiệu về dấu tích văn hóa địa phương.', 30),
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 5, 'Hành cung Vũ Lâm', 'Tham quan Hành cung Vũ Lâm trong quần thể danh thắng Tràng An.', 40),
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 6, 'Đường lên Hang Múa', 'Leo núi Hang Múa, ngắm toàn cảnh Tam Cốc - Tràng An từ trên cao.', 90),
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 7, 'Cố đô Hoa Lư', 'Khép lại lịch trình tại khu di tích Cố đô Hoa Lư.', 60),
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 8, 'Đền Vua Đinh', 'Tham quan Đền Vua Đinh trong khu di tích Hoa Lư.', 35),
    ('550ea000-e29b-41d4-a716-100000000001'::uuid, 1, 9, 'Đền Vua Lê', 'Tham quan Đền Vua Lê trước khi kết thúc tour.', 35),

    ('550ea000-e29b-41d4-a716-100000000002'::uuid, 1, 1, 'Chùa Bái Đính cổ', 'Khởi hành tham quan Chùa Bái Đính cổ và không gian tâm linh trên núi.', 120),
    ('550ea000-e29b-41d4-a716-100000000002'::uuid, 1, 2, 'Đền Trình', 'Dừng tại Đền Trình, tìm hiểu điểm mở đầu trong hành trình tâm linh.', 45),
    ('550ea000-e29b-41d4-a716-100000000002'::uuid, 2, 1, 'Bến thuyền Trung tâm Tam Cốc', 'Bắt đầu ngày thứ hai tại bến thuyền trung tâm Tam Cốc.', 45),
    ('550ea000-e29b-41d4-a716-100000000002'::uuid, 2, 2, 'Tam Cốc', 'Đi thuyền Tam Cốc, tham quan cảnh quan sông nước và núi đá vôi.', 120),
    ('550ea000-e29b-41d4-a716-100000000002'::uuid, 2, 3, 'Đền Thái Vi', 'Tham quan Đền Thái Vi trước khi kết thúc lịch trình.', 60)
)
INSERT INTO tour_package_stops (
  tour_package_id,
  day_number,
  stop_order,
  spot_id,
  title_vi,
  description_vi,
  planned_duration_min
)
SELECT
  m.tour_package_id,
  m.day_number,
  m.stop_order,
  ts.id,
  ts.name_vi,
  m.description_vi,
  m.planned_duration_min
FROM stop_mapping m
JOIN tourism_spots ts
  ON ts.name_vi = m.spot_name
 AND ts.status = 'active';

COMMIT;
