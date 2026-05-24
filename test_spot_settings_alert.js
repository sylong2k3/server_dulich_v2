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

const CapacityService = require('./src/services/capacity.service');

(async () => {
  const spotId = '68429dc8-9708-4029-9639-94488c0aaefa'; // Khách sạn Hoa Lư

  console.log("--- BẮT ĐẦU CHẠY KIỂM THỬ NGƯỠNG CẢNH BÁO TỪ SPOT (alert_threshold_pct = 20) ---");

  // 1. Reset dữ liệu kiểm thử
  await pool.query(`DELETE FROM capacity_alert_configs WHERE spot_id = $1`, [spotId]);
  await pool.query(`DELETE FROM capacity_logs WHERE spot_id = $1`, [spotId]);
  await pool.query(`DELETE FROM notifications WHERE type = 'capacity_alert'`);

  // Đảm bảo có ít nhất 1 user để nhận thông báo
  const userCheck = await pool.query(`SELECT id FROM auth.users WHERE role_id = 3 LIMIT 1`);
  if (userCheck.rows.length === 0) {
    await pool.query(`
      INSERT INTO auth.users (id, role_id, email, full_name, is_active)
      VALUES (uuid_generate_v4(), 3, 'test_role_3@example.com', 'Test User Role 3', true)
    `);
  }

  // 2. Ghi lượng khách là 400 (40% của 1000)
  // Thực tế: 40% >= 20% (ngưỡng cảnh báo). Trạng thái DB tính toán là 'normal'.
  // Mong đợi: Hệ thống vẫn gửi cảnh báo 'near_full' vì vượt qua ngưỡng 20%.
  console.log("\nGhi nhận lượng khách mới: 400 khách (Sức chứa tối đa: 1000)...");
  const log = await CapacityService.logCapacity({
    spot_id: spotId,
    visitor_count: 400,
    data_source: 'manual'
  });

  console.log("Kết quả ghi log:");
  console.log("- Tỉ lệ lấp đầy thực tế:", log.capacity_pct + "%");
  console.log("- Trạng thái lưu DB:", log.status);

  // 3. Kiểm tra thông báo được phát đi trong DB
  const notifications = await pool.query(`
    SELECT id, target_roles, title_vi, body_vi, created_at
    FROM notifications
    WHERE type = 'capacity_alert'
    ORDER BY created_at DESC
    LIMIT 1
  `);

  console.log("\n--- THÔNG BÁO CẢNH BÁO TRONG CƠ SỞ DỮ LIỆU ---");
  if (notifications.rows.length === 0) {
    console.log("❌ THẤT BẠI: Không tìm thấy thông báo cảnh báo nào được gửi đi!");
  } else {
    console.table(notifications.rows);
    console.log("✅ THÀNH CÔNG: Thông báo cảnh báo đã được phát đi thành công nhờ lấy ngưỡng alert_threshold_pct = 20 từ bảng tourism_spots!");
  }

  // 4. Dọn dẹp
  await pool.query(`DELETE FROM capacity_logs WHERE spot_id = $1`, [spotId]);
  await pool.query(`DELETE FROM notifications WHERE type = 'capacity_alert'`);
  await pool.query(`DELETE FROM auth.users WHERE email = 'test_role_3@example.com'`);

  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
