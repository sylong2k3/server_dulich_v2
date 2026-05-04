const RoleRepository = require('../models/repositories/role.repository');
const { getCountByField } = require('../utils/database');
const { Api404Error, Api409Error, BusinessLogicError } = require('../core/error.response');
const { formatPagination } = require('../utils/responseFormatter');

class RoleService {
  async getAllRoles(options) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 10);

    const { roles, totalCount } = await RoleRepository.getAllRoles({ ...options, page, limit });

    const result = formatPagination(roles.map(role => role.toJSON()), totalCount, page, limit);
    return { roles: result.data, pagination: result.pagination };
  }

  async getRoleById(id) {
    const role = await RoleRepository.findRoleById(id);
    if (!role) {
      throw new Api404Error("Role không tồn tại");
    }
    return role;
  }

  async createRole(roleData) {
    const name = roleData.name_vi ?? roleData.name;

    if (await RoleRepository.existsByName(name)) {
      throw new Api409Error("Tên vai trò đã tồn tại");
    }

    return await RoleRepository.createRole(roleData);
  }

  async updateRole(id, updates) {
    const role = await RoleRepository.findRoleById(id);
    if (!role) {
      throw new Api404Error("Role không tồn tại");
    }

    const newName = updates.name_vi ?? updates.name;
    if (newName && newName !== role.name_vi) {
      if (await RoleRepository.existsByName(newName, id)) {
        throw new Api409Error("Tên vai trò đã tồn tại");
      }
    }

    const newCode = updates.code;
    if (newCode && newCode !== role.code) {
      if (await RoleRepository.existsByCode(newCode, id)) {
        throw new Api409Error("Mã vai trò đã tồn tại");
      }
    }

    return await RoleRepository.updateRole(id, updates);
  }

  async deleteRole(id) {
    const role = await RoleRepository.findRoleById(id);
    if (!role) {
      throw new Api404Error("Role không tồn tại");
    }

    // Block deletion if any users are assigned to this role
    const usersCount = await getCountByField('users', 'role_id', id);
    if (usersCount > 0) {
      throw new Api409Error('Vai trò đang được sử dụng');
    }

    return await RoleRepository.deleteRole(id);
  }
}

module.exports = new RoleService();