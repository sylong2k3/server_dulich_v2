BEGIN;

DO $$
DECLARE
  missing_codes text;
BEGIN
  SELECT string_agg(required.code, ', ' ORDER BY required.code)
  INTO missing_codes
  FROM unnest(ARRAY[
    'vuon-quoc-gia',
    'khu-bao-ton-thien-nhien',
    'ho',
    'song-suoi',
    'nui',
    'hang-dong',
    'khu-du-lich',
    'den-chua',
    'nha-tho',
    'di-tich-lich-su',
    'bao-tang',
    'lang-nghe-truyen-thong',
    'lang-que',
    'nha-thuyen',
    'cho',
    'ga-tau',
    'ben-xe',
    'cong-vien',
    'cau'
  ]) AS required(code)
  WHERE NOT EXISTS (
    SELECT 1
    FROM spot_categories sc
    WHERE sc.code = required.code
      AND sc.parent_id IS NOT NULL
      AND sc.is_active = TRUE
  );

  IF missing_codes IS NOT NULL THEN
    RAISE EXCEPTION 'Missing active child spot_categories: %', missing_codes;
  END IF;
END $$;

WITH spot_seed(category_code, name_vi, name_en, slug, description_vi, address_vi, lng, lat, featured) AS (
  VALUES
    ('vuon-quoc-gia', 'Vườn quốc gia Cúc Phương', 'Cuc Phuong National Park', 'vuon-quoc-gia-cuc-phuong-ninh-binh', 'Vườn quốc gia lâu đời, nổi bật với rừng nguyên sinh, tuyến trekking, hang động và trung tâm cứu hộ linh trưởng.', 'Nho Quan, Ninh Bình', 105.6080, 20.3500, TRUE),
    ('khu-bao-ton-thien-nhien', 'Khu bảo tồn đất ngập nước Vân Long', 'Van Long Wetland Nature Reserve', 'khu-bao-ton-van-long-ninh-binh', 'Khu bảo tồn đất ngập nước với cảnh quan núi đá vôi, đầm nước và hệ sinh thái chim nước đặc trưng.', 'Gia Viễn, Ninh Bình', 105.8790, 20.3740, TRUE),
    ('ho', 'Hồ Đồng Chương', 'Dong Chuong Lake', 'ho-dong-chuong-ninh-binh', 'Hồ nước giữa rừng thông, phù hợp nghỉ dưỡng ngắn ngày, cắm trại và tham quan cảnh quan tự nhiên.', 'Nho Quan, Ninh Bình', 105.7240, 20.2530, FALSE),
    ('ho', 'Hồ Yên Thắng', 'Yen Thang Lake', 'ho-yen-thang-ninh-binh', 'Không gian hồ rộng tại Tam Điệp, phù hợp dã ngoại, nghỉ dưỡng và các hoạt động thể thao ngoài trời.', 'Tam Điệp, Ninh Bình', 105.8800, 20.1350, FALSE),
    ('song-suoi', 'Sông Sào Khê', 'Sao Khe River', 'song-sao-khe-ninh-binh', 'Dòng sông gắn với vùng di sản Tràng An và Cố đô Hoa Lư, tạo nên cảnh quan thủy mặc đặc trưng.', 'Hoa Lư, Ninh Bình', 105.9130, 20.2550, FALSE),
    ('song-suoi', 'Sông Hoàng Long', 'Hoang Long River', 'song-hoang-long-ninh-binh', 'Dòng sông lớn của vùng Gia Viễn - Hoa Lư, gắn với cảnh quan đồng bằng và núi đá vôi.', 'Gia Viễn, Ninh Bình', 105.8700, 20.3100, FALSE),
    ('nui', 'Núi Non Nước', 'Non Nuoc Mountain', 'nui-non-nuoc-ninh-binh', 'Ngọn núi nằm gần trung tâm thành phố, có cảnh quan sông núi và dấu tích văn hóa lịch sử.', 'Thành phố Ninh Bình, Ninh Bình', 105.9750, 20.2530, TRUE),
    ('nui', 'Núi Kỳ Lân', 'Ky Lan Mountain', 'nui-ky-lan-ninh-binh', 'Điểm cảnh quan trong đô thị Ninh Bình, nổi bật với hồ, núi đá và không gian công viên.', 'Thành phố Ninh Bình, Ninh Bình', 105.9690, 20.2550, FALSE),

    ('hang-dong', 'Động Am Tiên', 'Am Tien Cave', 'dong-am-tien-ninh-binh', 'Điểm tham quan trong khu vực Tuyệt Tình Cốc, có hồ nước, vách núi đá và không gian cổ kính.', 'Trường Yên, Hoa Lư, Ninh Bình', 105.9000, 20.2810, TRUE),
    ('hang-dong', 'Động Mã Tiên', 'Ma Tien Cave', 'dong-ma-tien-ninh-binh', 'Hang động thuộc vùng núi đá vôi Ninh Bình, phù hợp tuyến tham quan sinh thái và khám phá địa chất.', 'Nho Quan, Ninh Bình', 105.7400, 20.2600, FALSE),
    ('hang-dong', 'Động Thiên Hà', 'Thien Ha Cave', 'dong-thien-ha-ninh-binh', 'Hang động có hệ thống nhũ đá đẹp, thường được kết hợp trong các tuyến tham quan Nho Quan.', 'Sơn Hà, Nho Quan, Ninh Bình', 105.8100, 20.2550, TRUE),
    ('hang-dong', 'Động Galaxy', 'Galaxy Grotto', 'dong-galaxy-ninh-binh', 'Hang động cảnh quan có tuyến thuyền và nhũ đá, phù hợp du lịch sinh thái nhẹ.', 'Nho Quan, Ninh Bình', 105.8050, 20.2600, FALSE),
    ('hang-dong', 'Động Bích Động', 'Bich Dong Cave', 'dong-bich-dong-ninh-binh', 'Cụm hang nằm cùng tuyến chùa Bích Động, nổi bật với cảnh quan núi đá, hồ nước và kiến trúc chùa cổ.', 'Ninh Hải, Hoa Lư, Ninh Bình', 105.9140, 20.2180, TRUE),

    ('khu-du-lich', 'Khu du lịch sinh thái Thung Nham', 'Thung Nham Bird Park Eco Tourism Area', 'khu-du-lich-thung-nham-ninh-binh', 'Khu du lịch sinh thái với vườn chim, hang động, thung lũng và các tuyến tham quan tự nhiên.', 'Ninh Hải, Hoa Lư, Ninh Bình', 105.8950, 20.2140, TRUE),
    ('khu-du-lich', 'Khu du lịch sinh thái Tràng An', 'Trang An Eco Tourism Complex', 'khu-du-lich-sinh-thai-trang-an-ninh-binh', 'Quần thể du lịch sinh thái nổi bật với tuyến thuyền xuyên hang, núi đá vôi và di sản văn hóa.', 'Trường Yên, Hoa Lư, Ninh Bình', 105.9120, 20.2530, TRUE),
    ('khu-du-lich', 'Khu du lịch Kênh Gà - Vân Trình', 'Kenh Ga - Van Trinh Tourism Area', 'khu-du-lich-kenh-ga-van-trinh-ninh-binh', 'Tuyến du lịch ven sông, suối khoáng và hang động tại vùng Gia Viễn - Nho Quan.', 'Gia Viễn, Ninh Bình', 105.8350, 20.3050, FALSE),
    ('khu-du-lich', 'Khu du lịch Tam Cốc - Bích Động', 'Tam Coc - Bich Dong Tourism Area', 'khu-du-lich-tam-coc-bich-dong-ninh-binh', 'Cụm du lịch nổi tiếng với tuyến thuyền Tam Cốc, chùa Bích Động và cảnh quan ruộng lúa ven núi.', 'Ninh Hải, Hoa Lư, Ninh Bình', 105.9190, 20.2140, TRUE),

    ('den-chua', 'Chùa Bích Động', 'Bich Dong Pagoda', 'chua-bich-dong-ninh-binh', 'Ngôi chùa cổ nằm trên sườn núi, thường được gọi là Nam thiên đệ nhị động.', 'Ninh Hải, Hoa Lư, Ninh Bình', 105.9140, 20.2160, TRUE),
    ('den-chua', 'Chùa Duyên Ninh', 'Duyen Ninh Pagoda', 'chua-duyen-ninh-ninh-binh', 'Ngôi chùa cổ trong vùng Cố đô Hoa Lư, gắn với không gian văn hóa tâm linh địa phương.', 'Trường Yên, Hoa Lư, Ninh Bình', 105.8990, 20.2820, FALSE),
    ('den-chua', 'Chùa Non Nước', 'Non Nuoc Pagoda', 'chua-non-nuoc-ninh-binh', 'Chùa nằm dưới chân núi Non Nước, gần sông Đáy và trung tâm thành phố Ninh Bình.', 'Thành phố Ninh Bình, Ninh Bình', 105.9760, 20.2530, FALSE),
    ('den-chua', 'Đền Nguyễn Công Trứ', 'Nguyen Cong Tru Temple', 'den-nguyen-cong-tru-ninh-binh', 'Di tích thờ danh nhân Nguyễn Công Trứ, gắn với vùng Kim Sơn và lịch sử khai hoang lập ấp.', 'Kim Sơn, Ninh Bình', 106.1000, 20.0550, FALSE),

    ('nha-tho', 'Nhà thờ đá Phát Diệm', 'Phat Diem Stone Cathedral', 'nha-tho-da-phat-diem-ninh-binh', 'Quần thể nhà thờ đá nổi tiếng với kiến trúc giao thoa Đông - Tây, là điểm văn hóa đặc sắc của Kim Sơn.', 'Phát Diệm, Kim Sơn, Ninh Bình', 106.0760, 20.0890, TRUE),
    ('nha-tho', 'Nhà thờ giáo xứ Đồng Đắc', 'Dong Dac Parish Church', 'nha-tho-dong-dac-ninh-binh', 'Nhà thờ giáo xứ trong vùng Kim Sơn, phù hợp bổ sung tuyến tham quan kiến trúc tôn giáo.', 'Kim Sơn, Ninh Bình', 106.0950, 20.1050, FALSE),

    ('di-tich-lich-su', 'Phòng tuyến Tam Điệp', 'Tam Diep Defensive Line', 'phong-tuyen-tam-diep-ninh-binh', 'Di tích lịch sử gắn với tuyến phòng thủ Tam Điệp - Biện Sơn trong lịch sử chống ngoại xâm.', 'Tam Điệp, Ninh Bình', 105.9000, 20.1500, TRUE),
    ('di-tich-lich-su', 'Đền thờ Trương Hán Siêu', 'Truong Han Sieu Temple', 'den-tho-truong-han-sieu-ninh-binh', 'Di tích tưởng niệm danh nhân Trương Hán Siêu, nằm gần núi Non Nước và sông Đáy.', 'Thành phố Ninh Bình, Ninh Bình', 105.9740, 20.2520, FALSE),
    ('bao-tang', 'Bảo tàng Ninh Bình', 'Ninh Binh Museum', 'bao-tang-ninh-binh', 'Không gian trưng bày lịch sử, văn hóa và hiện vật tiêu biểu của vùng đất Ninh Bình.', 'Thành phố Ninh Bình, Ninh Bình', 105.9720, 20.2520, FALSE),

    ('lang-nghe-truyen-thong', 'Làng nghề thêu ren Văn Lâm', 'Van Lam Embroidery Village', 'lang-nghe-theu-ren-van-lam-ninh-binh', 'Làng nghề truyền thống nổi tiếng với nghề thêu ren, nằm gần tuyến du lịch Tam Cốc.', 'Ninh Hải, Hoa Lư, Ninh Bình', 105.9190, 20.2140, TRUE),
    ('lang-nghe-truyen-thong', 'Làng đá mỹ nghệ Ninh Vân', 'Ninh Van Stone Carving Village', 'lang-da-my-nghe-ninh-van-ninh-binh', 'Làng nghề chế tác đá mỹ nghệ lâu đời, phù hợp tham quan văn hóa làng nghề.', 'Ninh Vân, Hoa Lư, Ninh Bình', 105.9460, 20.1890, FALSE),
    ('lang-que', 'Làng Việt cổ Cố Viên Lầu', 'Co Vien Lau Ancient Village', 'lang-viet-co-co-vien-lau-ninh-binh', 'Không gian tái hiện kiến trúc làng Việt cổ, nằm trong vùng Tam Cốc - Bích Động.', 'Ninh Hải, Hoa Lư, Ninh Bình', 105.9180, 20.2150, FALSE),

    ('nha-thuyen', 'Bến thuyền Vân Long', 'Van Long Boat Wharf', 'ben-thuyen-van-long-ninh-binh', 'Bến thuyền phục vụ tuyến tham quan khu bảo tồn đất ngập nước Vân Long.', 'Gia Viễn, Ninh Bình', 105.8800, 20.3740, TRUE),
    ('nha-thuyen', 'Bến thuyền Thung Nham', 'Thung Nham Boat Wharf', 'ben-thuyen-thung-nham-ninh-binh', 'Bến thuyền trong khu du lịch sinh thái Thung Nham, phục vụ tuyến vườn chim và hang động.', 'Ninh Hải, Hoa Lư, Ninh Bình', 105.8950, 20.2140, FALSE),
    ('cho', 'Chợ Rồng Ninh Bình', 'Ninh Binh Dragon Market', 'cho-rong-ninh-binh', 'Khu chợ trung tâm của thành phố Ninh Bình, phù hợp tham quan đời sống địa phương và mua đặc sản.', 'Thành phố Ninh Bình, Ninh Bình', 105.9740, 20.2530, FALSE),
    ('ga-tau', 'Ga Ninh Bình', 'Ninh Binh Railway Station', 'ga-ninh-binh', 'Ga đường sắt chính phục vụ du khách đến Ninh Bình bằng tàu hỏa.', 'Thành phố Ninh Bình, Ninh Bình', 105.9700, 20.2540, FALSE),
    ('ben-xe', 'Bến xe Ninh Bình', 'Ninh Binh Bus Station', 'ben-xe-ninh-binh', 'Bến xe liên tỉnh phục vụ kết nối giao thông đường bộ đến các điểm du lịch trong tỉnh.', 'Thành phố Ninh Bình, Ninh Bình', 105.9640, 20.2500, FALSE),
    ('cong-vien', 'Công viên khủng long Ninh Bình', 'Ninh Binh Dinosaur Park', 'cong-vien-khung-long-ninh-binh', 'Công viên giải trí tại trung tâm thành phố, phù hợp gia đình và trẻ em.', 'Thành phố Ninh Bình, Ninh Bình', 105.9690, 20.2510, FALSE),
    ('cau', 'Cầu Non Nước', 'Non Nuoc Bridge', 'cau-non-nuoc-ninh-binh', 'Cây cầu kết nối khu vực trung tâm Ninh Bình, gần núi Non Nước và sông Đáy.', 'Thành phố Ninh Bình, Ninh Bình', 105.9770, 20.2540, FALSE)
)
INSERT INTO tourism_spots (
  category_id,
  province_code,
  name_vi,
  name_en,
  slug,
  description_vi,
  address_vi,
  geom,
  opening_hours,
  ticket_currency,
  max_capacity,
  alert_threshold_pct,
  status,
  is_featured,
  has_vr_360,
  has_ar_support,
  has_audio_guide,
  created_at,
  updated_at
)
SELECT
  sc.id,
  '37',
  s.name_vi,
  s.name_en,
  s.slug,
  s.description_vi,
  s.address_vi,
  ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326),
  '{"daily": "07:00-17:00"}'::jsonb,
  'VND',
  CASE WHEN s.featured THEN 1500 ELSE 600 END,
  80,
  'active',
  s.featured,
  FALSE,
  FALSE,
  FALSE,
  NOW(),
  NOW()
FROM spot_seed s
JOIN spot_categories sc
  ON sc.code = s.category_code
 AND sc.parent_id IS NOT NULL
 AND sc.is_active = TRUE
ON CONFLICT (slug) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  province_code = EXCLUDED.province_code,
  name_vi = EXCLUDED.name_vi,
  name_en = EXCLUDED.name_en,
  description_vi = EXCLUDED.description_vi,
  address_vi = EXCLUDED.address_vi,
  geom = EXCLUDED.geom,
  opening_hours = EXCLUDED.opening_hours,
  max_capacity = EXCLUDED.max_capacity,
  alert_threshold_pct = EXCLUDED.alert_threshold_pct,
  status = EXCLUDED.status,
  is_featured = EXCLUDED.is_featured,
  updated_at = NOW();

COMMIT;
