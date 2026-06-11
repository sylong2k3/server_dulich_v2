/**
 * Sinh migration backfill capacity cho các điểm chưa đầy đủ.
 *  - Nhóm A: thiếu max_capacity  -> đặt max_capacity theo loại điểm + seed log nhất quán.
 *  - Nhóm B: thiếu capacity_logs -> seed 1 log thực tế dựa trên max_capacity hiện có.
 * Idempotent: log seed gắn data_source = 'capacity_backfill', migration xoá log backfill cũ trước khi chèn.
 */
const { getClient } = require('../src/configs/database');
const fs = require('fs');
const path = require('path');

const ADMIN_ID = 'f4f1919a-bc43-4266-8f7c-89045c58cd86';

// max_capacity mặc định theo tên loại điểm (chỉ dùng cho nhóm thiếu max)
const CATEGORY_MAX = {
    'Khách sạn': 500,
    'Khu nghỉ dưỡng': 500,
    'Nhà hàng': 300,
    'Hang động': 1000,
    'Đền, chùa': 1500,
    'Di tích lịch sử': 2000,
    'Khu du lịch': 3000,
    'Khu bảo tồn thiên nhiên': 5000,
    'Vườn thú': 1500,
    'Rừng': 2000,
    'Núi': 1200,
};
const DEFAULT_MAX = 1000;

// Trạng thái khớp với view v_current_capacity
function statusFromPct(pct) {
    if (pct >= 100) return 'overloaded';
    if (pct >= 85) return 'near_full';
    if (pct >= 60) return 'busy';
    return 'normal';
}

// occupancy 50..84% xác định theo id (ổn định khi chạy lại)
function occupancyFor(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return 50 + (h % 35);
}

function q(s) {
    return s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
}

async function run() {
    const client = await getClient();
    try {
        const { rows } = await client.query(`
            SELECT ts.id, ts.name_vi, ts.max_capacity, sc.name_vi AS category,
                   EXISTS (SELECT 1 FROM capacity_logs c WHERE c.spot_id = ts.id) AS has_log
            FROM tourism_spots ts
            LEFT JOIN spot_categories sc ON sc.id = ts.category_id
            WHERE (ts.max_capacity IS NULL OR ts.max_capacity = 0)
               OR NOT EXISTS (SELECT 1 FROM capacity_logs c WHERE c.spot_id = ts.id)
            ORDER BY ts.name_vi;
        `);

        const maxUpdates = [];
        const seedRows = [];
        const seedSpotIds = [];

        for (const r of rows) {
            const hasMax = r.max_capacity != null && Number(r.max_capacity) > 0;
            const maxCap = hasMax
                ? Number(r.max_capacity)
                : (CATEGORY_MAX[r.category] || DEFAULT_MAX);

            if (!hasMax) {
                maxUpdates.push(`UPDATE tourism_spots SET max_capacity = ${maxCap}, updated_at = NOW() WHERE id = ${q(r.id)}; -- ${r.name_vi}`);
            }

            const pct = occupancyFor(r.id);
            const visitors = Math.round((maxCap * pct) / 100);
            const status = statusFromPct(pct);
            seedSpotIds.push(q(r.id));
            seedRows.push({
                tuple: `    (${q(r.id)}, NOW(), ${visitors}, ${pct.toFixed(2)}, ${q(status)}, 'capacity_backfill', ${q(ADMIN_ID)})`,
                comment: `${r.name_vi} (max ${maxCap})`,
            });
        }

        const lines = [];
        lines.push('-- Backfill capacity cho các điểm chưa đầy đủ (max_capacity + capacity_logs)');
        lines.push('-- Sinh tự động bởi scripts/generate_capacity_backfill.js. An toàn khi chạy lại.');
        lines.push(`-- Tổng số điểm xử lý: ${rows.length} (đặt max: ${maxUpdates.length}, seed log: ${seedRows.length})`);
        lines.push('');
        lines.push('BEGIN;');
        lines.push('');
        lines.push('-- 1) Đặt max_capacity cho các điểm còn thiếu (theo loại điểm)');
        lines.push(...maxUpdates);
        lines.push('');
        lines.push('-- 2) Dọn log backfill cũ để chạy lại an toàn');
        lines.push(`DELETE FROM capacity_logs WHERE data_source = 'capacity_backfill' AND spot_id IN (\n    ${seedSpotIds.join(',\n    ')}\n);`);
        lines.push('');
        lines.push('-- 3) Seed log capacity nhất quán (visitor_count = max * occupancy)');
        lines.push('INSERT INTO capacity_logs (spot_id, recorded_at, visitor_count, capacity_pct, status, data_source, recorded_by)');
        lines.push('VALUES');
        const valueLines = seedRows.map((row, i) => {
            const sep = i < seedRows.length - 1 ? ',' : ';';
            return `${row.tuple}${sep} -- ${row.comment}`;
        });
        lines.push(valueLines.join('\n'));
        lines.push('');
        lines.push('COMMIT;');
        lines.push('');

        const outName = '20260611_backfill_incomplete_capacity.sql';
        const outPath = path.resolve(process.cwd(), 'migrations', outName);
        fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
        console.log(`Đã sinh migration: migrations/${outName}`);
        console.log(`- Đặt max_capacity: ${maxUpdates.length} điểm`);
        console.log(`- Seed capacity_logs: ${seedRows.length} điểm`);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

run().catch((e) => { console.error('Fatal:', e); process.exit(1); });
