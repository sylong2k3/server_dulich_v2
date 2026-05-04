const Joi = require('joi');

const coordinateSchema = Joi.array()
    .items(Joi.number())
    .length(2)
    .description('[longitude, latitude]');

const measureDistanceSchema = Joi.object({
    coordinates: Joi.array()
        .items(coordinateSchema)
        .min(2)
        .required()
        .description('Mảng tọa độ [lng, lat] tạo thành đường đo'),
    unit: Joi.string().valid('m', 'km').default('m'),
});

const measureAreaSchema = Joi.object({
    coordinates: Joi.array()
        .items(coordinateSchema)
        .min(3)
        .required()
        .description('Mảng tọa độ [lng, lat] tạo thành đa giác (tự động đóng)'),
    unit: Joi.string().valid('m2', 'km2', 'ha').default('m2'),
});

module.exports = { measureDistanceSchema, measureAreaSchema };
