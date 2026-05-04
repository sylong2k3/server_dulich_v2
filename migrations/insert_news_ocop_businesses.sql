-- ============================================================
-- MIGRATION: insert_news_ocop_businesses.sql
-- Mục đích : Thêm dữ liệu mẫu cho businesses, ocop_products, news
--             dựa trên 23 điểm du lịch có slug đã được sửa bởi fix_slug_d_char.sql.
-- Phụ thuộc: fix_slug_d_char.sql, insert_tourism_spots_from_csv.sql
-- Tác giả  : auto-generated seed — 2026-05-03
-- Ghi chú  : Idempotent — dùng ON CONFLICT DO NOTHING cho tất cả bảng.
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: BUSINESSES (10 doanh nghiệp tiêu biểu Ninh Bình)
-- ============================================================

INSERT INTO businesses (
    id,
    province_code,
    business_name,
    business_code,
    business_type,
    description_vi,
    description_en,
    phone,
    email,
    website,
    address_vi,
    geom,
    status,
    approved_at,
    rating_avg,
    rating_count
) VALUES

-- 1. Sản xuất cơm cháy
(
    '550ba000-e29b-41d4-a716-000000000001'::uuid,
    '37',
    'HTX Cơm Cháy Thành Nhân',
    'HTX-NB-001',
    'san_xuat',
    'HTX Cơm Cháy Thành Nhân chuyên sản xuất cơm cháy truyền thống Ninh Bình – đặc sản OCOP 4 sao nức tiếng cả nước. Sản phẩm được làm từ gạo tẻ địa phương, trải qua quy trình nấu, ép và chiên tự nhiên, giữ nguyên vị thơm dẻo đặc trưng. Cơ sở sản xuất đạt tiêu chuẩn VSATTP, xuất khẩu sang nhiều thị trường trong và ngoài nước.',
    'Thanh Nhan Crispy Rice Cooperative specializes in producing traditional Ninh Binh crispy rice (Com Chay) – a 4-star OCOP certified specialty. Made from local rice with natural frying process, the product retains its distinctive aroma. The facility meets food safety standards and exports to domestic and international markets.',
    '0229 3871 234',
    'comchay.thanhnhan@gmail.com',
    'https://comchaythanhnhan.vn',
    'Khu công nghiệp Gián Khẩu, Gia Viễn, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.857, 20.381), 4326),
    'approved',
    NOW(),
    4.7,
    312
),

-- 2. Sản xuất mắm tép
(
    '550ba000-e29b-41d4-a716-000000000002'::uuid,
    '37',
    'Cơ Sở Mắm Tép Bà Quý Gia Viễn',
    'CS-NB-002',
    'san_xuat',
    'Cơ sở Mắm Tép Bà Quý có hơn 30 năm kinh nghiệm sản xuất mắm tép theo công thức gia truyền tại huyện Gia Viễn. Mắm tép được chế biến từ tép đồng tươi đánh bắt ngay tại vùng sông Hoàng Long, ủ muối theo đúng tỷ lệ truyền thống, tạo ra hương vị đặc trưng không lẫn đâu được. Sản phẩm đạt chứng nhận OCOP 4 sao tỉnh Ninh Bình.',
    'Ba Quy Shrimp Paste Facility has over 30 years of experience producing traditional shrimp paste in Gia Vien district. Made from fresh field shrimps caught in the Hoang Long river area, fermented with traditional salt ratios. The product holds the 4-star OCOP certification of Ninh Binh province.',
    '0229 3853 567',
    'mamtep.bauy@gmail.com',
    NULL,
    'Xã Gia Phong, Gia Viễn, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.843, 20.395), 4326),
    'approved',
    NOW(),
    4.8,
    245
),

-- 3. Rượu Kim Sơn
(
    '550ba000-e29b-41d4-a716-000000000003'::uuid,
    '37',
    'Công Ty TNHH Rượu Kim Sơn',
    'TNHH-NB-003',
    'san_xuat',
    'Công ty TNHH Rượu Kim Sơn kế thừa nghề nấu rượu truyền thống hơn 100 năm của vùng đất Kim Sơn. Rượu Kim Sơn được cất từ gạo nếp cái hoa vàng trồng tại vùng đất mặn Kim Sơn, kết hợp men lá gia truyền, tạo ra hương vị thơm nồng đặc trưng. Hiện nay công ty cung cấp nhiều dòng sản phẩm: rượu trắng, rượu ngâm thảo dược và rượu vang địa phương. Sản phẩm đạt OCOP 4 sao.',
    'Kim Son Liquor Company inherits a 100-year-old traditional distilling craft from the Kim Son region. Distilled from glutinous rice grown in Kim Son''s saline soil using traditional herbal yeast, creating a distinctive aroma. Product portfolio includes white liquor, herbal-infused liquor, and local wine. 4-star OCOP certified.',
    '0229 3862 999',
    'ruou.kimson@gmail.com',
    'https://ruoukimson.vn',
    'Thị trấn Phát Diệm, Kim Sơn, Ninh Bình',
    ST_SetSRID(ST_MakePoint(106.083, 20.052), 4326),
    'approved',
    NOW(),
    4.6,
    188
),

-- 4. Thêu ren Văn Lâm
(
    '550ba000-e29b-41d4-a716-000000000004'::uuid,
    '37',
    'Làng Nghề Thêu Ren Văn Lâm',
    'LN-NB-004',
    'san_xuat',
    'Làng nghề thêu ren Văn Lâm tại Ninh Hải – Hoa Lư có lịch sử hơn 700 năm, nổi tiếng với những sản phẩm thêu tay tinh xảo. Các nghệ nhân lành nghề tạo ra tranh thêu, khăn trải bàn, áo dài thêu và đồ lưu niệm xuất khẩu đi hơn 40 quốc gia. Sản phẩm thêu ren Văn Lâm đã được UNESCO công nhận là di sản văn hóa phi vật thể. Đạt chứng nhận OCOP 4 sao.',
    'Van Lam Embroidery Village in Ninh Hai – Hoa Lu has a 700-year history renowned for exquisite handmade embroidery. Skilled artisans create embroidered paintings, tablecloths, ao dai, and souvenirs exported to over 40 countries. Recognized by UNESCO as intangible cultural heritage. 4-star OCOP certified.',
    '0229 3871 456',
    'theurenvaniam@gmail.com',
    'https://theurenvaniam.vn',
    'Thôn Văn Lâm, Xã Ninh Hải, Hoa Lư, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.891, 20.262), 4326),
    'approved',
    NOW(),
    4.9,
    423
),

-- 5. Mật ong Nho Quan
(
    '550ba000-e29b-41d4-a716-000000000005'::uuid,
    '37',
    'HTX Mật Ong Rừng Nho Quan',
    'HTX-NB-005',
    'san_xuat',
    'HTX Mật Ong Rừng Nho Quan khai thác và sản xuất mật ong thuần tự nhiên từ các đàn ong nuôi trong rừng nguyên sinh Cúc Phương – Nho Quan. Mật ong đa hoa, mật ong nhãn, mật ong tràm và phấn hoa rừng là những sản phẩm chủ lực. Toàn bộ quy trình khai thác không sử dụng kháng sinh, đảm bảo sạch và an toàn. Đạt OCOP 4 sao.',
    'Nho Quan Forest Honey Cooperative harvests and produces pure natural honey from beehives kept in the primeval forests of Cuc Phuong – Nho Quan. Main products include polyfloral honey, longan honey, cajuput honey, and forest bee pollen. Antibiotic-free process. 4-star OCOP certified.',
    '0229 3835 178',
    'matongnhoquan@gmail.com',
    NULL,
    'Xã Kỳ Phú, Nho Quan, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.732, 20.344), 4326),
    'approved',
    NOW(),
    4.7,
    156
),

-- 6. Nhà hàng gần Cố Đô Hoa Lư
(
    '550ba000-e29b-41d4-a716-000000000006'::uuid,
    '37',
    'Nhà Hàng Dê Núi Cố Đô',
    'NH-NB-006',
    'nha_hang',
    'Nhà Hàng Dê Núi Cố Đô tọa lạc ngay tại cổng Khu Di Tích Cố Đô Hoa Lư, phục vụ các món đặc sản từ dê núi Ninh Bình: tái dê, dê xào lăn, lòng dê nướng, cháo dê và nhiều món khác. Nhà hàng có sức chứa 200 khách, không gian thoáng mát, view hướng ra cánh đồng và dãy núi đá vôi hùng vĩ. Thích hợp cho các đoàn khách du lịch và tiệc gia đình.',
    'De Nui Co Do Restaurant is located right at the gate of Hoa Lu Ancient Capital, serving Ninh Binh mountain goat specialties: raw goat, stir-fried goat, grilled goat intestines, goat porridge and more. Capacity 200 guests with panoramic views of rice fields and limestone mountains. Ideal for tour groups and family gatherings.',
    '0229 3873 666',
    'nhahang.denui.codo@gmail.com',
    NULL,
    'Đường vào Khu Di Tích Cố Đô Hoa Lư, Trường Yên, Hoa Lư, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.884, 20.278), 4326),
    'approved',
    NOW(),
    4.5,
    678
),

-- 7. Công ty du lịch Tràng An
(
    '550ba000-e29b-41d4-a716-000000000007'::uuid,
    '37',
    'Công Ty Du Lịch Tràng An Xanh',
    'TNHH-NB-007',
    'lu_hanh',
    'Công ty Du Lịch Tràng An Xanh cung cấp dịch vụ du thuyền sinh thái, hướng dẫn tham quan các tuyến Tràng An, Tam Cốc – Bích Động và Cố Đô Hoa Lư. Đội ngũ thuyền viên lành nghề, am hiểu lịch sử văn hóa địa phương. Cung cấp thêm dịch vụ thuê xe đạp khám phá vùng nông thôn, cắm trại sinh thái và tổ chức tour theo nhóm. Cam kết du lịch có trách nhiệm với môi trường.',
    'Trang An Xanh Tourism Company provides eco-boat tours, guided tours along Trang An, Tam Coc – Bich Dong and Hoa Lu routes. Experienced boatmen with deep local cultural knowledge. Additional services: bicycle rental for rural exploration, eco-camping, and group tour packages. Committed to responsible environmental tourism.',
    '0229 3812 345',
    'tranganxanh.tour@gmail.com',
    'https://tranganxanh.vn',
    'Bến Thuyền Tràng An, Ninh Hải, Hoa Lư, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.748, 20.231), 4326),
    'approved',
    NOW(),
    4.6,
    891
),

