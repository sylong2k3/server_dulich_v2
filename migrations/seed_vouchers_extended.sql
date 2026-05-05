-- Extended Seed Data: Vouchers
-- Realistic promotional codes and discount strategies

BEGIN;

-- ============================================================
-- GENERAL TOURISM VOUCHERS
-- ============================================================

INSERT INTO vouchers (code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
SELECT 'NINH2026', 'Giảm 10% du lịch Ninh Bình',
'Giảm 10% cho tất cả vé vào cảnh điểm du lịch ở Ninh Bình. Áp dụng đến 31/12/2026. Không kết hợp với các khuyến mãi khác.',
'percentage', 10, 0, 1000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'NINH2026')
UNION ALL
SELECT 'XUANNB50', 'Giảm 50k lên lịch mùa Xuân',
'Giảm 50.000 VND cho các tour kết hợp Xuân tại Ninh Bình. Áp dụng từ 01/01 - 31/03/2026. Giá tối thiểu 1.5 triệu VND.',
'fixed_amount', 50000, 1500000, 500, '2026-01-01'::TIMESTAMP, '2026-03-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'XUANNB50')
UNION ALL
SELECT 'SUMMER30', 'Giảm 30% du lịch hè Ninh Bình',
'Giảm 30% cho du khách đi du lịch Ninh Bình vào mùa hè (tháng 6-8). Bao gồm vé vào cảnh điểm, khách sạn, nhà hàng. Tối đa giảm 500k.',
'percentage', 30, 500000, 300, '2026-06-01'::TIMESTAMP, '2026-08-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'SUMMER30')
UNION ALL
SELECT 'FAMILLE', 'Giảm 20% cho gia đình',
'Giảm 20% cho gia đình (từ 4 người trở lên) du lịch Ninh Bình. Áp dụng cho vé vào cảnh điểm, khách sạn, nhà hàng. Có thể dùng 3 lần.',
'percentage', 20, 1000000, 1000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'FAMILLE')
UNION ALL
SELECT 'LOVECOUPLE', 'Giảm 25% cho cặp đôi',
'Giảm 25% cho cặp đôi du lịch ngắm cảnh Ninh Bình. Bao gồm vé vào cảnh điểm, khách sạn, nhà hàng, tour. Cần xuất trình chứng minh là cặp đôi.',
'percentage', 25, 800000, 400, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'LOVECOUPLE');

-- ============================================================
-- SPOT-SPECIFIC VOUCHERS
-- ============================================================

INSERT INTO vouchers (code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
SELECT 'TAMCOC100', 'Giảm 100k du thuyền Tam Cốc',
'Giảm 100.000 VND cho mỗi vé du thuyền Tam Cốc (tất cả các tuyến). Áp dụng từ 02/2026 - 04/2026. Giá tối thiểu 200k.',
'fixed_amount', 100000, 200000, 800, '2026-02-01'::TIMESTAMP, '2026-04-30'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'TAMCOC100')
UNION ALL
SELECT 'HANGMUA20', 'Giảm 20% vé Hang Múa',
'Giảm 20% cho vé leo Hang Múa dành cho nhóm từ 5 người trở lên. Cần xuất trình danh sách nhóm. Áp dụng cả năm.',
'percentage', 20, 500000, 2000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'HANGMUA20')
UNION ALL
SELECT 'BAIDINH50K', 'Giảm 50k vé Chùa Bái Đính',
'Giảm 50.000 VND cho vé vào Chùa Bái Đính. Áp dụng cho du khách quốc tế, cần xuất trình hộ chiếu. Giá tối thiểu 100k.',
'fixed_amount', 50000, 100000, 1500, '2026-03-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'BAIDINH50K')
UNION ALL
SELECT 'TRAMGAN15', 'Giảm 15% du thuyền Tràng An',
'Giảm 15% cho tất cả các tuyến du thuyền Tràng An. Áp dụng cả năm, không giới hạn số lần. Tối đa giảm 300k.',
'percentage', 15, 300000, 2500, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'TRAMGAN15')
UNION ALL
SELECT 'THUNGNHAM75K', 'Giảm 75k Thung Nham & Động Vái',
'Giảm 75.000 VND cho gói vé Thung Nham + Động Vái Giờ. Giá tối thiểu 150k. Áp dụng cả năm.',
'fixed_amount', 75000, 150000, 1000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'THUNGNHAM75K');

-- ============================================================
-- ACCOMMODATION VOUCHERS
-- ============================================================

