const OcopRepository = require('../src/models/repositories/ocop.repository');
const db = require('../src/configs/database');

(async () => {
  console.log('--- Testing OCOP GeoJSON in VIETNAMESE (lang = "vi") ---');
  const geojsonVi = await OcopRepository.getOcopGeoJSON({ page: 1, limit: 3, lang: 'vi' });
  console.log(`Features count: ${geojsonVi.features.length}`);
  geojsonVi.features.forEach((feature, idx) => {
    const props = feature.properties;
    const geom = feature.geometry;
    console.log(`Feature #${idx + 1}:`);
    console.log(`  - name (localized): ${props.name}`);
    console.log(`  - name_vi: ${props.name_vi}`);
    console.log(`  - Geometry: ${JSON.stringify(geom)}`);
  });

  console.log('\n--- Testing OCOP GeoJSON in ENGLISH (lang = "en") ---');
  const geojsonEn = await OcopRepository.getOcopGeoJSON({ page: 1, limit: 3, lang: 'en' });
  console.log(`Features count: ${geojsonEn.features.length}`);
  geojsonEn.features.forEach((feature, idx) => {
    const props = feature.properties;
    const geom = feature.geometry;
    console.log(`Feature #${idx + 1}:`);
    console.log(`  - name (localized): ${props.name}`);
    console.log(`  - name_vi: ${props.name_vi}`);
    console.log(`  - Geometry: ${JSON.stringify(geom)}`);
  });

  // Close database pool
  await db.pool.end();
  console.log('\nSimplified verification complete!');
})().catch(async (error) => {
  console.error('Error during verification:', error);
  try {
    await db.pool.end();
  } catch {}
  process.exit(1);
});
