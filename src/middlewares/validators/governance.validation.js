const Joi = require('joi');

const uuidSchema = Joi.string().guid({ version: ['uuidv1', 'uuidv3', 'uuidv4', 'uuidv5'] });

const paginationSchema = {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
};

const ministryOverviewQuerySchema = Joi.object({
    from_date: Joi.date().iso().optional(),
    to_date: Joi.date().iso().optional(),
});

const capacityAlertsQuerySchema = Joi.object({
    province_code: Joi.string().trim().max(20).optional(),
    statuses: Joi.alternatives().try(
        Joi.array().items(Joi.string().valid('normal', 'busy', 'near_full', 'overloaded')).optional(),
        Joi.string().trim().optional()
    ),
    limit: Joi.number().integer().min(1).max(200).default(50),
});

const conservationQuerySchema = Joi.object({
    province_code: Joi.string().trim().max(20).optional(),
    days: Joi.number().integer().min(1).max(3650).default(30),
});

const registrationQuerySchema = Joi.object({
    ...paginationSchema,
    status: Joi.string().trim().valid('pending', 'approved', 'rejected', 'suspended', 'active', 'inactive', 'archived').optional(),
    province_code: Joi.string().trim().max(20).optional(),
});

const uuidIdParamSchema = Joi.object({
    id: uuidSchema.required(),
});

const reportIdParamSchema = Joi.object({
    id: uuidSchema.required(),
});

const businessIdParamSchema = Joi.object({
    businessId: uuidSchema.required(),
});

const updateBusinessRegistrationSchema = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected', 'suspended').required(),
    rejection_note: Joi.string().allow('', null).max(2000).optional(),
});

const updateSpotRegistrationSchema = Joi.object({
    status: Joi.string().valid('pending', 'active', 'inactive', 'archived').required(),
});

const departmentFeedbackQuerySchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().trim().allow('').optional(),
    status: Joi.string().valid('pending', 'in_progress', 'resolved', 'closed').optional(),
    moderation_status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'priority', 'status').default('created_at'),
    sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
});

const createDepartmentReportSchema = Joi.object({
    schedule_id: Joi.number().integer().positive().optional().allow(null),
    report_type: Joi.string().trim().min(3).max(100).required(),
    period_from: Joi.date().iso().required(),
    period_to: Joi.date().iso().min(Joi.ref('period_from')).required(),
    title: Joi.string().trim().min(3).max(255).required(),
    file_url: Joi.string().trim().uri({ scheme: ['http', 'https'] }).optional().allow(null),
    file_format: Joi.string().trim().valid('pdf', 'xlsx').default('pdf'),
    file_size_kb: Joi.number().integer().min(0).optional().allow(null),
    sent_to_roles: Joi.array().items(Joi.number().integer().positive()).optional().default([]),
});

const listDepartmentReportsQuerySchema = Joi.object({
    ...paginationSchema,
    report_type: Joi.string().trim().optional(),
    created_by: uuidSchema.optional(),
});

const sendDepartmentReportSchema = Joi.object({
    target_roles: Joi.array().items(Joi.number().integer().positive()).optional().default([]),
    title_vi: Joi.string().trim().max(255).optional(),
    body_vi: Joi.string().trim().max(2000).optional(),
});

const createBusinessReportSchema = Joi.object({
    business_id: uuidSchema.required(),
    report_period: Joi.string().valid('month', 'quarter', 'year', 'custom').required(),
    period_from: Joi.date().iso().required(),
    period_to: Joi.date().iso().min(Joi.ref('period_from')).required(),
    total_revenue_vnd: Joi.number().min(0).default(0),
    total_bookings: Joi.number().integer().min(0).default(0),
    total_visitors: Joi.number().integer().min(0).default(0),
    avg_capacity_pct: Joi.number().min(0).max(100).optional().allow(null),
    notes: Joi.string().allow('', null).max(5000).optional(),
    status: Joi.string().valid('submitted', 'reviewed', 'approved', 'rejected').default('submitted'),
});

const listBusinessReportsQuerySchema = Joi.object({
    ...paginationSchema,
    business_id: uuidSchema.optional(),
    report_period: Joi.string().valid('month', 'quarter', 'year', 'custom').optional(),
    status: Joi.string().valid('submitted', 'reviewed', 'approved', 'rejected').optional(),
});

const businessDashboardQuerySchema = Joi.object({
    period: Joi.string().valid('month', 'quarter', 'year').default('month'),
    year: Joi.number().integer().min(2000).max(2100).default(new Date().getFullYear()),
});

const updateBusinessInfoSchema = Joi.object({
    business_name: Joi.string().trim().min(2).max(255).optional(),
    business_type: Joi.string().trim().max(100).optional().allow(null),
    description_vi: Joi.string().trim().allow('', null).optional(),
    phone: Joi.string().trim().max(30).optional().allow(null),
    email: Joi.string().trim().email().optional().allow(null),
    website: Joi.string().trim().uri({ scheme: ['http', 'https'] }).optional().allow(null),
    address_vi: Joi.string().trim().allow('', null).optional(),
    logo_url: Joi.string().trim().uri({ scheme: ['http', 'https'] }).optional().allow(null),
}).min(1);

const enterpriseFeedbackQuerySchema = Joi.object({
    ...paginationSchema,
    radius_km: Joi.number().min(1).max(200).default(20),
});

const adminTrafficQuerySchema = Joi.object({
    days: Joi.number().integer().min(1).max(3650).default(30),
    group_by: Joi.string().valid('day', 'week', 'month').default('day'),
});

const permissionsQuerySchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().trim().allow('').optional(),
});

const createPermissionSchema = Joi.object({
    resource: Joi.string().trim().min(2).max(100).required(),
    action: Joi.string().trim().min(2).max(50).required(),
    name_vi: Joi.string().trim().allow('', null).optional(),
    description: Joi.string().trim().allow('', null).optional(),
});

const roleIdParamSchema = Joi.object({
    roleId: Joi.number().integer().positive().required(),
});

const replaceRolePermissionsSchema = Joi.object({
    permission_ids: Joi.array().items(Joi.number().integer().positive()).required(),
});

module.exports = {
    ministryOverviewQuerySchema,
    capacityAlertsQuerySchema,
    conservationQuerySchema,
    registrationQuerySchema,
    uuidIdParamSchema,
    reportIdParamSchema,
    businessIdParamSchema,
    updateBusinessRegistrationSchema,
    updateSpotRegistrationSchema,
    departmentFeedbackQuerySchema,
    createDepartmentReportSchema,
    listDepartmentReportsQuerySchema,
    sendDepartmentReportSchema,
    createBusinessReportSchema,
    listBusinessReportsQuerySchema,
    businessDashboardQuerySchema,
    updateBusinessInfoSchema,
    enterpriseFeedbackQuerySchema,
    adminTrafficQuerySchema,
    permissionsQuerySchema,
    createPermissionSchema,
    roleIdParamSchema,
    replaceRolePermissionsSchema,
};
