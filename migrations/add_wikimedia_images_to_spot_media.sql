BEGIN;

WITH media_seed(slug, url, title_en, file_size_kb, resolution) AS (
  VALUES
    ('cho-rong-ninh-binh', '/uploads/images/wiki-cho-rong-ninh-binh.jpg', 'Chorong2.jpg', 621, '1920x1440'),
    ('chua-bich-dong-ninh-binh', '/uploads/images/wiki-chua-bich-dong-ninh-binh.jpg', 'Bich Dong Pagoda, Ninh Binh, Vietnam, 20240203 1126 5619.jpg', 1645, '1920x1769'),
    ('chua-duyen-ninh-ninh-binh', '/uploads/images/wiki-chua-duyen-ninh-ninh-binh.jpg', 'Chua Duyen Ninh 21.JPG', 617, '1920x1289'),
    ('chua-non-nuoc-ninh-binh', '/uploads/images/wiki-chua-non-nuoc-ninh-binh.jpg', 'Huynonnuoc2.jpg', 32, '420x315'),
    ('den-nguyen-cong-tru-ninh-binh', '/uploads/images/wiki-den-nguyen-cong-tru-ninh-binh.jpg', 'Dấu ấn "Ninh Bình Tuần phủ quang phòng" dùng đóng trên các bản tấu trình của quan tuần phủ Ninh Bình - VietKings.jpg', 67, '325x319'),
    ('den-tho-truong-han-sieu-ninh-binh', '/uploads/images/wiki-den-tho-truong-han-sieu-ninh-binh.jpg', 'Ducthuyson2.jpg', 430, '1024x768'),
    ('dong-am-tien-ninh-binh', '/uploads/images/wiki-dong-am-tien-ninh-binh.jpg', 'Chuaamtien1.JPG', 637, '1920x1440'),
    ('dong-bich-dong-ninh-binh', '/uploads/images/wiki-dong-bich-dong-ninh-binh.jpg', 'TamCoc-BichDong.jpg', 972, '1920x1440'),
    ('dong-ma-tien-ninh-binh', '/uploads/images/wiki-dong-ma-tien-ninh-binh.jpg', 'Bản vẽ thành Bình Thuận.jpg', 138, '1386x964'),
    ('dong-thien-ha-ninh-binh', '/uploads/images/wiki-dong-thien-ha-ninh-binh.jpg', 'Trường Ninh Thùy Điếu (cảnh cung Trường Ninh trong Hoàng thành Huế) result.jpg', 481, '1280x1226'),
    ('ga-ninh-binh', '/uploads/images/wiki-ga-ninh-binh.jpg', 'Ninh Binh Railway Station.jpg', 560, '1286x854'),
    ('ho-dong-chuong-ninh-binh', '/uploads/images/wiki-ho-dong-chuong-ninh-binh.jpg', 'Dongchuong001.jpg', 52, '640x427'),
    ('ho-yen-thang-ninh-binh', '/uploads/images/wiki-ho-yen-thang-ninh-binh.jpg', 'PHU NU CA MAU.jpg', 178, '1920x1209'),
    ('khu-bao-ton-van-long-ninh-binh', '/uploads/images/wiki-khu-bao-ton-van-long-ninh-binh.jpg', 'Van Long Nature Reserve Lowland Wetland Halong Bay Ninh Binh Limestone Karst Red River Delta.jpg', 417, '1920x933'),
    ('khu-du-lich-sinh-thai-trang-an-ninh-binh', '/uploads/images/wiki-khu-du-lich-sinh-thai-trang-an-ninh-binh.jpg', 'Vườn Chim Thung Nham.jpg', 127, '995x367'),
    ('khu-du-lich-thung-nham-ninh-binh', '/uploads/images/wiki-khu-du-lich-thung-nham-ninh-binh.jpg', 'Thung Nham 14.JPG', 1102, '1920x1289'),
    ('nha-tho-da-phat-diem-ninh-binh', '/uploads/images/wiki-nha-tho-da-phat-diem-ninh-binh.jpg', 'Phat Diem Stone Cathedral.jpg', 121, '800x582'),
    ('nui-ky-lan-ninh-binh', '/uploads/images/wiki-nui-ky-lan-ninh-binh.jpg', 'Ninh Bình - panorama from Kỳ Lân Mountain Feb 2024.jpg', 317, '1920x441'),
    ('nui-non-nuoc-ninh-binh', '/uploads/images/wiki-nui-non-nuoc-ninh-binh.png', 'Communist flag on Non Nuoc Mountain, Ninh Binh (1929).png', 263, '1920x1195'),
    ('phong-tuyen-tam-diep-ninh-binh', '/uploads/images/wiki-phong-tuyen-tam-diep-ninh-binh.jpg', 'Phongtuyentamdiep2010.jpg', 656, '1920x1440'),
    ('song-hoang-long-ninh-binh', '/uploads/images/wiki-song-hoang-long-ninh-binh.jpg', 'Hoanglong5.jpg', 83, '700x467'),
    ('song-sao-khe-ninh-binh', '/uploads/images/wiki-song-sao-khe-ninh-binh.jpg', 'Co do Hoa Lu 114.JPG', 455, '1920x1289'),
    ('vuon-quoc-gia-cuc-phuong-ninh-binh', '/uploads/images/wiki-vuon-quoc-gia-cuc-phuong-ninh-binh.jpg', 'Thousand year old tree in Cuc Phuong National Park, Vietnam.jpg', 1865, '1920x2560'),
    ('chua-tam-chuc-ha-nam', '/uploads/images/wiki-chua-tam-chuc-ha-nam.jpg', 'Hồ Tam Chúc.jpg', 191, '1920x650'),
    ('ben-thuyen-trang-an-ninh-binh', '/uploads/images/wiki-ben-thuyen-trang-an-ninh-binh.jpg', 'TrangAn01 BenGoc.JPG', 741, '1920x1440'),
    ('chua-bai-dinh-co-ninh-binh', '/uploads/images/wiki-chua-bai-dinh-co-ninh-binh.jpg', 'Portaal-Vietnam-NL.jpg', 595, '1600x900'),
    ('co-do-hoa-lu-ninh-binh', '/uploads/images/wiki-co-do-hoa-lu-ninh-binh.jpg', 'Codoj6.JPG', 739, '1920x1440'),
    ('den-dinh-tien-hoang-ninh-binh', '/uploads/images/wiki-den-dinh-tien-hoang-ninh-binh.jpg', 'Đền Đinh Tiên Hoàng, ao súng.JPG', 1170, '1920x1440'),
    ('den-thai-vi-ninh-binh', '/uploads/images/wiki-den-thai-vi-ninh-binh.jpg', 'Đền vua Lê Hoàn.jpg', 813, '1920x1282'),
    ('den-tran-ninh-binh', '/uploads/images/wiki-den-tran-ninh-binh.jpg', 'Trang An Festival 2011.jpg', 339, '650x410'),
    ('den-trinh-ninh-binh', '/uploads/images/wiki-den-trinh-ninh-binh.jpg', 'Đên trình.jpg', 663, '1920x1285'),
    ('den-voi-ninh-binh', '/uploads/images/wiki-den-voi-ninh-binh.jpg', 'Ninh Bình Province seal - VietKings.jpg', 118, '325x319'),
    ('den-vua-dinh-ninh-binh', '/uploads/images/wiki-den-vua-dinh-ninh-binh.jpg', 'Altar plinth carved with dragons, the Dinh king''s temple, Ninh Binh province, 1699 AD, stone - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC04983.JPG', 493, '1920x968'),
    ('den-vua-le-ninh-binh', '/uploads/images/wiki-den-vua-le-ninh-binh.jpg', 'Altar plinth carved with dragons, the Dinh king''s temple, Ninh Binh province, 1699 AD, stone - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC04983.JPG', 493, '1920x968'),
    ('dinh-cac-ninh-binh', '/uploads/images/wiki-dinh-cac-ninh-binh.jpg', 'Dinhvicodohoalu.jpg', 289, '1600x1200'),
    ('dong-thien-thanh-ninh-binh', '/uploads/images/wiki-dong-thien-thanh-ninh-binh.jpg', 'Thiên Mụ Chung Thanh (cảnh chùa Thiên Mụ) result.jpg', 433, '1280x1162'),
    ('ben-thuyen-thung-nham-ninh-binh', '/uploads/images/wiki-ben-thuyen-thung-nham-ninh-binh.jpg', 'Vườn chim Thung Nham .jpg', 506, '1920x1278'),
    ('ben-thuyen-van-long-ninh-binh', '/uploads/images/wiki-ben-thuyen-van-long-ninh-binh.jpg', 'Van Long Swamp (24135913297).jpg', 536, '1920x1285'),
    ('cong-vien-khung-long-ninh-binh', '/uploads/images/wiki-cong-vien-khung-long-ninh-binh.jpg', 'Kenhga1.jpg', 41, '627x390'),
    ('dong-galaxy-ninh-binh', '/uploads/images/wiki-dong-galaxy-ninh-binh.jpg', 'Vai Gioi Cave, Ninh Binh, Vietnam, 20240203 0908 5475.jpg', 618, '1920x2876'),
    ('khu-du-lich-kenh-ga-van-trinh-ninh-binh', '/uploads/images/wiki-khu-du-lich-kenh-ga-van-trinh-ninh-binh.jpg', 'Giavien3.JPG', 530, '1920x1440'),
    ('khu-du-lich-tam-coc-bich-dong-ninh-binh', '/uploads/images/wiki-khu-du-lich-tam-coc-bich-dong-ninh-binh.jpg', 'Ninh Binh-Tam Coc 04 voyage1.jpg', 140, '1920x274'),
    ('lang-nghe-theu-ren-van-lam-ninh-binh', '/uploads/images/wiki-lang-nghe-theu-ren-van-lam-ninh-binh.jpg', 'Goat in Ninh Hải, Ninh Binh province, Vietnam, 20240201 1510 4848.jpg', 1360, '1920x2876'),
    ('lang-viet-co-co-vien-lau-ninh-binh', '/uploads/images/wiki-lang-viet-co-co-vien-lau-ninh-binh.jpg', 'Cố viên lầu.JPG', 730, '1600x1067'),
    ('nha-tho-dong-dac-ninh-binh', '/uploads/images/wiki-nha-tho-dong-dac-ninh-binh.jpg', 'VN Phat Diem tango7174.jpg', 244, '600x800'),
    ('lang-da-my-nghe-ninh-van-ninh-binh', '/uploads/images/wiki-lang-da-my-nghe-ninh-van-ninh-binh.jpg', 'Vietnam, Ninh Binh, Trang An Limestone Peaks.jpg', 330, '1920x1280'),
    ('bao-tang-ninh-binh', '/uploads/images/wiki-bao-tang-ninh-binh.jpg', 'bao-tang-ninh-binh.jpg', 179, '1024x768'),
    ('ben-xe-ninh-binh', '/uploads/images/wiki-ben-xe-ninh-binh.jpg', 'ben-xe-ninh-binh.jpg', 88, '627x987'),
    ('cau-non-nuoc-ninh-binh', '/uploads/images/wiki-cau-non-nuoc-ninh-binh.jpg', 'cau-non-nuoc-ninh-binh.jpg', 404, '1920x1440')
),
updated_media AS (
  UPDATE spot_media sm
  SET
    media_type = 'image',
    url = ms.url,
    title_en = ms.title_en,
    file_size_kb = ms.file_size_kb,
    resolution = ms.resolution,
    is_primary = TRUE,
    sort_order = 0
  FROM media_seed ms
  JOIN tourism_spots ts
    ON ts.slug = ms.slug
  WHERE sm.spot_id = ts.id
    AND (
      sm.url = ms.url
      OR (
        sm.is_primary = TRUE
        AND sm.media_type = 'image'
        AND sm.url LIKE '/uploads/images/%'
        AND sm.url NOT LIKE '/uploads/images/wiki-%'
      )
    )
  RETURNING sm.spot_id, sm.url
)
INSERT INTO spot_media (
  spot_id,
  media_type,
  url,
  title_en,
  file_size_kb,
  resolution,
  is_primary,
  sort_order
)
SELECT
  ts.id,
  'image',
  ms.url,
  ms.title_en,
  ms.file_size_kb,
  ms.resolution,
  TRUE,
  0
FROM media_seed ms
JOIN tourism_spots ts
  ON ts.slug = ms.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM spot_media sm
  WHERE sm.spot_id = ts.id
    AND sm.url = ms.url
)
AND NOT EXISTS (
  SELECT 1
  FROM updated_media um
  WHERE um.spot_id = ts.id
    AND um.url = ms.url
);

COMMIT;
