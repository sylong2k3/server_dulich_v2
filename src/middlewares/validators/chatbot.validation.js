const Joi = require('joi');

const createSessionSchema = Joi.object({
  session_type: Joi.string().valid('tourist', 'manager').default('tourist'),
  language: Joi.string().valid('vi', 'en').default('vi'),
});

const sessionIdParamSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
});

const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required(),
});

const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createSessionSchema,
  sessionIdParamSchema,
  sendMessageSchema,
  paginationQuerySchema,
};
