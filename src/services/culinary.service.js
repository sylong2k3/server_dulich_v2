const CulinaryRepository = require('../models/repositories/culinary.repository');
const { Api404Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');

class CulinaryService {
  static async getAll(query) {
    const { page = 1, limit = 12, search, category, is_speciality, sortBy, sortOrder } = query;
    const { rows, total } = await CulinaryRepository.findAll({ page, limit, search, category, is_speciality, sortBy, sortOrder });
    return {
      items: rows.map(({ total_count, ...item }) => item),
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id) {
    const item = await CulinaryRepository.findById(id);
    if (!item) throw new Api404Error('Không tìm thấy món ẩm thực');
    return item;
  }

  static async create(data) {
    // Kiểm tra FK tồn tại (province_code)
    await FKValidator.province(data.province_code);
    return CulinaryRepository.create(data);
  }

  static async update(id, data) {
    const existing = await CulinaryRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy món ẩm thực');

    // Kiểm tra FK tồn tại nếu có thay đổi
    await FKValidator.province(data.province_code);

    const updated = await CulinaryRepository.update(id, data);
    if (!updated) throw new Api404Error('Không tìm thấy món ẩm thực');
    return updated;
  }

  static async delete(id) {
    const existing = await CulinaryRepository.findById(id);
    if (!existing) throw new Api404Error('Không tìm thấy món ẩm thực');
    await CulinaryRepository.delete(id);
  }

  static async getCategories() {
    return CulinaryRepository.getCategories();
  }
}

module.exports = CulinaryService;
