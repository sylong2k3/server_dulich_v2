-- Migration: Update main_image_url and gallery_images for tourism_spots
-- Source: data-1777951991951.csv
-- Strategy: Delete existing image media for these spots, then re-insert from CSV data

BEGIN;

-- Helper: delete existing image records for spots that have new data
DELETE FROM spot_media
WHERE media_type = 'image'
  AND spot_id IN (
    SELECT id FROM tourism_spots WHERE name_vi IN (
      'Hang Cả','Hang Hai','Hang Ba','Hang Đại','Hang Tối','Hang Sáng',
      'Hang Nấu Rượu','Hang Ba Giọt','Hang Seo','Hang Sơn Dương',
      'Hang Quy Hậu','Hang Lấm','Hang Vạng',
      'Bến thuyền Trung tâm Tam Cốc','Bến thuyền Tràng An','Hoàng Gia',
      'Khách sạn Ninh Bình Legend','Khách sạn Hoàng Sơn','Khách sạn The Reed',
      'Khách sạn Hoa Lư','Emeralda Tam Cốc Resort','Emeralda Resort Ninh Binh',
      'Khách sạn Hidden Charm','Khách sạn Thuận Thành','Khách sạn Tuylip',
      'Khách sạn The Vissai','Wyndham Grand Vedana Ninh Binh Resort',
      'Khách xá Tam Chúc','Tam Cốc Lamontagne Resort & spa','Jiva Hoa Lư Retreat',
      'Bái Đính garden Resort & spa','Tam Cốc','Đường lên Hang Múa',
      'Đền Trình','Hành cung Vũ Lâm','Chùa Bái Đính cổ','Đền Vua Đinh',
      'Đền Vua Lê','Đền Thái Vi','Nhà hàng Tre Xanh','Núi Ngu Động',
      'Cố đô Hoa Lư','Đền Đinh Tiên Hoàng','Quần thể Chùa Tam Chúc'
    )
  );

-- ============================================================
-- INSERT statements: main image (is_primary=TRUE, sort_order=0)
--                   gallery images (is_primary=FALSE, sort_order=1,2,...)
-- ============================================================

-- Hang Cả
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/z7161972951241-bfadf9f60424a1feb60bbec294eb55e6-1761638032713-699340358.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Cả';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/images-1761638267243-747582344.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Cả';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/z7161972951241-bfadf9f60424a1feb60bbec294eb55e6-1761638267243-729557240.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Cả';

-- Hang Hai
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0016-1762274977551-49516616.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Hai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0023-1762274977591-758826418.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Hai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0017-1762274977659-867245562.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Hai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0016-1762274977698-75937158.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Hai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0011-1762274977729-932642714.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Hai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0004-1762274977761-53899877.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Hai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0005-1762274977808-398171368.JPG', FALSE, 6 FROM tourism_spots WHERE name_vi = 'Hang Hai';

-- Hang Ba
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762352476430-665596787.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Ba';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0021-1762352476470-846122668.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Ba';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0022-1762352476524-350819607.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Ba';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0023-1762352476557-628764406.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Ba';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0005-1762352476586-521154819.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Ba';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762352476609-885192725.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Ba';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762352476651-995280813.JPG', FALSE, 6 FROM tourism_spots WHERE name_vi = 'Hang Ba';

-- Hang Đại
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762351539807-494805632.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Đại';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0023-1762351539832-86031490.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Đại';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762351539873-7736851.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Đại';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0012-1762351539908-868417952.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Đại';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762351539944-643977341.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Đại';

-- Hang Tối
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/dji-20250730090900-0001-v-1762274792042-954050570.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Tối';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762274813019-737868410.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Tối';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0023-1762274813058-387061258.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Tối';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762274813099-181995146.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Tối';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0018-1762274813126-892521818.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Tối';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0016-1762274813162-576085132.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Tối';

-- Hang Sáng
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0008-1762351931355-834387654.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Sáng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762351931395-608482664.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Sáng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762351931440-800710738.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Sáng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0021-1762351931469-235060145.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Sáng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0015-1762351931516-470860067.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Sáng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0008-1762351931548-533431625.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Sáng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0007-1762351931600-445781649.JPG', FALSE, 6 FROM tourism_spots WHERE name_vi = 'Hang Sáng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762351931647-183538297.JPG', FALSE, 7 FROM tourism_spots WHERE name_vi = 'Hang Sáng';

