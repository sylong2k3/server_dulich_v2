SET search_path TO public, auth, vn_units;

BEGIN;

ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS province_code VARCHAR(20) REFERENCES vn_units.provinces(code);

CREATE INDEX IF NOT EXISTS idx_users_province_code
ON auth.users(province_code);

UPDATE auth.users u
SET province_code = '37'
FROM auth.roles r
WHERE u.role_id = r.id
  AND r.code = 'department_manager'
  AND u.province_code IS NULL
  AND EXISTS (
      SELECT 1
      FROM vn_units.provinces p
      WHERE p.code = '37'
  );

INSERT INTO auth.permissions (resource, action, name_vi, description)
VALUES
    (
        'capacity',
        'read',
        'Xem du lieu suc chua',
        'Cho phep xem danh sach, lich su, thong ke va cau hinh doc du lieu suc chua'
    ),
    (
        'capacity',
        'create',
        'Cap nhat du lieu suc chua',
        'Cho phep ghi nhan tai trong va cap nhat cau hinh suc chua trong pham vi duoc phan quyen'
    ),
    (
        'capacity',
        'update',
        'Cap nhat cau hinh suc chua',
        'Cho phep cap nhat cau hinh suc chua va canh bao trong pham vi duoc phan quyen'
    )
ON CONFLICT (resource, action) DO UPDATE SET
    name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p
  ON p.resource = 'capacity'
 AND p.action = 'read'
WHERE r.code IN (
    'system_admin',
    'ministry_manager',
    'department_manager',
    'spot_operator',
    'travel_company',
    'service_provider'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p
  ON p.resource = 'capacity'
 AND p.action = 'create'
WHERE r.code IN (
    'system_admin',
    'department_manager',
    'spot_operator',
    'travel_company',
    'service_provider'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p
  ON p.resource = 'capacity'
 AND p.action = 'update'
WHERE r.code IN (
    'system_admin',
    'department_manager',
    'spot_operator',
    'travel_company',
    'service_provider'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

DELETE FROM auth.role_permissions rp
USING auth.roles r, auth.permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND p.resource = 'capacity'
  AND p.action = 'create'
  AND r.code IN ('ministry_manager', 'tourist');

DELETE FROM auth.role_permissions rp
USING auth.roles r, auth.permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND p.resource = 'capacity'
  AND p.action = 'update'
  AND r.code IN ('ministry_manager', 'tourist');

DELETE FROM auth.role_permissions rp
USING auth.roles r, auth.permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND p.resource = 'capacity'
  AND p.action = 'read'
  AND r.code = 'tourist';

COMMIT;
