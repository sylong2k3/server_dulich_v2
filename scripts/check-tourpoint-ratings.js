const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const database = process.env.MEDIA_DB_NAME || process.env.DB_NAME;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: '-c search_path=public,auth,vn_units',
});

(async () => {
  const totals = await pool.query(`
    SELECT
      (SELECT COUNT(1)::int FROM tour_package_stops WHERE spot_id IS NOT NULL) AS tourpoints,
      (SELECT COUNT(1)::int FROM ratings WHERE title LIKE 'Đánh giá tourpoint:%') AS tourpoint_ratings
  `);
  console.table(totals.rows);

  const ratedRows = await pool.query(`
    SELECT COUNT(DISTINCT tps.id)::int AS rated_stop_rows
    FROM tour_package_stops tps
    JOIN tour_packages tp ON tp.id = tps.tour_package_id
    JOIN ratings r
      ON r.spot_id = tps.spot_id
     AND r.title = 'Đánh giá tourpoint: ' || tp.slug || ' - ngày ' || tps.day_number || ' điểm ' || tps.stop_order
    WHERE tps.spot_id IS NOT NULL
  `);
  console.table(ratedRows.rows);

  const byTour = await pool.query(`
    SELECT
      tp.slug,
      COUNT(tps.id)::int AS tourpoints,
      COUNT(r.id)::int AS ratings
    FROM tour_packages tp
    LEFT JOIN tour_package_stops tps
      ON tps.tour_package_id = tp.id
     AND tps.spot_id IS NOT NULL
    LEFT JOIN ratings r
      ON r.spot_id = tps.spot_id
     AND r.title = 'Đánh giá tourpoint: ' || tp.slug || ' - ngày ' || tps.day_number || ' điểm ' || tps.stop_order
    GROUP BY tp.slug
    ORDER BY tp.slug
  `);
  console.table(byTour.rows);

  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