-- 8. Nhà hàng Cơm Cháy gần Hang Mua
(
    '550ba000-e29b-41d4-a716-000000000008'::uuid,
    '37',
    'Nhà Hàng Cơm Cháy Tam Cốc',
    'NH-NB-008',
    'nha_hang',
    'Nhà Hàng Cơm Cháy Tam Cốc nằm trên trục đường chính vào khu Tam Cốc – Bích Động, phục vụ đặc sản cơm cháy Ninh Bình kết hợp với thịt dê núi, thịt bê thui, nộm hoa chuối và các món rau sạch địa phương. Sức chứa 300 khách, có bãi giữ xe rộng rãi, phù hợp với đoàn khách đông. Mở cửa từ 7:00 – 21:00 hàng ngày.',
    'Com Chay Tam Coc Restaurant is located on the main road to Tam Coc – Bich Dong, serving Ninh Binh crispy rice specialty combined with mountain goat, grilled veal, banana blossom salad and local vegetables. Capacity 300 guests with large parking. Open 7:00–21:00 daily.',
    '0229 3829 888',
    'comchay.tamcoc@gmail.com',
    NULL,
    'Đường Tam Cốc, Ninh Hải, Hoa Lư, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.889, 20.217), 4326),
    'approved',
    NOW(),
    4.4,
    534
),

-- 9. Khu du lịch sinh thái Bái Đính
(
    '550ba000-e29b-41d4-a716-000000000009'::uuid,
    '37',
    'Công Ty TNHH Du Lịch Tâm Linh Bái Đính',
    'TNHH-NB-009',
    'khu_du_lich',
    'Công ty TNHH Du Lịch Tâm Linh Bái Đính khai thác và vận hành dịch vụ du lịch tâm linh tại quần thể chùa Bái Đính và Chùa Bái Đính Cổ. Cung cấp xe điện tham quan nội khu, dịch vụ hướng dẫn viên tâm linh, nhà hàng chay và mặn, cửa hàng lưu niệm, lễ cầu an và dịch vụ hội nghị – sự kiện. Đây là đơn vị vận hành chuyên nghiệp tại một trong những quần thể chùa lớn nhất Đông Nam Á.',
    'Bai Dinh Spiritual Tourism Company operates tourism services at the Bai Dinh Temple complex and ancient Bai Dinh Pagoda. Services include electric vehicle tours, spiritual guides, vegetarian and non-vegetarian restaurants, souvenir shops, prayer ceremonies, and conference/event services. Professional operator at one of Southeast Asia''s largest temple complexes.',
    '0229 3862 111',
    'dulichtamlinh.baidin@gmail.com',
    'https://baidinhtemple.com',
    'Xã Gia Sinh, Gia Viễn, Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.765, 20.335), 4326),
    'approved',
    NOW(),
    4.6,
    1247
),