-- Hang Nấu Rượu
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762277856585-998379298.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Nấu Rượu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762277856618-201795721.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Nấu Rượu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762277856658-746684366.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Nấu Rượu';

-- Hang Ba Giọt
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0002-1762351960495-802751728.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762351960534-405702771.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0020-1762351960587-447285991.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0021-1762351960636-274791279.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0008-1762351960671-315734790.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0006-1762351960711-75705531.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0007-1762351960736-306986934.JPG', FALSE, 6 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762351960778-130518256.JPG', FALSE, 7 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0002-1762351960817-748054839.JPG', FALSE, 8 FROM tourism_spots WHERE name_vi = 'Hang Ba Giọt';

-- Hang Seo
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0012-1762351595677-505821705.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Seo';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0014-1762351595704-644437254.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Seo';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0012-1762351595726-728067353.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Seo';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0008-1762351595764-290549198.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Seo';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762351595804-890731701.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Seo';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0002-1762351595831-773069670.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Seo';

-- Hang Sơn Dương
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762351578799-460169203.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Sơn Dương';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0014-1762351578829-416021911.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Sơn Dương';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0008-1762351578850-819017864.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Sơn Dương';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762351578881-155145122.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Sơn Dương';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0002-1762351578907-650954403.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Sơn Dương';

-- Hang Quy Hậu
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762352130936-843595544.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762352130964-176514217.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762352131007-895513787.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762352131033-373663496.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0006-1762352131065-38457000.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0003-1762352131088-105360305.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0004-1762352131108-139015935.JPG', FALSE, 6 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762352131145-850797795.JPG', FALSE, 7 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0002-1762352131171-404821707.JPG', FALSE, 8 FROM tourism_spots WHERE name_vi = 'Hang Quy Hậu';

-- Hang Lấm
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762352014049-802411237.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Lấm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0020-1762352014085-258014463.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Lấm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0017-1762352014102-41324201.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Lấm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0015-1762352014132-932547408.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Lấm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762352014159-927629468.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Lấm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762352014198-431311418.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Lấm';

-- Hang Vạng
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762352265772-827591947.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hang Vạng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762352265812-457836717.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hang Vạng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762352265857-605123547.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hang Vạng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0020-1762352265894-726054350.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hang Vạng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0003-1762352265929-876068802.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hang Vạng';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762352265952-897316424.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hang Vạng';

-- Bến thuyền Trung tâm Tam Cốc
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/unnamed-1763916136249-493292060.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Bến thuyền Trung tâm Tam Cốc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/depositphotos437663592xl-1736213457034-1763916136250-468341769.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Bến thuyền Trung tâm Tam Cốc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/tam-coc-bich-dong-mua-lua-chin3-1809-1763916136254-501191322.webp', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Bến thuyền Trung tâm Tam Cốc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/du-lich-ben-thuyen-tam-coc-1763916136256-477272338.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Bến thuyền Trung tâm Tam Cốc';

-- Bến thuyền Tràng An
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/z7161963550481-f365d49e7881a0c60a75c6149f4524c0-1761638743259-570921780.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Bến thuyền Tràng An';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0011-1762279923105-682871983.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Bến thuyền Tràng An';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0012-1762279923146-655583093.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Bến thuyền Tràng An';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762279923215-867074946.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Bến thuyền Tràng An';

-- Hoàng Gia
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/san-golf-hoang-gia4-royal-1763916006453-364528604.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hoàng Gia';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/san-golf-hoang-gia-2-1763916006455-306291904.webp', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hoàng Gia';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/sg4-1-1763916006457-540001225.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hoàng Gia';

-- Khách sạn Ninh Bình Legend
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763911918571-939515854.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách sạn Ninh Bình Legend';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-s-n-ninh-binh-legend-1763912446019-535830905.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách sạn Ninh Bình Legend';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-san-legend-ninh-binh-14-1763912446022-845794549.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách sạn Ninh Bình Legend';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-san-legend-ninh-binh-61-1763912446026-573754639.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Khách sạn Ninh Bình Legend';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/257915596-1763912446027-303358916.jpg', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Khách sạn Ninh Bình Legend';

