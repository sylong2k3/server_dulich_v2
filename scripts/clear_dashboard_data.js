const { query, getClient } = require('../src/configs/database');

async function run() {
    console.log('--- STARTING DATABASE CLEANUP ---');
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // 1. Delete citizen feedbacks associated with mock reports
        const deletedFeedbacks = await client.query(`
            DELETE FROM citizen_feedbacks
            WHERE title LIKE '[MOCK]%'
        `);
        console.log(`Deleted ${deletedFeedbacks.rowCount} citizen feedbacks.`);

        // 1.5. Delete activity reports associated with mock businesses
        const deletedReports = await client.query(`
            DELETE FROM business_activity_reports
            WHERE business_id IN (
                SELECT id FROM businesses WHERE business_name LIKE '[MOCK]%'
            )
        `);
        console.log(`Deleted ${deletedReports.rowCount} business activity reports.`);

        // 2. Delete mock businesses
        const deletedBusinesses = await client.query(`
            DELETE FROM businesses
            WHERE business_name LIKE '[MOCK]%'
        `);
        console.log(`Deleted ${deletedBusinesses.rowCount} businesses.`);

        // 3. Delete mock tourism spots
        const deletedSpots = await client.query(`
            DELETE FROM tourism_spots
            WHERE name_vi LIKE '[MOCK]%'
        `);
        console.log(`Deleted ${deletedSpots.rowCount} tourism spots.`);

        // 4. Delete mock users
        const deletedUsers = await client.query(`
            DELETE FROM auth.users
            WHERE email IN (
                'mock_seeder_user@tourismpj.gov.vn',
                'mock_travel_company@tourismpj.gov.vn',
                'mock_service_provider@tourismpj.gov.vn',
                'mock_spot_operator@tourismpj.gov.vn',
                'mock_tourist_1@tourismpj.gov.vn',
                'mock_tourist_2@tourismpj.gov.vn',
                'mock_tourist_3@tourismpj.gov.vn'
            )
        `);
        console.log(`Deleted ${deletedUsers.rowCount} mock users.`);

        // 5. Delete mock categories if they exist and are unused
        const checkMockCat = await client.query("SELECT id FROM spot_categories WHERE code = 'mock_cat' LIMIT 1");
        if (checkMockCat.rows.length > 0) {
            const catId = checkMockCat.rows[0].id;
            const checkSpots = await client.query('SELECT 1 FROM tourism_spots WHERE category_id = $1 LIMIT 1', [catId]);
            if (checkSpots.rows.length === 0) {
                await client.query('DELETE FROM spot_categories WHERE id = $1', [catId]);
                console.log('Deleted mock category.');
            }
        }

        await client.query('COMMIT');
        console.log('--- DATABASE CLEANUP COMPLETED SUCCESSFULLY ---');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('--- DATABASE CLEANUP FAILED ---', error);
        throw error;
    } finally {
        client.release();
    }
}

run().catch((err) => {
    console.error('Fatal error during execution:', err);
    process.exit(1);
});
