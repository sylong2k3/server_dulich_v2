const geographyService = require('../services/geography.service');
const asyncHandler = require('../helpers/async-handler');
const { OK } = require('../core/success.response');

class GeographyController {
  static getAllProvinces = asyncHandler(async (req, res) => {
    const provinces = await geographyService.getAllProvinces();
    return OK(res, 'Lấy danh sách tỉnh/thành phố thành công', { provinces });
  });

  static getProvinceByCode = asyncHandler(async (req, res) => {
    const province = await geographyService.getProvinceByCode(req.params.code);
    return OK(res, 'Lấy thông tin tỉnh/thành phố thành công', { province });
  });

  static searchProvinces = asyncHandler(async (req, res) => {
    const provinces = await geographyService.searchProvinces(req.query.q);
    return OK(res, 'Tìm kiếm tỉnh/thành phố thành công', { provinces });
  });

  static searchWards = asyncHandler(async (req, res) => {
    const wards = await geographyService.searchWards(req.query.q, req.query.province_code);
    return OK(res, 'Tìm kiếm xã/phường thành công', { wards });
  });

  static getAllWards = asyncHandler(async (req, res) => {
    const wards = await geographyService.getAllWards();
    return OK(res, 'Lấy danh sách xã/phường thành công', { wards });
  });

  static getWardsByProvince = asyncHandler(async (req, res) => {
    const wards = await geographyService.getWardsByProvince(req.params.province_code);
    return OK(res, 'Lấy danh sách xã/phường theo tỉnh thành công', { wards });
  });
}

module.exports = GeographyController;