-- 10. Cửa hàng đặc sản
(
    '550ba000-e29b-41d4-a716-000000000010'::uuid,
    '37',
    'Cửa Hàng Đặc Sản Ninh Bình Sạch',
    'CH-NB-010',
    'ban_le',
    'Cửa hàng Đặc Sản Ninh Bình Sạch là đầu mối bán lẻ và bán buôn các sản phẩm OCOP đặc trưng của Ninh Bình: cơm cháy, mắm tép Gia Viễn, rượu Kim Sơn, mật ong Nho Quan, thêu ren Văn Lâm, cói mỹ nghệ Kim Sơn, nem chua Yên Mạc và nhiều đặc sản khác. Tất cả sản phẩm đều có nguồn gốc rõ ràng, đảm bảo chất lượng và an toàn thực phẩm. Giao hàng toàn quốc và quốc tế.',
    'Ninh Binh Sach Specialty Store is a retail and wholesale outlet for Ninh Binh''s signature OCOP products: crispy rice, Gia Vien shrimp paste, Kim Son liquor, Nho Quan honey, Van Lam embroidery, Kim Son sedge crafts, Yen Mac sour meat and more. All products are traceable, quality-assured, and food-safe. Nationwide and international delivery available.',
    '0229 3891 234',
    'dacsan.ninhbinh.sach@gmail.com',
    'https://dacsanninhbinh.vn',
    '15 Trần Hưng Đạo, Phường Thanh Bình, Thành Phố Ninh Bình',
    ST_SetSRID(ST_MakePoint(105.975, 20.258), 4326),
    'approved',
    NOW(),
    4.7,
    389
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 2: OCOP PRODUCTS (12 sản phẩm OCOP tiêu biểu)
-- ============================================================

INSERT INTO ocop_products (
    id,
    business_id,
    province_code,
    name_vi,
    name_en,
    category,
    description_vi,
    star_rating,
    certification_no,
    certified_at,
    cover_image_url,
    price_vnd,
    unit,
    producer_name,
    is_active
) VALUES

-- 1. Cơm cháy Ninh Bình (4 sao)
(
    '550cb000-e29b-41d4-a716-000000000001'::uuid,
    '550ba000-e29b-41d4-a716-000000000001'::uuid,
    '37',
    'Cơm Cháy Ninh Bình Thành Nhân',
    'Ninh Binh Crispy Rice (Com Chay)',
    'thuc_pham',
    'Cơm cháy Ninh Bình là đặc sản được làm từ cơm nấu bằng gạo tẻ hạt ngắn trồng trên đất phù sa sông Đáy. Sau khi nấu, cơm được nén chặt và phơi nắng tự nhiên rồi chiên trong dầu thực vật tinh luyện. Thành phẩm có màu vàng óng, giòn tan, thơm phức, thường ăn kèm với nước sốt cà chua và thịt bò viên hoặc tôm. Đây là món không thể thiếu trên bàn ăn của người Ninh Bình và là món quà được du khách ưa thích nhất.',
    4,
    'OCOP-NB-2023-001',
    '2023-06-15',
    'https://storage.example.com/ocop/com-chay-ninh-binh.jpg',
    85000,
    'hộp 300g',
    'HTX Cơm Cháy Thành Nhân',
    TRUE
),

-- 2. Mắm tép Gia Viễn (4 sao)
(
    '550cb000-e29b-41d4-a716-000000000002'::uuid,
    '550ba000-e29b-41d4-a716-000000000002'::uuid,
    '37',
    'Mắm Tép Gia Viễn Bà Quý',
    'Gia Vien Shrimp Paste',
    'thuc_pham',
    'Mắm tép Gia Viễn được chế biến từ tép đồng nhỏ bé sống ở vùng nước ngọt sông Hoàng Long, ướp với muối biển theo tỷ lệ truyền thống 3:1, ủ trong chum sành từ 3–6 tháng. Khi mắm chín có màu đỏ hồng đẹp mắt, mùi thơm đặc trưng, vị ngọt đậm của tép đồng. Thường được dùng để nấu bún bò, ăn kèm rau sống, hoặc chấm thịt luộc. Đây là một trong những loại mắm ngon nhất miền Bắc.',
    4,
    'OCOP-NB-2023-002',
    '2023-06-15',
    'https://storage.example.com/ocop/mam-tep-gia-vien.jpg',
    65000,
    'hũ 250g',
    'Cơ Sở Mắm Tép Bà Quý Gia Viễn',
    TRUE
),

-- 3. Rượu Kim Sơn (4 sao)
(
    '550cb000-e29b-41d4-a716-000000000003'::uuid,
    '550ba000-e29b-41d4-a716-000000000003'::uuid,
    '37',
    'Rượu Gạo Kim Sơn Truyền Thống',
    'Kim Son Traditional Rice Wine',
    'do_uong',
    'Rượu Kim Sơn được cất từ gạo nếp cái hoa vàng trồng tại đất mặn Kim Sơn – vùng đất được bồi đắp phù sa từ sông Đáy và biển Đông. Gạo có hàm lượng tinh bột cao, kết hợp với men lá gia truyền thu hái từ rừng núi, tạo ra loại rượu có độ cồn từ 38–45 độ, hương thơm nhẹ dịu, vị ngọt thanh, uống vào cảm nhận được sự êm ái. Sản phẩm đạt tiêu chuẩn xuất khẩu, được kiểm định an toàn thực phẩm đầy đủ.',
    4,
    'OCOP-NB-2023-003',
    '2023-09-20',
    'https://storage.example.com/ocop/ruou-kim-son.jpg',
    120000,
    'chai 500ml',
    'Công Ty TNHH Rượu Kim Sơn',
    TRUE
),

-- 4. Thêu ren Văn Lâm (4 sao)
(
    '550cb000-e29b-41d4-a716-000000000004'::uuid,
    '550ba000-e29b-41d4-a716-000000000004'::uuid,
    '37',
    'Tranh Thêu Tay Làng Nghề Văn Lâm',
    'Van Lam Hand Embroidery Art',
    'thu_cong_my_nghe',
    'Tranh thêu tay Văn Lâm là sản phẩm thủ công mỹ nghệ đỉnh cao của làng nghề Văn Lâm, Ninh Hải, Hoa Lư. Mỗi bức tranh được thêu hoàn toàn bằng tay bởi các nghệ nhân lành nghề, sử dụng chỉ tơ tự nhiên hoặc chỉ cotton cao cấp. Các chủ đề đa dạng: phong cảnh Tràng An, danh thắng Ninh Bình, hoa sen, chân dung, thư pháp. Kích thước từ 20x30cm đến 150x200cm. Là quà tặng ý nghĩa và mặt hàng xuất khẩu cao cấp.',
    4,
    'OCOP-NB-2022-004',
    '2022-11-10',
    'https://storage.example.com/ocop/tranh-theu-van-lam.jpg',
    350000,
    'bức (40x60cm)',
    'Làng Nghề Thêu Ren Văn Lâm',
    TRUE
),

-- 5. Mật ong rừng Nho Quan (4 sao)
(
    '550cb000-e29b-41d4-a716-000000000005'::uuid,
    '550ba000-e29b-41d4-a716-000000000005'::uuid,
    '37',
    'Mật Ong Rừng Nho Quan',
    'Nho Quan Forest Honey',
    'thuc_pham',
    'Mật ong rừng Nho Quan được thu hoạch từ các đàn ong nuôi thả tự nhiên trong rừng nguyên sinh Cúc Phương, hút mật từ hàng trăm loài hoa rừng quý hiếm. Mật có màu vàng hổ phách hoặc đỏ thẫm tùy mùa thu hoạch, độ đậm đặc cao, hương thơm đặc trưng của hoa rừng, không pha trộn. Hoạt chất enzym và khoáng chất tự nhiên được bảo toàn hoàn toàn do không sử dụng nhiệt độ cao trong chế biến.',
    4,
    'OCOP-NB-2023-005',
    '2023-06-15',
    'https://storage.example.com/ocop/mat-ong-nho-quan.jpg',
    180000,
    'chai 500ml',
    'HTX Mật Ong Rừng Nho Quan',
    TRUE
),

-- 6. Dê núi chế biến (3 sao)
(
    '550cb000-e29b-41d4-a716-000000000006'::uuid,
    '550ba000-e29b-41d4-a716-000000000006'::uuid,
    '37',
    'Thịt Dê Núi Ninh Bình Khô Tẩm Gia Vị',
    'Ninh Binh Mountain Goat Jerky',
    'thuc_pham',
    'Dê núi Ninh Bình được nuôi thả tự do trên các vách đá vôi vùng Hoa Lư – Gia Viễn, ăn cỏ rừng và thảo dược tự nhiên nên thịt có màu đỏ tươi, chắc, thơm và ít mỡ. Sản phẩm thịt dê khô tẩm gia vị được chế biến từ thịt dê tươi, tẩm sả, gừng, nghệ, hạt tiêu rừng và các loại gia vị đặc trưng, phơi sấy đúng kỹ thuật. Thích hợp làm quà biếu, nhâm nhi cùng rượu Kim Sơn.',
    3,
    'OCOP-NB-2024-006',
    '2024-03-20',
    'https://storage.example.com/ocop/thit-de-kho.jpg',
    280000,
    'túi 200g',
    'Nhà Hàng Dê Núi Cố Đô',
    TRUE
),

-- 7. Nem chua Yên Mạc (3 sao)
(
    '550cb000-e29b-41d4-a716-000000000007'::uuid,
    NULL,
    '37',
    'Nem Chua Yên Mạc Ninh Bình',
    'Yen Mac Sour Meat (Nem Chua)',
    'thuc_pham',
    'Nem chua Yên Mạc là đặc sản của xã Yên Mạc, Yên Mô, Ninh Bình. Được làm từ thịt nạc vai lợn tươi giã nhuyễn bằng tay, trộn với bì lợn, tỏi, tiêu, đường và thính gạo rang theo công thức gia truyền. Nem được gói bằng lá ổi và lá chuối, ủ trong 3 ngày để lên men tự nhiên. Khi chín nem có màu hồng đẹp, vị chua dịu, dai ngon, ăn kèm tỏi và ớt tươi.',
    3,
    'OCOP-NB-2024-007',
    '2024-01-15',
    'https://storage.example.com/ocop/nem-chua-yen-mac.jpg',
    45000,
    'gói 10 cái',
    'HTX Nem Chua Yên Mạc',
    TRUE
),

-- 8. Cói mỹ nghệ Kim Sơn (3 sao)
(
    '550cb000-e29b-41d4-a716-000000000008'::uuid,
    NULL,
    '37',
    'Giỏ Cói Mỹ Nghệ Kim Sơn',
    'Kim Son Sedge Craft Baskets',
    'thu_cong_my_nghe',
    'Cói Kim Sơn được trồng trên vùng đất mặn ven biển huyện Kim Sơn, Ninh Bình – vùng đất có điều kiện thổ nhưỡng đặc biệt tạo ra loại cói có sợi dài, bền, mịn. Các nghệ nhân làng nghề đan thủ công các sản phẩm: giỏ xách, túi đi biển, thảm cói, mũ cói và đồ trang trí nội thất xuất khẩu. Sản phẩm thân thiện môi trường, bền đẹp và đang được ưa chuộng tại thị trường châu Âu và Nhật Bản.',
    3,
    'OCOP-NB-2023-008',
    '2023-09-10',
    'https://storage.example.com/ocop/coi-my-nghe-kim-son.jpg',
    95000,
    'cái',
    'HTX Cói Mỹ Nghệ Kim Sơn',
    TRUE
),

-- 9. Trà hoa sen (3 sao)
(
    '550cb000-e29b-41d4-a716-000000000009'::uuid,
    NULL,
    '37',
    'Trà Hoa Sen Ninh Bình',
    'Ninh Binh Lotus Flower Tea',
    'do_uong',
    'Trà hoa sen Ninh Bình được ướp từ búp trà xanh sạch và nhị sen hồng đại đóa thu hoạch từ cánh đồng sen Ninh Bình – vùng trồng sen nước lớn nhất miền Bắc. Nhị sen được tách thủ công từ bông sen tươi rồi ướp trực tiếp với trà theo tỷ lệ vàng, qua 5 lần ướp và sấy để hương sen ngấm sâu vào từng búp trà. Thành phẩm có màu xanh nhạt, hương sen tinh tế, vị ngọt hậu, an thần và tốt cho tim mạch.',
    3,
    'OCOP-NB-2024-009',
    '2024-05-01',
    'https://storage.example.com/ocop/tra-hoa-sen.jpg',
    150000,
    'hộp 100g',
    'Công Ty TNHH Trà Sen Ninh Bình',
    TRUE
),

-- 10. Bánh gai Ninh Bình (3 sao)
(
    '550cb000-e29b-41d4-a716-000000000010'::uuid,
    NULL,
    '37',
    'Bánh Gai Ninh Bình',
    'Ninh Binh Ramie Leaf Sticky Rice Cake',
    'thuc_pham',
    'Bánh gai Ninh Bình là loại bánh truyền thống được làm từ bột nếp trộn với lá gai giã nhuyễn tạo màu đen đặc trưng, nhân đậu xanh, dừa nạo, mứt bí và vừng. Bánh được gói bằng lá chuối và hấp chín. Vỏ bánh dẻo dai, nhân ngọt bùi, hương lá gai và lá chuối hòa quyện tạo ra vị ngon đặc trưng chỉ có ở Ninh Bình. Thường được làm trong dịp lễ tết và làm quà biếu.',
    3,
    'OCOP-NB-2023-010',
    '2023-12-05',
    'https://storage.example.com/ocop/banh-gai.jpg',
    35000,
    'hộp 4 cái',
    'Cơ Sở Bánh Gai Bà Lan',
    TRUE
),

-- 11. Muối hạt Kim Sơn (3 sao)
(
    '550cb000-e29b-41d4-a716-000000000011'::uuid,
    NULL,
    '37',
    'Muối Hạt Kim Sơn',
    'Kim Son Sea Salt',
    'thuc_pham',
    'Muối hạt Kim Sơn được sản xuất theo phương pháp phơi nước biển truyền thống tại vùng đồng muối Kim Sơn – một trong những vùng muối lớn nhất miền Bắc Việt Nam. Muối có hạt to, trắng tinh, chứa hàm lượng khoáng chất tự nhiên cao (NaCl ≥ 97%), không tẩy trắng hóa học. Sản phẩm đạt chứng nhận vệ sinh an toàn thực phẩm, phù hợp cho nấu ăn, bảo quản thực phẩm và chăm sóc sức khỏe.',
    3,
    'OCOP-NB-2022-011',
    '2022-08-20',
    'https://storage.example.com/ocop/muoi-hat-kim-son.jpg',
    25000,
    'túi 1kg',
    'HTX Muối Kim Sơn',
    TRUE
),

-- 12. Tinh dầu tràm Ninh Bình (3 sao)
(
    '550cb000-e29b-41d4-a716-000000000012'::uuid,
    NULL,
    '37',
    'Tinh Dầu Tràm Ninh Bình',
    'Ninh Binh Cajuput Essential Oil',
    'thuoc_và_cskh',
    'Tinh dầu tràm Ninh Bình được chưng cất từ lá và cành non của cây tràm (Melaleuca cajuputi) trồng tại vùng đầm lầy Nho Quan – Kim Sơn. Quy trình chưng cất hơi nước lạnh đảm bảo bảo toàn tối đa hoạt chất cineole (hàm lượng ≥ 55%). Tinh dầu có màu vàng nhạt, mùi thơm mát đặc trưng, kháng khuẩn, chống viêm, thông mũi và ấm người. Được sử dụng rộng rãi cho trẻ sơ sinh, người lớn tuổi và chăm sóc sức khỏe hàng ngày.',
    3,
    'OCOP-NB-2024-012',
    '2024-02-10',
    'https://storage.example.com/ocop/tinh-dau-tram.jpg',
    95000,
    'chai 20ml',
    'Công Ty TNHH Tinh Dầu Tràm Xanh Ninh Bình',
    TRUE
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 3: NEWS (18 bài viết du lịch và đặc sản Ninh Bình)
-- ============================================================

INSERT INTO news (
    id,
    title,
    slug,
    author_name,
    summary,
    content,
    thumbnail_url,
    is_published,
    is_featured,
    published_at,
    tags
) VALUES

-- 1. Cố Đô Hoa Lư
(
    '550db000-e29b-41d4-a716-000000000001'::uuid,
    'Cố Đô Hoa Lư – Kinh Đô Đầu Tiên Của Nhà Nước Phong Kiến Việt Nam',
    'co-do-hoa-lu-kinh-do-dau-tien-cua-nha-nuoc-phong-kien-viet-nam',
    'Ban Biên Tập Du Lịch Ninh Bình',
    'Cố Đô Hoa Lư là kinh đô đầu tiên của nhà nước Đại Cồ Việt, nơi lưu giữ hào quang của triều Đinh – Tiền Lê. Khám phá lịch sử nghìn năm, kiến trúc đền đài và cảnh quan thiên nhiên hùng vĩ tại vùng đất thiêng Ninh Bình.',
    '<p>Cố Đô Hoa Lư, thuộc xã Trường Yên, huyện Hoa Lư, tỉnh Ninh Bình, là kinh đô đầu tiên của nhà nước phong kiến trung ương tập quyền Đại Cồ Việt – tiền thân của nước Việt Nam ngày nay. Được thành lập năm 968 bởi Đinh Tiên Hoàng sau khi dẹp loạn 12 sứ quân, Hoa Lư đã là trung tâm chính trị, văn hóa và quân sự của quốc gia trong gần 42 năm (968–1010).</p>
<p>Khu di tích Cố Đô Hoa Lư ngày nay bao gồm hệ thống đền thờ, thành lũy đất và núi đá vôi tự nhiên tạo thành bức tường thành kiên cố. Đền Vua Đinh Tiên Hoàng và Đền Vua Lê Đại Hành là hai công trình kiến trúc cổ nổi bật, được xây dựng từ thế kỷ XVII trên nền cung điện xưa, mang phong cách kiến trúc đặc trưng của triều đình phong kiến Việt Nam.</p>
<p>Cảnh quan thiên nhiên tại Hoa Lư vô cùng hùng vĩ với những dãy núi đá vôi cao vút bao quanh, những dòng suối trong xanh len lỏi giữa thung lũng và những cánh đồng lúa xanh mướt trải dài. Khu di tích là một phần của Quần thể Danh thắng Tràng An – Di sản Văn hóa và Thiên nhiên Thế giới được UNESCO công nhận năm 2014.</p>
<p>Du khách đến Cố Đô Hoa Lư không chỉ được tham quan các di tích lịch sử quan trọng mà còn có thể trải nghiệm đi thuyền trên sông Sào Khê dọc chân núi, thưởng thức đặc sản dê núi và cơm cháy Ninh Bình ngay tại khu vực lân cận. Lễ hội Hoa Lư được tổ chức hàng năm vào ngày 8–10 tháng 3 âm lịch là dịp lễ hội truyền thống quan trọng bậc nhất của người dân Ninh Bình.</p>',
    'https://storage.example.com/news/co-do-hoa-lu.jpg',
    TRUE,
    TRUE,
    '2026-04-01 08:00:00',
    '["co-do-hoa-lu", "lich-su", "den-dinh-tien-hoang", "ninh-binh", "di-san-the-gioi"]'::jsonb
),

-- 2. Lễ hội Hoa Lư
(
    '550db000-e29b-41d4-a716-000000000002'::uuid,
    'Lễ Hội Hoa Lư 2026: Tưởng Niệm 1.058 Năm Nhà Nước Đại Cồ Việt',
    'le-hoi-hoa-lu-2026-tuong-niem-1058-nam-nha-nuoc-dai-co-viet',
    'Ban Biên Tập Du Lịch Ninh Bình',
    'Lễ hội Hoa Lư 2026 diễn ra từ ngày 8–10 tháng 3 âm lịch tại Khu Di Tích Cố Đô Hoa Lư với nhiều hoạt động văn hóa đặc sắc, tái hiện hào khí triều đình Đinh – Tiền Lê. Sự kiện lớn nhất của tỉnh Ninh Bình trong năm.',
    '<p>Lễ hội Hoa Lư năm 2026 sẽ diễn ra từ ngày 8 đến 10 tháng 3 âm lịch (tức ngày 25–27/4/2026 dương lịch) tại Khu Di Tích Quốc gia Đặc Biệt Cố Đô Hoa Lư, xã Trường Yên, huyện Hoa Lư, tỉnh Ninh Bình. Đây là lễ hội lớn nhất của tỉnh Ninh Bình, được tổ chức thường niên để tưởng nhớ công lao của Vua Đinh Tiên Hoàng – người có công thống nhất đất nước và lập nên nhà nước Đại Cồ Việt năm 968.</p>
<p>Chương trình lễ hội năm nay gồm: Lễ rước kiệu long trọng từ đền Vua Đinh đến đền Vua Lê với sự tham gia của hàng nghìn người mặc trang phục truyền thống; Lễ tế thần theo nghi thức cổ truyền; hội thi đấu vật, bơi thuyền, leo núi và các trò chơi dân gian đặc sắc như ném còn, múa rồng, múa lân.</p>
<p>Ban tổ chức dự kiến sẽ tái hiện các nghi lễ triều đình thời Đinh với đội ngũ vũ sĩ, quan văn, quan võ trong trang phục cung đình thế kỷ X. Đây sẽ là điểm nhấn đặc biệt thu hút hàng vạn du khách trong và ngoài tỉnh tham dự.</p>
<p>Du khách đến tham dự lễ hội nên đặt phòng lưu trú sớm vì nhu cầu rất cao trong những ngày này. Các khách sạn, nhà nghỉ tại thành phố Ninh Bình và khu vực Hoa Lư thường được đặt kín từ trước 1–2 tháng. Ban tổ chức cũng sẽ bố trí bãi đỗ xe rộng rãi và xe trung chuyển miễn phí từ các điểm tập kết đến khu vực lễ hội.</p>',
    'https://storage.example.com/news/le-hoi-hoa-lu-2026.jpg',
    TRUE,
    TRUE,
    '2026-04-10 09:00:00',
    '["le-hoi", "hoa-lu", "van-hoa-truyen-thong", "den-dinh-tien-hoang", "ninh-binh"]'::jsonb
),

-- 3. Đền Đinh Tiên Hoàng
(
    '550db000-e29b-41d4-a716-000000000003'::uuid,
    'Đền Đinh Tiên Hoàng – Ngôi Đền Thờ Vị Hoàng Đế Đầu Tiên Thống Nhất Đất Nước',
    'den-dinh-tien-hoang-ngoi-den-tho-vi-hoang-de-dau-tien-thong-nhat-dat-nuoc',
    'Nguyễn Thị Hương',
    'Đền Đinh Tiên Hoàng là nơi thờ phụng vua Đinh Bộ Lĩnh – người có công thống nhất đất nước năm 968 và lập nên nhà nước Đại Cồ Việt. Công trình kiến trúc cổ kính ẩn trong khuôn viên Cố Đô Hoa Lư, là điểm hành hương tâm linh quan trọng của người Việt.',
    '<p>Đền Đinh Tiên Hoàng tọa lạc trong khu vực trung tâm của Cố Đô Hoa Lư, xã Trường Yên, huyện Hoa Lư, Ninh Bình. Đây là ngôi đền thờ Vua Đinh Bộ Lĩnh (923–979), người đã lập nên nhà nước Đại Cồ Việt năm 968 sau khi dẹp loạn 12 sứ quân – một trong những kỳ tích lịch sử vĩ đại nhất của dân tộc Việt Nam.</p>
<p>Ngôi đền được xây dựng từ thế kỷ XVII trên nền cung điện Hoa Lư xưa, gồm nhiều công trình kiến trúc gỗ quý kết hợp đá xanh: Nghi môn ngoại, Hồ bán nguyệt, Nghi môn nội, Sân tế, Bái đường và Chính điện. Trên nóc chính điện đắp nổi hình rồng chầu mặt trời – biểu tượng của hoàng quyền. Bên trong thờ tượng Vua Đinh Tiên Hoàng bằng đồng đen nguyên khối, được đúc vào thế kỷ XVII.</p>
<p>Đặc biệt, trước sân đền có tấm bia đá "Đinh Tiên Hoàng Đế" khắc từ năm 1680 và hàng cột đá chạm khắc hình rồng tinh xảo – những tác phẩm nghệ thuật điêu khắc đá tiêu biểu của Việt Nam thế kỷ XVII. Khuôn viên đền được bao bọc bởi tường đá cổ và rừng cây xanh mát, tạo không gian trang nghiêm và linh thiêng.</p>
<p>Hàng năm, ngày giỗ Vua Đinh (ngày 10 tháng 3 âm lịch) trùng với lễ hội Hoa Lư – sự kiện lớn nhất tỉnh Ninh Bình, thu hút hàng vạn du khách thập phương về đây hành hương và dự lễ.</p>',
    'https://storage.example.com/news/den-dinh-tien-hoang.jpg',
    TRUE,
    FALSE,
    '2026-03-15 10:00:00',
    '["den-dinh-tien-hoang", "co-do-hoa-lu", "lich-su", "tam-linh", "ninh-binh"]'::jsonb
),

-- 4. Chùa Bái Đính Cổ
(
    '550db000-e29b-41d4-a716-000000000004'::uuid,
    'Chùa Bái Đính Cổ – Ngôi Chùa Ngàn Năm Tuổi Ẩn Mình Trong Núi Đá Ninh Bình',
    'chua-bai-dinh-co-ngoi-chua-ngan-nam-tuoi-an-minh-trong-nui-da',
    'Trần Văn Minh',
    'Chùa Bái Đính Cổ được xây dựng từ thế kỷ XI thời Lý, ẩn sâu trong hang đá tự nhiên trên núi Đính. Đây là nơi vua Lý Quốc Sư Nguyễn Minh Không tu hành và lập đàn cầu siêu, mang đậm giá trị tâm linh và lịch sử nghìn năm.',
    '<p>Chùa Bái Đính Cổ – còn gọi là Chùa Bái Đính Cũ để phân biệt với quần thể Chùa Bái Đính mới xây dựng bên cạnh – là một trong những ngôi chùa cổ kính và linh thiêng nhất Ninh Bình. Chùa được xây dựng từ thế kỷ XI thời vua Lý Thái Tông (1028–1054), gắn liền với danh tăng Nguyễn Minh Không – vị thiền sư được tôn là "Nam Thiên Đệ Nhất Phúc Điền" và là người có công chữa bệnh cho vua Lý Thần Tông.</p>
<p>Điểm độc đáo của Chùa Bái Đính Cổ là toàn bộ khu thờ tự được đặt trong các hang đá tự nhiên trên sườn núi Đính. Gồm 3 khu chính: Điện Thờ Thần Cao Sơn (thờ thần Cao Sơn – thần núi bảo hộ), Hang Phật (hang đá rộng ~2.500m² thờ Phật Thích Ca và 500 vị La Hán) và Hang Sáng (nơi thờ nữ thần). Tất cả đều giữ nguyên kiến trúc hang động thiên nhiên, mang vẻ đẹp hoang sơ và huyền bí.</p>
<p>Để lên chùa, du khách phải leo 300 bậc đá quanh co sườn núi. Dọc đường là những tảng đá mang hình thù kỳ lạ và cây cổ thụ hàng trăm tuổi, tạo nên không gian thiên nhiên tuyệt vời. Từ trên cao, du khách có thể nhìn bao quát toàn cảnh đồng bằng Ninh Bình và quần thể Bái Đính mới bên dưới.</p>
<p>Mỗi năm vào ngày 6 tháng Giêng âm lịch, chùa tổ chức lễ hội Bái Đính thu hút hàng vạn Phật tử và du khách thập phương về chiêm bái và cầu nguyện. Đây là một trong những lễ hội Phật giáo lớn nhất miền Bắc Việt Nam.</p>',
    'https://storage.example.com/news/chua-bai-dinh-co.jpg',
    TRUE,
    FALSE,
    '2026-02-20 08:00:00',
    '["chua-bai-dinh-co", "phat-giao", "tam-linh", "lich-su", "ninh-binh"]'::jsonb
),

-- 5. Cánh Đồng Sen
(
    '550db000-e29b-41d4-a716-000000000005'::uuid,
    'Mùa Sen Nở Rộ Tại Ninh Bình – Tháng 5 Đến Tháng 7 Rực Rỡ Sắc Hồng',
    'mua-sen-no-ro-tai-ninh-binh-thang-5-den-thang-7-ruc-ro-sac-hong',
    'Lê Thị Lan',
    'Tháng 5–7 hàng năm, những cánh đồng sen bạt ngàn ở Ninh Bình bung nở rực rỡ, tạo nên khung cảnh thơ mộng quyến rũ mọi du khách. Đây là thời điểm lý tưởng để chụp ảnh, trải nghiệm hái sen và thưởng thức trà sen tươi.',
    '<p>Ninh Bình là một trong những vùng trồng sen lớn nhất miền Bắc Việt Nam, với hàng nghìn héc-ta đầm sen trải dài ở các huyện Hoa Lư, Nho Quan, Gia Viễn và vùng ven sông Hoàng Long. Mỗi năm từ tháng 5 đến tháng 7 âm lịch, khi những bông sen hồng bắt đầu bung nở, cả vùng đồng bằng Ninh Bình trở thành thiên đường sắc màu của hoa sen.</p>
<p>Cánh đồng sen nổi tiếng nhất nằm ở khu vực Ninh Hải – Ninh Phong, không xa Khu Du Tích Cố Đô Hoa Lư. Du khách có thể thuê thuyền nhỏ len lỏi giữa những rừng sen bạt ngàn, ngắm hoa sen từ khoảng cách gần, nghe tiếng ong vo ve hút mật và hít hà hương thơm thanh khiết đặc trưng của hoa sen vào buổi sáng sớm.</p>
<p>Đặc biệt, nếu đến vào lúc 5–7 giờ sáng, du khách sẽ được chứng kiến cảnh hoa sen từ từ nở trong làn sương mai nhẹ nhàng – một khung cảnh vô cùng thơ mộng và lãng mạn, thu hút hàng nghìn nhiếp ảnh gia chuyên nghiệp và nghiệp dư. Trà sen ướp từ nhụy sen tươi, cơm gói lá sen và chè sen là những sản phẩm đặc biệt chỉ có trong mùa sen.</p>
<p>Ngoài tham quan, du khách có thể tham gia trải nghiệm hái sen cùng người nông dân, học cách lấy chỉ sen để ướp trà, hoặc đơn giản là thưởng thức một ly trà sen tươi ngay giữa đồng sen mênh mông – trải nghiệm bình dị mà đáng nhớ nhất khi đến Ninh Bình.</p>',
    'https://storage.example.com/news/canh-dong-sen-ninh-binh.jpg',
    TRUE,
    TRUE,
    '2026-04-25 07:00:00',
    '["canh-dong-sen", "hoa-sen", "du-lich-sinh-thai", "trai-nghiem", "ninh-binh"]'::jsonb
),

-- 6. Hang Mua
(
    '550db000-e29b-41d4-a716-000000000006'::uuid,
    'Leo 500 Bậc Đá Lên Hang Múa – Toàn Cảnh Ninh Bình Từ Trên Cao',
    'leo-500-bac-da-len-hang-mua-toan-canh-ninh-binh-tu-tren-cao',
    'Phạm Quang Huy',
    'Hang Múa với 500 bậc đá dẫn lên đỉnh núi rồng là điểm check-in nổi tiếng nhất Ninh Bình. Từ trên đỉnh, toàn cảnh vùng Tam Cốc – Bích Động với sông Ngô Đồng uốn lượn giữa đồng lúa và núi đá hiện ra tuyệt đẹp như bức tranh thủy mặc.',
    '<p>Hang Múa thuộc xã Ninh Xuân, huyện Hoa Lư, nằm cách trung tâm thành phố Ninh Bình khoảng 12km. Tên gọi Hang Múa xuất phát từ truyền thuyết rằng đây là nơi các vũ nữ của vua Trần xưa kia thường lên múa hầu, nay còn lưu giữ một hang đá nhỏ trên sườn núi có tượng Phật Bà và một số tác phẩm điêu khắc đá cổ.</p>
<p>Điểm thu hút du khách chính tại Hang Múa là hành trình leo 500 bậc đá được lát dọc theo sườn núi đá vôi dựng đứng, dẫn lên đỉnh núi rồng ở độ cao khoảng 98 mét so với mặt đất. Cuộc hành trình leo núi mất khoảng 20–30 phút, không quá khó khăn nhưng đủ thử thách để du khách cảm nhận được vẻ hùng vĩ của địa hình karst Ninh Bình.</p>
<p>Phần thưởng xứng đáng chờ đợi ở trên đỉnh là tầm nhìn panorama 360 độ: sông Ngô Đồng uốn lượn như dải lụa bạc giữa cánh đồng lúa ngút ngàn, các ngọn núi đá vôi cao thấp lô nhô trải dài đến tận chân trời, và toàn bộ khu vực Tam Cốc – Bích Động hiện ra như một bức tranh thủy mặc khổng lồ. Đây là một trong những góc chụp ảnh đẹp nhất của Ninh Bình và Đông Nam Á.</p>
<p>Thời điểm lý tưởng để leo Hang Múa là sáng sớm (6:00–8:00) và chiều tà (16:00–17:30) để tránh nắng gắt và chụp được ánh sáng đẹp. Mùa lúa chín (tháng 5–6 và tháng 9–10) là thời gian đẹp nhất khi cánh đồng bên dưới nhuộm màu vàng óng.</p>',
    'https://storage.example.com/news/hang-mua-toan-canh-ninh-binh.jpg',
    TRUE,
    TRUE,
    '2026-03-20 09:00:00',
    '["hang-mua", "duong-len-hang-mua", "leo-nui", "checkin", "tam-coc", "ninh-binh"]'::jsonb
),

-- 7. Đền Thái Vi
(
    '550db000-e29b-41d4-a716-000000000007'::uuid,
    'Đền Thái Vi – Ngôi Đền Trần Linh Thiêng Giữa Lòng Tam Cốc',
    'den-thai-vi-ngoi-den-tran-linh-thieng-giua-long-tam-coc',
    'Ngô Thị Bích',
    'Đền Thái Vi thờ các vua nhà Trần, tọa lạc trong thung lũng đá vôi hữu tình giữa khu vực Tam Cốc. Nơi đây gắn liền với lịch sử kháng chiến chống quân Nguyên Mông và là điểm tâm linh không thể bỏ qua khi đến Ninh Bình.',
    '<p>Đền Thái Vi nằm trong thôn Văn Lâm, xã Ninh Hải, huyện Hoa Lư, tỉnh Ninh Bình, cách bến thuyền Tam Cốc khoảng 2km. Ngôi đền được xây dựng từ thế kỷ XIII–XIV để thờ các vua và hoàng hậu nhà Trần, đặc biệt là Thái Tông Trần Cảnh – vị vua đã có công đánh bại quân Nguyên Mông lần thứ nhất năm 1258.</p>
<p>Đền tọa lạc trong một thung lũng hẹp bao quanh bởi những dãy núi đá vôi hùng vĩ, dòng sông Ngô Đồng trong xanh chảy qua trước cổng đền, tạo nên cảnh quan vừa trang nghiêm vừa thơ mộng. Kiến trúc đền mang phong cách truyền thống thời Trần với những mái đình cong vút, cột gỗ lim, đầu rồng chạm khắc tinh xảo và sân đền lát đá xanh cổ kính.</p>
<p>Hàng năm, lễ hội Đền Thái Vi được tổ chức vào ngày 14–17 tháng 3 âm lịch với nghi lễ tế thần trang trọng, hội thi bơi thuyền trên sông Ngô Đồng và các trò chơi dân gian. Đây là dịp để người dân địa phương và du khách cùng tưởng nhớ công lao của các vua Trần đối với dân tộc.</p>
<p>Du khách có thể kết hợp tham quan Đền Thái Vi cùng hành trình đi thuyền Tam Cốc hoặc thuê xe đạp khám phá làng nghề thêu ren Văn Lâm ngay bên cạnh – một trong những làng nghề thủ công mỹ nghệ lâu đời và nổi tiếng nhất Việt Nam.</p>',
    'https://storage.example.com/news/den-thai-vi-tam-coc.jpg',
    TRUE,
    FALSE,
    '2026-03-01 10:00:00',
    '["den-thai-vi", "nha-tran", "tam-coc", "tam-linh", "lich-su", "ninh-binh"]'::jsonb
),

-- 8. Động Tiên Cá
(
    '550db000-e29b-41d4-a716-000000000008'::uuid,
    'Động Tiên Cá – Kỳ Quan Dưới Lòng Núi Tại Vùng Tam Cốc Ninh Bình',
    'dong-tien-ca-ky-quan-duoi-long-nui-tai-vung-tam-coc',
    'Ban Biên Tập Du Lịch Ninh Bình',
    'Động Tiên Cá là hang động bí ẩn với hệ thống nhũ đá lung linh mang hình dáng đàn cá tiên huyền bí. Nằm trong vùng Tam Cốc, đây là điểm tham quan còn ít người biết, lý tưởng cho những ai muốn khám phá vẻ đẹp hoang sơ.',
    '<p>Động Tiên Cá (hay còn gọi là Tiên Cá Cave) là một hang động tự nhiên độc đáo nằm trong vùng đá vôi karst của khu vực Tam Cốc – Bích Động, huyện Hoa Lư, Ninh Bình. Hang được đặt tên theo truyền thuyết về đàn cá tiên sống dưới lòng hang có thể ban phúc lành cho người nhìn thấy chúng.</p>
<p>Điểm đặc sắc của Động Tiên Cá là hệ thống nhũ đá và măng đá với hình dáng giống những con cá đang bơi lội, được ánh đèn chiếu rọi tạo ra hiệu ứng lung linh kỳ ảo. Trong hang còn có mạch nước ngầm trong vắt chảy qua, nơi thực sự có những đàn cá nhỏ sinh sống trong môi trường tự nhiên hoàn toàn tối tăm, không tiếp xúc ánh sáng mặt trời.</p>
<p>Khác với các hang động nổi tiếng khác trong khu vực, Động Tiên Cá vẫn còn giữ nguyên vẻ hoang sơ, chưa được khai thác du lịch đại trà, là điểm đến lý tưởng cho những du khách muốn tránh đám đông và khám phá thiên nhiên theo cách riêng tư, chân thực nhất.</p>
<p>Để đến Động Tiên Cá, du khách cần thuê thuyền từ bến thuyền Tam Cốc và đi theo hướng dẫn của thuyền viên địa phương. Nên mang theo đèn pin và mặc áo chống thấm vì lối vào hang khá thấp, có thể bị nước bắn vào trong mùa mưa.</p>',
    'https://storage.example.com/news/dong-tien-ca.jpg',
    TRUE,
    FALSE,
    '2026-02-15 08:00:00',
    '["dong-tien-ca", "hang-dong", "tam-coc", "kham-pha", "ninh-binh"]'::jsonb
),

-- 9. Động Vái Giời và Thung Nham
(
    '550db000-e29b-41d4-a716-000000000009'::uuid,
    'Thung Nham – Thiên Đường Chim Và Hang Động Ba Tầng Kỳ Bí',
    'thung-nham-thien-duong-chim-va-hang-dong-ba-tang-ky-bi',
    'Vũ Đình Sơn',
    'Khu Du Lịch Sinh Thái Thung Nham tại Ninh Bình là thiên đường của các loài chim hoang dã với hơn 40 loài cò, vạc, le le... Nơi đây còn có Động Vái Giời ba tầng huyền bí và Hang Bụt linh thiêng, thu hút du khách yêu thiên nhiên và hành hương.',
    '<p>Khu Du Lịch Sinh Thái Thung Nham tọa lạc tại xã Ninh Hải, huyện Hoa Lư, tỉnh Ninh Bình, cách khu Tràng An khoảng 3km và cách thành phố Ninh Bình 12km. Thung Nham được bao bọc bởi những dãy núi đá vôi hùng vĩ, tạo thành một thung lũng kín, ẩn chứa nhiều sinh cảnh thiên nhiên quý hiếm.</p>
<p>Điểm nổi bật nhất của Thung Nham là khu vực sinh sống của hàng chục nghìn con cò, vạc, le le và nhiều loài chim nước khác. Vào buổi chiều tà (khoảng 16:00–17:30), khung cảnh hàng nghìn con cò bay về tổ tạo nên một bức tranh thiên nhiên đặc sắc, được ví như "đảo cò" độc đáo của Ninh Bình.</p>
<p>Bên cạnh quan sát chim, du khách có thể khám phá Động Vái Giời – hang động ba tầng độc đáo được tạo thành bởi ba khoang hang riêng biệt, nằm ở độ cao hơn 400 bậc đá trên sườn núi. Tương truyền, đây là nơi xưa kia dân làng thường leo lên cầu khấn trời đất cho mưa thuận gió hòa, mùa màng bội thu. Hệ thống nhũ đá trong hang lấp lánh dưới ánh đèn chiếu, tạo ra khung cảnh lung linh huyền ảo.</p>
<p>Khu Thung Nham còn có Hang Bụt – nơi có khối đá tự nhiên mang hình dáng Đức Phật đang ngồi thiền, được người dân địa phương coi là điểm tâm linh linh thiêng, thường đến thắp hương và cầu nguyện. Toàn bộ hành trình tham quan Thung Nham kết hợp đi thuyền, leo núi và chiêm ngưỡng thiên nhiên hoang dã – trải nghiệm không thể bỏ qua khi đến Ninh Bình.</p>',
    'https://storage.example.com/news/thung-nham-dong-vai-gioi.jpg',
    TRUE,
    FALSE,
    '2026-03-10 08:00:00',
    '["dong-vai-gioi", "thung-nham", "khu-sinh-thai", "chim-nuoc", "ninh-binh"]'::jsonb
),

-- 10. Đền Vua Đinh và Đền Vua Lê
(
    '550db000-e29b-41d4-a716-000000000010'::uuid,
    'Đền Vua Đinh Và Đền Vua Lê – Đôi Di Tích Lịch Sử Ngàn Năm Tại Hoa Lư',
    'den-vua-dinh-va-den-vua-le-doi-di-tich-lich-su-ngan-nam-tai-hoa-lu',
    'Hoàng Thị Mai',
    'Đền Vua Đinh và Đền Vua Lê là hai công trình kiến trúc cổ song hành trong Khu Di Tích Cố Đô Hoa Lư, tưởng niệm hai triều đại khai mở nền độc lập cho dân tộc. Kiến trúc chạm khắc gỗ đá tinh xảo, cảnh quan thiên nhiên thơ mộng quanh năm.',
    '<p>Trong khuôn viên Khu Di Tích Quốc Gia Đặc Biệt Cố Đô Hoa Lư, hai ngôi đền Vua Đinh và Vua Lê tọa lạc đối diện nhau qua một khoảng sân rộng, như hai người bạn đồng hành của lịch sử dân tộc. Cả hai đều được xây dựng từ thế kỷ XVII trên nền các cung điện hoàng triều xưa, được công nhận là Di Tích Lịch Sử Văn Hóa Quốc Gia Đặc Biệt.</p>
<p>Đền Vua Đinh (Đinh Tiên Hoàng Đế) thờ vua Đinh Bộ Lĩnh (923–979) – người thống nhất đất nước năm 968 và lập triều Đinh. Đền có kiến trúc bề thế với 3 tòa nhà chính nối liền nhau: Bái Đường, Thiên Hương và Chính Điện, được trang trí bằng những hàng cột đá chạm rồng tinh xảo và mái ngói đại hình vảy rồng truyền thống. Tượng Đinh Tiên Hoàng ngồi trên ngai vàng đúc bằng đồng đen nặng hàng tấn đặt trang trọng trong chính điện.</p>
<p>Đền Vua Lê (Lê Đại Hành) thờ vua Lê Hoàn (941–1005) – người kế vị triều Đinh và có công đánh bại quân xâm lược Tống năm 981. Đền có quy mô nhỏ hơn nhưng kiến trúc không kém phần tinh tế với những con rường chạm khắc hình rồng, phượng và tứ linh. Tượng Lê Đại Hành và hoàng hậu Dương Vân Nga được thờ trong nội thất, là biểu tượng của tình yêu và lòng trung trinh trong lịch sử.</p>
<p>Du khách đến thăm hai ngôi đền nên dành thêm thời gian đi bộ khám phá toàn bộ khu vực Cố Đô – từ tường thành đất cổ, dòng sông Sào Khê đến các thung lũng đá vôi xung quanh, để cảm nhận đầy đủ không gian kinh đô ngàn năm của Đại Cồ Việt.</p>',
    'https://storage.example.com/news/den-vua-dinh-vua-le.jpg',
    TRUE,
    FALSE,
    '2026-03-05 09:00:00',
    '["den-vua-dinh", "den-vua-le", "co-do-hoa-lu", "lich-su", "kien-truc-co", "ninh-binh"]'::jsonb
),

-- 11. Cơm cháy OCOP
(
    '550db000-e29b-41d4-a716-000000000011'::uuid,
    'Cơm Cháy Ninh Bình – Đặc Sản OCOP 4 Sao Chinh Phục Triệu Du Khách',
    'com-chay-ninh-binh-dac-san-ocop-4-sao-chinh-phuc-trieu-du-khach',
    'Đinh Thị Phương',
    'Cơm cháy Ninh Bình – từ món ăn dân dã của người nông dân đã trở thành đặc sản nổi tiếng cả nước, được chứng nhận OCOP 4 sao. Khám phá bí quyết làm cơm cháy giòn tan và cách thưởng thức đúng điệu của người Ninh Bình.',
    '<p>Cơm cháy (hay còn gọi là cơm vảy rồng) là đặc sản truyền thống của Ninh Bình, xuất phát từ thời vua Đinh Tiên Hoàng khi quân sĩ trong kinh thành Hoa Lư tận dụng phần cơm sát đáy nồi – phần cơm bị cháy vàng khi nấu bằng củi – để làm lương khô. Qua hàng thế kỷ, món ăn dân dã ấy đã trở thành đặc sản được cả nước biết đến.</p>
<p>Cơm cháy Ninh Bình được làm từ gạo tẻ hạt ngắn trồng trên đất phù sa sông Đáy. Sau khi nấu chín, cơm được nén chặt vào khuôn tạo hình tròn hoặc chữ nhật, rồi phơi nắng hoặc sấy khô và cuối cùng chiên ngập dầu thực vật tinh luyện ở nhiệt độ cao. Thành phẩm có màu vàng óng, giòn tan từ ngoài vào trong, thơm phức mùi cơm rang.</p>
<p>Cách thưởng thức truyền thống nhất là ăn cơm cháy kèm với nước sốt cà chua hầm với thịt bò, thịt dê núi hoặc tôm đồng. Khi chan nước sốt nóng lên miếng cơm cháy, tiếng xèo xèo bốc khói và mùi thơm lan tỏa là trải nghiệm vô cùng đặc biệt mà du khách không thể quên. Hiện nay, cơm cháy còn được chế biến thành snack ăn vặt, quà biếu và là sản phẩm xuất khẩu được ưa chuộng.</p>
<p>Năm 2023, cơm cháy Ninh Bình chính thức được công nhận là sản phẩm OCOP 4 sao – mức chứng nhận cao nhất do tỉnh cấp, khẳng định chất lượng và giá trị của đặc sản này. Hàng năm, Ninh Bình sản xuất và tiêu thụ hàng trăm tấn cơm cháy, phục vụ hàng triệu du khách trong và ngoài nước.</p>',
    'https://storage.example.com/news/com-chay-ninh-binh-ocop.jpg',
    TRUE,
    FALSE,
    '2026-04-05 08:00:00',
    '["com-chay", "ocop", "dac-san", "am-thuc", "ninh-binh"]'::jsonb
),

-- 12. Mắm tép Gia Viễn
(
    '550db000-e29b-41d4-a716-000000000012'::uuid,
    'Mắm Tép Gia Viễn – Vị Quê Hương Đậm Đà Được Công Nhận OCOP 4 Sao',
    'mam-tep-gia-vien-vi-que-huong-dam-da-duoc-cong-nhan-ocop-4-sao',
    'Nguyễn Văn Thịnh',
    'Mắm tép Gia Viễn là loại mắm truyền thống được làm từ tép đồng sông Hoàng Long, ủ muối theo công thức gia truyền hàng trăm năm. Được công nhận OCOP 4 sao, đây là đặc sản không thể thiếu trong ẩm thực Ninh Bình.',
    '<p>Mắm tép Gia Viễn – đặc sản nức tiếng của huyện Gia Viễn, tỉnh Ninh Bình – được làm từ những con tép đồng nhỏ bé sống trong vùng nước ngọt sông Hoàng Long và các cánh đồng ngập nước quanh huyện Gia Viễn. Loài tép đồng Gia Viễn nổi tiếng là ngon nhất vùng Bắc Bộ nhờ môi trường nước sạch, giàu phù du sinh vật và khoáng chất từ dãy núi Tam Điệp chảy về.</p>
<p>Quy trình làm mắm tép truyền thống gồm: tép đồng tươi được rửa sạch, để ráo rồi trộn đều với muối biển theo tỷ lệ 3:1 (3 phần tép, 1 phần muối), sau đó cho vào chum sành ủ trong bóng tối ở nhiệt độ phòng từ 3 đến 6 tháng. Trong quá trình lên men, tép tự phân giải tạo ra axit amin và các hợp chất tạo hương vị đặc trưng không thể tổng hợp bằng phương pháp công nghiệp.</p>
<p>Mắm tép Gia Viễn khi chín có màu đỏ hồng đẹp mắt, mùi thơm nồng đặc trưng, vị ngọt đậm của tép đồng kết hợp với độ mặn vừa phải. Thường được dùng để nấu bún bò Huế kiểu Ninh Bình, pha nước chấm thịt luộc, nấu canh rau muống hay đơn giản là ăn với cơm trắng – tất cả đều mang lại hương vị đậm đà, kích thích vị giác đặc biệt.</p>
<p>Được chứng nhận OCOP 4 sao năm 2023, mắm tép Gia Viễn ngày càng được nhiều người tiêu dùng trong và ngoài tỉnh tìm mua. Sản phẩm hiện có mặt tại các siêu thị lớn, cửa hàng đặc sản và được bán online trên khắp cả nước.</p>',
    'https://storage.example.com/news/mam-tep-gia-vien.jpg',
    TRUE,
    FALSE,
    '2026-03-25 09:00:00',
    '["mam-tep-gia-vien", "ocop", "dac-san", "am-thuc", "ninh-binh"]'::jsonb
),

-- 13. Hướng dẫn du lịch tổng hợp
(
    '550db000-e29b-41d4-a716-000000000013'::uuid,
    'Hướng Dẫn Du Lịch Ninh Bình 2026: Lịch Trình 3 Ngày 2 Đêm Trọn Vẹn',
    'huong-dan-du-lich-ninh-binh-2026-lich-trinh-3-ngay-2-dem-tron-ven',
    'Phạm Thị Thu',
    'Lịch trình du lịch Ninh Bình 3 ngày 2 đêm đầy đủ: từ Tràng An, Tam Cốc, Cố Đô Hoa Lư đến Chùa Bái Đính, Đền Thái Vi và cánh đồng sen. Kèm gợi ý ăn uống, lưu trú và chi phí tham khảo.',
    '<p><strong>Ngày 1: Tràng An – Hang Múa – Bái Đính</strong></p>
<p>Buổi sáng: Khởi hành từ Hà Nội (khoảng 90km – 2 giờ lái xe). Đến Tràng An trước 9:00 để tránh đông. Đi thuyền trên một trong ba tuyến (tuyến 1 dài nhất, khuyến nghị tuyến 2 hoặc 3 cho buổi sáng, khoảng 2,5–3 giờ). Vé thuyền: 150.000đ/người. Buổi trưa: Ăn trưa tại nhà hàng gần bến Tràng An, thử đặc sản cơm cháy dê núi và rau sắng. Buổi chiều: Di chuyển đến Hang Múa (5 phút lái xe). Leo 500 bậc đá ngắm cảnh hoàng hôn tuyệt đẹp (16:30–17:30). Vé: 100.000đ/người. Tối: Di chuyển về Ninh Bình hoặc Hoa Lư nhận phòng. Ăn tối đặc sản dê núi, thịt bê thui và uống rượu Kim Sơn.</p>
<p><strong>Ngày 2: Cố Đô Hoa Lư – Đền Đinh – Đền Lê – Cánh Đồng Sen</strong></p>
<p>Buổi sáng: Thức dậy sớm lúc 5:30–6:00 đến cánh đồng sen gần Ninh Hải chụp ảnh sen nở buổi sáng (tháng 5–7). Sau 8:00 di chuyển đến Cố Đô Hoa Lư – tham quan Đền Đinh Tiên Hoàng và Đền Vua Lê. Buổi trưa: Ăn tại nhà hàng Dê Núi Cố Đô ngay cổng khu di tích. Buổi chiều: Đến Đền Thái Vi trong lòng khu Tam Cốc – không gian thanh tịnh, kiến trúc cổ đẹp. Sau đó ghé làng thêu ren Văn Lâm mua quà lưu niệm. Tối: Tự do khám phá khu ẩm thực đêm Ninh Bình City.</p>
<p><strong>Ngày 3: Chùa Bái Đính – Khu OCOP – Về Hà Nội</strong></p>
<p>Buổi sáng: Di chuyển đến quần thể Chùa Bái Đính (20 phút từ trung tâm). Tham quan Chùa Bái Đính Cổ trên núi Đính (leo 300 bậc đá) và Chùa Bái Đính mới. Thời gian: 2–3 giờ. Buổi trưa: Cơm chay tại nhà hàng Bái Đính. Buổi chiều: Ghé Cửa Hàng Đặc Sản Ninh Bình Sạch mua cơm cháy, mắm tép, rượu Kim Sơn về làm quà. Chiều tối về Hà Nội.</p>
<p><strong>Chi phí tham khảo (2 người): 2.500.000 – 3.500.000đ</strong> (bao gồm: vé thuyền, vé tham quan, ăn uống 3 ngày, xăng xe máy cá nhân, lưu trú 2 đêm homestay/nhà nghỉ). Không bao gồm: khách sạn 3–4 sao, tour có hướng dẫn viên riêng.</p>',
    'https://storage.example.com/news/lich-trinh-ninh-binh-3n2d.jpg',
    TRUE,
    TRUE,
    '2026-04-15 08:00:00',
    '["lich-trinh", "du-lich-ninh-binh", "trang-an", "co-do-hoa-lu", "bai-dinh", "huong-dan"]'::jsonb
),

-- 14. Đền Thánh Cao Sơn
(
    '550db000-e29b-41d4-a716-000000000014'::uuid,
    'Đền Thánh Cao Sơn – Ngôi Đền Thờ Thần Núi Linh Thiêng Trên Đỉnh Cao',
    'den-thanh-cao-son-ngoi-den-tho-than-nui-linh-thieng',
    'Bùi Quang Dũng',
    'Đền Thánh Cao Sơn thờ thần Cao Sơn – vị thần bảo hộ núi non, là một trong "Tứ Bất Tử" của tín ngưỡng dân gian Việt Nam. Tọa lạc trên núi cao với cảnh quan hùng vĩ, đây là điểm hành hương quan trọng và điểm ngắm cảnh tuyệt vời tại Ninh Bình.',
    '<p>Đền Thánh Cao Sơn – còn gọi là Đền Cao Sơn hay Phủ Cao Sơn – là nơi thờ Đức Thánh Cao Sơn Đại Vương, vị thần cai quản núi non và bảo vệ muôn dân thoát khỏi thiên tai, dịch bệnh trong tín ngưỡng dân gian Việt Nam. Thánh Cao Sơn được xếp vào hàng "Tứ Bất Tử" – bốn vị thần bất tử quan trọng nhất trong văn hóa tín ngưỡng của người Việt.</p>
<p>Tại Ninh Bình, Đền Thánh Cao Sơn gắn liền với núi Cốc trong khu vực Bái Đính – nơi theo sử sách ghi lại, thiền sư Nguyễn Minh Không đã gặp và được thần Cao Sơn chỉ dẫn khi tìm kiếm thảo dược chữa bệnh cho vua Lý Thần Tông. Đền tọa lạc trên sườn núi cao, nhìn ra toàn cảnh thung lũng Bái Đính và dãy núi Tam Điệp hùng vĩ.</p>
<p>Kiến trúc đền mang đậm phong cách tín ngưỡng dân gian: đơn giản, gần gũi với thiên nhiên, sử dụng nhiều đá tự nhiên và gỗ quý. Xung quanh đền là rừng cây cổ thụ hàng trăm năm tuổi, không khí trong lành và yên tĩnh, tạo cảm giác thanh thản và kết nối với tâm linh đặc biệt.</p>
<p>Hàng năm vào ngày 10 tháng Giêng âm lịch, lễ hội Đền Cao Sơn thu hút hàng nghìn người dân địa phương và khách thập phương về dâng lễ, cầu sức khỏe, bình an và mùa màng tươi tốt. Đền Thánh Cao Sơn thường được kết hợp tham quan cùng Chùa Bái Đính Cổ trong cùng một chuyến leo núi.</p>',
    'https://storage.example.com/news/den-thanh-cao-son.jpg',
    TRUE,
    FALSE,
    '2026-02-28 09:00:00',
    '["den-thanh-cao-son", "tam-linh", "bai-dinh", "nui", "ninh-binh"]'::jsonb
),

-- 15. Ninh Bình top điểm đến
(
    '550db000-e29b-41d4-a716-000000000015'::uuid,
    'Ninh Bình Lọt Top 10 Điểm Đến Hàng Đầu Châu Á Theo Bình Chọn TripAdvisor 2026',
    'ninh-binh-lot-top-10-diem-den-hang-dau-chau-a-tripadvisor-2026',
    'Ban Biên Tập Du Lịch Ninh Bình',
    'Ninh Bình lần thứ ba liên tiếp được TripAdvisor xếp vào top điểm đến hàng đầu châu Á, khẳng định sức hút ngày càng tăng của vùng đất di sản thế giới với du khách quốc tế.',
    '<p>Trong bảng xếp hạng "Travelers'' Choice Best of the Best" năm 2026 vừa được TripAdvisor công bố, tỉnh Ninh Bình một lần nữa góp mặt trong top 10 điểm đến hàng đầu châu Á, xếp thứ 7 toàn khu vực và thứ 2 tại Việt Nam sau Hội An. Đây là lần thứ ba liên tiếp Ninh Bình đạt danh hiệu này.</p>
<p>Theo đánh giá của TripAdvisor, Ninh Bình gây ấn tượng mạnh với du khách quốc tế bởi sự kết hợp hoàn hảo giữa di sản thiên nhiên thế giới (Quần thể Tràng An), di sản lịch sử văn hóa (Cố Đô Hoa Lư, hệ thống đền chùa) và ẩm thực địa phương đặc sắc. Đặc biệt, chương trình phát triển sản phẩm OCOP và du lịch cộng đồng của tỉnh được đánh giá cao vì tạo ra trải nghiệm du lịch có chiều sâu và bền vững.</p>
<p>Theo thống kê của Sở Du lịch Ninh Bình, năm 2025 tỉnh đón hơn 7,5 triệu lượt khách, trong đó khách quốc tế chiếm 18% – tăng 35% so với năm trước. Doanh thu du lịch đạt hơn 4.200 tỷ đồng. Các quốc gia có nhiều du khách nhất đến Ninh Bình là Mỹ, Pháp, Đức, Australia và Hàn Quốc.</p>
<p>Ông Phó Giám đốc Sở Du lịch Ninh Bình cho biết: "Chúng tôi sẽ tiếp tục đầu tư vào nâng cao chất lượng dịch vụ, phát triển các sản phẩm du lịch đêm, du lịch sinh thái và du lịch trải nghiệm làng nghề để giữ chân du khách lâu hơn và gia tăng chi tiêu tại địa phương. Mục tiêu đến 2027 đón 10 triệu lượt khách mỗi năm."</p>',
    'https://storage.example.com/news/ninh-binh-top-diem-den-chau-a.jpg',
    TRUE,
    TRUE,
    '2026-04-20 08:00:00',
    '["ninh-binh", "giai-thuong", "du-lich-quoc-te", "trang-an", "di-san-the-gioi"]'::jsonb
),

-- 16. Núi Ngũ Động
(
    '550db000-e29b-41d4-a716-000000000016'::uuid,
    'Núi Ngũ Động – Điểm Ẩn Cảnh Bí Mật Đang Được Du Khách Ninh Bình Yêu Thích',
    'nui-ngu-dong-diem-an-canh-bi-mat-dang-duoc-du-khach-ua-thich',
    'Trịnh Văn Hòa',
    'Núi Ngũ Động với hệ thống 5 hang động liên thông độc đáo còn ít được biết đến, là điểm khám phá lý tưởng cho những du khách muốn tránh đám đông tại Tràng An hay Tam Cốc đông nghịt. Cảnh quan thiên nhiên nguyên sơ, hệ thống hang động kỳ thú chưa được khai thác nhiều.',
    '<p>Núi Ngũ Động – tên gọi xuất phát từ hệ thống 5 hang động (ngũ = năm, động = hang) tạo thành một mạng lưới hang kết nối độc đáo trong lòng khối núi đá vôi – là một trong những điểm tham quan còn tương đối ít được biết đến của Ninh Bình, dù nằm không xa các khu du lịch nổi tiếng hơn.</p>
<p>5 hang động trong hệ thống có quy mô và hình thái khác nhau: một hang rộng và cao như đại sảnh với hệ thống nhũ đá phong phú, hai hang có chiều dài vừa phải với ánh sáng tự nhiên len lỏi vào, một hang hẹp có suối ngầm chảy qua, và một hang nhỏ ẩn sau màn lá cây đặc biệt bí ẩn. Tất cả được kết nối bởi những con đường đá tự nhiên, tạo thành hành trình khám phá thú vị.</p>
<p>Điểm đặc biệt của Núi Ngũ Động là du khách có thể khám phá hầu hết các hang bằng cách đi bộ mà không cần thuyền, thích hợp cho những ai không thích đi thuyền hoặc muốn một trải nghiệm khác biệt. Vào mùa mưa, một số đoạn có thể cần lội qua suối nhỏ, tạo thêm sự phiêu lưu thú vị.</p>
<p>Vì chưa được khai thác du lịch đại trà, Núi Ngũ Động vẫn giữ nguyên vẻ hoang sơ tự nhiên. Không có tiếng ồn của đám đông, không có đèn chiếu rực rỡ, chỉ có tiếng nước nhỏ giọt, tiếng chim hót vang vọng trong hang và ánh sáng tự nhiên mơ màng – trải nghiệm tối giản nhưng đáng nhớ nhất cho những tâm hồn yêu thiên nhiên.</p>',
    'https://storage.example.com/news/nui-ngu-dong.jpg',
    TRUE,
    FALSE,
    '2026-04-08 08:00:00',
    '["nui-ngu-dong", "hang-dong", "kham-pha", "thien-nhien", "ninh-binh"]'::jsonb
),

-- 17. Bái Đính Garden Resort
(
    '550db000-e29b-41d4-a716-000000000017'::uuid,
    'Bái Đính Garden Resort & Spa – Nghỉ Dưỡng Cao Cấp Giữa Lòng Di Sản',
    'bai-dinh-garden-resort-spa-nghi-duong-cao-cap-giua-long-di-san',
    'Hoàng Minh Tuấn',
    'Bái Đính Garden Resort & Spa – khu nghỉ dưỡng 5 sao nằm trong quần thể Bái Đính, bao quanh bởi hồ nước và núi đá vôi hùng vĩ. Lý tưởng cho du khách muốn trải nghiệm nghỉ dưỡng cao cấp kết hợp khám phá di sản thiên nhiên và văn hóa Ninh Bình.',
    '<p>Bái Đính Garden Resort & Spa là khu nghỉ dưỡng sang trọng tọa lạc ngay trong vùng đệm của Quần thể Danh thắng Tràng An, cách Chùa Bái Đính chỉ vài phút lái xe. Được bao bọc bởi hồ nước trong xanh và những dãy núi đá vôi hùng vĩ, resort mang lại cảm giác nghỉ dưỡng giữa thiên nhiên nguyên sơ với tiện nghi 5 sao đầy đủ.</p>
<p>Khu nghỉ dưỡng gồm hơn 200 phòng và villa riêng biệt, từ phòng Deluxe nhìn ra vườn đến Villa Garden có bể bơi riêng nhìn ra hồ và núi. Kiến trúc kết hợp truyền thống Việt Nam (mái ngói, cột gỗ, ao sen, cầu đá) với tiện nghi hiện đại tạo ra không gian vừa thân quen vừa sang trọng đặc biệt.</p>
<p>Các tiện ích nổi bật: hồ bơi ngoài trời view núi, spa Á Đông với 20 phòng trị liệu, nhà hàng phục vụ ẩm thực Á – Âu với thực phẩm hữu cơ địa phương, kayaking trên hồ, đạp xe khám phá làng quê và các tour tham quan di sản được tổ chức riêng cho khách lưu trú.</p>
<p>Đặc biệt, resort tổ chức các buổi trải nghiệm văn hóa dân gian độc đáo: làm cơm cháy cùng đầu bếp địa phương, học hát xẩm – làn điệu dân ca đặc trưng của Ninh Bình, và workshop thêu ren Văn Lâm. Đây là điểm đến lý tưởng cho du lịch honeymoon, family retreat và corporate retreat tại miền Bắc Việt Nam.</p>',
    'https://storage.example.com/news/bai-dinh-garden-resort.jpg',
    TRUE,
    FALSE,
    '2026-03-30 09:00:00',
    '["bai-dinh-garden-resort-spa", "nghi-duong", "khach-san-5-sao", "ninh-binh", "spa"]'::jsonb
),

-- 18. Du lịch mùa thu Ninh Bình
(
    '550db000-e29b-41d4-a716-000000000018'::uuid,
    'Du Lịch Ninh Bình Mùa Thu – Tháng 9 Và 10 Đẹp Như Tranh Vẽ',
    'du-lich-ninh-binh-mua-thu-thang-9-va-10-dep-nhu-tranh-ve',
    'Mai Thị Xuân',
    'Mùa thu tháng 9–10 là thời điểm đẹp nhất trong năm để khám phá Ninh Bình. Cánh đồng lúa chín vàng ôm trọn chân núi đá vôi, không khí trong lành mát mẻ, ít mưa và không đông đúc như các dịp lễ. Đây là "mùa vàng" của nhiếp ảnh Ninh Bình.',
    '<p>Trong khi nhiều du khách chọn mùa xuân (tháng 2–3) để đến Ninh Bình vì dịp lễ hội, những người sành du lịch và đặc biệt là các nhiếp ảnh gia lại coi tháng 9–10 là thời điểm đẹp nhất để chiêm ngưỡng vùng đất này. Đây là lúc giao mùa thu – đông, khi cánh đồng lúa mùa chín vàng rực, tạo nên khung cảnh vô cùng thơ mộng.</p>
<p>Tại Hang Múa và nhiều điểm cao nhìn xuống đồng bằng Ninh Bình, khung cảnh tháng 9–10 là sự kết hợp hoàn hảo: phía trên là bầu trời xanh trong với những đám mây trắng phiêu diêu, phía dưới là thảm lúa vàng óng bao quanh bởi những khối núi đá vôi xanh thẳm và dòng sông Ngô Đồng phản chiếu ánh vàng. Nhiều nhiếp ảnh gia chuyên nghiệp coi đây là "golden hour" của cả năm.</p>
<p>Ngoài Hang Múa, các điểm cảnh quan đẹp nhất mùa lúa chín gồm: bến thuyền Tam Cốc nhìn ra cánh đồng lúa – núi đá, đê bao sông Hoàng Long (huyện Gia Viễn) với ruộng lúa trải dài ngút mắt, và đường đê vào khu Tràng An nơi lúa vươn cao hai bên đường. Đây là những địa điểm lý tưởng để chụp ảnh bình minh và hoàng hôn.</p>
<p>Thời tiết tháng 9–10 tại Ninh Bình còn mang lại lợi thế: nhiệt độ mát mẻ 22–28°C, ít mưa hơn tháng 7–8, trời thường trong xanh, thuận lợi cho các hoạt động ngoài trời như đi thuyền, leo núi và đạp xe khám phá làng quê. Các khách sạn và homestay có giá tốt hơn so với mùa cao điểm xuân – hè, đặt phòng dễ dàng hơn.</p>',
    'https://storage.example.com/news/ninh-binh-mua-thu-lua-chin.jpg',
    TRUE,
    FALSE,
    '2026-04-22 08:00:00',
    '["mua-thu", "lua-chin", "ninh-binh", "hang-mua", "nhiet-anh", "thoi-diem-du-lich"]'::jsonb
)

ON CONFLICT (id) DO NOTHING;

COMMIT;
