const spotService = require('../src/services/spot.service');
const db = require('../src/configs/database');

(async () => {
  console.log('Fetching a spot from the database to test...');
  const { rows } = await db.query('SELECT id, slug, name_vi, ST_X(geom::geometry) AS lng, ST_Y(geom::geometry) AS lat FROM tourism_spots WHERE status = \'active\' LIMIT 1');
  
  if (rows.length === 0) {
    console.log('No active tourism spots found in database!');
    await db.pool.end();
    return;
  }
  
  const targetSpot = rows[0];
  console.log(`Target Spot: "${targetSpot.name_vi}" (Slug: ${targetSpot.slug})`);
  console.log(`  - Coordinates: Lng=${targetSpot.lng}, Lat=${targetSpot.lat}`);
  
  console.log('\n--- 1. Querying Spot WITHOUT ocop parameter ---');
  const spotWithoutOcop = await spotService.getSpotBySlug(targetSpot.slug, {}, { lang: 'vi' });
  console.log(`ocop_products attached? ${spotWithoutOcop.ocop_products ? 'Yes' : 'No'}`);
  
  console.log('\n--- 2. Querying Spot WITH ocop=true (radius_km = 10) ---');
  const spotWithOcop10 = await spotService.getSpotBySlug(targetSpot.slug, {}, { lang: 'vi', ocop: true, radius_km: 10 });
  console.log(`ocop_products attached? ${spotWithOcop10.ocop_products ? 'Yes' : 'No'}`);
  if (spotWithOcop10.ocop_products) {
    console.log(`Number of OCOP products found within 10km: ${spotWithOcop10.ocop_products.length}`);
    spotWithOcop10.ocop_products.forEach((ocop, idx) => {
      console.log(`  OCOP #${idx + 1}: "${ocop.name}" (Stars: ${ocop.star_rating}, Lng: ${ocop.lng.toFixed(6)}, Lat: ${ocop.lat.toFixed(6)})`);
    });
  }
  
  console.log('\n--- 3. Querying Spot WITH ocop=true and a large radius_km = 50 ---');
  const spotWithOcop50 = await spotService.getSpotBySlug(targetSpot.slug, {}, { lang: 'vi', ocop: true, radius_km: 50 });
  console.log(`ocop_products attached? ${spotWithOcop50.ocop_products ? 'Yes' : 'No'}`);
  if (spotWithOcop50.ocop_products) {
    console.log(`Number of OCOP products found within 50km: ${spotWithOcop50.ocop_products.length}`);
  }

  // Close database pool
  await db.pool.end();
  console.log('\nSpot OCOP feature verification complete!');
})().catch(async (error) => {
  console.error('Error during verification:', error);
  try {
    await db.pool.end();
  } catch {}
  process.exit(1);
});
