const { getClient } = require('../src/configs/database');
const fs = require('fs');
const path = require('path');

async function run() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Error: Please provide the SQL file path as an argument.');
        console.error('Usage: node scripts/apply-sql-file.js <path-to-sql-file>');
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File not found at ${absolutePath}`);
        process.exit(1);
    }

    console.log(`Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(absolutePath, 'utf8');

    console.log('Connecting to database...');
    const client = await getClient();

    try {
        console.log('Executing SQL statements...');
        const start = Date.now();
        // pg client can execute multiple commands separated by semicolon in a single query call
        await client.query(sqlContent);
        const duration = Date.now() - start;
        console.log(`Successfully applied SQL file in ${duration}ms.`);
    } catch (error) {
        console.error('Error applying SQL file:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

run().catch((err) => {
    console.error('Fatal error during execution:', err);
    process.exit(1);
});
