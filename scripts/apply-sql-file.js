const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const sqlFile = process.argv[2];
const database = process.env.MEDIA_DB_NAME || process.env.DB_NAME;

if (!sqlFile) {
  console.error('Usage: node scripts/apply-sql-file.js <sql-file>');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: '-c search_path=public,auth,vn_units',
});

(async () => {
  await pool.query(fs.readFileSync(sqlFile, 'utf8'));
  console.log(`applied ${sqlFile} on ${database}`);
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
