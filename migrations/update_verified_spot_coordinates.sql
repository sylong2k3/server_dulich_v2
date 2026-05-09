BEGIN;

WITH verified_coords(slug, lng, lat, note) AS (
  VALUES
    ('vuon-quoc-gia-cuc-phuong-ninh-binh', 105.6176593, 20.3162835, 'OSM Nominatim: Vườn quốc gia Cúc Phương'),
    ('khu-bao-ton-van-long-ninh-binh', 105.8605764, 20.3858631, 'OSM Nominatim: Khu bảo tồn thiên nhiên đất ngập nước Vân Long'),
    ('ho-yen-thang-ninh-binh', 105.9633083, 20.1344759, 'OSM Nominatim: Hồ Yên Thắng'),
    ('dong-am-tien-ninh-binh', 105.9114446, 20.2815397, 'OSM Nominatim: Dong Am Tiem'),
    ('khu-du-lich-thung-nham-ninh-binh', 105.8887880, 20.2211319, 'OSM Nominatim: Thung Nham Bird Park'),
    ('khu-du-lich-sinh-thai-trang-an-ninh-binh', 105.9005014, 20.2537827, 'OSM Nominatim: Trang An Landscape Complex'),
    ('khu-du-lich-tam-coc-bich-dong-ninh-binh', 105.9374570, 20.2163426, 'OSM Nominatim: Tam Coc - Bich Dong'),
    ('nha-tho-da-phat-diem-ninh-binh', 106.0794722, 20.0930035, 'OSM Nominatim: Nhà thờ chính tòa Phát Diệm'),
    ('bao-tang-ninh-binh', 105.9807146, 20.2587950, 'OSM Nominatim: Museum Ninh Binh'),
    ('cho-rong-ninh-binh', 105.9776166, 20.2561711, 'OSM Nominatim: Chợ Rồng Ninh Bình'),
    ('ga-ninh-binh', 105.9746207, 20.2421142, 'OSM Nominatim: Ninh Bình railway station'),
    ('ben-xe-ninh-binh', 105.9762659, 20.2505209, 'OSM Nominatim: Bến xe khách Ninh Bình')
)
UPDATE tourism_spots ts
SET
  geom = ST_SetSRID(ST_MakePoint(vc.lng, vc.lat), 4326),
  updated_at = NOW()
FROM verified_coords vc
WHERE ts.slug = vc.slug;

COMMIT;
