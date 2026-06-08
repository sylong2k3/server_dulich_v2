SET search_path TO public, auth, vn_units;

BEGIN;

CREATE SCHEMA IF NOT EXISTS data_backups;

CREATE TABLE IF NOT EXISTS data_backups.user_profiles_before_named_alignment_20260608 AS
SELECT
    u.id,
    u.email,
    u.full_name,
    u.province_code,
    u.updated_at,
    NOW() AS backed_up_at
FROM auth.users u
WHERE u.email IN (
    'admin@gmail.com',
    'bovhttdl.vietnam@gmail.com',
    'sovhttdl.ninhbinh@gmail.com',
    'trangan.site.operator@gmail.com',
    'trangan.heritage.travel@gmail.com',
    'tamcoc.tourism.service@gmail.com'
);

CREATE TABLE IF NOT EXISTS data_backups.business_owners_before_named_alignment_20260608 AS
SELECT
    b.id,
    b.business_name,
    b.business_type,
    b.province_code,
    b.owner_id,
    b.updated_at,
    NOW() AS backed_up_at
FROM businesses b
WHERE b.province_code = '37'
  AND (
      b.owner_id IN (
          SELECT id
          FROM auth.users
          WHERE email IN (
              'trangan.site.operator@gmail.com',
              'trangan.heritage.travel@gmail.com',
              'tamcoc.tourism.service@gmail.com'
          )
      )
      OR b.business_name ILIKE '%Tràng An%'
      OR b.business_name ILIKE '%Trang An%'
      OR b.business_name ILIKE '%Tam Cốc%'
      OR b.business_name ILIKE '%Tam Coc%'
      OR COALESCE(b.address_vi, '') ILIKE '%Tràng An%'
      OR COALESCE(b.address_vi, '') ILIKE '%Trang An%'
      OR COALESCE(b.address_vi, '') ILIKE '%Tam Cốc%'
      OR COALESCE(b.address_vi, '') ILIKE '%Tam Coc%'
  );

CREATE TABLE IF NOT EXISTS data_backups.spot_creators_before_named_alignment_20260608 AS
SELECT
    ts.id,
    ts.name_vi,
    ts.province_code,
    ts.created_by,
    ts.updated_at,
    NOW() AS backed_up_at
FROM tourism_spots ts
WHERE ts.province_code = '37'
  AND (
      ts.created_by IN (
          SELECT id
          FROM auth.users
          WHERE email IN (
              'trangan.site.operator@gmail.com',
              'trangan.heritage.travel@gmail.com',
              'tamcoc.tourism.service@gmail.com'
          )
      )
      OR ts.name_vi ILIKE '%Tràng An%'
      OR ts.name_vi ILIKE '%Trang An%'
      OR ts.name_vi ILIKE '%Tam Cốc%'
      OR ts.name_vi ILIKE '%Tam Coc%'
  );

UPDATE auth.users
SET full_name = CASE email
        WHEN 'admin@gmail.com' THEN 'Admin'
        WHEN 'bovhttdl.vietnam@gmail.com' THEN 'Bộ VHTTDL'
        WHEN 'sovhttdl.ninhbinh@gmail.com' THEN 'Sở VHTTDL Ninh Bình'
        WHEN 'trangan.site.operator@gmail.com' THEN 'Vận hành Tràng An'
        WHEN 'trangan.heritage.travel@gmail.com' THEN 'Lữ hành Tràng An'
        WHEN 'tamcoc.tourism.service@gmail.com' THEN 'Dịch vụ Tam Cốc'
        ELSE full_name
    END,
    province_code = CASE
        WHEN email IN (
            'sovhttdl.ninhbinh@gmail.com',
            'trangan.site.operator@gmail.com',
            'trangan.heritage.travel@gmail.com',
            'tamcoc.tourism.service@gmail.com'
        ) THEN '37'
        ELSE province_code
    END,
    updated_at = NOW()
WHERE email IN (
    'admin@gmail.com',
    'bovhttdl.vietnam@gmail.com',
    'sovhttdl.ninhbinh@gmail.com',
    'trangan.site.operator@gmail.com',
    'trangan.heritage.travel@gmail.com',
    'tamcoc.tourism.service@gmail.com'
);

