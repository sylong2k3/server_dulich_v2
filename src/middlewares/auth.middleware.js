const UserRepository = require("../models/repositories/user.repository");
const RoleRepository = require("../models/repositories/role.repository");
const { TokenExpiredError, JsonWebTokenError } = require("jsonwebtoken");
const TokenManager = require("../utils/tokenManager");
const { Api401Error, Api403Error, BusinessLogicError } = require("../core/error.response");
const asyncHandler = require("../helpers/async-handler");

const ANONYMOUS_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class AuthMiddleware {
  static resolveAuthActor(req) {
    const userId = req.user?.id;
    if (userId) {
      return { userId };
    }

    const rawAnonymousId = req.headers["x-anonymous-id"];
    const anonymousIdHeader = Array.isArray(rawAnonymousId) ? rawAnonymousId[0] : rawAnonymousId;
    if (typeof anonymousIdHeader === "string" && ANONYMOUS_ID_PATTERN.test(anonymousIdHeader.trim())) {
      return { anonymousId: anonymousIdHeader.trim() };
    }

    return {};
  }

  static authenticateToken = asyncHandler(async (req, res, next) => {
    const token = TokenManager.extractToken(req);
    if (!token) {
      throw new Api401Error("Cần đăng nhập để thực hiện hành động này", ["AUTH_REQUIRED"]);
    }

    try {
      const decoded = TokenManager.validateAccessToken(token);
      const user = await UserRepository.findUserById(decoded.id);
      if (!user) {
        throw new Api401Error("Người dùng không tồn tại", ["USER_NOT_FOUND"]);
      }

      if (!user.is_active) {
        throw new Api403Error("Tài khoản đã bị vô hiệu hóa", ["ACCOUNT_INACTIVE"]);
      }

      req.user = user;
      req.token = decoded;
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new Api401Error("Token đã hết hạn, vui lòng làm mới token", ["TOKEN_EXPIRED"]);
      }

      if (error instanceof JsonWebTokenError) {
        throw new Api401Error("Token không hợp lệ", ["TOKEN_INVALID"]);
      }

      if (error instanceof Api401Error || error instanceof Api403Error) {
        throw error;
      }

      throw new BusinessLogicError("Lỗi xác thực không xác định", ["AUTH_ERROR"]);
    }
  });

  static optionalAuth = asyncHandler(async (req, res, next) => {
    const token = TokenManager.extractToken(req);

    if (!token) {
      req.user = null;
      req.token = null;
      return next();
    }

    try {
      const decoded = TokenManager.validateAccessToken(token);
      const user = await UserRepository.findUserById(decoded.id);

      if (!user || !user.is_active) {
        req.user = null;
        req.token = null;
        return next();
      }

      req.user = user;
      req.token = decoded;
      next();
    } catch (error) {
      req.user = null;
      req.token = null;
      next();
    }
  });

  static checkPermission(resource, action) {
    return asyncHandler(async (req, res, next) => {
      if (!req.user) {
        throw new Api401Error("Yêu cầu xác thực", ["AUTH_REQUIRED"]);
      }

      if (!req.user.role) {
        throw new Api403Error("Vai trò không tồn tại", ["ROLE_NOT_FOUND"]);
      }

      if (!req.user.hasPermission(resource, action)) {
        throw new Api403Error("Quyền truy cập bị từ chối", ["INSUFFICIENT_PERMISSIONS"]);
      }

      next();
    });
  }

  static requireRole(allowedRoles) {
    return asyncHandler(async (req, res, next) => {
      if (!req.user) {
        throw new Api401Error("Yêu cầu xác thực", ["AUTH_REQUIRED"]);
      }

      const role = req.user.role || (await RoleRepository.findRoleById(req.user.role_id));
      if (!role) {
        throw new Api403Error("Vai trò không tồn tại", ["ROLE_NOT_FOUND"]);
      }

      const allow = allowedRoles.map((r) => String(r || "").trim().toLowerCase());
      const roleCandidates = [role.code, role.name, role.name_vi, role.name_en]
        .filter(Boolean)
        .map((r) => String(r).trim().toLowerCase());
      const matched = roleCandidates.some((candidate) => allow.includes(candidate));

      if (!matched) {
        throw new Api403Error("Quyền truy cập bị từ chối", ["INSUFFICIENT_ROLE"]);
      }

      next();
    });
  }
}

module.exports = AuthMiddleware;
