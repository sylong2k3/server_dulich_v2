const roleService = require("../services/role.service");
const asyncHandler = require("../helpers/async-handler");
const { OK, CREATED } = require("../core/success.response");

class RoleController {
	static createRole = asyncHandler(async (req, res) => {
		const roleData = req.body;
		const role = await roleService.createRole(roleData);

		return CREATED(res, "Tạo vai trò thành công", { role: role });
	});

	static getAllRoles = asyncHandler(async (req, res) => {
		const options = req.query;

		const result = await roleService.getAllRoles(options);

		return OK(res, "Lấy danh sách vai trò thành công", {
			roles: result.roles,
			pagination: result.pagination,
		});
	});

	static getRoleById = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const role = await roleService.getRoleById(id);

		return OK(res, "Lấy thông tin vai trò thành công", { role: role });
	});

	static updateRole = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const updates = req.body;
		const role = await roleService.updateRole(id, updates);

		return OK(res, "Cập nhật vai trò thành công", { role: role });
	});

	static deleteRole = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const role = await roleService.deleteRole(id);

		return OK(res, "Xóa vai trò thành công", { role: role });
	});
}

module.exports = RoleController;
