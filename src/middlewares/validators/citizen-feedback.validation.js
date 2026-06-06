const Joi = require('joi');
const {
  uuid,
  latField,
  lngField,
  paginationQuery,
  sortQuery,
  makeOptional,
} = require('./common/base-schemas');
const { uuidParamSchema: idParamSchema } = require('./common/id-param.schema');
const { FEEDBACK_STATUS, FEEDBACK_MODERATION_STATUS, LIMITS } = require('./common/constants');
const msg = require('./common/messages');
const FEEDBACK_PRIORITY = ['low', 'normal', 'high', 'urgent'];

const adminNoteSchema = (field) => Joi.string().allow('').min(10).max(2000).optional().messages({
  'string.base': `${field} phải là chuỗi ký tự`,
  'string.min': msg.min(field, 10),
  'string.max': msg.max(field, 2000),
});

// Schema tạo phản ánh mới
const feedbackBaseFields = {
  title: Joi.string().trim().min(10).max(500).messages({
    'string.base': 'Tiêu đề phải là chuỗi ký tự',
    'string.empty': msg.empty('Tiêu đề'),
    'string.min': msg.min('Tiêu đề', 10),
    'string.max': msg.max('Tiêu đề', 500),
  }),
  content: Joi.string().trim().min(20).messages({
    'string.base': 'Nội dung phải là chuỗi ký tự',
    'string.empty': msg.empty('Nội dung'),
    'string.min': msg.min('Nội dung', 20),
  }),
  latitude: latField(),
  longitude: lngField(),
  priority: Joi.string().valid(...FEEDBACK_PRIORITY).optional().messages({
    'string.base': 'Mức độ ưu tiên phải là chuỗi ký tự',
    'any.only': msg.oneOf('Mức độ ưu tiên', FEEDBACK_PRIORITY),
  }),
  location_text: Joi.string().max(500).optional(),
  images: Joi.array().items(Joi.string().max(1000)).max(10).optional(),
  forest_loss_area_estimate_m2: Joi.number().min(0).optional(),
};

const createFeedbackSchema = Joi.object({
  ...feedbackBaseFields,
  title: feedbackBaseFields.title.required().messages({
    'string.base': 'Tiêu đề phải là chuỗi ký tự',
    'string.empty': msg.empty('Tiêu đề'),
    'string.min': msg.min('Tiêu đề', 10),
    'string.max': msg.max('Tiêu đề', 500),
    'any.required': msg.required('Tiêu đề'),
  }),
  content: feedbackBaseFields.content.required().messages({
    'string.base': 'Nội dung phải là chuỗi ký tự',
    'string.empty': msg.empty('Nội dung'),
    'string.min': msg.min('Nội dung', 20),
    'any.required': msg.required('Nội dung'),
  }),
});

// Schema cập nhật phản ánh
const updateFeedbackSchema = makeOptional(Joi.object({
  title: feedbackBaseFields.title,
  content: feedbackBaseFields.content,
  latitude: feedbackBaseFields.latitude,
  longitude: feedbackBaseFields.longitude,
  priority: feedbackBaseFields.priority,
}));

// Schema cập nhật trạng thái xử lý
const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...FEEDBACK_STATUS).required().messages({
    'string.base': 'Trạng thái phải là chuỗi ký tự',
    'any.only': msg.oneOf('Trạng thái', FEEDBACK_STATUS),
    'any.required': msg.required('Trạng thái'),
  }),
  is_location_verified: Joi.boolean().optional().messages({
    'boolean.base': 'Trường xác minh vị trí phải là true hoặc false',
  }),
  admin_response: adminNoteSchema('Phản hồi của admin'),
  resolution_note: adminNoteSchema('Ghi chú giải quyết'),
});

// Schema cập nhật trạng thái kiểm duyệt
const updateModerationStatusSchema = Joi.object({
  moderation_status: Joi.string().valid(...FEEDBACK_MODERATION_STATUS).required().messages({
    'string.base': 'Trạng thái kiểm duyệt phải là chuỗi ký tự',
    'any.only': msg.oneOf('Trạng thái kiểm duyệt', FEEDBACK_MODERATION_STATUS),
    'any.required': msg.required('Trạng thái kiểm duyệt'),
  }),
  admin_response: adminNoteSchema('Phản hồi của admin'),
});

// Schema query lọc và phân trang
const getFeedbacksQuerySchema = Joi.object({
  ...paginationQuery({ maxLimit: 100 }),
  search: Joi.string().max(LIMITS.SEARCH_QUERY_MAX).allow('').optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi ký tự',
    'string.max': msg.max('Từ khóa tìm kiếm', LIMITS.SEARCH_QUERY_MAX),
  }),
  status: Joi.string().valid(...FEEDBACK_STATUS).optional().messages({
    'string.base': 'Trạng thái phải là chuỗi ký tự',
    'any.only': 'Trạng thái không hợp lệ',
  }),
  moderation_status: Joi.string().valid(...FEEDBACK_MODERATION_STATUS).optional().messages({
    'string.base': 'Trạng thái kiểm duyệt phải là chuỗi ký tự',
    'any.only': 'Trạng thái kiểm duyệt không hợp lệ',
  }),
  priority: Joi.string().valid(...FEEDBACK_PRIORITY).optional().messages({
    'string.base': 'Mức độ ưu tiên phải là chuỗi ký tự',
    'any.only': 'Mức độ ưu tiên không hợp lệ',
  }),
  user_id: uuid().optional().messages({
    'string.guid': 'ID người dùng không hợp lệ',
  }),
  start_date: Joi.date().iso().optional().messages({
    'date.base': 'Ngày bắt đầu phải là định dạng ngày hợp lệ',
    'date.format': 'Ngày bắt đầu phải theo định dạng ISO (YYYY-MM-DD)',
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).optional().messages({
    'date.base': 'Ngày kết thúc phải là định dạng ngày hợp lệ',
    'date.format': 'Ngày kết thúc phải theo định dạng ISO (YYYY-MM-DD)',
    'date.min': 'Ngày kết thúc phải sau ngày bắt đầu',
  }),
  ...sortQuery(['created_at', 'updated_at', 'priority', 'status', 'responded_at']),
});

module.exports = {
  createFeedbackSchema,
  updateFeedbackSchema,
  updateStatusSchema,
  updateModerationStatusSchema,
  getFeedbacksQuerySchema,
  idParamSchema,
};
