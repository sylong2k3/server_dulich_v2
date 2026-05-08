BEGIN;

DO $$
DECLARE
  missing_slugs text;
BEGIN
  SELECT string_agg(required.slug, ', ' ORDER BY required.slug)
  INTO missing_slugs
  FROM unnest(ARRAY[
    'ben-thuyen-trang-an-ninh-binh',
    'hang-ba-ninh-binh',
    'hang-ba-giot-ninh-binh',
    'hang-ca-ninh-binh',
    'hang-dai-ninh-binh',
    'hang-hai-ninh-binh',
    'hang-lam-ninh-binh',
    'hang-nau-ruou-ninh-binh',
    'hang-quy-hau-ninh-binh',
    'hang-sang-ninh-binh',
    'hang-seo-ninh-binh',
    'hang-son-duong-ninh-binh',
    'hang-toi-ninh-binh',
    'hang-vang-ninh-binh',
    'nui-ngu-dong-ninh-binh',
    'hanh-cung-vu-lam-ninh-binh',
    'ben-thuyen-trung-tam-tam-coc-ninh-binh',
    'tam-coc-ninh-binh',
    'den-thai-vi-ninh-binh',
    'duong-len-hang-mua-ninh-binh',
    'co-do-hoa-lu-ninh-binh',
    'den-vua-dinh-ninh-binh',
    'den-vua-le-ninh-binh',
    'chua-bai-dinh-co-ninh-binh',
    'den-trinh-ninh-binh'
  ]) AS required(slug)
  WHERE NOT EXISTS (
    SELECT 1
    FROM tourism_spots ts
    WHERE ts.slug = required.slug
      AND ts.status = 'active'
  );

  IF missing_slugs IS NOT NULL THEN
    RAISE EXCEPTION 'Missing active tourism_spots slugs: %', missing_slugs;
  END IF;
END $$;

