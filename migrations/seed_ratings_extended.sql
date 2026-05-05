-- Extended Seed Data: Ratings (Comments/Reviews)
-- Realistic visitor reviews with detailed feedback

BEGIN;

-- ============================================================
-- TAM CỐC REVIEWS
-- ============================================================

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Kinh nghiệm không thể quên!',
  'Tôi đã đi Tam Cốc với gia đình và con nhỏ. Du thuyền rất an toàn, thoải mái, và những hòn núi đá vôi tuyệt đẹp. Hướng dẫn viên rất thân thiện, kỳ công giảng dạy về địa lý và lịch sử. Cảnh quan từng khung hình đều như tranh vẽ. Giá vé phải chăng so với trải nghiệm. Sẽ quay lại.',
  '2026-03-15'::DATE, 'published', true, 42
FROM tourism_spots WHERE name_vi = 'Tam Cốc'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 4,
  'Đẹp lắm nhưng vắng ít nữa thì hoàn hảo',
  'Ngôi trời đẹp, nhưng vào lúc 9h sáng thứ bảy thì quá đông. Du thuyền chặt như lò cá. Nếu muốn trải nghiệm yên tĩnh, hãy đi vào tuần hoặc sớm hơn buổi sáng. Nhân viên bến còn hơi nóng nảy. Tuy nhiên, cảnh quan không thể phủ nhận.',
  '2026-03-20'::DATE, 'published', true, 28
FROM tourism_spots WHERE name_vi = 'Tam Cốc'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Tuyệt vời! Du thuyền cả ngày cũng chưa hết!',
  'Tôi thuê thuyền cả ngày để khám phá từng hang động. Đó là quyết định tốt nhất. Hướng dẫn viên nội địa biết rất nhiều về hang động, loài chim, cây cối. Cơm trưa trong thuyền ngon tuyệt vời. Chiều tắm mát trên sông. Cảm thấy rất thư giãn và yên bình.',
  '2026-02-28'::DATE, 'published', true, 35
FROM tourism_spots WHERE name_vi = 'Tam Cốc'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 3,
  'Okay nhưng không phải tốt nhất',
  'Cảnh đẹp thực sự nhưng khá overrated. Hang động nhiều nhưng tương tự nhau. Du thuyền lâu, ngồi khá mệt. Phí tắm rửa sau du thuyền không hợp lý (100k). Nên là tốt cho lần đầu nhưng không muốn quay lại.',
  '2026-01-10'::DATE, 'published', true, 12
FROM tourism_spots WHERE name_vi = 'Tam Cốc'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Dù mưa vẫn rất tuyệt vời!',
  'Tôi lo lắng về thời tiết mưa nhưng hướng dẫn viên nói cảnh sắc còn hùng vĩ hơn khi mưa sương mù. Đúng vậy! Núi đá vôi phủ sương huyền ảo, cây cỏ xanh tươi hơn. Du thuyền an toàn, không bị ướt. Trải nghiệm tuyệt diệu!',
  '2026-03-25'::DATE, 'published', true, 31
FROM tourism_spots WHERE name_vi = 'Tam Cốc'
ON CONFLICT DO NOTHING;

-- ============================================================
-- HANG MÚA REVIEWS
-- ============================================================

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Nhìn toàn cảnh Ninh Bình từ đỉnh - Tuyệt vời!',
  'Leo Hang Múa là bắt buộc khi đến Ninh Bình. 500 bậc đá nhưng không quá khó. Từ trên đỉnh, thấy toàn bộ vùng Tam Cốc, cánh đồng lúa, sông nước, các hang động. Lúc chiều nắng vàng rất lãng mạn. Nhiều cặp đôi chụp ảnh cưới ở đây.',
  '2026-03-01'::DATE, 'published', true, 58
FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 4,
  'Đẹp nhưng lân la trên vệ đường',
  'Cảnh đẹp không chối cãi. Nhưng leo lên khá khó khăn, vệ đường hẹp và không an toàn, người già/trẻ em cần cẩn thận. Nên leo lúc sáng để tránh nắng. Không có nhà vệ sinh hoặc nước uống ở đỉnh. Mang đủ nước lên.',
  '2026-02-20'::DATE, 'published', true, 22
FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Bình minh từ đỉnh Hang Múa tuyệt diệu!',
  'Tôi dậy 5h sáng để leo Hang Múa chứng kiến bình minh. Ánh nắng vàng em lần đầu chiếu vào các hang động, cánh đồng lúa, và sông nước. Cảnh tượng như trong phim. Mang theo máy ảnh, chụp được hàng trăm tấm hình đẹp.',
  '2026-02-15'::DATE, 'published', true, 45
FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 2,
  'Quá đông, không yên bình',
  'Mặc dù đẹp nhưng lúc tôi đi lúc 10h sáng thì quá đông, chật chội. Mỗi bậc đá có người đứng chụp ảnh. Không thể lên đỉnh yên tĩnh. Hơi thất vọng. Nên đi vào sáng sớm hoặc chiều tối để tránh đông đúc.',
  '2026-03-10'::DATE, 'published', true, 8
FROM tourism_spots WHERE name_vi = 'Đường lên Hang Múa'
ON CONFLICT DO NOTHING;

