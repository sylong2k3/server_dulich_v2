const UserRepository = require("../models/repositories/user.repository");
const RoleRepository = require("../models/repositories/role.repository");
const AuditLogService = require("./audit-log.service");
const { Api404Error, Api409Error, Api403Error, BusinessLogicError } = require("../core/error.response");
const uploadService = require("../middlewares/upload");
const { formatPagination } = require("../utils/responseFormatter");

/**
 * Thứ tự ưu tiên vai trò (cao hơn = giá trị nhỏ hơn).
 * Actor chỉ có thể gán role có thứ tự THAP HƠN HOẶC BẰỚC chính mình.
 * system_admin (1) > ministry_manager (2) > department_manager (3)
 *   > spot_operator (4) = travel_company (4) = service_provider (4) > tourist (5)
 */
const ROLE_PRIORITY = {
  system_admin:       1,
  ministry_manager:   2,
  department_manager: 3,
  spot_operator:      4,
  travel_company:     4,
  service_provider:   4,
  tourist:            5,
};

class UserService {
  async getAllUsers(options) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 10);

    const { users, totalCount } = await UserRepository.getAllUsers({ ...options, page, limit });
    const filteredUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      is_active: user.is_active,
      role_name: user.role?.name_vi || user.role?.name_en || null,
      role_code: user.role?.code || null,
    }));

    const result = formatPagination(filteredUsers, totalCount, page, limit);
    return { users: result.data, pagination: result.pagination };
  }

  async getUserById(id) {
    const user = await UserRepository.findUserById(id);
    if (!user) {
      throw new Api404Error("Người dùng không tồn tại");
    }
    return user;
  }

  async createUser(userData) {
    const { email, phone } = userData;

    if (email && (await UserRepository.checkEmailExists(email))) {
      throw new Api409Error("Email đã tồn tại");
    }
    if (phone && (await UserRepository.checkPhoneExists(phone))) {
      throw new Api409Error("Số điện thoại đã tồn tại");
    }

    return UserRepository.createUser(userData);
  }

  async updateUser(id, updates) {
    const user = await UserRepository.findUserById(id);
    if (!user) {
      throw new Api404Error("Người dùng không tồn tại");
    }

    if (updates.email && updates.email !== user.email) {
      if (await UserRepository.checkEmailExists(updates.email)) {
        throw new Api409Error("Email đã tồn tại");
      }
    }

    if (updates.phone && updates.phone !== user.phone) {
      if (await UserRepository.checkPhoneExists(updates.phone)) {
        throw new Api409Error("Số điện thoại đã tồn tại");
      }
    }

    if (updates.avatar_url && user.avatar_url && updates.avatar_url !== user.avatar_url) {
      await uploadService.deleteFileByUrl(user.avatar_url);
    }

    return UserRepository.updateUser(id, updates);
  }

  async toggleUserLock(id) {
    const user = await UserRepository.findUserById(id);
    if (!user) {
      throw new Api404Error("Người dùng không tồn tại");
    }

    return UserRepository.toggleAccountLock(id);
  }

  async hardDeleteUser(id) {
    const user = await UserRepository.findUserById(id);
    if (!user) {
      throw new Api404Error("Người dùng không tồn tại");
    }

    const deleted = await UserRepository.hardDeleteUser(id);
    if (!deleted) throw new BusinessLogicError("Xóa thất bại");
    return deleted;
  }

  async deleteUsersBatch(userIds) {
    return UserRepository.deleteUsersBatch(userIds);
  }

  /**
   * Gán role cho user.
   * - Kiểm tra user & role tồn tại
   * - Chặn privilege escalation: actor không thể gán role cao hơn bản thân
   * - Chặn tự đổi role của chính mình (tránh lách kiểm soát)
   * - Ghi audit log (fire-and-forget, không block response)
   *
   * @param {string}  targetUserId  - UUID của user cần đổi role
   * @param {number}  newRoleId     - ID của role mới
   * @param {object}  actor         - req.user (người thực hiện hành động)
   * @param {object}  meta          - { ip_address, user_agent } từ request
   */
  async assignRole(targetUserId, newRoleId, actor, meta = {}) {
    // 1. Kiểm tra target user tồn tại
    const targetUser = await UserRepository.findUserById(targetUserId);
    if (!targetUser) throw new Api404Error("Người dùng không tồn tại");

    // 2. Kiểm tra role mới tồn tại
    const newRole = await RoleRepository.findRoleById(newRoleId);
    if (!newRole) throw new Api404Error("Vai trò không tồn tại");

    // 3. Chặn tự đổi role của chính mình
    if (String(actor?.id) === String(targetUserId)) {
      throw new Api403Error("Không thể tự thay đổi vai trò của chính mình");
    }

    // 4. Privilege escalation check (bỏ qua nếu actor là system_admin)
    const actorCode = String(actor?.role?.code || "").toLowerCase();
    if (actorCode !== "system_admin") {
      const actorPriority  = ROLE_PRIORITY[actorCode] ?? 99;
      const targetNewPriority = ROLE_PRIORITY[newRole.code] ?? 99;

      if (targetNewPriority <= actorPriority) {
        throw new Api403Error(
          "Không được gán vai trò có cấp bậc cao hơn hoặc bằng với bản thân"
        );
      }
    }

    // 5. Không thay đổi nếu role không đổi
    if (targetUser.role_id === newRoleId) {
      throw new Api409Error("Người dùng đã có vai trò này");
    }

    // 6. Thực hiện cập nhật
    const updatedUser = await UserRepository.updateUserRole(targetUserId, newRoleId);

    // 7. Audit log (fire-and-forget — không block response kể cả khi log fail)
    AuditLogService.createLog({
      user_id:     actor?.id || null,
      action:      "assign_role",
      entity_type: "user",
      entity_id:   targetUserId,
      old_value:   { role_id: targetUser.role_id, role_code: targetUser.role?.code },
      new_value:   { role_id: newRoleId, role_code: newRole.code },
      ip_address:  meta.ip_address || null,
      user_agent:  meta.user_agent || null,
    }).catch(() => {});

    return updatedUser;
  }
}

module.exports = new UserService();
