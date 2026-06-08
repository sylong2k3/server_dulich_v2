SET search_path TO public, auth, vn_units;

BEGIN;

CREATE SCHEMA IF NOT EXISTS data_backups;

-- 1. Backup tour packages before adjustment
CREATE TABLE IF NOT EXISTS data_backups.tour_packages_before_adjustment_20260608 AS
SELECT
    tp.id,
    tp.name_vi,
    tp.business_id,
    tp.updated_at,
    NOW() AS backed_up_at
FROM tour_packages tp
WHERE tp.province_code = '37';

-- 2. Adjust tour packages owner businesses: only travel company owns tours
WITH target_businesses AS (
    SELECT
        (MAX(id::text) FILTER (WHERE business_name = 'Công ty lữ hành Tràng An'))::uuid AS trangan_travel_business_id
    FROM businesses
    WHERE province_code = '37'
)
UPDATE tour_packages tp
SET business_id = CASE
        WHEN tp.name_vi ILIKE '%Tràng An%'
          OR tp.name_vi ILIKE '%Trang An%'
            THEN tb.trangan_travel_business_id
        ELSE NULL
    END,
    updated_at = NOW()
FROM target_businesses tb
WHERE tp.province_code = '37';

COMMIT;
