const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/integration.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
  integrationQuerySchema,
  integrationIdParamSchema,
  syncLogsQuerySchema,
  createIntegrationSchema,
  updateIntegrationSchema,
} = require('../middlewares/validators/integration.validation');

// NV-60: Tích hợp nền tảng bên thứ 3 — chỉ admin
// ROUTE: GET / - Truy vấn tích hợp hệ thống. Xử lý bởi IntegrationController.list. Truy cập: yêu cầu đăng nhập, cần quyền integrations:read.
router.get('/', authenticateToken, checkPermission('integrations', 'read'), validateQuery(integrationQuerySchema), IntegrationController.list );

// ROUTE: GET /:id - Lấy chi tiết theo ID tích hợp hệ thống. Xử lý bởi IntegrationController.getById. Truy cập: yêu cầu đăng nhập, cần quyền integrations:read.
router.get('/:id', authenticateToken, checkPermission('integrations', 'read'), validateParams(integrationIdParamSchema), IntegrationController.getById );

// ROUTE: POST / - Tạo mới tích hợp hệ thống. Xử lý bởi IntegrationController.create. Truy cập: yêu cầu đăng nhập, cần quyền integrations:create.
router.post('/', authenticateToken, checkPermission('integrations', 'create'), validateBody(createIntegrationSchema), IntegrationController.create );

// ROUTE: PATCH /:id - Cập nhật tích hợp hệ thống. Xử lý bởi IntegrationController.update. Truy cập: yêu cầu đăng nhập, cần quyền integrations:update.
router.patch('/:id', authenticateToken, checkPermission('integrations', 'update'), validateParams(integrationIdParamSchema), validateBody(updateIntegrationSchema), IntegrationController.update );

// ROUTE: DELETE /:id - Xóa tích hợp hệ thống. Xử lý bởi IntegrationController.delete. Truy cập: yêu cầu đăng nhập, cần quyền integrations:delete.
router.delete('/:id', authenticateToken, checkPermission('integrations', 'delete'), validateParams(integrationIdParamSchema), IntegrationController.delete );

// ROUTE: POST /:id/sync - Tạo/Gửi tích hợp hệ thống. Xử lý bởi IntegrationController.triggerSync. Truy cập: yêu cầu đăng nhập, cần quyền integrations:update.
router.post('/:id/sync', authenticateToken, checkPermission('integrations', 'update'), validateParams(integrationIdParamSchema), IntegrationController.triggerSync );

// ROUTE: GET /:id/logs - Truy vấn tích hợp hệ thống. Xử lý bởi IntegrationController.getLogs. Truy cập: yêu cầu đăng nhập, cần quyền integrations:read.
router.get('/:id/logs', authenticateToken, checkPermission('integrations', 'read'), validateParams(integrationIdParamSchema), validateQuery(syncLogsQuerySchema), IntegrationController.getLogs );

module.exports = router;
