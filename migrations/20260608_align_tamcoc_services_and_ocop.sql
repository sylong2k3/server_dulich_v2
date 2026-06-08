SET search_path TO public, auth, vn_units;

BEGIN;

CREATE SCHEMA IF NOT EXISTS data_backups;

-- 1. Backup businesses and services before adjustment
CREATE TABLE IF NOT EXISTS data_backups.businesses_before_tamcoc_alignment_20260608 AS
SELECT * FROM businesses WHERE province_code = '37';

CREATE TABLE IF NOT EXISTS data_backups.services_before_tamcoc_alignment_20260608 AS
SELECT * FROM services;

-- 2. Assign Làng Nghề Thêu Ren Văn Lâm (550ba000-e29b-41d4-a716-000000000004) to Tam Cốc user
WITH tamcoc_user AS (
    SELECT id FROM auth.users WHERE email = 'tamcoc.tourism.service@gmail.com' LIMIT 1
)
UPDATE businesses
SET owner_id = (SELECT id FROM tamcoc_user),
    updated_at = NOW()
WHERE id = '550ba000-e29b-41d4-a716-000000000004';

-- 3. Rename test business (295e24d5-c574-462e-bf59-345947412345) to 'Emeralda Tam Cốc Resort' and set owner
WITH tamcoc_user AS (
    SELECT id FROM auth.users WHERE email = 'tamcoc.tourism.service@gmail.com' LIMIT 1
)
UPDATE businesses
SET business_name = 'Emeralda Tam Cốc Resort',
    business_type = 'hotel',
    owner_id = (SELECT id FROM tamcoc_user),
    address_vi = 'Khu du lịch Tam Cốc - Bích Động, Ninh Hải, Hoa Lư, Ninh Bình',
    updated_at = NOW()
WHERE id = '295e24d5-c574-462e-bf59-345947412345';

-- 4. Rename test business (6c6de155-675f-4f5c-90df-718240fe50a7) to 'Tam Cốc Lamontagne Resort & spa' and set owner
WITH tamcoc_user AS (
    SELECT id FROM auth.users WHERE email = 'tamcoc.tourism.service@gmail.com' LIMIT 1
)
UPDATE businesses
SET business_name = 'Tam Cốc Lamontagne Resort & spa',
    business_type = 'hotel',
    owner_id = (SELECT id FROM tamcoc_user),
    address_vi = 'Khu du lịch Tam Cốc - Bích Động, Ninh Hải, Hoa Lư, Ninh Bình',
    updated_at = NOW()
WHERE id = '6c6de155-675f-4f5c-90df-718240fe50a7';

-- 5. Delete any existing service for 295e24d5-c574-462e-bf59-345947412345 and 6c6de155-675f-4f5c-90df-718240fe50a7 to avoid duplicates
DELETE FROM services WHERE business_id IN ('295e24d5-c574-462e-bf59-345947412345', '6c6de155-675f-4f5c-90df-718240fe50a7');

-- 6. Insert service for 'Emeralda Tam Cốc Resort' (business 295e24d5-c574-462e-bf59-345947412345) linking to its spot
INSERT INTO services (business_id, spot_id, service_name_vi, category, price_from, price_to, currency, is_active)
VALUES (
    '295e24d5-c574-462e-bf59-345947412345',
    '1c7dff3b-7855-4478-a24b-f5998c17aa60',
    'Dịch vụ nghỉ dưỡng Emeralda Tam Cốc Resort',
    'hotel',
    1000000,
    5000000,
    'VND',
    TRUE
);

-- 7. Insert service for 'Tam Cốc Lamontagne Resort & spa' (business 6c6de155-675f-4f5c-90df-718240fe50a7) linking to its spot
INSERT INTO services (business_id, spot_id, service_name_vi, category, price_from, price_to, currency, is_active)
VALUES (
    '6c6de155-675f-4f5c-90df-718240fe50a7',
    '5adc4eae-320b-413f-892c-c9f08a2d6007',
    'Dịch vụ nghỉ dưỡng Tam Cốc Lamontagne Resort & spa',
    'hotel',
    800000,
    4000000,
    'VND',
    TRUE
);

COMMIT;