WITH named_users AS (
    SELECT
        (MAX(id::text) FILTER (WHERE email = 'trangan.site.operator@gmail.com'))::uuid AS trangan_operator_id,
        (MAX(id::text) FILTER (WHERE email = 'trangan.heritage.travel@gmail.com'))::uuid AS trangan_travel_id,
        (MAX(id::text) FILTER (WHERE email = 'tamcoc.tourism.service@gmail.com'))::uuid AS tamcoc_service_id
    FROM auth.users
)
UPDATE businesses b
SET owner_id = CASE
        WHEN b.business_name ILIKE '%Tam Cốc%'
          OR b.business_name ILIKE '%Tam Coc%'
          OR COALESCE(b.address_vi, '') ILIKE '%Tam Cốc%'
          OR COALESCE(b.address_vi, '') ILIKE '%Tam Coc%'
            THEN nu.tamcoc_service_id
        WHEN (
            b.business_name ILIKE '%Tràng An%'
            OR b.business_name ILIKE '%Trang An%'
            OR COALESCE(b.address_vi, '') ILIKE '%Tràng An%'
            OR COALESCE(b.address_vi, '') ILIKE '%Trang An%'
        )
        AND lower(COALESCE(b.business_type, '')) IN ('spot_operator', 'khu_du_lich', 'entertainment', 'service_provider')
            THEN nu.trangan_operator_id
        WHEN b.business_name ILIKE '%Tràng An%'
          OR b.business_name ILIKE '%Trang An%'
          OR COALESCE(b.address_vi, '') ILIKE '%Tràng An%'
          OR COALESCE(b.address_vi, '') ILIKE '%Trang An%'
            THEN nu.trangan_travel_id
        ELSE NULL
    END,
    updated_at = NOW()
FROM named_users nu
WHERE b.province_code = '37'
  AND (
      b.owner_id IN (nu.trangan_operator_id, nu.trangan_travel_id, nu.tamcoc_service_id)
      OR b.business_name ILIKE '%Tràng An%'
      OR b.business_name ILIKE '%Trang An%'
      OR b.business_name ILIKE '%Tam Cốc%'
      OR b.business_name ILIKE '%Tam Coc%'
      OR COALESCE(b.address_vi, '') ILIKE '%Tràng An%'
      OR COALESCE(b.address_vi, '') ILIKE '%Trang An%'
      OR COALESCE(b.address_vi, '') ILIKE '%Tam Cốc%'
      OR COALESCE(b.address_vi, '') ILIKE '%Tam Coc%'
  );

WITH named_users AS (
    SELECT
        (MAX(id::text) FILTER (WHERE email = 'trangan.site.operator@gmail.com'))::uuid AS trangan_operator_id,
        (MAX(id::text) FILTER (WHERE email = 'tamcoc.tourism.service@gmail.com'))::uuid AS tamcoc_service_id
    FROM auth.users
)
UPDATE tourism_spots ts
SET created_by = CASE
        WHEN ts.name_vi ILIKE '%Tam Cốc%'
          OR ts.name_vi ILIKE '%Tam Coc%'
            THEN nu.tamcoc_service_id
        WHEN ts.name_vi ILIKE '%Tràng An%'
          OR ts.name_vi ILIKE '%Trang An%'
            THEN nu.trangan_operator_id
        ELSE NULL
    END,
    updated_at = NOW()
FROM named_users nu
WHERE ts.province_code = '37'
  AND (
      ts.created_by IN (nu.trangan_operator_id, nu.tamcoc_service_id)
      OR ts.created_by = (
          SELECT id FROM auth.users WHERE email = 'trangan.heritage.travel@gmail.com'
      )
      OR ts.name_vi ILIKE '%Tràng An%'
      OR ts.name_vi ILIKE '%Trang An%'
      OR ts.name_vi ILIKE '%Tam Cốc%'
      OR ts.name_vi ILIKE '%Tam Coc%'
  );

COMMIT;
