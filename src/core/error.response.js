const { StatusCodes, ReasonPhrases } = require("./http-status-code");

class BaseError extends Error {
  constructor(message, status, errors, isOperational) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.status = status;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class Api409Error extends BaseError {
  constructor(
    message = ReasonPhrases.CONFLICT,
    errors = [],
    status = StatusCodes.CONFLICT,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

class Api400Error extends BaseError {
  constructor(
    message = ReasonPhrases.BAD_REQUEST,
    errors = [],
    status = StatusCodes.BAD_REQUEST,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

class Api403Error extends BaseError {
  constructor(
    message = ReasonPhrases.FORBIDDEN,
    errors = [],
    status = StatusCodes.FORBIDDEN,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

class Api401Error extends BaseError {
  constructor(
    message = ReasonPhrases.UNAUTHORIZED,
    errors = [],
    status = StatusCodes.UNAUTHORIZED,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

class BusinessLogicError extends BaseError {
  constructor(
    message = ReasonPhrases.INTERNAL_SERVER_ERROR,
    errors = [],
    status = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

class Api404Error extends BaseError {
  constructor(
    message = ReasonPhrases.NOT_FOUND,
    errors = [],
    status = StatusCodes.NOT_FOUND,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

/**
 * Satellite-specific error
 */
class SatelliteError extends BaseError {
  constructor(
    message = "Lỗi xử lý ảnh vệ tinh",
    errors = [],
    status = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

/**
 * Earth Engine error
 */
class EarthEngineError extends BaseError {
  constructor(
    message = "Lỗi từ Earth Engine",
    errors = [],
    status = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

/**
 * Geometry validation error
 */
class GeometryValidationError extends BaseError {
  constructor(
    message = "Geometry không hợp lệ",
    errors = [],
    status = StatusCodes.BAD_REQUEST,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

/**
 * Date range validation error
 */
class DateRangeValidationError extends BaseError {
  constructor(
    message = "Khoảng thời gian không hợp lệ",
    errors = [],
    status = StatusCodes.BAD_REQUEST,
    isOperational = true,
  ) {
    super(message, status, errors, isOperational);
  }
}

module.exports = {
  Api401Error,
  Api400Error,
  Api403Error,
  Api404Error,
  Api409Error,
  BusinessLogicError,
  BaseError,
  SatelliteError,
  EarthEngineError,
  GeometryValidationError,
  DateRangeValidationError,
};
