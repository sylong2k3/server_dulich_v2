const app = require("./src/app");
const db = require("./src/configs/database");
const { initializeEarthEngine, isInitialized } = require("./src/configs/gge");
const {
  initWebSocketServer,
  closeWebSocketServer,
} = require("./src/realtime/websocket.server");
const TokenManager = require("./src/utils/tokenManager");
const NotificationPushWorker = require("./src/services/notification-push.worker");
const EmailVerificationRepository = require("./src/models/repositories/email-verification.repository");
const VrHotspotRepository = require("./src/models/repositories/vr-hotspot.repository");
require("dotenv").config();

const PORT = process.env.PORT || 8881;
const HOST = process.env.HOST || "0.0.0.0";
const WS_PATH = "/ws";

// Trong cluster mode, chỉ worker 0 chạy singleton services
// (NotificationPushWorker, TokenManager) để tránh duplicate jobs.
const IS_SINGLETON_WORKER =
  !process.env.CLUSTER_WORKER_ID || process.env.CLUSTER_WORKER_ID === "0";

let server;
let isShuttingDown = false;

function formatField(label, value) {
  return `${label.padEnd(14)}: ${value}`;
}

function printStartupBanner({ dbStatus }) {
  const publicHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  const lines = [
    "NINH BINH TOURISM API",
    formatField("HTTP", `http://${publicHost}:${PORT}`),
    formatField("WebSocket", `ws://${publicHost}:${PORT}${WS_PATH}`),
    formatField("Môi trường", process.env.NODE_ENV || "development"),
    formatField("Cơ sở dữ liệu", process.env.DB_NAME || "(chưa cấu hình)"),
    formatField(
      "DB Host",
      `${process.env.DB_HOST || "(chưa cấu hình)"}:${process.env.DB_PORT || "(chưa cấu hình)"}`,
    ),
    formatField("PostgreSQL", dbStatus),
    formatField("Lưu trữ file", "✓ Local (public/uploads)"),
    formatField(
      "Earth Engine",
      isInitialized() ? "✓ Khởi tạo" : "✗ Chưa khởi tạo",
    ),
  ];

  const width = Math.max(...lines.map((line) => line.length), 48);
  const border = "─".repeat(width + 2);

  console.log(`\n┌${border}┐`);

  lines.forEach((line, index) => {
    console.log(`│ ${line.padEnd(width)} │`);
    if (index === 0) {
      console.log(`├${border}┤`);
    }
  });

  console.log(`└${border}┘`);
}

async function getDatabaseStartupStatus() {
  try {
    await db.query("SELECT 1");
    return "✓ Đã kết nối";
  } catch (error) {
    const reason = error.code || error.message || "Không xác định";
    return `✗ Lỗi (${reason})`;
  }
}

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nNhận tín hiệu ${signal}. Đang tắt server an toàn...`);

  // Dừng cleanup interval (chỉ worker 0 đã khởi động)
  if (IS_SINGLETON_WORKER) {
    TokenManager.stopCleanup();
    NotificationPushWorker.stop();
  }

  if (server) {
    server.close(async () => {
      console.log("HTTP server đã đóng");

      closeWebSocketServer();

      try {
        await db.pool.end();
        console.log("Đã đóng kết nối cơ sở dữ liệu");
      } catch (error) {
        console.error("Lỗi khi đóng kết nối cơ sở dữ liệu:", error);
      }

      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force exit sau 10s nếu graceful shutdown bị treo
  setTimeout(() => {
    console.error("Graceful shutdown timeout, forcing exit...");
    process.exit(1);
  }, 10000).unref();
}

// Xử lý lỗi không được bắt
process.on("uncaughtException", (error) => {
  console.error("LỖI KHÔNG ĐƯỢC BẮT! Đang tắt server...");
  console.error(error.name, error.message);
  console.error(error.stack);
  gracefulShutdown("uncaughtException").finally(() => process.exit(1));
});

// Khởi tạo server với chờ Earth Engine initialized
const initializeAndStartServer = async () => {
  try {
    await initializeEarthEngine();

    const dbStatus = await getDatabaseStartupStatus();

    // Khởi động server sau khi EE được khởi tạo
    server = app.listen(PORT, HOST, () => {
      printStartupBanner({ dbStatus });
    });

    initWebSocketServer(server, { path: WS_PATH });

    // Singleton services: chỉ worker 0 (hoặc single-process mode) chạy
    if (IS_SINGLETON_WORKER) {
      TokenManager.initializeCleanup();
      NotificationPushWorker.start();
    }

    // Xử lý Promise rejection không được bắt
    process.on("unhandledRejection", (error) => {
      console.error("PROMISE REJECTION KHÔNG ĐƯỢC XỬ LÝ! Đang tắt server...");
      console.error(error.name, error.message);
      console.error(error.stack);
      gracefulShutdown("unhandledRejection");
    });

    // Tắt server an toàn
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    return server;
  } catch (error) {
    console.error("✗ Lỗi khởi tạo Earth Engine:", error.message);
    console.error("  Đang tắt server...");
    process.exit(1);
  }
};

// Khởi động server
initializeAndStartServer();

module.exports = server;
