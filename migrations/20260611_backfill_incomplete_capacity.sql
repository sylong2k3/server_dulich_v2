-- Backfill capacity cho các điểm chưa đầy đủ (max_capacity + capacity_logs)
-- Sinh tự động bởi scripts/generate_capacity_backfill.js. An toàn khi chạy lại.
-- Tổng số điểm xử lý: 96 (đặt max: 70, seed log: 96)

BEGIN;

-- 1) Đặt max_capacity cho các điểm còn thiếu (theo loại điểm)
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '92789714-0afa-4871-807f-8dc8e0143aad'; -- Aquarius Garden
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '0e2d8a5f-439b-4f34-9412-48b98529aff0'; -- Athena Premier Resort
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '6f7e4e7a-9443-4f26-8544-804e656c140e'; -- Bái Đính garden Resort & spa
UPDATE tourism_spots SET max_capacity = 3000, updated_at = NOW() WHERE id = 'a5b939d7-57ab-4803-a057-afe961a7fd14'; -- Cánh đồng Sen
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = 'bf23dd39-7f14-4c70-893d-584bb616f4a0'; -- Chùa Bái Đính cổ
UPDATE tourism_spots SET max_capacity = 2000, updated_at = NOW() WHERE id = '64393e71-ff15-4d26-a468-08503702d42b'; -- Cố đô Hoa Lư
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '7190788f-7a44-41c8-8575-650b56a55a7e'; -- Cúc Phương Mineral Retreat
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = '0d7ed63f-510e-45ea-8c24-b53333dac7cb'; -- Đền Đinh Tiên Hoàng
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = 'e8cb7dac-b2dd-400d-8b96-1d43451086aa'; -- Đền Suối Tiên
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = 'b9bb1115-e295-425f-ab03-98e83b5337c6'; -- Đền Thái Vi
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = 'aa534d10-acf1-46a0-8096-c5b9bb797390'; -- Đền thánh Cao Sơn
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = '95236950-c6db-422e-bc0f-ad0734dd9f8f'; -- Đền Thung Nhang
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = '57ca21dd-26a5-438d-b900-012fa3ab798c'; -- Đền Trần
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = '08cbb049-686b-4694-a4ab-f3e4fafc9842'; -- Đền Trình
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = 'c950277d-fe88-4a3f-9fd7-d58aa328e882'; -- Đền Vối
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = 'fa2e6cf0-77d3-404a-9e20-4624655dfbd2'; -- Đền Vua Đinh
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = 'cb297188-81d7-4e3e-b693-ab6f570f1593'; -- Đền Vua Lê
UPDATE tourism_spots SET max_capacity = 2000, updated_at = NOW() WHERE id = '43481b72-af83-47b7-89f9-e66a82b466d4'; -- Đình Các
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'd64b5078-3a09-4d02-9cbf-b52e2a51b034'; -- Động Thiên Thanh
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'c937e25c-b85b-48fa-9bf3-2a958858f613'; -- Động Tiên Cá
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'f1d47566-c376-4e01-aa1f-18867c9fa589'; -- Động Vái Giời
UPDATE tourism_spots SET max_capacity = 3000, updated_at = NOW() WHERE id = '7ffaf2c5-a665-4795-8fc3-8e5ec9060b4d'; -- Đường lên Hang Múa
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '452884e6-fc19-42f8-9386-1a732b16f0b4'; -- Emeralda Resort Ninh Binh
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '55f42e67-66e5-41fa-8eb4-44f41f0f49a3'; -- Hang Ba Giọt
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'a02a5bd6-9329-4299-98f4-afe742d04e55'; -- Hang Bói
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '3ced73f3-68de-464f-a185-8a95b83755c4'; -- Hang Bụt
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'd489058b-bf60-4d6f-8c9f-ae9a99c5e4d6'; -- Hang Cả
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '77a1e1cb-8d08-4d3f-b9fb-244b7629d697'; -- Hang Đại
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'e4208dd8-e875-4df6-9444-5e4e456676b0'; -- Hang Địa Linh
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'd0b90d46-8945-4f32-9ecb-abca3448a2fd'; -- Hang Đột
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '379e47c1-b0b9-495c-98ae-067390ebe849'; -- Hang Khống
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'bf8d1768-77cd-4a0e-b70f-ad2b82fca588'; -- Hang Lấm
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'c36c438d-f287-4743-9013-3823965aba2a'; -- Hang Mòi
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '5346944b-b1b9-4b8e-b0da-1a01def7e429'; -- Hang Nấu Rượu
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'fc7b4aeb-1ccc-4891-b332-fe2c0822b864'; -- Hang Quy Hậu
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'ec1fbc3b-0f03-478e-a8fc-0ad68d7a58c0'; -- Hang Seo
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'b5410ea5-9018-4c8f-a67f-2ef64a680099'; -- Hang Sơn Dương
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '31cc0a9f-f8dc-4084-b2c9-d15201267269'; -- Hang Tối
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '99e24d0c-ee4a-4736-b90e-ce8f1288bc70'; -- Hang Trần
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '4e9e2b22-cb7d-4e54-8bc4-e0bd8f758795'; -- Hang Trống
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = 'f015664f-f19f-42d9-b3ab-5ec27768edbe'; -- Hang Vân
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '6d308fcc-71e0-4d2e-a742-eda70fdaad1e'; -- Hang Vạng
UPDATE tourism_spots SET max_capacity = 1000, updated_at = NOW() WHERE id = '382f1061-8f10-4886-8c71-1b80c19a7ec6'; -- Hang Vồng
UPDATE tourism_spots SET max_capacity = 2000, updated_at = NOW() WHERE id = '5f6bdde9-f49c-4a0d-9d38-c9ace94dd842'; -- Hành cung Vũ Lâm
UPDATE tourism_spots SET max_capacity = 5000, updated_at = NOW() WHERE id = '5f4033ad-cfb8-4c81-a592-0cb9109ad016'; -- Hoa Lư
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '45f85023-1702-429e-aaec-7ad41b429a8b'; -- Hoàng Gia
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = 'da96292b-51e5-40e6-b92b-c225e7482bf0'; -- Jiva Hoa Lư Retreat
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = 'bb03c1c8-9dfe-441b-84e6-b3f83a13ef68'; -- Khách sạn Hidden Charm
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = 'eb125044-5e44-4271-82fd-c742966742fc'; -- Khách sạn Hòa Bình
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = 'c3e83414-ddbe-4753-bc22-10b1c74d759c'; -- Khách sạn Hoàng Sơn
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = 'df62e0fe-2154-45df-9db7-b6ccf49411e9'; -- Khách sạn Lakeside II
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '96e56a22-9033-4ac0-b95b-4b452fabd257'; -- Khách sạn Ninh Bình Legend
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = 'fd3ac749-c32a-46e5-94c2-a565d6e23499'; -- Khách sạn The Reed
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = 'ae05294b-fde8-4b65-bbde-ffd4260b71bb'; -- Khách sạn The Vissai
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '4fce0631-096e-4d19-bdbf-738d8e85d20c'; -- Khách sạn Thuận Thành
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '86bdae42-4d92-4146-9317-0bf6c78ac889'; -- Khách sạn Tuylip
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = 'faa4e73a-a3e7-4969-b77d-cd46104b969b'; -- Khách sạn Vân Long Green
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '948b8a40-d0cb-4dc3-b126-42aa7df4c967'; -- Khách sạn Yến Nhi
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '4d735048-a929-46ae-bcd2-dd51f41d591e'; -- Khách xá Tam Chúc
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '8bc79d21-ac31-4a8c-a1be-f06774ac5c8e'; -- Memorina Ninh Bình Famstay
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '9f3f274b-52f4-4be9-a8b3-eb5b1650b2e1'; -- Mường Thanh Luxury Hà Nam
UPDATE tourism_spots SET max_capacity = 300, updated_at = NOW() WHERE id = 'c3c40f16-e645-4dca-819b-ab3e87548801'; -- Nhà hàng Tre Xanh
UPDATE tourism_spots SET max_capacity = 1200, updated_at = NOW() WHERE id = '111dc2a9-77be-4b05-ad16-b465c786a0e0'; -- Núi Ngu Động
UPDATE tourism_spots SET max_capacity = 2000, updated_at = NOW() WHERE id = 'bea03c29-cd55-447a-817f-488ad3b5d1e0'; -- Phủ Khống
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '2b9ae111-b6e2-42b5-a901-905c1cbb970c'; -- Thung Nham Resort
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '60cbf99e-4666-445f-a6fd-a35a946679f6'; -- Tru by Hilton Nam Dinh City Centre
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '8f041f97-a1bf-4b14-b6f1-f5cd3cf3cf98'; -- Vinpearl Melia Phủ Lý
UPDATE tourism_spots SET max_capacity = 1500, updated_at = NOW() WHERE id = '9b7ae99e-14f6-42e1-95d5-0817492866ee'; -- Vườn chim Thung Nham
UPDATE tourism_spots SET max_capacity = 500, updated_at = NOW() WHERE id = '53e5ef65-ac16-464b-9116-56583f51f52d'; -- Wyndham Grand Vedana Ninh Binh Resort
UPDATE tourism_spots SET max_capacity = 2000, updated_at = NOW() WHERE id = '8432a2a5-a147-43d8-bf9e-bc2875ce9954'; -- Xuân Thủy

