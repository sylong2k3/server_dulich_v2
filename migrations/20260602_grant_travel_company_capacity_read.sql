SET search_path TO public, auth, vn_units;

BEGIN;

INSERT INTO auth.permissions (resource, action, name_vi, description)
VALUES (
    'capacity',
    'read',
    'Xem du lieu suc chua',
    'Cho phep xem danh sach, thong ke va cau hinh doc du lieu suc chua'
)
ON CONFLICT (resource, action) DO UPDATE SET
    name_vi = COALESCE(EXCLUDED.name_vi, auth.permissions.name_vi),
    description = COALESCE(EXCLUDED.description, auth.permissions.description);

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p
  ON p.resource = 'capacity'
 AND p.action = 'read'
WHERE r.code = 'travel_company'
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
