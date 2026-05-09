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
  const { rows } = await pool.query(`
    SELECT slug, name_vi, name_en, status
    FROM tourism_spots
    WHERE status IS DISTINCT FROM 'active'
    ORDER BY slug
  `);
  console.table(rows);
  console.log('count', rows.length);
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
