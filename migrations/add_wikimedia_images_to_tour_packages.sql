BEGIN;

WITH tour_media_seed(slug, cover_image_url) AS (
  VALUES
    ('tour-bai-dinh-den-trinh-den-thai-vi-1-ngay', '/uploads/images/wiki-tour-tour-bai-dinh-den-trinh-den-thai-vi-1-ngay.jpg'),
    ('tour-bai-dinh-trang-an-hang-mua-2n1d', '/uploads/images/wiki-tour-tour-bai-dinh-trang-an-hang-mua-2n1d.jpg'),
    ('tour-hang-ba-hang-ca-hang-dai-2n1d', '/uploads/images/wiki-tour-tour-hang-ba-hang-ca-hang-dai-2n1d.jpg'),
    ('tour-hang-dong-nui-ngu-dong-1-ngay', '/uploads/images/wiki-tour-tour-hang-dong-nui-ngu-dong-1-ngay.jpg'),
    ('tour-hoa-lu-den-vua-dinh-den-vua-le-nua-ngay', '/uploads/images/wiki-tour-tour-hoa-lu-den-vua-dinh-den-vua-le-nua-ngay.jpg'),
    ('tour-ninh-binh-classic-4n3d', '/uploads/images/wiki-tour-tour-ninh-binh-classic-4n3d.jpg'),
    ('tour-tam-coc-hang-mua-checkin-1-ngay', '/uploads/images/wiki-tour-tour-tam-coc-hang-mua-checkin-1-ngay.jpg'),
    ('tour-tam-coc-hoa-lu-2n1d', '/uploads/images/wiki-tour-tour-tam-coc-hoa-lu-2n1d.jpg'),
    ('tour-trang-an-hang-sang-hang-toi-1-ngay', '/uploads/images/wiki-tour-tour-trang-an-hang-sang-hang-toi-1-ngay.jpg'),
    ('tour-trang-an-hanh-cung-vu-lam-nua-ngay', '/uploads/images/wiki-tour-tour-trang-an-hanh-cung-vu-lam-nua-ngay.jpg'),
    ('tour-di-san-trang-an-hoa-lu-tam-coc-3n2d', '/uploads/images/wiki-tour-tour-di-san-trang-an-hoa-lu-tam-coc-3n2d.jpg'),
    ('tour-hang-dong-trang-an-1-ngay', '/uploads/images/wiki-tour-tour-hang-dong-trang-an-1-ngay.jpg'),
    ('tour-hoa-lu-bai-dinh-tam-linh-1-ngay', '/uploads/images/wiki-chua-bai-dinh-co-ninh-binh.jpg'),
    ('tour-kham-pha-hang-dong-ninh-binh-2n1d', '/uploads/images/wiki-dong-galaxy-ninh-binh.jpg'),
    ('tour-tam-coc-den-thai-vi-hang-mua-1-ngay', '/uploads/images/wiki-khu-du-lich-tam-coc-bich-dong-ninh-binh.jpg'),
    ('tour-bai-dinh-tam-coc-den-thai-vi-2n1d', '/uploads/images/wiki-chua-bai-dinh-co-ninh-binh.jpg'),
    ('tour-trang-an-hang-mua-hoa-lu-1-ngay', '/uploads/images/wiki-khu-du-lich-sinh-thai-trang-an-ninh-binh.jpg')
)
UPDATE tour_packages tp
SET
  cover_image_url = tms.cover_image_url,
  updated_at = NOW()
FROM tour_media_seed tms
WHERE tp.slug = tms.slug;

COMMIT;
