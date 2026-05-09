const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const databases = process.argv.slice(2);

async function checkDatabase(database) {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: '-c search_path=public,auth,vn_units',
  });

  try {
    const tables = await pool.query(`
      SELECT
        to_regclass('public.tourism_spots') AS tourism_spots,
        to_regclass('public.spot_media') AS spot_media
    `);

    const hasTables = tables.rows[0].tourism_spots && tables.rows[0].spot_media;
    let counts = null;
    if (hasTables) {
      counts = await pool.query(`
        SELECT
          (SELECT COUNT(1)::int FROM tourism_spots) AS spots,
          (SELECT COUNT(1)::int FROM spot_media) AS media
      `);
    }

    console.log(database);
    console.table(tables.rows);
    if (counts) console.table(counts.rows);
  } catch (error) {
    console.error(`${database}: ${error.message}`);
  } finally {
    await pool.end();
  }
}

(async () => {
  for (const database of databases) {
    await checkDatabase(database);
  }
})();
