/**
 * =============================================================================
 * ERROR HANDLER UTILITY — utils/errorHandler.js
 * =============================================================================
 *
 * Xử lý lỗi cho các service, controller
 * Ánh xạ lỗi từ GEE/Satellite service sang HTTP response
 *
 * =============================================================================
 */

const { StatusCodes, ReasonPhrases } = require("../core/http-status-code");
const {
  BaseError,
  Api400Error,
  Api401Error,
  Api403Error,
  Api404Error,
  Api409Error,
  BusinessLogicError,
  SatelliteError,
  EarthEngineError,
  GeometryValidationError,
  DateRangeValidationError,
} = require("../core/error.response");

/**
 * Bản đồ lỗi cho Satellite Service
 * Map GEE errors → HTTP Status + Message
 */
const SATELLITE_ERROR_MAP = {
  // GEE/Collection errors
  EE_COLLECTION_NOT_FOUND: {
    status: StatusCodes.BAD_REQUEST,
    message: "Collection không tìm thấy",
  },
  EE_GEOMETRY_INVALID: {
    status: StatusCodes.BAD_REQUEST,
    message: "Geometry không hợp lệ",
  },
  EE_DATE_RANGE_INVALID: {
    status: StatusCodes.BAD_REQUEST,
    message: "Khoảng thời gian không hợp lệ",
  },
  EE_AUTHENTICATION_FAILED: {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: "Lỗi xác thực Earth Engine",
  },
  EE_RATE_LIMIT_EXCEEDED: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: "Vượt quá giới hạn yêu cầu. Vui lòng thử lại sau",
  },
  EE_TIMEOUT: {
    status: StatusCodes.REQUEST_TIMEOUT,
    message: "Yêu cầu hết thời gian chờ",
  },

  // Validation errors
  INVALID_DATE_FORMAT: {
    status: StatusCodes.BAD_REQUEST,
    message: "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD",
  },
  INVALID_GEOMETRY: {
    status: StatusCodes.BAD_REQUEST,
    message: "Geometry không hợp lệ",
  },
  INVALID_CLOUD_COVER: {
    status: StatusCodes.BAD_REQUEST,
    message: "Cloud cover phải từ 0-100",
  },
  INVALID_COLLECTION: {
    status: StatusCodes.BAD_REQUEST,
    message: "Collection không hợp lệ. Chỉ chấp nhận: S2, L8, L9, ALL",
  },
  INVALID_NDVI_THRESHOLD: {
    status: StatusCodes.BAD_REQUEST,
    message: "NDVI threshold phải từ -1 đến 1",
  },

  // Processing errors
  EE_EMPTY_COLLECTION: {
    status: StatusCodes.NOT_FOUND,
    message:
      "Không tìm thấy ảnh vệ tinh nào. Hãy mở rộng khoảng thời gian hoặc tăng ngưỡng mây.",
  },
  NO_DATA_AVAILABLE: {
    status: StatusCodes.NOT_FOUND,
    message: "Không có dữ liệu ảnh vệ tinh cho khoảng thời gian này",
  },
  INSUFFICIENT_DATA: {
    status: StatusCodes.BAD_REQUEST,
    message: "Dữ liệu không đủ để xử lý. Thử tăng khoảng thời gian",
  },
  PROCESSING_ERROR: {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: "Lỗi xử lý ảnh vệ tinh",
  },

  // Server errors
  INTERNAL_ERROR: {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: "Lỗi máy chủ nội bộ",
  },
};

/**
 * Handle lỗi từ service layer
 *
 * @param {Error} error - Error object từ service
 * @param {Object} res - Express response object
 * @param {Object} errorMap - Bản đồ lỗi ánh xạ error code → HTTP response
 * @param {Object} defaultError - Default error nếu không tìm thấy trong map
 * @returns {Object} - Express response
 */