INSERT INTO vouchers (code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
SELECT 'HOTEL25', 'Giảm 25% khách sạn 4-5 sao',
'Giảm 25% giá phòng cho các khách sạn cao cấp ở Ninh Bình (Emeralda, Wyndham, Legend, Hoàng Sơn...). Tối đa giảm 1 triệu. Áp dụng cả năm, mỗi người 1 lần.',
'percentage', 25, 1000000, 1000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'HOTEL25')
UNION ALL
SELECT 'RESORT40', 'Giảm 40% resort & spa',
'Giảm 40% giá phòng cho các resort có spa tại Ninh Bình. Không bao gồm tiền spa riêng. Áp dụng cho booking trước 7 ngày.',
'percentage', 40, 800000, 500, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'RESORT40')
UNION ALL
SELECT 'HOMESTAY15', 'Giảm 15% nhà nghỉ & homestay',
'Giảm 15% cho các nhà nghỉ, homestay tại Ninh Bình. Giá tối thiểu 300k. Áp dụng cả năm.',
'percentage', 15, 300000, 3000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'HOMESTAY15');

-- ============================================================
-- EARLY BIRD & LOYALTY VOUCHERS
-- ============================================================

INSERT INTO vouchers (code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
SELECT 'EARLY20', 'Đặt sớm giảm 20%',
'Giảm 20% cho các tour, vé, khách sạn đặt trước 14 ngày. Giá tối thiểu 1 triệu. Hoàn tiền nếu hủy trước 10 ngày.',
'percentage', 20, 1000000, 2000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'EARLY20')
UNION ALL
SELECT 'LOYALTY300', 'Khách VIP giảm 300k',
'Giảm 300.000 VND cho khách hàng đã du lịch Ninh Bình 2 lần trở lên. Giá tối thiểu 2 triệu. Cần xuất trình hóa đơn du lịch trước đó.',
'fixed_amount', 300000, 2000000, 500, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'LOYALTY300')
UNION ALL
SELECT 'REPEAT15', 'Quay lại - Giảm 15%',
'Giảm 15% cho khách hàng quay lại du lịch Ninh Bình lần thứ 2 trở lên. Không giới hạn lần sử dụng. Giá tối thiểu 500k.',
'percentage', 15, 500000, 5000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'REPEAT15')
UNION ALL
SELECT 'REFERRAL100', 'Giới thiệu bạn - Giảm 100k',
'Giảm 100.000 VND khi bạn giới thiệu bạn bè đến du lịch Ninh Bình và họ sử dụng mã này. Giá tối thiểu 800k.',
'fixed_amount', 100000, 800000, 2000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'REFERRAL100');

-- ============================================================
-- SEASONAL & EVENT VOUCHERS
-- ============================================================

INSERT INTO vouchers (code, title_vi, description_vi, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, is_active, created_at)
SELECT 'TETTET35', 'Giảm 35% dịp Tết Nguyên Đán',
'Giảm 35% cho du lịch Ninh Bình vào dịp Tết Nguyên Đán (từ 20/01 - 10/02/2026). Giá tối thiểu 2 triệu. Tối đa giảm 1.5 triệu.',
'percentage', 35, 2000000, 300, '2026-01-20'::TIMESTAMP, '2026-02-10'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'TETTET35')
UNION ALL
SELECT 'MIDYEAR18', 'Giảm 18% giữa năm',
'Giảm 18% cho du lịch Ninh Bình vào giữa năm (tháng 6-7). Thích hợp cho tour hè, trại hè. Giá tối thiểu 1.5 triệu.',
'percentage', 18, 1500000, 800, '2026-06-01'::TIMESTAMP, '2026-07-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'MIDYEAR18')
UNION ALL
SELECT 'MOND100', 'Thứ Hai - Giảm 100k',
'Giảm 100.000 VND cho tour, vé vào cảnh điểm chỉ vào các ngày Thứ Hai (yên tĩnh, ít khách). Giá tối thiểu 300k.',
'fixed_amount', 100000, 300000, 1000, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'MOND100')
UNION ALL
SELECT 'SUNRISE50', 'Dậy sớm - Giảm 50k',
'Giảm 50.000 VND cho tour khám phá bình minh tại Cố Đô, Hang Múa, hoặc Thung Nham (khởi hành trước 6h sáng). Giá tối thiểu 200k.',
'fixed_amount', 50000, 200000, 1500, '2026-01-01'::TIMESTAMP, '2026-12-31'::TIMESTAMP, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE code = 'SUNRISE50');

COMMIT;