-- Khách sạn Hoàng Sơn
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763912766106-423794949.webp', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách sạn Hoàng Sơn';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/2eb0d47e573d45a3f2d34aaf5e478207-1763912805528-863038419.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách sạn Hoàng Sơn';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/banner-1763912805528-744283205.png', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách sạn Hoàng Sơn';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/luxury-hoang-son-peace-1763912805535-480851423.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Khách sạn Hoàng Sơn';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/542156780-1763912805538-885247963.jpg', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Khách sạn Hoàng Sơn';

-- Khách sạn The Reed
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763912930804-771057887.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách sạn The Reed';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/163699906-1763912930805-366820749.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách sạn The Reed';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/643759189-1763912930807-411319010.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách sạn The Reed';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/the-reed-hotel-6088e9fd9f857-1763912930807-742839758.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Khách sạn The Reed';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-san-the-reed-ninh-binh-22481-1763912930812-21271684.jpg', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Khách sạn The Reed';

-- Khách sạn Hoa Lư
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763913017299-56932653.webp', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách sạn Hoa Lư';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/vietgoing-hwd2503073142-1763913017300-430448817.webp', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách sạn Hoa Lư';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/f15a76ff3f8c3be7ecfce931b2139960-1763913017302-254241124.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách sạn Hoa Lư';

-- Emeralda Tam Cốc Resort
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763913094536-938887938.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Emeralda Tam Cốc Resort';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/2-1763913094539-70379810.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Emeralda Tam Cốc Resort';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/download-1763913094542-648724945.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Emeralda Tam Cốc Resort';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/emeralda-resort-tam-coc-ninh-binh-49-1763913094543-32044021.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Emeralda Tam Cốc Resort';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/emeralda-resort-tam-coc-ho-boi-1763913094544-610105895.jpg', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Emeralda Tam Cốc Resort';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/emeralda-resort-tam-coc-ninh-binh-0-1763913094547-688668625.jpg', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Emeralda Tam Cốc Resort';

-- Emeralda Resort Ninh Binh
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763913540732-555239037.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Emeralda Resort Ninh Binh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/2-1763913540735-117097751.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Emeralda Resort Ninh Binh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/download-1763913540738-919868167.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Emeralda Resort Ninh Binh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/emeralda-resort-tam-coc-ninh-binh-49-1763913540739-418981148.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Emeralda Resort Ninh Binh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/emeralda-resort-tam-coc-ho-boi-1763913540740-401933062.jpg', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Emeralda Resort Ninh Binh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/emeralda-resort-tam-coc-ninh-binh-0-1763913540742-689382045.jpg', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Emeralda Resort Ninh Binh';

-- Khách sạn Hidden Charm
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763914204733-217431567.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách sạn Hidden Charm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/ninh-binh-hidden-charm-hotel---resort-5-1763914204735-410677286.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách sạn Hidden Charm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/ad4e795d-1763914204739-192282251.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách sạn Hidden Charm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/7f41ab55-1763914204740-876660671.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Khách sạn Hidden Charm';

-- Khách sạn Thuận Thành
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763914358356-565300852.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách sạn Thuận Thành';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/55104bc2936b381be94436d82ec4696d-1763914358357-863885126.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách sạn Thuận Thành';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/3a874ad0-1763914358359-661253678.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách sạn Thuận Thành';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/782a2e419af766a792634beeaa508eba-1763914358361-562293885.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Khách sạn Thuận Thành';

-- Khách sạn Tuylip
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763914468904-146623063.webp', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách sạn Tuylip';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khu-cong-vien-nu-c-c-1763914468906-802584348.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách sạn Tuylip';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-san-tulip-ninh-binh-5-1763914468907-128196690.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách sạn Tuylip';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-san-tulip-ninh-binh-14-1763914468909-447470858.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Khách sạn Tuylip';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/11-1763914468911-545548182.jpg', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Khách sạn Tuylip';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-san-tulip-ninh-binh-2-1763914468914-628369611.jpg', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Khách sạn Tuylip';

