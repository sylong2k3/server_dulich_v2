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
SET full_name = CASE r.code
        WHEN 'spot_operator' THEN 'Đơn vị vận hành điểm du lịch Ninh Bình'
        WHEN 'travel_company' THEN 'Công ty lữ hành Ninh Bình'
        WHEN 'service_provider' THEN 'Đơn vị cung cấp dịch vụ du lịch Ninh Bình'
        ELSE u.full_name
    END,
    updated_at = NOW()
FROM auth.roles r
WHERE u.role_id = r.id
  AND r.code IN ('spot_operator', 'travel_company', 'service_provider')
  AND EXISTS (
      SELECT 1
      FROM businesses b
      WHERE b.owner_id = u.id
        AND b.province_code = '37'
  );

COMMIT;
