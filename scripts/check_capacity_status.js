const { getClient } = require('../src/configs/database');

async function run() {
    const client = await getClient();
    try {
        const sql = `
            SELECT
                ts.id,
                ts.name_vi AS name,
                ts.province_code,
                ts.status,
                ts.max_capacity,
                ts.alert_threshold_pct,
                COUNT(cl.id) AS log_count,
                MAX(cl.recorded_at) AS last_recorded_at,
                (
                    SELECT cl2.visitor_count
                    FROM capacity_logs cl2
                    WHERE cl2.spot_id = ts.id
                    ORDER BY cl2.recorded_at DESC
                    LIMIT 1
                ) AS latest_visitor_count
            FROM tourism_spots ts
            LEFT JOIN capacity_logs cl ON cl.spot_id = ts.id
            GROUP BY ts.id, ts.name_vi, ts.province_code, ts.status, ts.max_capacity, ts.alert_threshold_pct
            ORDER BY ts.name_vi;
        `;
        const { rows } = await client.query(sql);

        const full = [];
        const missingMax = [];
        const missingLogs = [];

        for (const r of rows) {
            const hasMax = r.max_capacity !== null && Number(r.max_capacity) > 0;
            const hasLogs = Number(r.log_count) > 0;
            if (hasMax && hasLogs) full.push(r);
            else {
                if (!hasMax) missingMax.push(r);
                if (!hasLogs) missingLogs.push(r);
            }
        }

        console.log('================ TỔNG QUAN ================');
        console.log('Tổng số điểm:', rows.length);
        console.log('Đầy đủ capacity (có max_capacity + có log):', full.length);
        console.log('Thiếu max_capacity:', missingMax.length);
        console.log('Thiếu capacity_logs:', missingLogs.length);

        console.log('\n================ ĐẦY ĐỦ CAPACITY ================');
        full.forEach((r) =>
            console.log(
                `[OK] ${r.name} | max=${r.max_capacity} | logs=${r.log_count} | latest_visitors=${r.latest_visitor_count} | status=${r.status}`
            )
        );

        console.log('\n================ THIẾU max_capacity ================');
        missingMax.forEach((r) =>
            console.log(
                `[NO MAX] ${r.id} | ${r.name} | logs=${r.log_count} | status=${r.status} | province=${r.province_code}`
            )
        );

        console.log('\n================ THIẾU capacity_logs ================');
        missingLogs.forEach((r) =>
            console.log(
                `[NO LOG] ${r.id} | ${r.name} | max=${r.max_capacity} | status=${r.status} | province=${r.province_code}`
            )
        );
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
