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
  console.log('Starting OCOP products update...');
  
  // Update query: set spot_id to NULL and generate a random lat/lng in Ninh Binh bounding box
  // Ninh Binh is approx 20.0 to 20.45 Lat, 105.6 to 106.15 Lng.
  // To keep it strictly inside Ninh Binh: Lng range [105.75, 106.05], Lat range [20.10, 20.35]
  const updateSql = `
    UPDATE ocop_products
    SET spot_id = NULL,
        geom = ST_SetSRID(ST_MakePoint(
            105.75 + random() * 0.30,
            20.10 + random() * 0.25
        ), 4326)
    RETURNING id, name_vi, ST_X(geom::geometry) AS lng, ST_Y(geom::geometry) AS lat;
  `;
  
  const res = await pool.query(updateSql);
  console.log(`Successfully updated ${res.rows.length} OCOP products.`);
  
  res.rows.forEach(row => {
    console.log(`- Product "${row.name_vi}" (ID: ${row.id}): New random coordinates -> Lng: ${row.lng.toFixed(6)}, Lat: ${row.lat.toFixed(6)}`);
  });
  
  await pool.end();
  console.log('Update complete!');
})().catch(async (error) => {
  console.error('Error running update:', error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
