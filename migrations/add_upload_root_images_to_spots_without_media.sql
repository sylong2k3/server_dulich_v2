BEGIN;

WITH media_files(seq, url, title_en, file_size_kb, resolution) AS (
  VALUES
    (1, '/uploads/images/1-kinh-nghiem-du-lich-trang-an-toan-canh.png', 'Ninh Binh travel image 01', 1294, '1024x788'),
    (2, '/uploads/images/60019412712924787195925383263826428877428588n-1771119968637112843541-1771147010761-1771147010923569991570.webp', 'Ninh Binh travel image 02', 955, '2000x1256'),
    (3, '/uploads/images/780_crop_chua-bai-đinh-4.jpg', 'Ninh Binh travel image 03', 71, '780x520'),
    (4, '/uploads/images/anhninhbinh_1.jpg', 'Ninh Binh travel image 04', 58, '612x417'),
    (5, '/uploads/images/chuabaidinh_2.jpg', 'Ninh Binh travel image 05', 114, '1024x660'),
    (6, '/uploads/images/du-lich-ninh-binh-5.jpg', 'Ninh Binh travel image 06', 134, '1057x709'),
    (7, '/uploads/images/du-lich-ninh-binh-ivivu-2.jpg', 'Ninh Binh travel image 07', 276, '1000x562'),
    (8, '/uploads/images/nb2-9328-1712913023.webp', 'Ninh Binh travel image 08', 568, '1360x835'),
    (9, '/uploads/images/ninhbinh3.jpg', 'Ninh Binh travel image 09', 176, '1024x651'),
    (10, '/uploads/images/ninhbinh4.jpg', 'Ninh Binh travel image 10', 82, '612x459'),
    (11, '/uploads/images/ninhbinh_2.webp', 'Ninh Binh travel image 11', 410, '1200x791'),
    (12, '/uploads/images/thungui.jpg', 'Ninh Binh travel image 12', 133, '2048x1152'),
    (13, '/uploads/images/trang-an-ninh-binh-2.webp', 'Ninh Binh travel image 13', 319, '900x600'),
    (14, '/uploads/images/z4309470334425c8a43945f8154389c67c623f83639b06-16829400684762053418537.jpg', 'Ninh Binh travel image 14', 1043, '2000x1500')
),
spots_without_media AS (
  SELECT
    ts.id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE
          WHEN ts.slug IN (
            'vuon-quoc-gia-cuc-phuong-ninh-binh',
            'khu-bao-ton-van-long-ninh-binh',
            'ho-dong-chuong-ninh-binh',
            'ho-yen-thang-ninh-binh',
            'song-sao-khe-ninh-binh',
            'song-hoang-long-ninh-binh',
            'nui-non-nuoc-ninh-binh',
            'nui-ky-lan-ninh-binh',
            'dong-am-tien-ninh-binh',
            'dong-ma-tien-ninh-binh',
            'dong-thien-ha-ninh-binh',
            'dong-galaxy-ninh-binh',
            'dong-bich-dong-ninh-binh',
            'khu-du-lich-thung-nham-ninh-binh',
            'khu-du-lich-sinh-thai-trang-an-ninh-binh',
            'khu-du-lich-kenh-ga-van-trinh-ninh-binh',
            'khu-du-lich-tam-coc-bich-dong-ninh-binh',
            'chua-bich-dong-ninh-binh',
            'chua-duyen-ninh-ninh-binh',
            'chua-non-nuoc-ninh-binh',
            'den-nguyen-cong-tru-ninh-binh',
            'nha-tho-da-phat-diem-ninh-binh',
            'nha-tho-dong-dac-ninh-binh',
            'phong-tuyen-tam-diep-ninh-binh',
            'den-tho-truong-han-sieu-ninh-binh',
            'bao-tang-ninh-binh',
            'lang-nghe-theu-ren-van-lam-ninh-binh',
            'lang-da-my-nghe-ninh-van-ninh-binh',
            'lang-viet-co-co-vien-lau-ninh-binh',
            'ben-thuyen-van-long-ninh-binh',
            'ben-thuyen-thung-nham-ninh-binh',
            'cho-rong-ninh-binh',
            'ga-ninh-binh',
            'ben-xe-ninh-binh',
            'cong-vien-khung-long-ninh-binh',
            'cau-non-nuoc-ninh-binh'
          )
          THEN 0
          ELSE 1
        END,
        ts.created_at,
        ts.slug
    ) AS rn
  FROM tourism_spots ts
  WHERE NOT EXISTS (
    SELECT 1
    FROM spot_media sm
    WHERE sm.spot_id = ts.id
  )
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
  swm.id,
  'image',
  mf.url,
  mf.title_en,
  mf.file_size_kb,
  mf.resolution,
  TRUE,
  0
FROM spots_without_media swm
JOIN media_files mf
  ON mf.seq = ((swm.rn - 1) % (SELECT COUNT(*) FROM media_files)) + 1
WHERE NOT EXISTS (
  SELECT 1
  FROM spot_media existing_media
  WHERE existing_media.spot_id = swm.id
    AND existing_media.url = mf.url
);

UPDATE tourism_spots ts
SET
  has_audio_guide = EXISTS (
    SELECT 1
    FROM spot_media sm
    WHERE sm.spot_id = ts.id
      AND sm.media_type = 'audio_guide'
  ),
  updated_at = NOW()
WHERE ts.has_audio_guide IS DISTINCT FROM EXISTS (
  SELECT 1
  FROM spot_media sm
  WHERE sm.spot_id = ts.id
    AND sm.media_type = 'audio_guide'
);

COMMIT;
