const userService = require("../services/user.service");
const { OK, CREATED } = require("../core/success.response");
const asyncHandler = require("../helpers/async-handler");

class UserController {
  static getAllUsers = asyncHandler(async (req, res) => {
    const options = req.query;
    const result = await userService.getAllUsers(options);
    return OK(res, "Lấy danh sách người dùng thành công", {
      users: result.users,
      pagination: result.pagination,
    });
  });

  static getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    return OK(res, "Lấy thông tin người dùng thành công", { user: user.toJSON() });
  });

  static createUser = asyncHandler(async (req, res) => {
    const userData = { ...req.body };
    const newUser = await userService.createUser(userData);
    return CREATED(res, "Tạo người dùng thành công", { user: newUser.toJSON() });
  });

  static updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };
    const updatedUser = await userService.updateUser(id, updates);
    return OK(res, "Cập nhật người dùng thành công", { user: updatedUser.toJSON() });
  });

  static toggleUserLock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await userService.toggleUserLock(id);
    const message = updated.is_active
      ? "Mở khóa tài khoản thành công"
      : "Khóa tài khoản thành công";
    return OK(res, message, { is_active: updated.is_active });
  });

  static deleteUsersBatch = asyncHandler(async (req, res) => {
    const { userIds } = req.body;
    const result = await userService.deleteUsersBatch(userIds);
    return OK(res, `Xóa ${result.length} người dùng thành công`, { result });
  });

  static deleteUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await userService.hardDeleteUser(id);
    return OK(res, "Xóa người dùng thành công", {});
  });

  static assignRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role_id } = req.body;
    const meta = {
      ip_address: req.ip || req.headers["x-forwarded-for"] || null,
      user_agent: req.headers["user-agent"] || null,
    };
    const updatedUser = await userService.assignRole(id, role_id, req.user, meta);
    return OK(res, "Gán vai trò thành công", { user: updatedUser.toJSON() });
  });
}

module.exports = UserController;
