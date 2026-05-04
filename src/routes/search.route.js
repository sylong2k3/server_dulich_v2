const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/search.controller');
const { validateParams, validateQuery } = require('../middlewares/validation');
const {
    searchQuerySchema,
    searchByTypeQuerySchema,
    searchTypeParamSchema,
} = require('../middlewares/validators/search.validation');

// GET /api/v1/search/types
// ROUTE: GET /types - Truy vấn tìm kiếm. Xử lý bởi SearchController.getTypes. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/types', SearchController.getTypes);

// GET /api/v1/search/:type?q=...  (spots | businesses | vlogs | cuisine | festivals | ocop | users)
// ROUTE: GET /:type - Tìm kiếm tìm kiếm. Xử lý bởi SearchController.searchByType. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:type', validateParams(searchTypeParamSchema), validateQuery(searchByTypeQuerySchema), SearchController.searchByType );

// GET /api/v1/search?q=...&types=spots,cuisine
// ROUTE: GET / - Tìm kiếm tìm kiếm. Xử lý bởi SearchController.search. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/', validateQuery(searchQuerySchema), SearchController.search );

module.exports = router;
