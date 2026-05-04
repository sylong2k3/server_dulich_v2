const asyncHandler = require('../helpers/async-handler');
const { OK } = require('../core/success.response');
const MapMeasureService = require('../services/map-measure.service');

class MapMeasureController {
    static measureDistance = asyncHandler(async (req, res) => {
        const { coordinates, unit } = req.body;
        const result = await MapMeasureService.measureDistance(coordinates, unit);
        return OK(res, 'Kết quả đo khoảng cách', result);
    });

    static measureArea = asyncHandler(async (req, res) => {
        const { coordinates, unit } = req.body;
        const result = await MapMeasureService.measureArea(coordinates, unit);
        return OK(res, 'Kết quả đo diện tích', result);
    });
}

module.exports = MapMeasureController;