DELETE FROM tour_packages
WHERE slug IN (
  'tour-hang-dong-trang-an-1-ngay',
  'tour-tam-coc-den-thai-vi-hang-mua-1-ngay',
  'tour-hoa-lu-bai-dinh-tam-linh-1-ngay',
  'tour-kham-pha-hang-dong-ninh-binh-2n1d',
  'tour-di-san-trang-an-hoa-lu-tam-coc-3n2d'
);

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
  '550ea000-e29b-41d4-a716-100000000003',
  '37',
  'Tour hang động Tràng An 1 ngày',
  'Trang An Cave Discovery Day Tour',
  'tour-hang-dong-trang-an-1-ngay',
  'Lịch trình tập trung vào cụm hang và điểm tham quan trong quần thể Tràng An.',
  1,
  780000,
  25,
  '["Ve tham quan", "Huong dan vien", "Nuoc uong", "Xe dua don trong lich trinh"]'::jsonb,
  '["Chi phi ca nhan", "Bua an ngoai chuong trinh", "VAT"]'::jsonb,
  'Bến thuyền Tràng An',
  'Hành cung Vũ Lâm',
  NULL,
  'published',
  TRUE,
  NOW(),
  0,
  0
),
(
  '550ea000-e29b-41d4-a716-100000000004',
  '37',
  'Tour Tam Cốc - Đền Thái Vi - Hang Múa 1 ngày',
  'Tam Coc - Thai Vi Temple - Hang Mua Day Tour',
  'tour-tam-coc-den-thai-vi-hang-mua-1-ngay',
  'Lịch trình 1 ngày gồm Tam Cốc, Đền Thái Vi và điểm ngắm cảnh Hang Múa.',
  1,
  890000,
  22,
  '["Ve tham quan", "Thuyen Tam Coc", "Huong dan vien", "Nuoc uong"]'::jsonb,
  '["Chi phi ca nhan", "VAT"]'::jsonb,
  'Bến thuyền Trung tâm Tam Cốc',
  'Đường lên Hang Múa',
  NULL,
  'published',
  FALSE,
  NOW(),
  0,
  0
),
(
  '550ea000-e29b-41d4-a716-100000000005',
  '37',
  'Tour Hoa Lư - Bái Đính tâm linh 1 ngày',
  'Hoa Lu - Bai Dinh Spiritual Day Tour',
  'tour-hoa-lu-bai-dinh-tam-linh-1-ngay',
  'Lịch trình kết nối các điểm văn hóa, lịch sử và tâm linh nổi bật quanh Hoa Lư.',
  1,
  820000,
  30,
  '["Ve tham quan", "Huong dan vien", "Xe dua don trong lich trinh"]'::jsonb,
  '["Chi phi ca nhan", "Bua an ngoai chuong trinh", "VAT"]'::jsonb,
  'Cố đô Hoa Lư',
  'Chùa Bái Đính cổ',
  NULL,
  'published',
  FALSE,
  NOW(),
  0,
  0
),
(
  '550ea000-e29b-41d4-a716-100000000006',
  '37',
  'Tour khám phá hang động Ninh Bình 2 ngày 1 đêm',
  'Ninh Binh Cave Explorer 2D1N Tour',
  'tour-kham-pha-hang-dong-ninh-binh-2n1d',
  'Tour 2 ngày dành cho khách thích hang động và tuyến cảnh quan ít trùng lặp.',
  2,
  1650000,
  18,
  '["Ve tham quan", "Huong dan vien", "Xe dua don trong lich trinh", "1 dem luu tru tieu chuan"]'::jsonb,
  '["Chi phi ca nhan", "Phu thu phong don", "VAT"]'::jsonb,
  'Hang Ba',
  'Núi Ngu Động',
  NULL,
  'published',
  FALSE,
  NOW(),
  0,
  0
),
(
  '550ea000-e29b-41d4-a716-100000000007',
  '37',
  'Tour di sản Tràng An - Hoa Lư - Tam Cốc 3 ngày 2 đêm',
  'Trang An - Hoa Lu - Tam Coc Heritage 3D2N Tour',
  'tour-di-san-trang-an-hoa-lu-tam-coc-3n2d',
  'Lịch trình 3 ngày phù hợp khách muốn đi đầy đủ các cụm điểm chính trong cơ sở dữ liệu hiện có.',
  3,
  2850000,
  18,
  '["Ve tham quan", "Huong dan vien", "Xe dua don trong lich trinh", "2 dem luu tru tieu chuan"]'::jsonb,
  '["Chi phi ca nhan", "Phu thu phong don", "VAT"]'::jsonb,
  'Bến thuyền Tràng An',
  'Đền Thái Vi',
  NULL,
  'published',
  TRUE,
  NOW(),
  0,
  0
);

