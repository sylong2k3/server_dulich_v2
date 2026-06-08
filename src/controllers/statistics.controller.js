const statisticsService = require('../services/statistics.service');
const asyncHandler = require('../helpers/async-handler');
const { OK } = require('../core/success.response');

class StatisticsController {
    static listDataFiles = asyncHandler(async (req, res) => {
        const result = await statisticsService.listDataFiles();
        return OK(res, 'Danh sách file thống kê', result);
    });

    static downloadDataFile = asyncHandler(async (req, res) => {
        const { filename } = req.params;
        const dataFile = await statisticsService.getDataFile(filename);
        res.setHeader('Content-Type', dataFile.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${dataFile.filename}"`);
        return res.send(dataFile.content);
    });
}

module.exports = StatisticsController;
