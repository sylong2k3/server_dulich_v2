const express = require('express');
const GovernanceController = require('../controllers/governance.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
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
} = require('../middlewares/validators/governance.validation');

const router = express.Router();

// ==================== BỘ VH-TT&DL ====================
// ROUTE: GET /ministry/overview - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getMinistryOverview. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/ministry/overview', authenticateToken, checkPermission('governance', 'read'), validateQuery(ministryOverviewQuerySchema), GovernanceController.getMinistryOverview );

// ROUTE: GET /ministry/capacity-alerts - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getMinistryCapacityAlerts. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/ministry/capacity-alerts', authenticateToken, checkPermission('governance', 'read'), validateQuery(capacityAlertsQuerySchema), GovernanceController.getMinistryCapacityAlerts );

// ROUTE: GET /ministry/conservation-summary - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getMinistryConservationSummary. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/ministry/conservation-summary', authenticateToken, checkPermission('governance', 'read'), validateQuery(conservationQuerySchema), GovernanceController.getMinistryConservationSummary );

// ==================== SỞ VH-TT&DL ====================
// ROUTE: GET /department/registrations/businesses - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getBusinessRegistrations. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/department/registrations/businesses', authenticateToken, checkPermission('governance', 'read'), validateQuery(registrationQuerySchema), GovernanceController.getBusinessRegistrations );

// ROUTE: PATCH /department/registrations/businesses/:id - Cập nhật quản trị hệ thống. Xử lý bởi GovernanceController.updateBusinessRegistration. Truy cập: yêu cầu đăng nhập, cần quyền governance:update.
router.patch('/department/registrations/businesses/:id', authenticateToken, checkPermission('governance', 'update'), validateParams(uuidIdParamSchema), validateBody(updateBusinessRegistrationSchema), GovernanceController.updateBusinessRegistration );

// ROUTE: GET /department/registrations/spots - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getSpotRegistrations. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/department/registrations/spots', authenticateToken, checkPermission('governance', 'read'), validateQuery(registrationQuerySchema), GovernanceController.getSpotRegistrations );

// ROUTE: PATCH /department/registrations/spots/:id - Cập nhật quản trị hệ thống. Xử lý bởi GovernanceController.updateSpotRegistration. Truy cập: yêu cầu đăng nhập, cần quyền governance:update.
router.patch('/department/registrations/spots/:id', authenticateToken, checkPermission('governance', 'update'), validateParams(uuidIdParamSchema), validateBody(updateSpotRegistrationSchema), GovernanceController.updateSpotRegistration );

// ROUTE: GET /department/feedbacks - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getDepartmentFeedbacks. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/department/feedbacks', authenticateToken, checkPermission('governance', 'read'), validateQuery(departmentFeedbackQuerySchema), GovernanceController.getDepartmentFeedbacks );

// ROUTE: POST /department/reports - Tạo mới quản trị hệ thống. Xử lý bởi GovernanceController.createDepartmentReport. Truy cập: yêu cầu đăng nhập, cần quyền governance:create.
router.post('/department/reports', authenticateToken, checkPermission('governance', 'create'), validateBody(createDepartmentReportSchema), GovernanceController.createDepartmentReport );

// ROUTE: GET /department/reports - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.listDepartmentReports. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/department/reports', authenticateToken, checkPermission('governance', 'read'), validateQuery(listDepartmentReportsQuerySchema), GovernanceController.listDepartmentReports );

// ROUTE: POST /department/reports/:id/send - Gửi dữ liệu/thông báo quản trị hệ thống. Xử lý bởi GovernanceController.sendDepartmentReport. Truy cập: yêu cầu đăng nhập, cần quyền governance:update.
router.post('/department/reports/:id/send', authenticateToken, checkPermission('governance', 'update'), validateParams(reportIdParamSchema), validateBody(sendDepartmentReportSchema), GovernanceController.sendDepartmentReport );

// ROUTE: GET /department/capacity-alerts - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getDepartmentCapacityAlerts. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/department/capacity-alerts', authenticateToken, checkPermission('governance', 'read'), validateQuery(capacityAlertsQuerySchema), GovernanceController.getDepartmentCapacityAlerts );

