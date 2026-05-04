const SearchService = require('../services/search.service');
const asyncHandler = require('../helpers/async-handler');
const { OK } = require('../core/success.response');

class SearchController {
  // GET /search?q=ninh+binh&types=spots,cuisine,festivals
  static search = asyncHandler(async (req, res) => {
    const result = await SearchService.search(req.query);
    return OK(res, 'Kết quả tìm kiếm', result);
  });

  // GET /search/:type?q=ninh+binh
  static searchByType = asyncHandler(async (req, res) => {
    const result = await SearchService.searchByType(req.params.type, req.query);
    return OK(res, `Kết quả tìm kiếm: ${result.label}`, result);
  });

  // GET /search/types
  static getTypes = asyncHandler(async (req, res) => {
    const result = SearchService.getAvailableTypes();
    return OK(res, 'Danh sách loại tìm kiếm', result);
  });
}

module.exports = SearchController;
