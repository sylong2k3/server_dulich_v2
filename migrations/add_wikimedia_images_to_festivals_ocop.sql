BEGIN;

WITH festival_media_seed(name_vi, cover_image_url) AS (
  VALUES
    ('Festival Âm Nhạc & Du Thuyền Tràng An', '/uploads/images/wiki-festival-festival-am-nhac-du-thuyen-trang-an.jpg'),
    ('Lễ Hội Cố Đô Hoa Lư - Lịch Sử & Văn Hóa', '/uploads/images/wiki-festival-le-hoi-co-o-hoa-lu-lich-su-van-hoa.jpg'),
    ('Lễ Hội Đền Đinh - Tế Vua Đinh', '/uploads/images/wiki-festival-le-hoi-en-inh-te-vua-inh.jpg'),
    ('Lễ Hội Mùa Thu Hang Múa - Trekking & Nhiếp Ảnh', '/uploads/images/wiki-festival-le-hoi-mua-thu-hang-mua-trekking-nhiep-anh.jpg'),
    ('Lễ Hội Tái Hiện Lịch Sử Hoàng Gia', '/uploads/images/wiki-festival-le-hoi-tai-hien-lich-su-hoang-gia.jpg'),
    ('Lễ Hội Tết Trung Thu Tam Cốc', '/uploads/images/wiki-festival-le-hoi-tet-trung-thu-tam-coc.jpg'),
    ('Lễ Hội Xuân Tràng An - Du Lịch Golf & Lữ Hành', '/uploads/images/wiki-festival-le-hoi-xuan-trang-an-du-lich-golf-lu-hanh.jpg'),
    ('Lễ Phật Đản Bái Đính - Lễ Hội Tôn Giáo Lớn Nhất', '/uploads/images/wiki-festival-le-phat-an-bai-inh-le-hoi-ton-giao-lon-nhat.jpg')
)
UPDATE festivals f
SET
  cover_image_url = fms.cover_image_url,
  updated_at = NOW()
FROM festival_media_seed fms
WHERE f.name_vi = fms.name_vi;

WITH ocop_media_seed(name_vi, cover_image_url) AS (
  VALUES
    ('Bánh Gai Ninh Bình', '/uploads/images/wiki-ocop-banh-gai-ninh-binh.jpg'),
    ('Cơm Cháy Ninh Bình Thành Nhân', '/uploads/images/wiki-ocop-com-chay-ninh-binh-thanh-nhan.jpg'),
    ('Giỏ Cói Mỹ Nghệ Kim Sơn', '/uploads/images/wiki-ocop-gio-coi-my-nghe-kim-son.jpg'),
    ('Mắm Tép Gia Viễn Bà Quý', '/uploads/images/wiki-ocop-mam-tep-gia-vien-ba-quy.jpg'),
    ('Mật Ong Rừng Nho Quan', '/uploads/images/wiki-ocop-mat-ong-rung-nho-quan.jpg'),
    ('Muối Hạt Kim Sơn', '/uploads/images/wiki-ocop-muoi-hat-kim-son.jpg'),
    ('Nem Chua Yên Mạc Ninh Bình', '/uploads/images/wiki-ocop-nem-chua-yen-mac-ninh-binh.jpg'),
    ('Rượu Gạo Kim Sơn Truyền Thống', '/uploads/images/wiki-ocop-ruou-gao-kim-son-truyen-thong.jpg'),
    ('Thịt Dê Núi Ninh Bình Khô Tẩm Gia Vị', '/uploads/images/wiki-ocop-thit-de-nui-ninh-binh-kho-tam-gia-vi.jpg'),
    ('Tinh Dầu Tràm Ninh Bình', '/uploads/images/wiki-ocop-tinh-dau-tram-ninh-binh.png'),
    ('Trà Hoa Sen Ninh Bình', '/uploads/images/wiki-ocop-tra-hoa-sen-ninh-binh.jpg'),
    ('Tranh Thêu Tay Làng Nghề Văn Lâm', '/uploads/images/wiki-ocop-tranh-theu-tay-lang-nghe-van-lam.jpg')
)
UPDATE ocop_products o
SET
  cover_image_url = oms.cover_image_url,
  media_urls = ARRAY[oms.cover_image_url]::text[],
  updated_at = NOW()
FROM ocop_media_seed oms
WHERE o.name_vi = oms.name_vi;

COMMIT;
