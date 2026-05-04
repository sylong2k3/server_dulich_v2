const statisticsService = require('../services/statistics.service');
const asyncHandler = require('../helpers/async-handler');
const { OK } = require('../core/success.response');
const path = require('path');

class StatisticsController {
    static listDataFiles = asyncHandler(async (req, res) => {
        const result = statisticsService.listDataFiles();
        return OK(res, 'Danh sách file thống kê', result);
    });

    static downloadDataFile = asyncHandler(async (req, res) => {
        const { filename } = req.params;
        const filePath = statisticsService.getDataFilePath(filename);
        res.download(filePath, path.basename(filePath));
    });
}

module.exports = StatisticsController;
