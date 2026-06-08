SET search_path TO public, auth, vn_units;

BEGIN;

CREATE OR REPLACE VIEW v_current_capacity AS
SELECT
    ts.id AS spot_id,
    ts.name_vi,
    cl.visitor_count,
    CASE
        WHEN ts.max_capacity IS NOT NULL AND ts.max_capacity > 0 AND cl.visitor_count IS NOT NULL
            THEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2)::numeric(5,2)
        ELSE cl.capacity_pct
    END AS capacity_pct,
    CASE
        WHEN ts.max_capacity IS NOT NULL AND ts.max_capacity > 0 AND cl.visitor_count IS NOT NULL THEN
            CASE
                WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 100 THEN 'overloaded'
                WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 85 THEN 'near_full'
                WHEN ROUND((cl.visitor_count::numeric / ts.max_capacity) * 100, 2) >= 60 THEN 'busy'
                ELSE 'normal'
            END
        ELSE cl.status
    END::varchar(20) AS status,
    cl.recorded_at,
    ts.max_capacity,
    ST_AsGeoJSON(ts.geom)::jsonb AS geojson
FROM tourism_spots ts
LEFT JOIN LATERAL (
    SELECT
        visitor_count,
        capacity_pct,
        status,
        recorded_at
    FROM capacity_logs cl
    WHERE cl.spot_id = ts.id
    ORDER BY cl.recorded_at DESC
    LIMIT 1
) cl ON TRUE;

COMMIT;
