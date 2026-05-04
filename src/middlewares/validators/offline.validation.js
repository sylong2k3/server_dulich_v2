const Joi = require('joi');

const boundsSchema = Joi.object({
  minLat: Joi.number().min(-90).max(90).required(),
  maxLat: Joi.number().min(-90).max(90).required(),
  minLng: Joi.number().min(-180).max(180).required(),
  maxLng: Joi.number().min(-180).max(180).required(),
}).custom((value, helpers) => {
  if (value.maxLat <= value.minLat) {
    return helpers.error('bounds.latOrder');
  }
  if (value.maxLng <= value.minLng) {
    return helpers.error('bounds.lngOrder');
  }
  // Giới hạn diện tích bbox tối đa: 2° × 2° (~222km × 222km tại xích đạo)
  const deltaLat = value.maxLat - value.minLat;
  const deltaLng = value.maxLng - value.minLng;
  if (deltaLat > 2 || deltaLng > 2) {
    return helpers.error('bounds.tooLarge');
  }
  return value;
}).messages({
  'bounds.latOrder': 'maxLat phải lớn hơn minLat',
  'bounds.lngOrder': 'maxLng phải lớn hơn minLng',
  'bounds.tooLarge': 'Vùng bản đồ quá lớn (tối đa 2° × 2°, ~222km × 222km)',
});

const downloadIdParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required().messages({
    'number.base': 'ID phải là số nguyên',
    'any.required': 'ID là bắt buộc',
  }),
});

const requestDownloadSchema = Joi.object({
  area_name: Joi.string().trim().max(255).optional(),
  province_code: Joi.string().trim().max(20).optional().allow(null),
  bounds: boundsSchema.required(),
  zoom_min: Joi.number().integer().min(1).max(22).default(10),
  zoom_max: Joi.number().integer().min(1).max(22).default(16),
}).custom((value, helpers) => {
  if (value.zoom_min > value.zoom_max) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({ 'any.invalid': 'zoom_min phải nhỏ hơn hoặc bằng zoom_max' });

module.exports = { requestDownloadSchema, downloadIdParamSchema };
