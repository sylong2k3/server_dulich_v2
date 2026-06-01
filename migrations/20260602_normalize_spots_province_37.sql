SET search_path TO public, auth, vn_units;

BEGIN;

UPDATE tourism_spots
SET province_code = '37',
    updated_at = NOW()
WHERE province_code IS DISTINCT FROM '37'
  AND EXISTS (
      SELECT 1
      FROM vn_units.provinces p
      WHERE p.code = '37'
  );

COMMIT;
