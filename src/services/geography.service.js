const GeographyRepository = require('../models/repositories/geography.repository');
const { Api404Error } = require('../core/error.response');
const { cacheOrFetch } = require('../utils/cache.utils');

class GeographyService {
  async getAllProvinces() {
    return cacheOrFetch('geo:provinces', () => GeographyRepository.getAllProvinces(), 86400);
  }

  async getProvinceByCode(code) {
    const province = await cacheOrFetch(
      `geo:province:${code}`,
      () => GeographyRepository.getProvinceByCode(code),
      86400
    );
    if (!province) {
      throw new Api404Error('Tỉnh/thành phố không tồn tại');
    }
    return province;
  }

  async searchProvinces(q) {
    return GeographyRepository.searchProvinces(q);
  }

  async searchWards(q, provinceCode) {
    return GeographyRepository.searchWards(q, provinceCode);
  }

  async getAllWards() {
    return cacheOrFetch('geo:wards:all', () => GeographyRepository.getAllWards(), 86400);
  }

  async getWardsByProvince(provinceCode) {
    if (!provinceCode) throw new Api404Error('Thiếu mã tỉnh/thành phố');
    return cacheOrFetch(
      `geo:wards:province:${provinceCode}`,
      () => GeographyRepository.getWardsByProvince(provinceCode),
      86400
    );
  }
}

module.exports = new GeographyService();
