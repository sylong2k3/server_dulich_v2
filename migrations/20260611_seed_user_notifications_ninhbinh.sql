-- ============================================================
-- Seed thông báo (notifications) thực tế theo từng user_id
-- Bối cảnh: Du lịch tỉnh Ninh Bình (province_code = 37)
-- Tham chiếu UUID điểm du lịch & lễ hội CÓ THẬT trong database.
--
-- Đối tượng nhận theo vai trò:
--   - Khách du lịch (kakabui17)        : lễ hội, thời tiết, ưu đãi, ùn tắc, cảnh báo, mẹo lịch trình
--   - ĐV vận hành Tràng An             : cảnh báo sức chứa, phản ánh, báo cáo điểm
--   - Công ty lữ hành Tràng An         : điều phối đoàn, lễ hội, chính sách giá, báo cáo
--   - ĐV dịch vụ Tam Cốc               : trạng thái hồ sơ DN, báo cáo dịch vụ, phản ánh
--   - Sở VHTTDL Ninh Bình              : phản ánh, hồ sơ DN chờ duyệt
--   - Bộ VHTTDL                        : báo cáo cấp tỉnh
--   - Admin                            : nhật ký hệ thống
--
-- Cơ chế chống chạy trùng: triggered_by = 'seed_ninhbinh_20260611'
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM notifications WHERE triggered_by = 'seed_ninhbinh_20260611') THEN
    RAISE NOTICE '[seed_ninhbinh_20260611] Đã seed trước đó - bỏ qua.';
    RETURN;
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- 1) KHÁCH DU LỊCH  (kakabui17@gmail.com)
  --    user_id = 50637b3e-0a86-4795-96d6-608391a2b59a
  -- ──────────────────────────────────────────────────────────
  INSERT INTO notifications
    (user_id, type, title_vi, body_vi, data, sent_at, delivery_status, read_at, triggered_by, created_at)
  VALUES
  ('50637b3e-0a86-4795-96d6-608391a2b59a', 'festival',
   '🏯 Lễ hội Tái hiện Lịch sử Hoàng gia tại Cố đô Hoa Lư',
   'Từ 15-20/6/2026 tại Khu di tích Cố đô Hoa Lư diễn ra lễ rước kiệu và tái hiện nghi lễ đăng quang của vua Đinh Tiên Hoàng. Vào cửa miễn phí.',
   '{"spot_id":"64393e71-ff15-4d26-a468-08503702d42b","event_id":"ac599de6-fa44-42f5-a3c7-e7b90e9d651c"}'::jsonb,
   NOW() - INTERVAL '12 hours', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '12 hours'),

  ('50637b3e-0a86-4795-96d6-608391a2b59a', 'weather',
   '🌧️ Cảnh báo mưa dông chiều tối khu vực Ninh Bình',
   'Trung tâm KTTV tỉnh dự báo chiều tối nay có mưa rào và dông, lượng mưa 20-40mm. Du khách đi thuyền Tràng An, Tam Cốc nên theo dõi thông báo tại bến.',
   '{"severity":"medium","link":"weather_alert"}'::jsonb,
   NOW() - INTERVAL '3 hours', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '3 hours'),

  ('50637b3e-0a86-4795-96d6-608391a2b59a', 'festival',
   '🎶 Festival Âm nhạc & Du thuyền Tràng An (1-10/7)',
   'Lần đầu tổ chức chuỗi đêm nhạc trên sông kết hợp du thuyền tại Khu du lịch sinh thái Tràng An. Vé sớm mở bán từ 20/6.',
   '{"spot_id":"aeee9098-9540-4068-ab06-bc5faf0ecf8a","event_id":"2825f1cf-2721-4881-9427-e5f46fc15a7d"}'::jsonb,
   NOW() - INTERVAL '1 day', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '1 day'),

  ('50637b3e-0a86-4795-96d6-608391a2b59a', 'promo',
   '🎟️ Combo vé Tràng An + Hang Múa tiết kiệm 15%',
   'Đặt combo tham quan Khu du lịch sinh thái Tràng An và leo Hang Múa trong tháng 6, tiết kiệm tới 90.000đ/khách. Vé điện tử gửi về email.',
   '{"discount":15,"spot_id":"aeee9098-9540-4068-ab06-bc5faf0ecf8a"}'::jsonb,
   NOW() - INTERVAL '2 days', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '2 days'),

  ('50637b3e-0a86-4795-96d6-608391a2b59a', 'congestion',
   '⛴️ Bến thuyền Tràng An đông khách dịp cuối tuần',
   'Dự kiến cuối tuần lượng khách tại Bến thuyền Tràng An tăng cao, thời gian chờ đò có thể tới 45 phút. Nên đến trước 8h sáng hoặc đặt vé trước qua app.',
   '{"spot_id":"179dbcbd-bc1d-422c-8588-050728111b1e"}'::jsonb,
   NOW() - INTERVAL '3 days', 'sent', NOW() - INTERVAL '2 days 20 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '3 days'),

  ('50637b3e-0a86-4795-96d6-608391a2b59a', 'alert',
   '🌲 Vườn quốc gia Cúc Phương hạn chế tham quan ban đêm',
   'Để bảo vệ động vật hoang dã, khu vực rừng nguyên sinh đóng cửa từ 18:00 đến 6:00. Tour xem đom đóm cần đăng ký trước với ban quản lý.',
   '{"spot_id":"bb0ae9ba-9613-4a2d-8975-63a775e503dc"}'::jsonb,
   NOW() - INTERVAL '5 days', 'sent', NOW() - INTERVAL '4 days 18 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '5 days'),

  ('50637b3e-0a86-4795-96d6-608391a2b59a', 'system',
   '🗺️ Gợi ý lịch trình 1 ngày khám phá Ninh Bình',
   'Sáng tham quan Tràng An, trưa thưởng thức cơm cháy - dê núi, chiều leo Hang Múa ngắm toàn cảnh Tam Cốc. App đã cập nhật tuyến đường tối ưu.',
   '{"link":"itinerary_suggest"}'::jsonb,
   NOW() - INTERVAL '8 days', 'sent', NOW() - INTERVAL '7 days 12 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '8 days');

  -- ──────────────────────────────────────────────────────────
  -- 2) ĐƠN VỊ VẬN HÀNH TRÀNG AN (trangan.site.operator@gmail.com)
  --    user_id = c722a96e-24ad-4cea-89cd-5882573724f3
  -- ──────────────────────────────────────────────────────────
  INSERT INTO notifications
    (user_id, type, title_vi, body_vi, data, sent_at, delivery_status, read_at, triggered_by, created_at)
  VALUES
  ('c722a96e-24ad-4cea-89cd-5882573724f3', 'capacity_alert',
   '⚠️ Bến thuyền Tràng An đạt 86% sức chứa',
   'Lượng khách hiện tại 4.300/5.000. Đã chạm ngưỡng cảnh báo 80%. Đề nghị tăng cường điều phối đò và phân luồng lối vào.',
   '{"type":"capacity_alert","status":"warning","spot_id":"179dbcbd-bc1d-422c-8588-050728111b1e","capacity_pct":"86.00","visitor_count":4300}'::jsonb,
   NOW() - INTERVAL '1 hour', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '1 hour'),

  ('c722a96e-24ad-4cea-89cd-5882573724f3', 'feedback_new',
   '📩 Phản ánh mới: Thiếu áo phao tại bến đò số 2 Tràng An',
   'Mức độ: Trung bình. Du khách phản ánh một số đò chưa trang bị đủ áo phao cho trẻ em tại bến đò số 2.',
   '{"priority":"medium","spot_id":"179dbcbd-bc1d-422c-8588-050728111b1e"}'::jsonb,
   NOW() - INTERVAL '5 hours', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '5 hours'),

  ('c722a96e-24ad-4cea-89cd-5882573724f3', 'capacity_alert',
   '⚠️ CẢNH BÁO: Khu du lịch sinh thái Tràng An quá tải (112%)',
   'Sức chứa đạt 112% (8.960/8.000 khách) lúc cao điểm trưa. Vui lòng tạm dừng bán vé và điều phối khách sang khung giờ chiều.',
   '{"type":"capacity_alert","status":"overloaded","spot_id":"aeee9098-9540-4068-ab06-bc5faf0ecf8a","capacity_pct":"112.00","visitor_count":8960}'::jsonb,
   NOW() - INTERVAL '2 days', 'sent', NOW() - INTERVAL '1 day 22 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '2 days'),

  ('c722a96e-24ad-4cea-89cd-5882573724f3', 'system_report',
   '📊 [Báo cáo tuần] Lượng khách Quần thể Tràng An 1/6 - 7/6/2026',
   'Tổng lượt khách trong tuần: 48.250 (+12% so với tuần trước). Cao điểm Chủ nhật 9.800 lượt. Báo cáo chi tiết đã sẵn sàng.',
   '{"period_type":"weekly","spot_id":"aeee9098-9540-4068-ab06-bc5faf0ecf8a"}'::jsonb,
   NOW() - INTERVAL '3 days', 'sent', NOW() - INTERVAL '2 days 12 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '3 days'),

  ('c722a96e-24ad-4cea-89cd-5882573724f3', 'feedback_status_updated',
   '📋 Phản ánh "Trơn trượt lối lên đền Trình" đã xử lý xong',
   'Bộ phận vận hành đã lắp thảm chống trượt và tay vịn tại lối lên đền Trình. Phản ánh được đánh dấu hoàn thành.',
   '{"status":"resolved"}'::jsonb,
   NOW() - INTERVAL '6 days', 'sent', NOW() - INTERVAL '5 days 20 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '6 days');

  -- ──────────────────────────────────────────────────────────
  -- 3) CÔNG TY LỮ HÀNH TRÀNG AN (trangan.heritage.travel@gmail.com)
  --    user_id = 9a3f422e-1564-44f6-ac33-2f15bd2e65a3
  -- ──────────────────────────────────────────────────────────
  INSERT INTO notifications
    (user_id, type, title_vi, body_vi, data, sent_at, delivery_status, read_at, triggered_by, created_at)
  VALUES
  ('9a3f422e-1564-44f6-ac33-2f15bd2e65a3', 'congestion',
   '⛴️ Khuyến nghị điều phối đoàn: Tràng An đông cuối tuần',
   'Dự báo cuối tuần Bến thuyền Tràng An quá tải. Đề nghị các công ty lữ hành dời lịch tham quan sang sáng sớm hoặc chuyển sang tuyến Tam Cốc - Bích Động.',
   '{"spot_id":"179dbcbd-bc1d-422c-8588-050728111b1e"}'::jsonb,
   NOW() - INTERVAL '6 hours', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '6 hours'),

  ('9a3f422e-1564-44f6-ac33-2f15bd2e65a3', 'festival',
   '🏯 Cơ hội xây tour: Lễ hội Tái hiện Lịch sử Hoàng gia (15-20/6)',
   'Lễ hội tại Cố đô Hoa Lư là điểm nhấn xây dựng tour văn hóa hè 2026. Ban tổ chức hỗ trợ đăng ký đoàn trên 20 khách.',
   '{"spot_id":"64393e71-ff15-4d26-a468-08503702d42b","event_id":"ac599de6-fa44-42f5-a3c7-e7b90e9d651c"}'::jsonb,
   NOW() - INTERVAL '1 day', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '1 day'),

  ('9a3f422e-1564-44f6-ac33-2f15bd2e65a3', 'promo',
   '🎟️ Chính sách giá vé nhóm dịp hè 2026',
   'BQL Quần thể Tràng An áp dụng giảm 10% vé tham quan cho đoàn từ 30 khách đặt trước qua hệ thống. Áp dụng từ 15/6/2026.',
   '{"discount":10}'::jsonb,
   NOW() - INTERVAL '2 days', 'sent', NOW() - INTERVAL '1 day 18 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '2 days'),

  ('9a3f422e-1564-44f6-ac33-2f15bd2e65a3', 'system_report',
   '📊 [Báo cáo tháng] Hoạt động lữ hành tháng 5/2026',
   'Công ty lữ hành Tràng An: 42 tour, 1.180 lượt khách, doanh thu ước tính tăng 8% so với tháng 4. Xem chi tiết trong mục Báo cáo.',
   '{"period_type":"monthly","business_id":"e7a5a7ad-6e1a-4d71-8baf-eafe7a6812ed"}'::jsonb,
   NOW() - INTERVAL '4 days', 'sent', NOW() - INTERVAL '3 days 12 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '4 days');

  -- ──────────────────────────────────────────────────────────
  -- 4) ĐƠN VỊ DỊCH VỤ TAM CỐC (tamcoc.tourism.service@gmail.com)
  --    user_id = 872e4d6e-158e-45f5-b760-390321a30c01
  -- ──────────────────────────────────────────────────────────
  INSERT INTO notifications
    (user_id, type, title_vi, body_vi, data, sent_at, delivery_status, read_at, triggered_by, created_at)
  VALUES
  ('872e4d6e-158e-45f5-b760-390321a30c01', 'business_registration',
   '🕒 Hồ sơ "Tam Cốc Lamontagne Resort & spa" đang chờ duyệt',
   'Hồ sơ đăng ký của bạn đã được tiếp nhận và đang chờ Sở VHTTDL Ninh Bình thẩm định. Thời gian xử lý dự kiến 3-5 ngày làm việc.',
   '{"business_id":"6c6de155-675f-4f5c-90df-718240fe50a7","status":"pending"}'::jsonb,
   NOW() - INTERVAL '4 hours', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '4 hours'),

  ('872e4d6e-158e-45f5-b760-390321a30c01', 'business_rejected',
   '⛔ "Emeralda Tam Cốc Resort" đã bị tạm ngưng hoạt động',
   'Cơ sở bị tạm ngưng do thiếu giấy chứng nhận PCCC còn hiệu lực. Vui lòng bổ sung hồ sơ để được khôi phục hoạt động.',
   '{"business_id":"295e24d5-c574-462e-bf59-345947412345","status":"suspended"}'::jsonb,
   NOW() - INTERVAL '1 day', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '1 day'),

  ('872e4d6e-158e-45f5-b760-390321a30c01', 'feedback_status_updated',
   '📋 Phản ánh về giá dịch vụ chèo thuyền đã được phản hồi',
   'Phản ánh của du khách về phụ thu chèo thuyền tại Tam Cốc đã được xử lý. Bảng giá dịch vụ đã được niêm yết công khai tại bến.',
   '{"status":"resolved","spot_id":"b41fc495-e247-4bfd-8795-0eefa8ea70ee"}'::jsonb,
   NOW() - INTERVAL '3 days', 'sent', NOW() - INTERVAL '2 days 16 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '3 days'),

  ('872e4d6e-158e-45f5-b760-390321a30c01', 'system_report',
   '📊 [Báo cáo tuần] Hiệu suất dịch vụ Tam Cốc 1/6 - 7/6/2026',
   'Trung tâm dịch vụ du lịch Tam Cốc: công suất phòng 78%, đánh giá trung bình 4.6/5. Báo cáo chi tiết đã sẵn sàng.',
   '{"period_type":"weekly","business_id":"a30ac047-d7c8-4beb-a481-637f429ad06c"}'::jsonb,
   NOW() - INTERVAL '5 days', 'sent', NOW() - INTERVAL '4 days 12 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '5 days');

  -- ──────────────────────────────────────────────────────────
  -- 5) SỞ VHTTDL NINH BÌNH (sovhttdl.ninhbinh@gmail.com)
  --    user_id = ff134c2d-5841-4181-8feb-395d14239930
  -- ──────────────────────────────────────────────────────────
  INSERT INTO notifications
    (user_id, type, title_vi, body_vi, data, sent_at, delivery_status, read_at, triggered_by, created_at)
  VALUES
  ('ff134c2d-5841-4181-8feb-395d14239930', 'feedback_new',
   '📩 Phản ánh mới: Hàng rong chèo kéo khách tại Tam Cốc',
   'Mức độ: Cao. Du khách phản ánh tình trạng bán hàng rong đeo bám tại Bến thuyền Trung tâm Tam Cốc dịp cuối tuần.',
   '{"priority":"high","spot_id":"1e393854-2a47-4d01-8679-4fef6b0d6765"}'::jsonb,
   NOW() - INTERVAL '7 hours', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '7 hours'),

  ('ff134c2d-5841-4181-8feb-395d14239930', 'business_registration',
   '🏢 Doanh nghiệp mới chờ thẩm định: Tam Cốc Lamontagne Resort & spa',
   'Cơ sở lưu trú "Tam Cốc Lamontagne Resort & spa" vừa nộp hồ sơ đăng ký, đang chờ Sở phê duyệt.',
   '{"business_id":"6c6de155-675f-4f5c-90df-718240fe50a7"}'::jsonb,
   NOW() - INTERVAL '4 hours', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '4 hours');

  -- ──────────────────────────────────────────────────────────
  -- 6) BỘ VHTTDL (bovhttdl.vietnam@gmail.com)
  --    user_id = d01b2107-83ae-4abb-ab29-9f24ef286876
  -- ──────────────────────────────────────────────────────────
  INSERT INTO notifications
    (user_id, type, title_vi, body_vi, data, sent_at, delivery_status, read_at, triggered_by, created_at)
  VALUES
  ('d01b2107-83ae-4abb-ab29-9f24ef286876', 'system_report',
   '📊 [Báo cáo tháng] Du lịch Ninh Bình tháng 5/2026',
   'Ninh Bình đón hơn 720.000 lượt khách trong tháng 5/2026, doanh thu du lịch ước đạt 1.250 tỷ đồng. Tràng An và Tam Cốc dẫn đầu lượt khách.',
   '{"period_type":"monthly","province_code":"37"}'::jsonb,
   NOW() - INTERVAL '2 days', 'sent', NULL, 'seed_ninhbinh_20260611', NOW() - INTERVAL '2 days');

  -- ──────────────────────────────────────────────────────────
  -- 7) ADMIN (admin@gmail.com)
  --    user_id = f4f1919a-bc43-4266-8f7c-89045c58cd86
  -- ──────────────────────────────────────────────────────────
  INSERT INTO notifications
    (user_id, type, title_vi, body_vi, data, sent_at, delivery_status, read_at, triggered_by, created_at)
  VALUES
  ('f4f1919a-bc43-4266-8f7c-89045c58cd86', 'system',
   '🛡️ Sao lưu cơ sở dữ liệu định kỳ hoàn tất',
   'Bản sao lưu tự động lúc 02:00 hôm nay đã hoàn tất thành công. Dung lượng 2,4 GB, đã lưu trữ an toàn.',
   '{"link":"backup_log"}'::jsonb,
   NOW() - INTERVAL '9 hours', 'sent', NOW() - INTERVAL '8 hours', 'seed_ninhbinh_20260611', NOW() - INTERVAL '9 hours');

  RAISE NOTICE '[seed_ninhbinh_20260611] Seed thông báo Ninh Bình hoàn tất.';
END $$;