-- ============================================================
-- CHÙA BÁI ĐÍNH REVIEWS
-- ============================================================

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Tâm linh và kiến trúc tuyệt vời!',
  'Chùa Bái Đính rất ấn tượng. Không chỉ to và khang trang, mà còn có không khí tâm linh rất thiêng liêng. Tượng Phật cao 80m uy nghi. Hang Phật rộng lớn với nhũ đá lung linh. Mọi nhân viên rất lịch sự. Nơi này thực sự là di tích quốc gia.',
  '2026-01-15'::DATE, 'published', true, 51
FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 4,
  'Tuyệt vời nhưng cần chuẩn bị thể chất',
  'Leo 500 bậc cầu thang không dễ, kể cả có thang máy. Hang Phật rộng và lạnh lẽo. Mang áo ấm. Nhìn toàn cảnh Cúc Phương từ trên cao rất đẹp. Có cơm chay miễn phí. Cần 2-3 giờ để khám phá đầy đủ.',
  '2026-02-10'::DATE, 'published', true, 19
FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Lịch sử 1000 năm tuổi - Phải thấy một lần!',
  'Chùa Bái Đính có lịch sử 1000 năm, là một trong những chùa lâu đời nhất Việt Nam. Mỗi chi tiết kiến trúc đều kể một câu chuyện. Hang động bên trong thực sự linh thiêng. Tôi cảm thấy rất yên bình khi ở đây.',
  '2026-01-20'::DATE, 'published', true, 38
FROM tourism_spots WHERE name_vi = 'Chùa Bái Đính cổ'
ON CONFLICT DO NOTHING;

-- ============================================================
-- KHÁCH SẠN REVIEWS
-- ============================================================

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Khách sạn 5 sao xứng đáng!',
  'Khách sạn Ninh Bình Legend rất sang trọng, phòng khách lớn và thoải mái. Nhân viên siêu thân thiện, khách sạn sạch sẽ, bữa sáng phong phú (ba-đôc, bánh mì, cơm, cháo...). Hồ bơi ngoài trời đẹp. Vị trí gần các điểm du lịch chính. Giá khá hợp lý cho 5 sao.',
  '2026-01-20'::DATE, 'published', true, 52
FROM tourism_spots WHERE name_vi = 'Khách sạn Ninh Bình Legend'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 4,
  'Tốt nhưng hơi ồn ào',
  'Khách sạn tốt, view đẹp ra sông. Nhân viên chuyên nghiệp. Tuy nhiên, ban đêm hơi ồn do nhạc từ các quán bar gần đó, hoặc tiếng giao thông. Nếu chọn phòng phía sau sẽ yên tĩnh hơn. Điều hòa hơi yếu, cần nhờ nhân viên thay filter.',
  '2026-02-15'::DATE, 'published', true, 16
FROM tourism_spots WHERE name_vi = 'Khách sạn Ninh Bình Legend'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Resort sang trọng, giá hợp lý',
  'Emeralda Tam Cốc Resort rất đẹp, từng phòng đều view ra sông và núi đá vôi. Spa xịn xò, masseur giỏi. Nhà hàng ngon, đồ ăn tươi. Có sân bay thuyền du lịch riêng. Berpool xanh sạch. Nhân viên lịch sự. Giá khá tốt so với chất lượng.',
  '2026-03-05'::DATE, 'published', true, 48
FROM tourism_spots WHERE name_vi = 'Emeralda Tam Cốc Resort'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Quá tuyệt vời! Sẽ quay lại với bạn bè',
  'Wyndham Grand Vedana Ninh Binh Resort là khách sạn tốt nhất tôi từng ở tại Ninh Bình. Phòng rộng, tiện nghi hiện đại, tử tế. Nhân viên rất chuyên nghiệp, chu đáo. Bữa sáng phong phú. Hồ bơi và spa tuyệt vời. Vị trí yên tĩnh nhưng gần các điểm du lịch.',
  '2026-03-12'::DATE, 'published', true, 61
FROM tourism_spots WHERE name_vi = 'Wyndham Grand Vedana Ninh Binh Resort'
ON CONFLICT DO NOTHING;

-- ============================================================
-- NHÀ HÀNG REVIEWS
-- ============================================================

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 5,
  'Ẩm thực tuyệt vời, view đẹp',
  'Nhà hàng Tre Xanh có view ra Tam Cốc tuyệt đẹp, nhất là lúc chiều tắt nắng. Ẩm thực Ninh Bình chuyên biệt: dê núi, nem chua, bánh gai, cơm cháy đều ngon tuyệt vời. Rượu Kim Sơn đặc biệt. Nhân viên thân thiện, dịch vụ tốt.',
  '2026-02-20'::DATE, 'published', true, 44
FROM tourism_spots WHERE name_vi = 'Nhà hàng Tre Xanh'
ON CONFLICT DO NOTHING;

INSERT INTO ratings (spot_id, stars, title, content, visit_date, status, is_verified_visit, helpful_count)
SELECT id, 4,
  'Ngon nhưng chút hơi đắt',
  'Nhà hàng đắt tiền nhưng chất lượng tương xứng. Dê núi tươi, nấu nước dùng rất ngon. Bánh gai xích tơ ngon lắm. Tuy nhiên, giá 1 người ~500k nếu ăn khoảng 3-4 món. Còn khá mắc so với các nhà hàng khác ở Ninh Bình.',
  '2026-03-01'::DATE, 'published', true, 18
FROM tourism_spots WHERE name_vi = 'Nhà hàng Tre Xanh'
ON CONFLICT DO NOTHING;

COMMIT;