WITH stop_mapping(tour_package_id, day_number, stop_order, spot_slug, description_vi, planned_duration_min) AS (
  VALUES
    ('550ea000-e29b-41d4-a716-100000000003'::uuid, 1, 1, 'ben-thuyen-trang-an-ninh-binh', 'Check-in va bat dau tuyen tham quan tai ben thuyen Trang An.', 45),
    ('550ea000-e29b-41d4-a716-100000000003'::uuid, 1, 2, 'hang-sang-ninh-binh', 'Di thuyen qua Hang Sang trong cum danh thang Trang An.', 30),
    ('550ea000-e29b-41d4-a716-100000000003'::uuid, 1, 3, 'hang-toi-ninh-binh', 'Tiep tuc kham pha Hang Toi va canh quan nui da voi.', 30),
    ('550ea000-e29b-41d4-a716-100000000003'::uuid, 1, 4, 'hang-nau-ruou-ninh-binh', 'Tham quan Hang Nau Ruou va nghe gioi thieu ve dau tich van hoa.', 30),
    ('550ea000-e29b-41d4-a716-100000000003'::uuid, 1, 5, 'hanh-cung-vu-lam-ninh-binh', 'Dung chan tai Hanh cung Vu Lam truoc khi ket thuc tour.', 50),

    ('550ea000-e29b-41d4-a716-100000000004'::uuid, 1, 1, 'ben-thuyen-trung-tam-tam-coc-ninh-binh', 'Khoi hanh tai ben thuyen trung tam Tam Coc.', 45),
    ('550ea000-e29b-41d4-a716-100000000004'::uuid, 1, 2, 'tam-coc-ninh-binh', 'Di thuyen Tam Coc, ngam canh song nuoc va nui da voi.', 120),
    ('550ea000-e29b-41d4-a716-100000000004'::uuid, 1, 3, 'den-thai-vi-ninh-binh', 'Tham quan Den Thai Vi gan khu Tam Coc.', 60),
    ('550ea000-e29b-41d4-a716-100000000004'::uuid, 1, 4, 'duong-len-hang-mua-ninh-binh', 'Leo Hang Mua va ngam toan canh Tam Coc tu tren cao.', 90),

    ('550ea000-e29b-41d4-a716-100000000005'::uuid, 1, 1, 'co-do-hoa-lu-ninh-binh', 'Bat dau voi khu di tich Co do Hoa Lu.', 70),
    ('550ea000-e29b-41d4-a716-100000000005'::uuid, 1, 2, 'den-vua-dinh-ninh-binh', 'Tham quan Den Vua Dinh va khong gian kien truc co.', 45),
    ('550ea000-e29b-41d4-a716-100000000005'::uuid, 1, 3, 'den-vua-le-ninh-binh', 'Tiep tuc tham quan Den Vua Le trong khu di tich Hoa Lu.', 45),
    ('550ea000-e29b-41d4-a716-100000000005'::uuid, 1, 4, 'den-trinh-ninh-binh', 'Dung chan tai Den Trinh tren hanh trinh tam linh.', 40),
    ('550ea000-e29b-41d4-a716-100000000005'::uuid, 1, 5, 'chua-bai-dinh-co-ninh-binh', 'Ket thuc tour tai Chua Bai Dinh co.', 90),

    ('550ea000-e29b-41d4-a716-100000000006'::uuid, 1, 1, 'hang-ba-ninh-binh', 'Khoi dau hanh trinh kham pha hang dong tai Hang Ba.', 45),
    ('550ea000-e29b-41d4-a716-100000000006'::uuid, 1, 2, 'hang-ba-giot-ninh-binh', 'Tham quan Hang Ba Giot.', 45),
    ('550ea000-e29b-41d4-a716-100000000006'::uuid, 1, 3, 'hang-ca-ninh-binh', 'Tiep tuc lich trinh voi Hang Ca.', 45),
    ('550ea000-e29b-41d4-a716-100000000006'::uuid, 2, 1, 'hang-dai-ninh-binh', 'Ngay thu hai bat dau tai Hang Dai.', 45),
    ('550ea000-e29b-41d4-a716-100000000006'::uuid, 2, 2, 'hang-hai-ninh-binh', 'Tham quan Hang Hai va cum canh quan lan can.', 45),
    ('550ea000-e29b-41d4-a716-100000000006'::uuid, 2, 3, 'nui-ngu-dong-ninh-binh', 'Ket thuc tour tai Nui Ngu Dong.', 70),

    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 1, 1, 'ben-thuyen-trang-an-ninh-binh', 'Ngay 1 khoi hanh tai ben thuyen Trang An.', 45),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 1, 2, 'hang-sang-ninh-binh', 'Kham pha Hang Sang.', 30),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 1, 3, 'hang-toi-ninh-binh', 'Kham pha Hang Toi.', 30),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 1, 4, 'hanh-cung-vu-lam-ninh-binh', 'Dung chan tai Hanh cung Vu Lam.', 50),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 2, 1, 'co-do-hoa-lu-ninh-binh', 'Ngay 2 tham quan Co do Hoa Lu.', 70),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 2, 2, 'den-vua-dinh-ninh-binh', 'Tham quan Den Vua Dinh.', 45),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 2, 3, 'den-vua-le-ninh-binh', 'Tham quan Den Vua Le.', 45),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 3, 1, 'ben-thuyen-trung-tam-tam-coc-ninh-binh', 'Ngay 3 bat dau tai ben thuyen Tam Coc.', 45),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 3, 2, 'tam-coc-ninh-binh', 'Di thuyen Tam Coc.', 120),
    ('550ea000-e29b-41d4-a716-100000000007'::uuid, 3, 3, 'den-thai-vi-ninh-binh', 'Ket thuc lich trinh tai Den Thai Vi.', 60)
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
  ON ts.slug = m.spot_slug
 AND ts.status = 'active';

COMMIT;