-- Khách sạn The Vissai
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763914759085-128479605.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách sạn The Vissai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-san-the-vissai-ninh-binh-9-1763914759089-407003629.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách sạn The Vissai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/587943161-1763914759092-687148201.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách sạn The Vissai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/587943158-1763914759093-587556400.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Khách sạn The Vissai';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/vietgoing-rfm2112298384-1763914759094-785671346.webp', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Khách sạn The Vissai';

-- Wyndham Grand Vedana Ninh Binh Resort
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763914869944-64840711.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Wyndham Grand Vedana Ninh Binh Resort';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/350435161-1763914869947-649599730.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Wyndham Grand Vedana Ninh Binh Resort';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/unnamed-1763914869948-420683606.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Wyndham Grand Vedana Ninh Binh Resort';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/be-boi-vedana-ninh-binh-1763914869960-395609815.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Wyndham Grand Vedana Ninh Binh Resort';

-- Khách xá Tam Chúc
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763915089997-133987447.webp', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Khách xá Tam Chúc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/vietgoing-pfc2205067929-1763915090000-230175434.webp', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Khách xá Tam Chúc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/khach-xa-tam-chuc-2-1763915090003-260584157.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Khách xá Tam Chúc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/dsc03234-hdr-min-1763915090004-426758895.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Khách xá Tam Chúc';

-- Tam Cốc Lamontagne Resort & spa
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/tong-quan-1-134869-1763915800518-275540207.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Tam Cốc Lamontagne Resort & spa';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/tong-quan-1-134869-1763915800520-573479022.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Tam Cốc Lamontagne Resort & spa';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/tam-coc-la-montagne-resort-ninh-binh-set-up-tiec-1763915800523-399349057.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Tam Cốc Lamontagne Resort & spa';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/f3fa3eb52179be78542728c1608a321c-1763915800525-665595337.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Tam Cốc Lamontagne Resort & spa';

-- Jiva Hoa Lư Retreat
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/download-1763915562114-951951406.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Jiva Hoa Lư Retreat';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/jiva-hoa-lu-retreat-ninh-binh-phong-nghi-1763915616110-816752679.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Jiva Hoa Lư Retreat';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/9e71c010-1763915616111-930252170.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Jiva Hoa Lư Retreat';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/13c1af80-1763915616113-383191986.webp', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Jiva Hoa Lư Retreat';

-- Bái Đính garden Resort & spa
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/bai-dinh-garden-resort-spa-ninh-binh-1763915157648-286271977.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Bái Đính garden Resort & spa';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/bai-dinh-garden-resort-1763915157649-466132322.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Bái Đính garden Resort & spa';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/bai-dinh-garden-resort-spa-over-view-1763915157652-309180312.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Bái Đính garden Resort & spa';

-- Tam Cốc
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0012-1762278799074-290361621.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Tam Cốc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762278799111-919494737.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Tam Cốc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0018-1762278799152-505616203.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Tam Cốc';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0019-1762278799202-241919916.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Tam Cốc';

-- Đường lên Hang Múa
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/z7161947971391-64028ce6d9160a1fed960c6041e5b62a-1761638840504-346228749.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/z7161947493349-23569bc3cf962cc76727f063e576a10e-1761638840510-427726358.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/z7161946226729-2324bb80e930bc956d8dd8efad9b6d7c-1761638840525-300236639.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/z7161945906712-76b940e86791fb02c0f55c265889cb76-1761638840530-833325380.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa';

-- Đền Trình
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762351370618-221467346.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Đền Trình';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0022-1762351370687-940629168.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Đền Trình';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0023-1762351370786-111332277.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Đền Trình';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0005-1762351370830-271973927.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Đền Trình';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0025-1762351370882-150832354.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Đền Trình';

-- Hành cung Vũ Lâm
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0006-1762351487516-262471135.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0017-1762351487549-847849540.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0013-1762351487594-719200865.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0008-1762351487626-76597386.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762351487660-130768721.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0006-1762351487696-767259116.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762351487719-94441412.JPG', FALSE, 6 FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0005-1762351487777-102856966.JPG', FALSE, 7 FROM tourism_spots WHERE name_vi = 'Hành cung Vũ Lâm';

