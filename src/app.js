const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
require("dotenv").config();

const routes = require("./routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/error-handler");
const activityLogger = require("./middlewares/activity-logger");
const { initPassport } = require("./configs/passport");
const healthRoutes = require('./routes/health.routes');

// Khởi tạo Passport strategies
initPassport();

const app = express();
app.set("trust proxy", 1);

const corsOrigins = process.env.CORS_ORIGINS || "*";
let allowedOrigins = corsOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsAllowCredentials = true;
if (corsAllowCredentials && allowedOrigins.includes("*")) {
  allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "http://103.163.119.247:22026",
    "http://103.163.119.247:12026"
  ];
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "frame-ancestors": ["'self'", ...allowedOrigins],
      },
    },
  }),
);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes("*")) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(
      new Error("CORS policy does not allow access from the specified Origin."),
      false,
    );
  },
  credentials: corsAllowCredentials,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(passport.initialize());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static("public/uploads"));
app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.",
    errors: ["TOO_MANY_REQUESTS"],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Health-check endpoint (MED-08: comprehensive observability)
app.use('/health', healthRoutes);

app.use("/api/v1", activityLogger, routes);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to Du Lịch Ninh Bình 2.0 API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
