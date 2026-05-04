const { BaseError, Api401Error } = require('../core/error.response');
const { StatusCodes, ReasonPhrases } = require('../core/http-status-code');

const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });

    if (err instanceof BaseError && err.isOperational) {
        return res.status(err.status).json({
            success: false,
            message: err.message,
            status: err.status,
            errors: err.errors,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    if (err.name === 'JsonWebTokenError') {
        const jwtError = new Api401Error('Token không hợp lệ', ['INVALID_TOKEN']);
        return res.status(jwtError.status).json({
            success: false,
            message: jwtError.message,
            status: jwtError.status,
            errors: jwtError.errors,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    if (err.name === 'TokenExpiredError') {
        const expiredError = new Api401Error('Token đã hết hạn', ['TOKEN_EXPIRED']);
        return res.status(expiredError.status).json({
            success: false,
            message: expiredError.message,
            status: expiredError.status,
            errors: expiredError.errors,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Lỗi validation dữ liệu',
            status: StatusCodes.BAD_REQUEST,
            errors: err.errors ? err.errors.map(e => e.message || e) : [err.message],
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    // PostgreSQL unique constraint violation (code 23505)
    if (err.code === '23505') {
        return res.status(StatusCodes.CONFLICT).json({
            success: false,
            message: 'Dữ liệu đã tồn tại',
            status: StatusCodes.CONFLICT,
            errors: ['UNIQUE_CONSTRAINT'],
            ...(process.env.NODE_ENV === 'development' && { detail: err.detail, stack: err.stack })
        });
    }

    // PostgreSQL foreign key constraint violation (code 23503)
    if (err.code === '23503') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Lỗi ràng buộc khóa ngoại',
            status: StatusCodes.BAD_REQUEST,
            errors: ['FOREIGN_KEY_CONSTRAINT'],
            ...(process.env.NODE_ENV === 'development' && { detail: err.detail, stack: err.stack })
        });
    }

    // PostgreSQL invalid input syntax (e.g. passing non-integer as integer ID, invalid UUID)
    if (err.code === '22P02' || err.code === '22003') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'ID hoặc giá trị đầu vào không hợp lệ',
            status: StatusCodes.BAD_REQUEST,
            errors: ['INVALID_INPUT'],
            ...(process.env.NODE_ENV === 'development' && { detail: err.message, stack: err.stack })
        });
    }

    // PostgreSQL not-null constraint violation
    if (err.code === '23502') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Thiếu trường dữ liệu bắt buộc',
            status: StatusCodes.BAD_REQUEST,
            errors: ['NOT_NULL_VIOLATION'],
            ...(process.env.NODE_ENV === 'development' && { detail: err.detail, stack: err.stack })
        });
    }

    // PostgreSQL undefined table (migration not run)
    if (err.code === '42P01') {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Lỗi cấu hình database, vui lòng liên hệ quản trị viên',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            errors: ['DATABASE_CONFIG_ERROR'],
            ...(process.env.NODE_ENV === 'development' && { detail: err.message, stack: err.stack })
        });
    }

    if (err.name === 'MulterError') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Lỗi tải file',
            status: StatusCodes.BAD_REQUEST,
            errors: [err.message],
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    // Handle unexpected errors (programming errors)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        errors: ['INTERNAL_SERVER_ERROR'],
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `Route ${req.originalUrl} không tồn tại`,
        errors: ['NOT_FOUND']
    });
};

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = {
    errorHandler,
    notFoundHandler
};