// ROUTE: GET /department/conservation-summary - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getDepartmentConservationSummary. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/department/conservation-summary', authenticateToken, checkPermission('governance', 'read'), validateQuery(conservationQuerySchema), GovernanceController.getDepartmentConservationSummary );

// ==================== ĐƠN VỊ DOANH NGHIỆP ====================
// ROUTE: POST /enterprise/reports - Tạo mới quản trị hệ thống. Xử lý bởi GovernanceController.createBusinessActivityReport. Truy cập: yêu cầu đăng nhập, cần quyền governance:create.
router.post('/enterprise/reports', authenticateToken, checkPermission('governance', 'create'), validateBody(createBusinessReportSchema), GovernanceController.createBusinessActivityReport );

// ROUTE: GET /enterprise/reports - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.listBusinessActivityReports. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/enterprise/reports', authenticateToken, checkPermission('governance', 'read'), validateQuery(listBusinessReportsQuerySchema), GovernanceController.listBusinessActivityReports );

// ROUTE: GET /enterprise/businesses/:businessId/dashboard - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getBusinessDashboard. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/enterprise/businesses/:businessId/dashboard', authenticateToken, checkPermission('governance', 'read'), validateParams(businessIdParamSchema), validateQuery(businessDashboardQuerySchema), GovernanceController.getBusinessDashboard );

// ROUTE: PATCH /enterprise/businesses/:businessId - Cập nhật quản trị hệ thống. Xử lý bởi GovernanceController.updateBusinessInfo. Truy cập: yêu cầu đăng nhập, cần quyền governance:update.
router.patch('/enterprise/businesses/:businessId', authenticateToken, checkPermission('governance', 'update'), validateParams(businessIdParamSchema), validateBody(updateBusinessInfoSchema), GovernanceController.updateBusinessInfo );

// ROUTE: GET /enterprise/businesses/:businessId/feedbacks - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getEnterpriseFeedbacks. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/enterprise/businesses/:businessId/feedbacks', authenticateToken, checkPermission('governance', 'read'), validateParams(businessIdParamSchema), validateQuery(enterpriseFeedbackQuerySchema), GovernanceController.getEnterpriseFeedbacks );

// ==================== QUẢN TRỊ HỆ THỐNG ====================
// ROUTE: GET /admin/dashboard - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getAdminDashboard. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/admin/dashboard', authenticateToken, checkPermission('governance', 'read'), GovernanceController.getAdminDashboard);

// ROUTE: GET /admin/traffic - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getTrafficAnalytics. Truy cập: yêu cầu đăng nhập, cần quyền governance:read.
router.get('/admin/traffic', authenticateToken, checkPermission('governance', 'read'), validateQuery(adminTrafficQuerySchema), GovernanceController.getTrafficAnalytics );

// ROUTE: GET /admin/permissions - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.listPermissions. Truy cập: yêu cầu đăng nhập, cần quyền permissions:read.
router.get('/admin/permissions', authenticateToken, checkPermission('permissions', 'read'), validateQuery(permissionsQuerySchema), GovernanceController.listPermissions );

// ROUTE: POST /admin/permissions - Tạo mới quản trị hệ thống. Xử lý bởi GovernanceController.createPermission. Truy cập: yêu cầu đăng nhập, cần quyền permissions:create.
router.post('/admin/permissions', authenticateToken, checkPermission('permissions', 'create'), validateBody(createPermissionSchema), GovernanceController.createPermission );

// ROUTE: GET /admin/roles/:roleId/permissions - Truy vấn quản trị hệ thống. Xử lý bởi GovernanceController.getRolePermissions. Truy cập: yêu cầu đăng nhập, cần quyền roles:read.
router.get('/admin/roles/:roleId/permissions', authenticateToken, checkPermission('roles', 'read'), validateParams(roleIdParamSchema), GovernanceController.getRolePermissions );

// ROUTE: PUT /admin/roles/:roleId/permissions - Cập nhật toàn phần quản trị hệ thống. Xử lý bởi GovernanceController.replaceRolePermissions. Truy cập: yêu cầu đăng nhập, cần quyền roles:update.
router.put('/admin/roles/:roleId/permissions', authenticateToken, checkPermission('roles', 'update'), validateParams(roleIdParamSchema), validateBody(replaceRolePermissionsSchema), GovernanceController.replaceRolePermissions );

module.exports = router;
