const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");
const { authenticateToken, checkPermission } = require("../middlewares/auth.middleware");
const { parseJsonFields } = require("../middlewares/parse-json");
const { validateParams } = require("../middlewares/validation");
const { idParamSchema } = require("../middlewares/validators/common/id-param.schema");

// All routes require authentication and admin permission
// ROUTE: GET / - Truy vấn vai trò và phân quyền. Xử lý bởi roleController.getAllRoles. Truy cập: yêu cầu đăng nhập, cần quyền roles:read.
router.get("/", authenticateToken, checkPermission("roles", "read"), roleController.getAllRoles);
// ROUTE: GET /:id - Truy vấn vai trò và phân quyền. Xử lý bởi roleController.getRoleById. Truy cập: yêu cầu đăng nhập, cần quyền roles:read.
router.get("/:id", authenticateToken, checkPermission("roles", "read"), validateParams(idParamSchema), roleController.getRoleById);
// ROUTE: POST / - Tạo mới vai trò và phân quyền. Xử lý bởi roleController.createRole. Truy cập: yêu cầu đăng nhập, cần quyền roles:create.
router.post("/", authenticateToken, checkPermission("roles", "create"), parseJsonFields(["permissions"]), roleController.createRole);
// ROUTE: PUT /:id - Cập nhật vai trò và phân quyền. Xử lý bởi roleController.updateRole. Truy cập: yêu cầu đăng nhập, cần quyền roles:update.
router.put("/:id", authenticateToken, checkPermission("roles", "update"), validateParams(idParamSchema), parseJsonFields(["permissions"]), roleController.updateRole);
// ROUTE: DELETE /:id - Xóa vai trò và phân quyền. Xử lý bởi roleController.deleteRole. Truy cập: yêu cầu đăng nhập, cần quyền roles:delete.
router.delete("/:id", authenticateToken, checkPermission("roles", "delete"), validateParams(idParamSchema), roleController.deleteRole);

module.exports = router;