-- 2) Dọn log backfill cũ để chạy lại an toàn
DELETE FROM capacity_logs WHERE data_source = 'capacity_backfill' AND spot_id IN (
    '92789714-0afa-4871-807f-8dc8e0143aad',
    '0e2d8a5f-439b-4f34-9412-48b98529aff0',
    '6f7e4e7a-9443-4f26-8544-804e656c140e',
    '274da49d-4a22-4a62-9dca-fda552133bfb',
    '55bd5089-e88e-415c-86b8-c99cb10fb7fa',
    'a5b939d7-57ab-4803-a057-afe961a7fd14',
    '1b4c6eb8-68a1-4e3d-9081-3bca4904b1cc',
    'f72921e4-5faa-426d-9f69-d9587e35a9d8',
    'bf23dd39-7f14-4c70-893d-584bb616f4a0',
    '168f708b-c45e-41d1-819f-302368af742c',
    '4d79a54a-9cff-4691-8c0a-88ed28296ddd',
    '2bfa4785-623c-48d1-8182-40b4267e721a',
    '64393e71-ff15-4d26-a468-08503702d42b',
    '027faa95-528b-49fb-a249-b298b8d6fbca',
    '7190788f-7a44-41c8-8575-650b56a55a7e',
    '0d7ed63f-510e-45ea-8c24-b53333dac7cb',
    'f7610137-2936-4f82-beec-bc682c35a851',
    'e8cb7dac-b2dd-400d-8b96-1d43451086aa',
    'b9bb1115-e295-425f-ab03-98e83b5337c6',
    'aa534d10-acf1-46a0-8096-c5b9bb797390',
    '3041b884-99d1-41cb-83f3-2a59aebf1056',
    '95236950-c6db-422e-bc0f-ad0734dd9f8f',
    '57ca21dd-26a5-438d-b900-012fa3ab798c',
    '08cbb049-686b-4694-a4ab-f3e4fafc9842',
    'c950277d-fe88-4a3f-9fd7-d58aa328e882',
    'fa2e6cf0-77d3-404a-9e20-4624655dfbd2',
    'cb297188-81d7-4e3e-b693-ab6f570f1593',
    '43481b72-af83-47b7-89f9-e66a82b466d4',
    'bbf7ed01-1e30-4d37-b852-32466b69aed7',
    'b51ce667-6552-4ada-8519-dd46db962fea',
    'd64b5078-3a09-4d02-9cbf-b52e2a51b034',
    'c937e25c-b85b-48fa-9bf3-2a958858f613',
    'f1d47566-c376-4e01-aa1f-18867c9fa589',
    '7ffaf2c5-a665-4795-8fc3-8e5ec9060b4d',
    '452884e6-fc19-42f8-9386-1a732b16f0b4',
    '46a7398d-386f-4449-af1f-b24dd5667649',
    '55f42e67-66e5-41fa-8eb4-44f41f0f49a3',
    'a02a5bd6-9329-4299-98f4-afe742d04e55',
    '3ced73f3-68de-464f-a185-8a95b83755c4',
    'd489058b-bf60-4d6f-8c9f-ae9a99c5e4d6',
    '77a1e1cb-8d08-4d3f-b9fb-244b7629d697',
    'e4208dd8-e875-4df6-9444-5e4e456676b0',
    'd0b90d46-8945-4f32-9ecb-abca3448a2fd',
    '379e47c1-b0b9-495c-98ae-067390ebe849',
    'bf8d1768-77cd-4a0e-b70f-ad2b82fca588',
    'c36c438d-f287-4743-9013-3823965aba2a',
    '5346944b-b1b9-4b8e-b0da-1a01def7e429',
    'fc7b4aeb-1ccc-4891-b332-fe2c0822b864',
    'ec1fbc3b-0f03-478e-a8fc-0ad68d7a58c0',
    'b5410ea5-9018-4c8f-a67f-2ef64a680099',
    '31cc0a9f-f8dc-4084-b2c9-d15201267269',
    '99e24d0c-ee4a-4736-b90e-ce8f1288bc70',
    '4e9e2b22-cb7d-4e54-8bc4-e0bd8f758795',
    'f015664f-f19f-42d9-b3ab-5ec27768edbe',
    '6d308fcc-71e0-4d2e-a742-eda70fdaad1e',
    '382f1061-8f10-4886-8c71-1b80c19a7ec6',
    '5f6bdde9-f49c-4a0d-9d38-c9ace94dd842',
    'ddcf603e-ea11-4743-869c-0069e9aec47b',
    'b7455c23-c374-4aa6-9474-bb162c9d61de',
    '5f4033ad-cfb8-4c81-a592-0cb9109ad016',
    '45f85023-1702-429e-aaec-7ad41b429a8b',
    'da96292b-51e5-40e6-b92b-c225e7482bf0',
    'bb03c1c8-9dfe-441b-84e6-b3f83a13ef68',
    'eb125044-5e44-4271-82fd-c742966742fc',
    'c3e83414-ddbe-4753-bc22-10b1c74d759c',
    'df62e0fe-2154-45df-9db7-b6ccf49411e9',
    '96e56a22-9033-4ac0-b95b-4b452fabd257',
    'fd3ac749-c32a-46e5-94c2-a565d6e23499',
    'ae05294b-fde8-4b65-bbde-ffd4260b71bb',
    '4fce0631-096e-4d19-bdbf-738d8e85d20c',
    '86bdae42-4d92-4146-9317-0bf6c78ac889',
    'faa4e73a-a3e7-4969-b77d-cd46104b969b',
    '948b8a40-d0cb-4dc3-b126-42aa7df4c967',
    '4d735048-a929-46ae-bcd2-dd51f41d591e',
    'ba99f738-9c8e-426f-8d1d-1c1d2fce04ec',
    'a0655366-141b-4e5f-8540-070b7b810c46',
    '661fce25-9fa9-45ac-b83b-6491c3abf546',
    '8bc79d21-ac31-4a8c-a1be-f06774ac5c8e',
    '9f3f274b-52f4-4be9-a8b3-eb5b1650b2e1',
    'c3c40f16-e645-4dca-819b-ab3e87548801',
    'c42f8a59-1d20-4eb7-a859-eaf04ef051fa',
    '7e79199d-da3a-4ece-8f54-e0babe003642',
    '24d948f4-1229-445a-b7be-d668fb0cc88a',
    '111dc2a9-77be-4b05-ad16-b465c786a0e0',
    'c52303b1-b7ec-4fae-ab07-973f96a5b6d6',
    'c2c4b9a9-ee83-402b-9ba9-7ba88592b2c5',
    'bea03c29-cd55-447a-817f-488ad3b5d1e0',
    '9dd166b3-c814-4e05-8312-14df4ecd253a',
    '2c87fc54-a877-41cd-bf03-bd6d2b0e12e9',
    '2b9ae111-b6e2-42b5-a901-905c1cbb970c',
    '60cbf99e-4666-445f-a6fd-a35a946679f6',
    '8f041f97-a1bf-4b14-b6f1-f5cd3cf3cf98',
    '9b7ae99e-14f6-42e1-95d5-0817492866ee',
    'bb0ae9ba-9613-4a2d-8975-63a775e503dc',
    '53e5ef65-ac16-464b-9116-56583f51f52d',
    '8432a2a5-a147-43d8-bf9e-bc2875ce9954'
);

