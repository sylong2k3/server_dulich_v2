const { query } = require('../src/configs/database');

async function insertMockCapacity() {
  try {
    // Find spot with name containing "Tam Chúc"
    const spotResult = await query(`
      SELECT id, name_vi, max_capacity
      FROM tourism_spots
      WHERE name_vi ILIKE '%Tam Chúc%' OR name_en ILIKE '%Tam Chuc%'
      LIMIT 1
    `);

    if (!spotResult.rows.length) {
      console.log('❌ Không tìm thấy điểm du lịch "Tam Chúc"');
      process.exit(1);
    }

    const spot = spotResult.rows[0];
    console.log(`✅ Tìm thấy: ${spot.name_vi} (ID: ${spot.id})`);
    console.log(`   Max capacity: ${spot.max_capacity || 'Not set'}`);

    // Insert mock capacity data
    const maxCapacity = spot.max_capacity || 1000; // Default to 1000 if not set
    const visitorCount = Math.floor(maxCapacity * 0.65); // 65% full
    const capacityPct = 65;

    const insertResult = await query(`
      INSERT INTO capacity_logs (spot_id, visitor_count, capacity_pct, status, data_source)
      VALUES ($1, $2, $3, 'moderate', 'mock')
      RETURNING id, spot_id, visitor_count, capacity_pct, status, recorded_at
    `, [spot.id, visitorCount, capacityPct]);

    const capacityLog = insertResult.rows[0];
    console.log(`\n✅ Mock capacity data created:`);
    console.log(`   ID: ${capacityLog.id}`);
    console.log(`   Spot ID: ${capacityLog.spot_id}`);
    console.log(`   Current visitors: ${capacityLog.visitor_count}/${maxCapacity}`);
    console.log(`   Capacity: ${capacityLog.capacity_pct}%`);
    console.log(`   Status: ${capacityLog.status}`);
    console.log(`   Recorded at: ${capacityLog.recorded_at}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertMockCapacity();