function handleServiceError(error, res, errorMap = {}, defaultError = {}) {
  console.error("[handleServiceError]", {
    message: error.message,
    code: error.code,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });

  // Nếu là BaseError (custom error), trả về trực tiếp
  if (error instanceof BaseError && error.isOperational) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      status: error.status,
      errors: error.errors,
    });
  }

  // Tìm trong error map
  const errorCode = error.code || error.errorCode || "INTERNAL_ERROR";
  const mappedError = errorMap[errorCode];

  if (mappedError) {
    return res.status(mappedError.status).json({
      success: false,
      message: mappedError.message,
      status: mappedError.status,
      errors: [errorCode],
    });
  }

  // Sử dụng default error nếu có
  if (defaultError && typeof defaultError === "object") {
    const status = defaultError.status || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = defaultError.message || ReasonPhrases.INTERNAL_SERVER_ERROR;

    return res.status(status).json({
      success: false,
      message: message,
      status: status,
      errors: [error.message || "UNKNOWN_ERROR"],
    });
  }

  // Default: Internal Server Error
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    errors: [error.message || "INTERNAL_SERVER_ERROR"],
  });
}

/**
 * Map GEE service errors → Custom error object
 *
 * @param {Error} error - Error from GEE
 * @returns {Object} - { code, message, status }
 */
function mapGeeError(error) {
  const message = error.message || "";

  if (message.includes("rate limit") || message.includes("rate_limit")) {
    return {
      code: "EE_RATE_LIMIT_EXCEEDED",
      message: "Vượt quá giới hạn yêu cầu",
      status: StatusCodes.TOO_MANY_REQUESTS,
    };
  }

  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("DEADLINE_EXCEEDED")
  ) {
    return {
      code: "EE_TIMEOUT",
      message: "Yêu cầu hết thời gian chờ",
      status: StatusCodes.REQUEST_TIMEOUT,
    };
  }

  if (message.includes("authentication") || message.includes("Unauthorized")) {
    return {
      code: "EE_AUTHENTICATION_FAILED",
      message: "Lỗi xác thực Earth Engine",
      status: StatusCodes.UNAUTHORIZED,
    };
  }

  if (message.includes("geometry") || message.includes("Geometry")) {
    return {
      code: "EE_GEOMETRY_INVALID",
      message: "Geometry không hợp lệ",
      status: StatusCodes.BAD_REQUEST,
    };
  }

  if (
    message.includes("collection") ||
    message.includes("Collection") ||
    message.includes("not found")
  ) {
    return {
      code: "EE_COLLECTION_NOT_FOUND",
      message: "Collection không tìm thấy",
      status: StatusCodes.BAD_REQUEST,
    };
  }

  // Default
  return {
    code: "PROCESSING_ERROR",
    message: "Lỗi xử lý dữ liệu",
    status: StatusCodes.INTERNAL_SERVER_ERROR,
  };
}

/**
 * Tạo Satellite error từ message
 * @param {string} message - Error message
 * @param {string[]} errors - Error codes
 * @param {number} status - HTTP status code
 * @returns {SatelliteError}
 */
function createSatelliteError(
  message,
  errors = [],
  status = StatusCodes.INTERNAL_SERVER_ERROR,
) {
  return new SatelliteError(message, errors, status);
}

/**
 * Tạo Earth Engine error
 * @param {string} message - Error message
 * @param {string[]} errors - Error codes
 * @param {number} status - HTTP status code
 * @returns {EarthEngineError}
 */
function createEarthEngineError(
  message,
  errors = [],
  status = StatusCodes.INTERNAL_SERVER_ERROR,
) {
  return new EarthEngineError(message, errors, status);
}

/**
 * Tạo Geometry validation error
 * @param {string} message - Error message
 * @param {string[]} errors - Error codes
 * @returns {GeometryValidationError}
 */
function createGeometryError(
  message = "Geometry không hợp lệ",
  errors = ["INVALID_GEOMETRY"],
) {
  return new GeometryValidationError(message, errors);
}

/**
 * Tạo Date range validation error
 * @param {string} message - Error message
 * @param {string[]} errors - Error codes
 * @returns {DateRangeValidationError}
 */
function createDateRangeError(
  message = "Khoảng thời gian không hợp lệ",
  errors = ["INVALID_DATE_RANGE"],
) {
  return new DateRangeValidationError(message, errors);
}

module.exports = {
  SATELLITE_ERROR_MAP,
  handleServiceError,
  mapGeeError,
  createSatelliteError,
  createEarthEngineError,
  createGeometryError,
  createDateRangeError,
};
