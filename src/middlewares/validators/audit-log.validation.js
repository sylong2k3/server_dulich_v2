const Joi = require('joi');

const getAuditLogsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    user_id: Joi.string().guid({ version: ['uuidv4'] }).optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE').uppercase(),
    status_code: Joi.number().integer().min(100).max(599),
    from_date: Joi.date().iso(),
    to_date: Joi.date().iso(),
    search: Joi.string().trim().max(255).allow('')
});

const getVisitorStatsQuerySchema = Joi.object({
    from_date: Joi.date().iso(),
    to_date: Joi.date().iso(),
    group_by: Joi.string().valid('day', 'week', 'month').default('day')
});

module.exports = {
    getAuditLogsQuerySchema,
    getVisitorStatsQuerySchema
};
