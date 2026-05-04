const express = require('express');
const router = express.Router();
const GeographyController = require('../controllers/geography.controller');
const { validateQuery, validateParams } = require('../middlewares/validation');
const {
    codeParamSchema,
    provinceCodeParamSchema,
    searchProvinceSchema,
    searchWardSchema,
} = require('../middlewares/validators/geography.validation');

// Public routes - Dữ liệu đơn vị hành chính (cache 24h, dữ liệu tĩnh)
// ROUTE: GET /provinces - Truy vấn dữ liệu địa lý. Xử lý bởi GeographyController.getAllProvinces. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/provinces', GeographyController.getAllProvinces);
// ROUTE: GET /provinces/search - Tìm kiếm dữ liệu địa lý. Xử lý bởi GeographyController.searchProvinces. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/provinces/search', validateQuery(searchProvinceSchema), GeographyController.searchProvinces);
// ROUTE: GET /provinces/:code - Truy vấn dữ liệu địa lý. Xử lý bởi GeographyController.getProvinceByCode. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/provinces/:code', validateParams(codeParamSchema), GeographyController.getProvinceByCode);
// ROUTE: GET /provinces/:province_code/wards - Truy vấn dữ liệu địa lý. Xử lý bởi GeographyController.getWardsByProvince. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/provinces/:province_code/wards', validateParams(provinceCodeParamSchema), GeographyController.getWardsByProvince);
// ROUTE: GET /wards - Truy vấn dữ liệu địa lý. Xử lý bởi GeographyController.getAllWards. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/wards', GeographyController.getAllWards);
// ROUTE: GET /wards/search - Tìm kiếm dữ liệu địa lý. Xử lý bởi GeographyController.searchWards. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/wards/search', validateQuery(searchWardSchema), GeographyController.searchWards);

module.exports = router;
