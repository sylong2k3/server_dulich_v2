SET search_path TO public, auth, vn_units;

BEGIN;

ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS province_code VARCHAR(20) REFERENCES vn_units.provinces(code);

CREATE INDEX IF NOT EXISTS idx_users_province_code
ON auth.users(province_code);

COMMIT;
