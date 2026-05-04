const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticateToken, checkPermission } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload");
const {
  validateBody,
  validateParams,
  validateQuery,
} = require("../middlewares/validation");
const {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  batchDeleteUsersSchema,
  userIdParamSchema,
  assignRoleSchema,
} = require("../middlewares/validators/user.validation");

const router = express.Router();

// ROUTE: GET / - Truy vấn người dùng. Xử lý bởi userController.getAllUsers. Truy cập: yêu cầu đăng nhập, cần quyền users:read.
router.get( "/", authenticateToken, checkPermission("users", "read"), validateQuery(getUsersQuerySchema), userController.getAllUsers );

// ROUTE: GET /:id - Truy vấn người dùng. Xử lý bởi userController.getUserById. Truy cập: yêu cầu đăng nhập, cần quyền users:read.
router.get( "/:id", authenticateToken, checkPermission("users", "read"), validateParams(userIdParamSchema), userController.getUserById );

// ROUTE: POST / - Tạo mới người dùng. Xử lý bởi userController.createUser. Truy cập: yêu cầu đăng nhập, cần quyền users:create.
router.post( "/", authenticateToken, checkPermission("users", "create"), upload.single("avatar_url"), upload.process(), validateBody(createUserSchema), userController.createUser );

// ROUTE: PUT /:id - Cập nhật người dùng. Xử lý bởi userController.updateUser. Truy cập: yêu cầu đăng nhập, cần quyền users:update.
router.put( "/:id", authenticateToken, checkPermission("users", "update"), upload.single("avatar_url"), upload.process(), validateParams(userIdParamSchema), validateBody(updateUserSchema), userController.updateUser );

// PUT /:id/lock  → khóa (idempotent)
// DELETE /:id/lock → mở khóa (idempotent)
// ROUTE: PUT /:id/lock - Cập nhật toàn phần người dùng. Xử lý bởi userController.lockUser. Truy cập: yêu cầu đăng nhập, cần quyền users:update.
router.put( "/:id/lock", authenticateToken, checkPermission("users", "update"), validateParams(userIdParamSchema), userController.lockUser );
// ROUTE: DELETE /:id/lock - Xóa/Vô hiệu hóa người dùng. Xử lý bởi userController.unlockUser. Truy cập: yêu cầu đăng nhập, cần quyền users:update.
router.delete( "/:id/lock", authenticateToken, checkPermission("users", "update"), validateParams(userIdParamSchema), userController.unlockUser );

// ROUTE: DELETE /batch - Xóa người dùng. Xử lý bởi userController.deleteUsersBatch. Truy cập: yêu cầu đăng nhập, cần quyền users:delete.
router.delete( "/batch", authenticateToken, checkPermission("users", "delete"), validateBody(batchDeleteUsersSchema), userController.deleteUsersBatch );

/**
 * PUT /users/:id/role
 * Gán vai trò cho user. Yêu cầu users:update.
 * Chặn privilege escalation và tự đổi role tại service layer.
 */
// ROUTE: PUT /:id/role - Cập nhật toàn phần người dùng. Xử lý bởi userController.assignRole. Truy cập: yêu cầu đăng nhập, cần quyền users:update.
router.put( "/:id/role", authenticateToken, checkPermission("users", "update"), validateParams(userIdParamSchema), validateBody(assignRoleSchema), userController.assignRole );

// ROUTE: DELETE /:id - Xóa người dùng. Xử lý bởi userController.deleteUserById. Truy cập: yêu cầu đăng nhập, cần quyền users:delete.
router.delete( "/:id", authenticateToken, checkPermission("users", "delete"), validateParams(userIdParamSchema), userController.deleteUserById );

module.exports = router;
