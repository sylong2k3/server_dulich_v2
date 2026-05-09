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
  console.log(`database=${database}`);

  const tables = await pool.query(`
    SELECT
      to_regclass('public.festivals') AS festivals,
      to_regclass('public.ocop_products') AS ocop_products
  `);
  console.table(tables.rows);

  const festivals = await pool.query(`
    SELECT id, name_vi, name_en, festival_type, cover_image_url
    FROM festivals
    ORDER BY created_at DESC, name_vi
  `);
  console.log('festivals');
  console.table(festivals.rows);

  const ocop = await pool.query(`
    SELECT id, name_vi, name_en, category, cover_image_url, media_urls
    FROM ocop_products
    ORDER BY created_at DESC, name_vi
  `);
  console.log('ocop_products');
  console.table(ocop.rows);

  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