-- 3) Seed log capacity nhất quán (visitor_count = max * occupancy)
INSERT INTO capacity_logs (spot_id, recorded_at, visitor_count, capacity_pct, status, data_source, recorded_by)
VALUES
    ('92789714-0afa-4871-807f-8dc8e0143aad', NOW(), 270, 54.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Aquarius Garden (max 500)
    ('0e2d8a5f-439b-4f34-9412-48b98529aff0', NOW(), 385, 77.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Athena Premier Resort (max 500)
    ('6f7e4e7a-9443-4f26-8544-804e656c140e', NOW(), 370, 74.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Bái Đính garden Resort & spa (max 500)
    ('274da49d-4a22-4a62-9dca-fda552133bfb', NOW(), 342, 57.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Bảo tàng Ninh Bình (max 600)
    ('55bd5089-e88e-415c-86b8-c99cb10fb7fa', NOW(), 444, 74.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Bến thuyền Thung Nham (max 600)
    ('a5b939d7-57ab-4803-a057-afe961a7fd14', NOW(), 2400, 80.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Cánh đồng Sen (max 3000)
    ('1b4c6eb8-68a1-4e3d-9081-3bca4904b1cc', NOW(), 432, 72.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Cầu Non Nước (max 600)
    ('f72921e4-5faa-426d-9f69-d9587e35a9d8', NOW(), 426, 71.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Chợ Rồng Ninh Bình (max 600)
    ('bf23dd39-7f14-4c70-893d-584bb616f4a0', NOW(), 1230, 82.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Chùa Bái Đính cổ (max 1500)
    ('168f708b-c45e-41d1-819f-302368af742c', NOW(), 1230, 82.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Chùa Bích Động (max 1500)
    ('4d79a54a-9cff-4691-8c0a-88ed28296ddd', NOW(), 366, 61.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Chùa Duyên Ninh (max 600)
    ('2bfa4785-623c-48d1-8182-40b4267e721a', NOW(), 354, 59.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Chùa Non Nước (max 600)
    ('64393e71-ff15-4d26-a468-08503702d42b', NOW(), 1200, 60.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Cố đô Hoa Lư (max 2000)
    ('027faa95-528b-49fb-a249-b298b8d6fbca', NOW(), 456, 76.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Công viên khủng long Ninh Bình (max 600)
    ('7190788f-7a44-41c8-8575-650b56a55a7e', NOW(), 325, 65.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Cúc Phương Mineral Retreat (max 500)
    ('0d7ed63f-510e-45ea-8c24-b53333dac7cb', NOW(), 1215, 81.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Đinh Tiên Hoàng (max 1500)
    ('f7610137-2936-4f82-beec-bc682c35a851', NOW(), 432, 72.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Nguyễn Công Trứ (max 600)
    ('e8cb7dac-b2dd-400d-8b96-1d43451086aa', NOW(), 1215, 81.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Suối Tiên (max 1500)
    ('b9bb1115-e295-425f-ab03-98e83b5337c6', NOW(), 840, 56.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Thái Vi (max 1500)
    ('aa534d10-acf1-46a0-8096-c5b9bb797390', NOW(), 765, 51.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền thánh Cao Sơn (max 1500)
    ('3041b884-99d1-41cb-83f3-2a59aebf1056', NOW(), 414, 69.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền thờ Trương Hán Siêu (max 600)
    ('95236950-c6db-422e-bc0f-ad0734dd9f8f', NOW(), 855, 57.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Thung Nhang (max 1500)
    ('57ca21dd-26a5-438d-b900-012fa3ab798c', NOW(), 945, 63.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Trần (max 1500)
    ('08cbb049-686b-4694-a4ab-f3e4fafc9842', NOW(), 825, 55.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Trình (max 1500)
    ('c950277d-fe88-4a3f-9fd7-d58aa328e882', NOW(), 1125, 75.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Vối (max 1500)
    ('fa2e6cf0-77d3-404a-9e20-4624655dfbd2', NOW(), 900, 60.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Vua Đinh (max 1500)
    ('cb297188-81d7-4e3e-b693-ab6f570f1593', NOW(), 900, 60.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đền Vua Lê (max 1500)
    ('43481b72-af83-47b7-89f9-e66a82b466d4', NOW(), 1520, 76.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đình Các (max 2000)
    ('bbf7ed01-1e30-4d37-b852-32466b69aed7', NOW(), 426, 71.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Động Galaxy (max 600)
    ('b51ce667-6552-4ada-8519-dd46db962fea', NOW(), 318, 53.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Động Mã Tiên (max 600)
    ('d64b5078-3a09-4d02-9cbf-b52e2a51b034', NOW(), 530, 53.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Động Thiên Thanh (max 1000)
    ('c937e25c-b85b-48fa-9bf3-2a958858f613', NOW(), 560, 56.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Động Tiên Cá (max 1000)
    ('f1d47566-c376-4e01-aa1f-18867c9fa589', NOW(), 530, 53.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Động Vái Giời (max 1000)
    ('7ffaf2c5-a665-4795-8fc3-8e5ec9060b4d', NOW(), 2010, 67.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Đường lên Hang Múa (max 3000)
    ('452884e6-fc19-42f8-9386-1a732b16f0b4', NOW(), 315, 63.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Emeralda Resort Ninh Binh (max 500)
    ('46a7398d-386f-4449-af1f-b24dd5667649', NOW(), 342, 57.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Ga Ninh Bình (max 600)
    ('55f42e67-66e5-41fa-8eb4-44f41f0f49a3', NOW(), 670, 67.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Ba Giọt (max 1000)
    ('a02a5bd6-9329-4299-98f4-afe742d04e55', NOW(), 510, 51.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Bói (max 1000)
    ('3ced73f3-68de-464f-a185-8a95b83755c4', NOW(), 790, 79.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Bụt (max 1000)
    ('d489058b-bf60-4d6f-8c9f-ae9a99c5e4d6', NOW(), 580, 58.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Cả (max 1000)
    ('77a1e1cb-8d08-4d3f-b9fb-244b7629d697', NOW(), 540, 54.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Đại (max 1000)
    ('e4208dd8-e875-4df6-9444-5e4e456676b0', NOW(), 580, 58.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Địa Linh (max 1000)
    ('d0b90d46-8945-4f32-9ecb-abca3448a2fd', NOW(), 590, 59.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Đột (max 1000)
    ('379e47c1-b0b9-495c-98ae-067390ebe849', NOW(), 650, 65.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Khống (max 1000)
    ('bf8d1768-77cd-4a0e-b70f-ad2b82fca588', NOW(), 840, 84.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Lấm (max 1000)
    ('c36c438d-f287-4743-9013-3823965aba2a', NOW(), 500, 50.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Mòi (max 1000)
    ('5346944b-b1b9-4b8e-b0da-1a01def7e429', NOW(), 500, 50.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Nấu Rượu (max 1000)
    ('fc7b4aeb-1ccc-4891-b332-fe2c0822b864', NOW(), 800, 80.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Quy Hậu (max 1000)
    ('ec1fbc3b-0f03-478e-a8fc-0ad68d7a58c0', NOW(), 610, 61.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Seo (max 1000)
    ('b5410ea5-9018-4c8f-a67f-2ef64a680099', NOW(), 620, 62.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Sơn Dương (max 1000)
    ('31cc0a9f-f8dc-4084-b2c9-d15201267269', NOW(), 660, 66.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Tối (max 1000)
    ('99e24d0c-ee4a-4736-b90e-ce8f1288bc70', NOW(), 840, 84.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Trần (max 1000)
    ('4e9e2b22-cb7d-4e54-8bc4-e0bd8f758795', NOW(), 700, 70.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Trống (max 1000)
    ('f015664f-f19f-42d9-b3ab-5ec27768edbe', NOW(), 540, 54.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Vân (max 1000)
    ('6d308fcc-71e0-4d2e-a742-eda70fdaad1e', NOW(), 790, 79.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Vạng (max 1000)
    ('382f1061-8f10-4886-8c71-1b80c19a7ec6', NOW(), 680, 68.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hang Vồng (max 1000)
    ('5f6bdde9-f49c-4a0d-9d38-c9ace94dd842', NOW(), 1300, 65.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hành cung Vũ Lâm (max 2000)
    ('ddcf603e-ea11-4743-869c-0069e9aec47b', NOW(), 402, 67.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hồ Đồng Chương (max 600)
    ('b7455c23-c374-4aa6-9474-bb162c9d61de', NOW(), 336, 56.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hồ Yên Thắng (max 600)
    ('5f4033ad-cfb8-4c81-a592-0cb9109ad016', NOW(), 3700, 74.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hoa Lư (max 5000)
    ('45f85023-1702-429e-aaec-7ad41b429a8b', NOW(), 340, 68.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Hoàng Gia (max 500)
    ('da96292b-51e5-40e6-b92b-c225e7482bf0', NOW(), 295, 59.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Jiva Hoa Lư Retreat (max 500)
    ('bb03c1c8-9dfe-441b-84e6-b3f83a13ef68', NOW(), 315, 63.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Hidden Charm (max 500)
    ('eb125044-5e44-4271-82fd-c742966742fc', NOW(), 410, 82.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Hòa Bình (max 500)
    ('c3e83414-ddbe-4753-bc22-10b1c74d759c', NOW(), 385, 77.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Hoàng Sơn (max 500)
    ('df62e0fe-2154-45df-9db7-b6ccf49411e9', NOW(), 335, 67.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Lakeside II (max 500)
    ('96e56a22-9033-4ac0-b95b-4b452fabd257', NOW(), 405, 81.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Ninh Bình Legend (max 500)
    ('fd3ac749-c32a-46e5-94c2-a565d6e23499', NOW(), 360, 72.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn The Reed (max 500)
    ('ae05294b-fde8-4b65-bbde-ffd4260b71bb', NOW(), 415, 83.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn The Vissai (max 500)
    ('4fce0631-096e-4d19-bdbf-738d8e85d20c', NOW(), 285, 57.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Thuận Thành (max 500)
    ('86bdae42-4d92-4146-9317-0bf6c78ac889', NOW(), 390, 78.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Tuylip (max 500)
    ('faa4e73a-a3e7-4969-b77d-cd46104b969b', NOW(), 385, 77.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Vân Long Green (max 500)
    ('948b8a40-d0cb-4dc3-b126-42aa7df4c967', NOW(), 395, 79.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách sạn Yến Nhi (max 500)
    ('4d735048-a929-46ae-bcd2-dd51f41d591e', NOW(), 315, 63.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khách xá Tam Chúc (max 500)
    ('ba99f738-9c8e-426f-8d1d-1c1d2fce04ec', NOW(), 474, 79.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Khu du lịch Kênh Gà - Vân Trình (max 600)
    ('a0655366-141b-4e5f-8540-070b7b810c46', NOW(), 486, 81.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Làng đá mỹ nghệ Ninh Vân (max 600)
    ('661fce25-9fa9-45ac-b83b-6491c3abf546', NOW(), 336, 56.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Làng Việt cổ Cố Viên Lầu (max 600)
    ('8bc79d21-ac31-4a8c-a1be-f06774ac5c8e', NOW(), 265, 53.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Memorina Ninh Bình Famstay (max 500)
    ('9f3f274b-52f4-4be9-a8b3-eb5b1650b2e1', NOW(), 315, 63.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Mường Thanh Luxury Hà Nam (max 500)
    ('c3c40f16-e645-4dca-819b-ab3e87548801', NOW(), 153, 51.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Nhà hàng Tre Xanh (max 300)
    ('c42f8a59-1d20-4eb7-a859-eaf04ef051fa', NOW(), 1035, 69.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Nhà thờ đá Phát Diệm (max 1500)
    ('7e79199d-da3a-4ece-8f54-e0babe003642', NOW(), 402, 67.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Nhà thờ giáo xứ Đồng Đắc (max 600)
    ('24d948f4-1229-445a-b7be-d668fb0cc88a', NOW(), 396, 66.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Núi Kỳ Lân (max 600)
    ('111dc2a9-77be-4b05-ad16-b465c786a0e0', NOW(), 960, 80.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Núi Ngu Động (max 1200)
    ('c52303b1-b7ec-4fae-ab07-973f96a5b6d6', NOW(), 1095, 73.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Núi Non Nước (max 1500)
    ('c2c4b9a9-ee83-402b-9ba9-7ba88592b2c5', NOW(), 1230, 82.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Phòng tuyến Tam Điệp (max 1500)
    ('bea03c29-cd55-447a-817f-488ad3b5d1e0', NOW(), 1580, 79.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Phủ Khống (max 2000)
    ('9dd166b3-c814-4e05-8312-14df4ecd253a', NOW(), 312, 52.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Sông Hoàng Long (max 600)
    ('2c87fc54-a877-41cd-bf03-bd6d2b0e12e9', NOW(), 390, 65.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Sông Sào Khê (max 600)
    ('2b9ae111-b6e2-42b5-a901-905c1cbb970c', NOW(), 255, 51.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Thung Nham Resort (max 500)
    ('60cbf99e-4666-445f-a6fd-a35a946679f6', NOW(), 310, 62.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Tru by Hilton Nam Dinh City Centre (max 500)
    ('8f041f97-a1bf-4b14-b6f1-f5cd3cf3cf98', NOW(), 370, 74.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Vinpearl Melia Phủ Lý (max 500)
    ('9b7ae99e-14f6-42e1-95d5-0817492866ee', NOW(), 1155, 77.00, 'busy', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Vườn chim Thung Nham (max 1500)
    ('bb0ae9ba-9613-4a2d-8975-63a775e503dc', NOW(), 765, 51.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Vườn quốc gia Cúc Phương (max 1500)
    ('53e5ef65-ac16-464b-9116-56583f51f52d', NOW(), 260, 52.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'), -- Wyndham Grand Vedana Ninh Binh Resort (max 500)
    ('8432a2a5-a147-43d8-bf9e-bc2875ce9954', NOW(), 1180, 59.00, 'normal', 'capacity_backfill', 'f4f1919a-bc43-4266-8f7c-89045c58cd86'); -- Xuân Thủy (max 2000)

COMMIT;