-- Chùa Bái Đính cổ
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/bai-dinh1-1761584791526-165590071.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/5-1761584791573-293369934.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/bai-dinh2-1761584791604-695623853.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/dsc-5387---copy-1761584791635-359978275.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ';

-- Đền Vua Đinh
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0006-1762352332091-749371257.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Đền Vua Đinh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0019-1762352332134-909685814.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Đền Vua Đinh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0015-1762352332164-710339413.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Đền Vua Đinh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0013-1762352332215-632028.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Đền Vua Đinh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0012-1762352332267-921795368.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Đền Vua Đinh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762352332297-188230571.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Đền Vua Đinh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0006-1762352332326-74349377.JPG', FALSE, 6 FROM tourism_spots WHERE name_vi = 'Đền Vua Đinh';

-- Đền Vua Lê
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0021-1761638459153-738657609.JPG', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Đền Vua Lê';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0023-1762351459946-303012631.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Đền Vua Lê';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0024-1762351459993-513223041.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Đền Vua Lê';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0017-1762351460018-118456699.JPG', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Đền Vua Lê';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0009-1762351460063-152422276.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Đền Vua Lê';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0002-1762351460102-867956030.JPG', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Đền Vua Lê';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/pano0001-1762351460111-916550645.JPG', FALSE, 6 FROM tourism_spots WHERE name_vi = 'Đền Vua Lê';

-- Đền Thái Vi
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/2-1761545655185-488518082-1761545855761-924786078.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Đền Thái Vi';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/-dsc2840-1761545655151-760821805.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Đền Thái Vi';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/2-1761545655185-488518082.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Đền Thái Vi';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/den-thai-vi-1761545655187-395113927.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Đền Thái Vi';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/den-thai-vi1-1761545655224-365814599.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Đền Thái Vi';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/dsc-1610-1761545655238-552697028.jpg', FALSE, 5 FROM tourism_spots WHERE name_vi = 'Đền Thái Vi';

-- Nhà hàng Tre Xanh
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/287035366-782572176447675-6982131780479620170-n-1763909817785-499918857.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Nhà hàng Tre Xanh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/1-1763910276375-20174897.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Nhà hàng Tre Xanh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/2-1763910276375-901325204.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Nhà hàng Tre Xanh';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/download-1763910276376-139838665.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Nhà hàng Tre Xanh';

-- Núi Ngu Động
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/4-1761546189886-324080610.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Núi Ngu Động';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/5-1761546189902-111979906.JPG', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Núi Ngu Động';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/7-1761546189932-470873858.jpg', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Núi Ngu Động';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/baidinh-1761546189946-676062916.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Núi Ngu Động';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/chuabaidinh-1761546189967-426200237.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Núi Ngu Động';

-- Cố đô Hoa Lư
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/3-1761546678002-657162188.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Cố đô Hoa Lư';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/4-1761546678058-846221790.jpg', FALSE, 1 FROM tourism_spots WHERE name_vi = 'Cố đô Hoa Lư';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/5-1761546678081-218506846.JPG', FALSE, 2 FROM tourism_spots WHERE name_vi = 'Cố đô Hoa Lư';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/7-1761546678126-760893246.jpg', FALSE, 3 FROM tourism_spots WHERE name_vi = 'Cố đô Hoa Lư';
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/dsc-1220-1761546678134-634758036.JPG', FALSE, 4 FROM tourism_spots WHERE name_vi = 'Cố đô Hoa Lư';

-- Đền Đinh Tiên Hoàng (main image only, no gallery)
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/images-1761721791666-966734956.jpg', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Đền Đinh Tiên Hoàng';

-- Quần thể Chùa Tam Chúc (main image only, no gallery)
INSERT INTO spot_media (spot_id, media_type, url, is_primary, sort_order)
SELECT id, 'image', '/uploads/images/207137d2da2ec63dac95c28df48dfa20-1766565527124-435938442.webp', TRUE, 0 FROM tourism_spots WHERE name_vi = 'Quần thể Chùa Tam Chúc';

COMMIT;
