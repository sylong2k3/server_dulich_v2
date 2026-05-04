const OcopRepository = require('../models/repositories/ocop.repository');
const { Api404Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');

class OcopService {
  static async getAll(query, viewer = {}) {
    const { page = 1, limit = 12, search, category, star_rating, province_code, is_active, sortBy, sortOrder } = query;
    const canManage = OcopService.canManage(viewer);
    const effectiveIsActive = canManage ? is_active : true;
    const { rows, total } = await OcopRepository.findAll({ page, limit, search, category, star_rating, province_code, is_active: effectiveIsActive, sortBy, sortOrder });
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id, viewer = {}) {
    const item = await OcopRepository.findById(id);
    if (!item || (item.is_active === false && !OcopService.canManage(viewer))) {
      throw new Api404Error('Không tìm thấy sản phẩm OCOP');
    }
    return item;
  }

  static async create(data) {
    // Kiểm tra FK tồn tại (business_id phải là doanh nghiệp đã duyệt, province_code phải tồn tại)
    await FKValidator.all([
      FKValidator.business(data.business_id, 'approved'),
      FKValidator.province(data.province_code),
    ]);
    return OcopRepository.create(data);
  }

  static async update(id, data) {
    const existing = await OcopRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy sản phẩm OCOP');

    // Kiểm tra FK tồn tại nếu có thay đổi
    await FKValidator.all([
      FKValidator.business(data.business_id, 'approved'),
      FKValidator.province(data.province_code),
    ]);

    const updated = await OcopRepository.update(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy sản phẩm OCOP');
    return updated;
  }

  static async delete(id) {
    const existing = await OcopRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy sản phẩm OCOP');
    await OcopRepository.delete(id);
  }

  static async getCategories() {
    return OcopRepository.getCategories();
  }

  static canManage(viewer = {}) {
    return Boolean(viewer.user?.hasPermission?.('ocop', 'update') || viewer.user?.hasPermission?.('ocop', 'delete'));
  }
}

module.exports = OcopService;
