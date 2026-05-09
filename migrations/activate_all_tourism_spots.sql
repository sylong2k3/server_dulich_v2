BEGIN;

UPDATE tourism_spots
SET
  status = 'active',
  updated_at = NOW()
WHERE status IS DISTINCT FROM 'active';

COMMIT;
