const fs = require("fs");
const path = require("path");
const routes = require("express").Router();

const routeMappings = [
  // Core
  { mountPath: "/auth", modulePath: "./auth.route" },
  { mountPath: "/users", modulePath: "./user.route" },
  { mountPath: "/roles", modulePath: "./role.route" },
  { mountPath: "/audit-logs", modulePath: "./audit-log.route" },
  { mountPath: "/notifications", modulePath: "./notification.route" },
  { mountPath: "/statistics", modulePath: "./statistics.route" },
  { mountPath: "/geography", modulePath: "./geography.route" },
  { mountPath: "/spot-categories", modulePath: "./spot-category.route" },
  { mountPath: "/spots", modulePath: "./spot.route" },
  { mountPath: "/spots", modulePath: "./aframe.route" },
  { mountPath: "/spots", modulePath: "./vr-hotspot.route" },
  { mountPath: "/capacity", modulePath: "./capacity.route" },
  { mountPath: "/ratings", modulePath: "./rating.route" },
  // Pha 1
  { mountPath: "/news", modulePath: "./news.route" },
  { mountPath: "/culinary", modulePath: "./culinary.route" },
  { mountPath: "/festivals", modulePath: "./festival.route" },
  { mountPath: "/ocop", modulePath: "./ocop.route" },
  { mountPath: "/vlogs", modulePath: "./vlog.route" },
  { mountPath: "/feedbacks", modulePath: "./citizen-feedback.route" },
  { mountPath: "/search", modulePath: "./search.route" },
  // Quản trị nâng cao
  { mountPath: "/governance", modulePath: "./governance.route" },
  { mountPath: "/map-admin", modulePath: "./map-admin.route" },
  // Doanh nghiệp
  { mountPath: "/businesses", modulePath: "./business.route" },
  // Lịch trình & Tour
  { mountPath: "/itineraries", modulePath: "./itinerary.route" },
  { mountPath: "/tours", modulePath: "./tour.route" },
  // Bản đồ - tiện ích
  { mountPath: "/map/measure", modulePath: "./map-measure.route" },
  // VR/AR
  { mountPath: "/ar-sessions", modulePath: "./ar-session.route" },
  // GPS & Offline
  { mountPath: "/gps", modulePath: "./gps.route" },
  { mountPath: "/offline", modulePath: "./offline.route" },
  // NV-50/51: Chatbot AI
  { mountPath: "/chatbot", modulePath: "./chatbot.route" },
  // NV-60: Tích hợp bên thứ 3
  { mountPath: "/integrations", modulePath: "./integration.route" },
  // NV-Map: Truy cập data qua API key (external)
  { mountPath: "/map-data", modulePath: "./map-data.route" },
];

for (const { mountPath, modulePath } of routeMappings) {
  const absoluteModulePath = path.join(__dirname, `${modulePath}.js`);
  if (!fs.existsSync(absoluteModulePath)) {
    console.warn(`[routes] Skip missing route module: ${modulePath}`);
    continue;
  }

  const router = require(modulePath);
  routes.use(mountPath, router);
}

module.exports = routes;
