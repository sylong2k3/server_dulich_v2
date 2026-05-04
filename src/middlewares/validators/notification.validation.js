const Joi = require('joi');

const queryNotificationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  unread_only: Joi.boolean().optional(),
  type: Joi.string().trim().max(50).optional(),
  delivery_status: Joi.string().valid('pending', 'sent', 'failed').optional(),
});

const createNotificationSchema = Joi.object({
  type: Joi.string().trim().max(50).required(),
  title_vi: Joi.string().trim().min(1).max(255).optional().allow('', null),
  title: Joi.string().trim().min(1).max(255).optional().allow('', null),
  body_vi: Joi.string().trim().max(4000).optional().allow('', null),
  body: Joi.string().trim().max(4000).optional().allow('', null),
  user_id: Joi.string().guid({ version: ['uuidv4'] }).optional().allow(null),
  role_ids: Joi.array().items(Joi.number().integer().positive()).max(20).optional(),
  send_all: Joi.boolean().default(false),
  target_lng: Joi.number().min(-180).max(180).optional().allow(null),
  target_lat: Joi.number().min(-90).max(90).optional().allow(null),
  target_radius_m: Joi.number().integer().min(50).max(200000).default(5000),
  data: Joi.object().unknown(true).optional().allow(null),
}).custom((value, helpers) => {
  const title = (value.title_vi || value.title || '').trim();
  if (!title) {
    return helpers.error('any.custom', {
      message: 'Tiêu đề thông báo là bắt buộc (title_vi hoặc title)',
    });
  }

  const hasUserTarget = Boolean(value.user_id);
  const hasRoleTarget = Array.isArray(value.role_ids) && value.role_ids.length > 0;
  const hasBroadcastAll = value.send_all === true;
  const hasGeoLng = value.target_lng !== null && value.target_lng !== undefined;
  const hasGeoLat = value.target_lat !== null && value.target_lat !== undefined;
  const hasGeoTarget = hasGeoLng && hasGeoLat;

  if (hasGeoLng !== hasGeoLat) {
    return helpers.error('any.custom', {
      message: 'Cần cung cấp đầy đủ target_lng và target_lat',
    });
  }

  if (!hasUserTarget && !hasRoleTarget && !hasBroadcastAll && !hasGeoTarget) {
    return helpers.error('any.custom', {
      message: 'Cần ít nhất một đối tượng nhận: user_id, role_ids, send_all hoặc vùng địa lý',
    });
  }

  return value;
}, 'notification-target-validation').messages({
  'any.custom': '{{#message}}',
});

module.exports = {
  queryNotificationSchema,
  createNotificationSchema,
};
