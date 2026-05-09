BEGIN;

WITH news_media_seed(slug, thumbnail_url) AS (
  VALUES
    ('bai-dinh-garden-resort-spa-nghi-duong-cao-cap-giua-long-di-san', '/uploads/images/wiki-news-bai-dinh-garden-resort-spa-nghi-duong-cao-cap-giua-long-di-san.jpg'),
    ('chua-bai-dinh-co-ngoi-chua-ngan-nam-tuoi-an-minh-trong-nui-da', '/uploads/images/wiki-news-chua-bai-dinh-co-ngoi-chua-ngan-nam-tuoi-an-minh-trong-nui-da.jpg'),
    ('co-do-hoa-lu-kinh-do-dau-tien-cua-nha-nuoc-phong-kien-viet-nam', '/uploads/images/wiki-news-co-do-hoa-lu-kinh-do-dau-tien-cua-nha-nuoc-phong-kien-viet-nam.jpg'),
    ('com-chay-ninh-binh-dac-san-ocop-4-sao-chinh-phuc-trieu-du-khach', '/uploads/images/wiki-news-com-chay-ninh-binh-dac-san-ocop-4-sao-chinh-phuc-trieu-du-khach.jpg'),
    ('den-dinh-tien-hoang-ngoi-den-tho-vi-hoang-de-dau-tien-thong-nhat-dat-nuoc', '/uploads/images/wiki-news-den-dinh-tien-hoang-ngoi-den-tho-vi-hoang-de-dau-tien-thong-nhat-dat-nuoc.jpg'),
    ('den-thai-vi-ngoi-den-tran-linh-thieng-giua-long-tam-coc', '/uploads/images/wiki-news-den-thai-vi-ngoi-den-tran-linh-thieng-giua-long-tam-coc.jpg'),
    ('den-thanh-cao-son-ngoi-den-tho-than-nui-linh-thieng', '/uploads/images/wiki-news-den-thanh-cao-son-ngoi-den-tho-than-nui-linh-thieng.jpg'),
    ('den-vua-dinh-va-den-vua-le-doi-di-tich-lich-su-ngan-nam-tai-hoa-lu', '/uploads/images/wiki-news-den-vua-dinh-va-den-vua-le-doi-di-tich-lich-su-ngan-nam-tai-hoa-lu.jpg'),
    ('dong-tien-ca-ky-quan-duoi-long-nui-tai-vung-tam-coc', '/uploads/images/wiki-news-dong-tien-ca-ky-quan-duoi-long-nui-tai-vung-tam-coc.jpg'),
    ('du-lich-ninh-binh-mua-thu-thang-9-va-10-dep-nhu-tranh-ve', '/uploads/images/wiki-news-du-lich-ninh-binh-mua-thu-thang-9-va-10-dep-nhu-tranh-ve.jpg'),
    ('huong-dan-du-lich-ninh-binh-2026-lich-trinh-3-ngay-2-dem-tron-ven', '/uploads/images/wiki-news-huong-dan-du-lich-ninh-binh-2026-lich-trinh-3-ngay-2-dem-tron-ven.jpg'),
    ('le-hoi-hoa-lu-2026-tuong-niem-1058-nam-nha-nuoc-dai-co-viet', '/uploads/images/wiki-news-le-hoi-hoa-lu-2026-tuong-niem-1058-nam-nha-nuoc-dai-co-viet.jpg'),
    ('leo-500-bac-da-len-hang-mua-toan-canh-ninh-binh-tu-tren-cao', '/uploads/images/wiki-news-leo-500-bac-da-len-hang-mua-toan-canh-ninh-binh-tu-tren-cao.jpg'),
    ('mam-tep-gia-vien-vi-que-huong-dam-da-duoc-cong-nhan-ocop-4-sao', '/uploads/images/wiki-news-mam-tep-gia-vien-vi-que-huong-dam-da-duoc-cong-nhan-ocop-4-sao.jpg'),
    ('mua-sen-no-ro-tai-ninh-binh-thang-5-den-thang-7-ruc-ro-sac-hong', '/uploads/images/wiki-news-mua-sen-no-ro-tai-ninh-binh-thang-5-den-thang-7-ruc-ro-sac-hong.jpg'),
    ('ninh-binh-lot-top-10-diem-den-hang-dau-chau-a-tripadvisor-2026', '/uploads/images/wiki-news-ninh-binh-lot-top-10-diem-den-hang-dau-chau-a-tripadvisor-2026.jpg'),
    ('nui-ngu-dong-diem-an-canh-bi-mat-dang-duoc-du-khach-ua-thich', '/uploads/images/wiki-news-nui-ngu-dong-diem-an-canh-bi-mat-dang-duoc-du-khach-ua-thich.jpg'),
    ('thung-nham-thien-duong-chim-va-hang-dong-ba-tang-ky-bi', '/uploads/images/wiki-news-thung-nham-thien-duong-chim-va-hang-dong-ba-tang-ky-bi.jpg')
)
UPDATE news n
SET
  thumbnail_url = nms.thumbnail_url,
  updated_at = NOW()
FROM news_media_seed nms
WHERE n.slug = nms.slug;

COMMIT;
