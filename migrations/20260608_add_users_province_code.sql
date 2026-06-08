SET search_path TO public, auth, vn_units;

BEGIN;

ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS province_code VARCHAR(20) REFERENCES vn_units.provinces(code);

CREATE INDEX IF NOT EXISTS idx_users_province_code
ON auth.users(province_code);

UPDATE auth.users u
SET province_code = '37',
    updated_at = NOW()
FROM auth.roles r
WHERE u.role_id = r.id
  AND r.code = 'department_manager'
  AND u.province_code IS DISTINCT FROM '37'
  AND EXISTS (
      SELECT 1
      FROM vn_units.provinces p
      WHERE p.code = '37'
  );

UPDATE auth.users u
SET province_code = '37',
    updated_at = NOW()
FROM auth.roles r
WHERE u.role_id = r.id
  AND r.code IN ('spot_operator', 'travel_company', 'service_provider')
  AND u.province_code IS DISTINCT FROM '37'
  AND EXISTS (
      SELECT 1
      FROM businesses b
      WHERE b.owner_id = u.id
        AND b.province_code = '37'
  )
  AND EXISTS (
      SELECT 1
      FROM vn_units.provinces p
      WHERE p.code = '37'
  );

UPDATE auth.users u
SET full_name = CASE u.email
        WHEN 'trangan.site.operator@gmail.com' THEN 'Vận hành Tràng An'
        WHEN 'trangan.heritage.travel@gmail.com' THEN 'Lữ hành Tràng An'
        WHEN 'tamcoc.tourism.service@gmail.com' THEN 'Dịch vụ Tam Cốc'
        ELSE u.full_name
    END,
    updated_at = NOW()
FROM auth.roles r
WHERE u.role_id = r.id
  AND u.email IN (
      'trangan.site.operator@gmail.com',
      'trangan.heritage.travel@gmail.com',
      'tamcoc.tourism.service@gmail.com'
  )
  AND EXISTS (
      SELECT 1
      FROM businesses b
      WHERE b.owner_id = u.id
        AND b.province_code = '37'
  );

COMMIT;
