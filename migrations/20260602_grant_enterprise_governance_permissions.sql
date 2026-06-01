SET search_path TO public, auth, vn_units;

BEGIN;

INSERT INTO auth.permissions (resource, action, name_vi, description)
VALUES
    (
        'governance',
        'read',
        'Xem du lieu quan tri',
        'Cho phep xem dashboard, bao cao va phan anh trong pham vi duoc phan quyen'
    ),
    (
        'governance',
        'create',
        'Tao du lieu quan tri',
        'Cho phep tao bao cao hoat dong doanh nghiep trong pham vi duoc phan quyen'
    ),
    (
        'governance',
        'update',
        'Cap nhat du lieu quan tri',
        'Cho phep cap nhat thong tin doanh nghiep trong pham vi duoc phan quyen'
    )
ON CONFLICT (resource, action) DO UPDATE SET
    name_vi = COALESCE(EXCLUDED.name_vi, auth.permissions.name_vi),
    description = COALESCE(EXCLUDED.description, auth.permissions.description);

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p
  ON p.resource = 'governance'
 AND p.action IN ('read', 'create', 'update')
WHERE r.code IN ('spot_operator', 'travel_company', 'service_provider')
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
