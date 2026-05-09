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
    SELECT id, slug, title, thumbnail_url, tags
    FROM news
    ORDER BY created_at DESC, slug
  `);
  console.log(`database=${database}`);
  console.table(rows);
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
