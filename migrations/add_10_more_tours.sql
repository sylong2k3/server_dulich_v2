BEGIN;

DO $$
DECLARE
  missing_slugs text;
BEGIN
  SELECT string_agg(required.slug, ', ' ORDER BY required.slug)
  INTO missing_slugs
  FROM unnest(ARRAY[
    'ben-thuyen-trang-an-ninh-binh',
    'hang-sang-ninh-binh',
    'hang-toi-ninh-binh',
    'hang-nau-ruou-ninh-binh',
    'hanh-cung-vu-lam-ninh-binh',
    'duong-len-hang-mua-ninh-binh',
    'co-do-hoa-lu-ninh-binh',
    'den-vua-dinh-ninh-binh',
    'den-vua-le-ninh-binh',
    'chua-bai-dinh-co-ninh-binh',
    'den-trinh-ninh-binh',
    'den-thai-vi-ninh-binh',
    'ben-thuyen-trung-tam-tam-coc-ninh-binh',
    'tam-coc-ninh-binh',
    'hang-ba-ninh-binh',
    'hang-ba-giot-ninh-binh',
    'hang-ca-ninh-binh',
    'hang-dai-ninh-binh',
    'hang-hai-ninh-binh',
    'hang-lam-ninh-binh',
    'hang-quy-hau-ninh-binh',
    'hang-seo-ninh-binh',
    'hang-son-duong-ninh-binh',
    'hang-vang-ninh-binh',
    'nui-ngu-dong-ninh-binh'
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
  'tour-trang-an-hanh-cung-vu-lam-nua-ngay',
  'tour-hoa-lu-den-vua-dinh-den-vua-le-nua-ngay',
  'tour-tam-coc-hang-mua-checkin-1-ngay',
  'tour-bai-dinh-den-trinh-den-thai-vi-1-ngay',
  'tour-trang-an-hang-sang-hang-toi-1-ngay',
  'tour-hang-dong-nui-ngu-dong-1-ngay',
  'tour-tam-coc-hoa-lu-2n1d',
  'tour-bai-dinh-trang-an-hang-mua-2n1d',
  'tour-hang-ba-hang-ca-hang-dai-2n1d',
  'tour-ninh-binh-classic-4n3d'
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
('550ea000-e29b-41d4-a716-100000000008', '37', 'Tour Tràng An - Hành cung Vũ Lâm nửa ngày', 'Trang An - Vu Lam Palace Half-day Tour', 'tour-trang-an-hanh-cung-vu-lam-nua-ngay', 'Tuyến nửa ngày nhẹ, phù hợp khách muốn trải nghiệm nhanh cụm Tràng An.', 1, 520000, 25, '["Vé tham quan", "Hướng dẫn viên", "Nước uống"]'::jsonb, '["Chi phí cá nhân", "VAT"]'::jsonb, 'Bến thuyền Tràng An', 'Hành cung Vũ Lâm', NULL, 'published', FALSE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000009', '37', 'Tour Hoa Lư - Đền Vua Đinh - Đền Vua Lê nửa ngày', 'Hoa Lu - King Dinh Temple - King Le Temple Half-day Tour', 'tour-hoa-lu-den-vua-dinh-den-vua-le-nua-ngay', 'Tuyến văn hóa lịch sử ngắn quanh Cố đô Hoa Lư.', 1, 450000, 30, '["Vé tham quan", "Hướng dẫn viên"]'::jsonb, '["Chi phí cá nhân", "VAT"]'::jsonb, 'Cố đô Hoa Lư', 'Đền Vua Lê', NULL, 'published', FALSE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000010', '37', 'Tour Tam Cốc - Hang Múa check-in 1 ngày', 'Tam Coc - Hang Mua Check-in Day Tour', 'tour-tam-coc-hang-mua-checkin-1-ngay', 'Tuyến check-in cảnh quan sông nước Tam Cốc và điểm ngắm toàn cảnh Hang Múa.', 1, 760000, 24, '["Vé tham quan", "Thuyền Tam Cốc", "Hướng dẫn viên"]'::jsonb, '["Chi phí cá nhân", "VAT"]'::jsonb, 'Bến thuyền Trung tâm Tam Cốc', 'Đường lên Hang Múa', NULL, 'published', TRUE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000011', '37', 'Tour Bái Đính - Đền Trình - Đền Thái Vi 1 ngày', 'Bai Dinh - Trinh Temple - Thai Vi Temple Day Tour', 'tour-bai-dinh-den-trinh-den-thai-vi-1-ngay', 'Tuyến tâm linh 1 ngày kết nối các đền chùa active trong hệ thống.', 1, 690000, 28, '["Vé tham quan", "Hướng dẫn viên", "Xe đưa đón trong lịch trình"]'::jsonb, '["Chi phí cá nhân", "VAT"]'::jsonb, 'Chùa Bái Đính cổ', 'Đền Thái Vi', NULL, 'published', FALSE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000012', '37', 'Tour Tràng An - Hang Sáng - Hang Tối 1 ngày', 'Trang An - Bright Cave - Dark Cave Day Tour', 'tour-trang-an-hang-sang-hang-toi-1-ngay', 'Tuyến hang nước Tràng An với các điểm nổi bật trong cơ sở dữ liệu.', 1, 720000, 25, '["Vé tham quan", "Hướng dẫn viên", "Nước uống"]'::jsonb, '["Chi phí cá nhân", "VAT"]'::jsonb, 'Bến thuyền Tràng An', 'Hang Nấu Rượu', NULL, 'published', FALSE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000013', '37', 'Tour hang động - Núi Ngũ Động 1 ngày', 'Cave Route - Ngu Dong Mountain Day Tour', 'tour-hang-dong-nui-ngu-dong-1-ngay', 'Tuyến dành cho khách muốn đi các hang và kết thúc ở Núi Ngũ Động.', 1, 640000, 18, '["Vé tham quan", "Hướng dẫn viên"]'::jsonb, '["Chi phí cá nhân", "VAT"]'::jsonb, 'Hang Ba', 'Núi Ngũ Động', NULL, 'published', FALSE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000014', '37', 'Tour Tam Cốc - Hoa Lư 2 ngày 1 đêm', 'Tam Coc - Hoa Lu 2D1N Tour', 'tour-tam-coc-hoa-lu-2n1d', 'Tuyến 2 ngày kết hợp Tam Cốc, Hang Múa và cụm di tích Hoa Lư.', 2, 1450000, 22, '["Vé tham quan", "Hướng dẫn viên", "1 đêm lưu trú tiêu chuẩn"]'::jsonb, '["Chi phí cá nhân", "Phụ thu phòng đơn", "VAT"]'::jsonb, 'Bến thuyền Trung tâm Tam Cốc', 'Đền Vua Lê', NULL, 'published', TRUE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000015', '37', 'Tour Bái Đính - Tràng An - Hang Múa 2 ngày 1 đêm', 'Bai Dinh - Trang An - Hang Mua 2D1N Tour', 'tour-bai-dinh-trang-an-hang-mua-2n1d', 'Tuyến 2 ngày cân bằng giữa tâm linh, hang nước và điểm ngắm cảnh.', 2, 1580000, 22, '["Vé tham quan", "Hướng dẫn viên", "1 đêm lưu trú tiêu chuẩn"]'::jsonb, '["Chi phí cá nhân", "Phụ thu phòng đơn", "VAT"]'::jsonb, 'Chùa Bái Đính cổ', 'Đường lên Hang Múa', NULL, 'published', TRUE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000016', '37', 'Tour Hang Ba - Hang Cả - Hang Đại 2 ngày 1 đêm', 'Hang Ba - Hang Ca - Hang Dai 2D1N Tour', 'tour-hang-ba-hang-ca-hang-dai-2n1d', 'Tuyến chuyên đề hang động, dùng các điểm hang active còn lại trong hệ thống.', 2, 1320000, 16, '["Vé tham quan", "Hướng dẫn viên", "1 đêm lưu trú tiêu chuẩn"]'::jsonb, '["Chi phí cá nhân", "Phụ thu phòng đơn", "VAT"]'::jsonb, 'Hang Ba', 'Hang Vạng', NULL, 'published', FALSE, NOW(), 0, 0),
('550ea000-e29b-41d4-a716-100000000017', '37', 'Tour Ninh Bình classic 4 ngày 3 đêm', 'Ninh Binh Classic 4D3N Tour', 'tour-ninh-binh-classic-4n3d', 'Tuyến dài tổng hợp Tràng An, Hoa Lư, Bái Đính, Tam Cốc, Hang Múa và các hang động.', 4, 3650000, 18, '["Vé tham quan", "Hướng dẫn viên", "3 đêm lưu trú tiêu chuẩn", "Xe đưa đón trong lịch trình"]'::jsonb, '["Chi phí cá nhân", "Phụ thu phòng đơn", "VAT"]'::jsonb, 'Bến thuyền Tràng An', 'Núi Ngũ Động', NULL, 'published', TRUE, NOW(), 0, 0);

WITH stop_mapping(tour_package_id, day_number, stop_order, spot_slug, description_vi, planned_duration_min) AS (
  VALUES
    ('550ea000-e29b-41d4-a716-100000000008'::uuid, 1, 1, 'ben-thuyen-trang-an-ninh-binh', 'Khởi hành tại bến thuyền Tràng An.', 45),
    ('550ea000-e29b-41d4-a716-100000000008'::uuid, 1, 2, 'hang-sang-ninh-binh', 'Đi thuyền qua Hang Sáng.', 30),
    ('550ea000-e29b-41d4-a716-100000000008'::uuid, 1, 3, 'hang-toi-ninh-binh', 'Tiếp tục tham quan Hang Tối.', 30),
    ('550ea000-e29b-41d4-a716-100000000008'::uuid, 1, 4, 'hanh-cung-vu-lam-ninh-binh', 'Dừng tại Hành cung Vũ Lâm.', 45),

    ('550ea000-e29b-41d4-a716-100000000009'::uuid, 1, 1, 'co-do-hoa-lu-ninh-binh', 'Tham quan tổng quan khu Cố đô Hoa Lư.', 60),
    ('550ea000-e29b-41d4-a716-100000000009'::uuid, 1, 2, 'den-vua-dinh-ninh-binh', 'Tham quan Đền Vua Đinh.', 45),
    ('550ea000-e29b-41d4-a716-100000000009'::uuid, 1, 3, 'den-vua-le-ninh-binh', 'Tham quan Đền Vua Lê.', 45),

    ('550ea000-e29b-41d4-a716-100000000010'::uuid, 1, 1, 'ben-thuyen-trung-tam-tam-coc-ninh-binh', 'Bắt đầu tại bến thuyền trung tâm Tam Cốc.', 40),
    ('550ea000-e29b-41d4-a716-100000000010'::uuid, 1, 2, 'tam-coc-ninh-binh', 'Đi thuyền Tam Cốc.', 120),
    ('550ea000-e29b-41d4-a716-100000000010'::uuid, 1, 3, 'duong-len-hang-mua-ninh-binh', 'Leo Hang Múa và chụp ảnh toàn cảnh.', 90),

    ('550ea000-e29b-41d4-a716-100000000011'::uuid, 1, 1, 'chua-bai-dinh-co-ninh-binh', 'Tham quan Chùa Bái Đính cổ.', 100),
    ('550ea000-e29b-41d4-a716-100000000011'::uuid, 1, 2, 'den-trinh-ninh-binh', 'Dừng tại Đền Trình.', 45),
    ('550ea000-e29b-41d4-a716-100000000011'::uuid, 1, 3, 'den-thai-vi-ninh-binh', 'Kết thúc tuyến tâm linh tại Đền Thái Vi.', 60),

    ('550ea000-e29b-41d4-a716-100000000012'::uuid, 1, 1, 'ben-thuyen-trang-an-ninh-binh', 'Khởi hành ở bến thuyền Tràng An.', 45),
    ('550ea000-e29b-41d4-a716-100000000012'::uuid, 1, 2, 'hang-sang-ninh-binh', 'Tham quan Hang Sáng.', 30),
    ('550ea000-e29b-41d4-a716-100000000012'::uuid, 1, 3, 'hang-toi-ninh-binh', 'Tham quan Hang Tối.', 30),
    ('550ea000-e29b-41d4-a716-100000000012'::uuid, 1, 4, 'hang-nau-ruou-ninh-binh', 'Dừng ở Hang Nấu Rượu.', 35),

    ('550ea000-e29b-41d4-a716-100000000013'::uuid, 1, 1, 'hang-ba-ninh-binh', 'Tham quan Hang Ba.', 45),
    ('550ea000-e29b-41d4-a716-100000000013'::uuid, 1, 2, 'hang-ba-giot-ninh-binh', 'Tham quan Hang Ba Giọt.', 45),
    ('550ea000-e29b-41d4-a716-100000000013'::uuid, 1, 3, 'hang-ca-ninh-binh', 'Tham quan Hang Cả.', 45),
    ('550ea000-e29b-41d4-a716-100000000013'::uuid, 1, 4, 'nui-ngu-dong-ninh-binh', 'Kết thúc tại Núi Ngũ Động.', 70),

    ('550ea000-e29b-41d4-a716-100000000014'::uuid, 1, 1, 'ben-thuyen-trung-tam-tam-coc-ninh-binh', 'Ngày 1 bắt đầu tại bến thuyền Tam Cốc.', 40),
    ('550ea000-e29b-41d4-a716-100000000014'::uuid, 1, 2, 'tam-coc-ninh-binh', 'Đi thuyền Tam Cốc.', 120),
    ('550ea000-e29b-41d4-a716-100000000014'::uuid, 1, 3, 'duong-len-hang-mua-ninh-binh', 'Leo Hang Múa.', 90),
    ('550ea000-e29b-41d4-a716-100000000014'::uuid, 2, 1, 'co-do-hoa-lu-ninh-binh', 'Ngày 2 tham quan Cố đô Hoa Lư.', 70),
    ('550ea000-e29b-41d4-a716-100000000014'::uuid, 2, 2, 'den-vua-dinh-ninh-binh', 'Tham quan Đền Vua Đinh.', 45),
    ('550ea000-e29b-41d4-a716-100000000014'::uuid, 2, 3, 'den-vua-le-ninh-binh', 'Tham quan Đền Vua Lê.', 45),

    ('550ea000-e29b-41d4-a716-100000000015'::uuid, 1, 1, 'chua-bai-dinh-co-ninh-binh', 'Ngày 1 tham quan Chùa Bái Đính cổ.', 100),
    ('550ea000-e29b-41d4-a716-100000000015'::uuid, 1, 2, 'den-trinh-ninh-binh', 'Dừng tại Đền Trình.', 45),
    ('550ea000-e29b-41d4-a716-100000000015'::uuid, 2, 1, 'ben-thuyen-trang-an-ninh-binh', 'Ngày 2 đi thuyền Tràng An.', 45),
    ('550ea000-e29b-41d4-a716-100000000015'::uuid, 2, 2, 'hang-sang-ninh-binh', 'Tham quan Hang Sáng.', 30),
    ('550ea000-e29b-41d4-a716-100000000015'::uuid, 2, 3, 'hang-toi-ninh-binh', 'Tham quan Hang Tối.', 30),
    ('550ea000-e29b-41d4-a716-100000000015'::uuid, 2, 4, 'duong-len-hang-mua-ninh-binh', 'Kết thúc với Hang Múa.', 90),

    ('550ea000-e29b-41d4-a716-100000000016'::uuid, 1, 1, 'hang-ba-ninh-binh', 'Ngày 1 tham quan Hang Ba.', 45),
    ('550ea000-e29b-41d4-a716-100000000016'::uuid, 1, 2, 'hang-ca-ninh-binh', 'Tham quan Hang Cả.', 45),
    ('550ea000-e29b-41d4-a716-100000000016'::uuid, 1, 3, 'hang-dai-ninh-binh', 'Tham quan Hang Đại.', 45),
    ('550ea000-e29b-41d4-a716-100000000016'::uuid, 2, 1, 'hang-lam-ninh-binh', 'Ngày 2 tham quan Hang Lấm.', 45),
    ('550ea000-e29b-41d4-a716-100000000016'::uuid, 2, 2, 'hang-quy-hau-ninh-binh', 'Tham quan Hang Quy Hậu.', 45),
    ('550ea000-e29b-41d4-a716-100000000016'::uuid, 2, 3, 'hang-vang-ninh-binh', 'Kết thúc tại Hang Vạng.', 45),

    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 1, 1, 'ben-thuyen-trang-an-ninh-binh', 'Ngày 1 khởi hành tại Tràng An.', 45),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 1, 2, 'hang-sang-ninh-binh', 'Tham quan Hang Sáng.', 30),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 1, 3, 'hang-toi-ninh-binh', 'Tham quan Hang Tối.', 30),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 1, 4, 'hanh-cung-vu-lam-ninh-binh', 'Dừng tại Hành cung Vũ Lâm.', 50),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 2, 1, 'co-do-hoa-lu-ninh-binh', 'Ngày 2 tham quan Cố đô Hoa Lư.', 70),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 2, 2, 'den-vua-dinh-ninh-binh', 'Tham quan Đền Vua Đinh.', 45),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 2, 3, 'den-vua-le-ninh-binh', 'Tham quan Đền Vua Lê.', 45),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 3, 1, 'chua-bai-dinh-co-ninh-binh', 'Ngày 3 tham quan Chùa Bái Đính cổ.', 100),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 3, 2, 'den-trinh-ninh-binh', 'Tham quan Đền Trình.', 45),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 3, 3, 'duong-len-hang-mua-ninh-binh', 'Ngắm cảnh tại Hang Múa.', 90),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 4, 1, 'ben-thuyen-trung-tam-tam-coc-ninh-binh', 'Ngày 4 bắt đầu ở bến thuyền Tam Cốc.', 40),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 4, 2, 'tam-coc-ninh-binh', 'Đi thuyền Tam Cốc.', 120),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 4, 3, 'den-thai-vi-ninh-binh', 'Tham quan Đền Thái Vi.', 60),
    ('550ea000-e29b-41d4-a716-100000000017'::uuid, 4, 4, 'nui-ngu-dong-ninh-binh', 'Kết thúc tour tại Núi Ngũ Động.', 70)
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
