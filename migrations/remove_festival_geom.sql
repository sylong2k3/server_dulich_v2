-- Remove geom column from festivals table
-- Coordinates will be retrieved from linked tourism_spots instead

ALTER TABLE festivals DROP COLUMN IF EXISTS geom;
