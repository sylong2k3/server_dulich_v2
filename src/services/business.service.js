const BusinessRepository = require('../models/repositories/business.repository');
const UserRepository = require('../models/repositories/user.repository');
const NotificationService = require('./notification.service');
const { Api400Error, Api404Error, Api403Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');
const { normalizeLang } = require('../utils/i18n.utils');

class BusinessService {
  // ==================== BUSINESSES ====================

  static async getAll(query, viewer = {}) {
    const { page = 1, limit = 10, search, status, business_type, province_code, ward_code, sortBy, sortOrder, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);

    // Áp dụng giới hạn theo tỉnh của Sở (department_manager)
    let finalProvinceCode = province_code;
    const roleCode = String(viewer?.role?.code || '').toLowerCase();
    if (roleCode === 'department_manager') {
      const userProvinceCode = viewer.province_code || viewer.province?.code || viewer.department?.province_code || viewer.profile?.province_code;
      if (userProvinceCode) {
        finalProvinceCode = userProvinceCode;
      }
    }

    const { rows, total } = await BusinessRepository.findAll({
      page, limit, search, status, business_type, province_code: finalProvinceCode, ward_code, sortBy, sortOrder, lang,
    });
    return {
      items: rows.map(r => { const { total_count, ...item } = r; return item; }),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getApproved(query) {
    return this.getAll({ ...query, status: 'approved' });
  }

  static async getById(id, rawLang = 'vi') {
    const lang = normalizeLang(rawLang);
    const business = await BusinessRepository.findById(id, lang);
    if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');
    return business;
  }

  static async getByOwner(ownerId) {
    return BusinessRepository.findByOwnerId(ownerId);
  }

  // NV-38: Đăng ký doanh nghiệp — tạo với status=pending, gửi thông báo Sở VHTTDL
  static async create(data, userId) {
    // Kiểm tra FK địa chỉ trước khi tạo
    await FKValidator.all([
      FKValidator.province(data.province_code),
      FKValidator.ward(data.ward_code, data.province_code),
    ]);

    const business = await BusinessRepository.create({ ...data, owner_id: userId });

    // Thông báo cho Sở VHTTDL
    const staffUsers = await UserRepository.getUsersByRoleCodes(['department_manager']);
    if (staffUsers.length) {
      await Promise.all(staffUsers.map(u =>
        NotificationService.createNotification({
          user_id: u.id,
          title: 'Doanh nghiệp mới đăng ký chờ duyệt',
          body: `"${business.business_name}" vừa đăng ký và đang chờ phê duyệt.`,
          type: 'business_registration',
          reference_id: business.id,
          reference_type: 'business',
        }, { broadcastChannel: false, broadcastUser: true }).catch(() => {})
      ));
    }

    return business;
  }

  static async update(id, data, userId) {
    const business = await BusinessRepository.findById(id);
    if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');
    if (business.owner_id !== userId) throw new Api403Error('Bạn không có quyền cập nhật doanh nghiệp này');

    // Kiểm tra FK địa chỉ nếu có thay đổi
    await FKValidator.all([
      FKValidator.province(data.province_code),
      FKValidator.ward(data.ward_code, data.province_code ?? business.province_code),
    ]);

    const updated = await BusinessRepository.update(id, data);
    if (!updated) throw new Api400Error('Không có trường nào được cập nhật');
    return updated;
  }

  static async updateStatus(id, { status, rejection_note }, user) {
    const business = await BusinessRepository.findById(id);
    if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');

    const roleCode = String(user?.role?.code || '').toLowerCase();
    const adminId = user?.id;

    // Nếu là department_manager, kiểm tra tỉnh
    if (roleCode === 'department_manager') {
      const userProvinceCode = user.province_code || user.province?.code || user.department?.province_code || user.profile?.province_code;
      if (userProvinceCode && business.province_code !== userProvinceCode) {
        throw new Api403Error('Bạn chỉ có quyền duyệt doanh nghiệp trong tỉnh của mình');
      }
    }

    // Kiểm tra workflow trạng thái
    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['suspended'],
      rejected: ['pending'],
      suspended: ['approved'],
    };
    const allowed = validTransitions[business.status] || [];
    if (!allowed.includes(status)) {
      throw new Api400Error(`Không thể chuyển trạng thái từ '${business.status}' sang '${status}'`);
    }

    if (status === 'rejected' && !rejection_note) {
      throw new Api400Error('Vui lòng nhập lý do từ chối');
    }

    const updated = await BusinessRepository.updateStatus(id, {
      status,
      approved_by: adminId,
      rejection_note: rejection_note || null,
    });
    return updated;
  }

  // ==================== SERVICES ====================

  static async getServices(businessId, query) {
    const business = await BusinessRepository.findById(businessId);
    if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');

    const { page = 1, limit = 20, lang: rawLang } = query;
    const lang = normalizeLang(rawLang);
    const { rows, total } = await BusinessRepository.findServicesByBusinessId(businessId, { page, limit, lang });
    return {
      items: rows.map(r => { const { total_count, ...item } = r; return item; }),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async createService(businessId, data, userId) {
    const business = await BusinessRepository.findById(businessId);
    if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');
    if (business.owner_id !== userId) throw new Api403Error('Bạn không có quyền thêm dịch vụ cho doanh nghiệp này');

    // Kiểm tra FK spot_id nếu có
    await FKValidator.spot(data.spot_id);

    return BusinessRepository.createService({ ...data, business_id: businessId });
  }

  static async updateService(businessId, serviceId, data, userId) {
    const business = await BusinessRepository.findById(businessId);
    if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');
    if (business.owner_id !== userId) throw new Api403Error('Bạn không có quyền cập nhật dịch vụ của doanh nghiệp này');

    const service = await BusinessRepository.findServiceById(serviceId);
    if (!service || service.business_id !== businessId) throw new Api404Error('Không tìm thấy dịch vụ');

    const updated = await BusinessRepository.updateService(serviceId, data);
    if (!updated) throw new Api400Error('Không có trường nào được cập nhật');
    return updated;
  }

  static async deleteService(businessId, serviceId, userId) {
    const business = await BusinessRepository.findById(businessId);
    if (!business) throw new Api404Error('Không tìm thấy doanh nghiệp');
    if (business.owner_id !== userId) throw new Api403Error('Bạn không có quyền xóa dịch vụ của doanh nghiệp này');

    const service = await BusinessRepository.findServiceById(serviceId);
    if (!service || service.business_id !== businessId) throw new Api404Error('Không tìm thấy dịch vụ');

    await BusinessRepository.deleteService(serviceId);
  }
}

module.exports = BusinessService;
