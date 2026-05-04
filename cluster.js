/**
 * Cluster entry point — chạy nhiều worker Node.js trên các CPU cores.
 *
 * Usage:
 *   node cluster.js                          # mặc định: floor(CPUs/2) workers
 *   CLUSTER_WORKERS=8 node cluster.js        # chỉ định số worker sau load test
 *   PG_MAX_CONNECTIONS=200 node cluster.js   # nếu PostgreSQL được tuned
 *
 * Mặc định chỉ dùng một nửa số CPU để không tranh tài nguyên với PostgreSQL
 * và OS trên cùng máy. Sau khi load test xác nhận hệ thống ổn định, tăng dần
 * CLUSTER_WORKERS lên đến NUM_CPUS.
 *
 * Singleton services (NotificationPushWorker, TokenManager) chỉ chạy ở
 * worker có CLUSTER_WORKER_ID=0. ID này được giữ nguyên khi worker restart.
 *
 * QUAN TRỌNG — Cache & WebSocket với nhiều workers:
 *   - Cache: mỗi worker dùng node-cache riêng (in-memory). Nếu cần
 *     cache invalidation đồng bộ giữa các workers (vd: admin xóa 1 bài viết
 *     cần clear cache ngay ở tất cả workers), phải dùng Redis thay thế.
 *   - WebSocket broadcast: cluster.fork() không share memory, nên
 *     worker A không thể push event sang client kết nối vào worker B.
 *     Giải pháp: dùng Redis Pub/Sub làm message bus giữa các workers.
 *   Khi nào cần Redis: scale > 2 instances, hoặc WebSocket broadcast là
 *   tính năng quan trọng. Hiện tại với single machine + in-memory cache
 *   là đủ cho tải hiện tại.
 */

const cluster = require('cluster');
const os = require('os');
require('dotenv').config();

const NUM_CPUS = os.cpus().length;

// Mặc định dùng floor(CPUs/2) để an toàn. Tăng sau khi load test xác nhận.
const NUM_WORKERS = parseInt(process.env.CLUSTER_WORKERS, 10)
  || Math.max(2, Math.floor(NUM_CPUS / 2));

// Dành 10 connections cho PostgreSQL admin/superuser/background tasks.
// Mặc định 200 sau khi đã ALTER SYSTEM SET max_connections = 200.
const PG_MAX_CONNECTIONS = parseInt(process.env.PG_MAX_CONNECTIONS, 10) || 200;
const SAFE_CONNECTIONS   = PG_MAX_CONNECTIONS - 10;
const POOL_MAX = Math.max(2, Math.floor(SAFE_CONNECTIONS / NUM_WORKERS));
const POOL_MIN = Math.max(1, Math.floor(POOL_MAX / 4));

if (cluster.isPrimary) {
  console.log(`\n[Cluster] Primary PID : ${process.pid}`);
  console.log(`[Cluster] Workers     : ${NUM_WORKERS} / ${NUM_CPUS} CPUs`);
  console.log(`[Cluster] DB pool     : min=${POOL_MIN}, max=${POOL_MAX} per worker`);
  console.log(`[Cluster] Total DB    : max=${NUM_WORKERS * POOL_MAX}/${PG_MAX_CONNECTIONS} connections`);
  console.log(`[Cluster] Tip         : tăng CLUSTER_WORKERS=${NUM_CPUS} sau khi load test ổn\n`);

  // Map: cluster internal worker.id  ->  app CLUSTER_WORKER_ID (string)
  // Dùng để reuse đúng ID khi worker bị crash và restart,
  // đảm bảo worker 0 luôn giữ singleton services.
  const workerIdMap = new Map();

  // Stagger startup: khởi động từng worker cách nhau SPAWN_DELAY_MS.
  // Tránh tất cả workers khởi động đồng thời với cold cache → đổ DB queries
  // vào cùng một thời điểm (cold-start dogpile).
  const SPAWN_DELAY_MS = parseInt(process.env.CLUSTER_SPAWN_DELAY_MS, 10) || 300;
  for (let i = 0; i < NUM_WORKERS; i++) {
    setTimeout(() => spawnWorker(String(i)), i * SPAWN_DELAY_MS);
  }

  cluster.on('exit', (worker, code, signal) => {
    const appId  = workerIdMap.get(worker.id) ?? `orphan-${Date.now()}`;
    const reason = signal || `exit code ${code}`;
    workerIdMap.delete(worker.id);

    if (worker.exitedAfterDisconnect) return; // graceful shutdown, không restart

    console.error(
      `[Cluster] Worker PID ${worker.process.pid} (app-id=${appId}) died (${reason}). Restarting with same id...`,
    );
    // Giữ nguyên appId để worker 0 vẫn chạy singleton services sau khi restart
    spawnWorker(appId);
  });

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  function spawnWorker(appWorkerId) {
    const worker = cluster.fork({
      CLUSTER_WORKER_ID: appWorkerId,
      DB_POOL_MAX: String(POOL_MAX),
      DB_POOL_MIN: String(POOL_MIN),
    });
    workerIdMap.set(worker.id, appWorkerId);
    return worker;
  }

  function gracefulShutdown(signal) {
    console.log(`\n[Cluster] Received ${signal}. Shutting down ${NUM_WORKERS} workers...`);
    for (const id in cluster.workers) {
      cluster.workers[id].disconnect();
    }
    setTimeout(() => {
      console.error('[Cluster] Forced exit after timeout.');
      process.exit(1);
    }, 15000).unref();
  }

} else {
  // Worker process — khởi động HTTP server bình thường
  require('./server.js');
}
