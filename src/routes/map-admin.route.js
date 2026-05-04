const express = require('express');
const MapAdminController = require('../controllers/map-admin.controller');
const { authenticateToken, checkPermission } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
    idParamSchema,
    permissionIdParamSchema,
    paginationQuerySchema,
    createCategorySchema,
    updateCategorySchema,
    createLayerSchema,
    updateLayerSchema,
    createMapApiSchema,
    updateMapApiSchema,
    upsertPermissionSchema,
    apiKeyQuerySchema,
    createApiKeySchema,
} = require('../middlewares/validators/map-admin.validation');

const router = express.Router();

// ==================== MAP CATEGORIES ====================
// ROUTE: GET /categories - Truy vấn quản trị bản đồ. Xử lý bởi MapAdminController.listCategories. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:read.
router.get('/categories', authenticateToken, checkPermission('map_admin', 'read'), validateQuery(paginationQuerySchema), MapAdminController.listCategories);
// ROUTE: POST /categories - Tạo mới quản trị bản đồ. Xử lý bởi MapAdminController.createCategory. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:create.
router.post('/categories', authenticateToken, checkPermission('map_admin', 'create'), validateBody(createCategorySchema), MapAdminController.createCategory);
// ROUTE: PATCH /categories/:id - Cập nhật quản trị bản đồ. Xử lý bởi MapAdminController.updateCategory. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:update.
router.patch('/categories/:id', authenticateToken, checkPermission('map_admin', 'update'), validateParams(idParamSchema), validateBody(updateCategorySchema), MapAdminController.updateCategory);
// ROUTE: DELETE /categories/:id - Xóa quản trị bản đồ. Xử lý bởi MapAdminController.deleteCategory. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:delete.
router.delete('/categories/:id', authenticateToken, checkPermission('map_admin', 'delete'), validateParams(idParamSchema), MapAdminController.deleteCategory);

// ==================== MAP LAYERS ====================
// ROUTE: GET /layers - Truy vấn quản trị bản đồ. Xử lý bởi MapAdminController.listLayers. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:read.
router.get('/layers', authenticateToken, checkPermission('map_admin', 'read'), validateQuery(paginationQuerySchema), MapAdminController.listLayers);
// ROUTE: POST /layers - Tạo mới quản trị bản đồ. Xử lý bởi MapAdminController.createLayer. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:create.
router.post('/layers', authenticateToken, checkPermission('map_admin', 'create'), validateBody(createLayerSchema), MapAdminController.createLayer);
// ROUTE: PATCH /layers/:id/toggle - Cập nhật một phần quản trị bản đồ. Xử lý bởi MapAdminController.toggleLayerStatus. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:update.
router.patch('/layers/:id/toggle', authenticateToken, checkPermission('map_admin', 'update'), validateParams(idParamSchema), MapAdminController.toggleLayerStatus);
// ROUTE: PATCH /layers/:id - Cập nhật quản trị bản đồ. Xử lý bởi MapAdminController.updateLayer. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:update.
router.patch('/layers/:id', authenticateToken, checkPermission('map_admin', 'update'), validateParams(idParamSchema), validateBody(updateLayerSchema), MapAdminController.updateLayer);
// ROUTE: DELETE /layers/:id - Xóa quản trị bản đồ. Xử lý bởi MapAdminController.deleteLayer. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:delete.
router.delete('/layers/:id', authenticateToken, checkPermission('map_admin', 'delete'), validateParams(idParamSchema), MapAdminController.deleteLayer);

// ==================== MAP LAYER APIS ====================
// ROUTE: GET /apis - Truy vấn quản trị bản đồ. Xử lý bởi MapAdminController.listMapApis. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:read.
router.get('/apis', authenticateToken, checkPermission('map_admin', 'read'), validateQuery(paginationQuerySchema), MapAdminController.listMapApis);
// ROUTE: POST /apis - Tạo mới quản trị bản đồ. Xử lý bởi MapAdminController.createMapApi. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:create.
router.post('/apis', authenticateToken, checkPermission('map_admin', 'create'), validateBody(createMapApiSchema), MapAdminController.createMapApi);
// ROUTE: PATCH /apis/:id - Cập nhật quản trị bản đồ. Xử lý bởi MapAdminController.updateMapApi. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:update.
router.patch('/apis/:id', authenticateToken, checkPermission('map_admin', 'update'), validateParams(idParamSchema), validateBody(updateMapApiSchema), MapAdminController.updateMapApi);
// ROUTE: DELETE /apis/:id - Xóa quản trị bản đồ. Xử lý bởi MapAdminController.deleteMapApi. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:delete.
router.delete('/apis/:id', authenticateToken, checkPermission('map_admin', 'delete'), validateParams(idParamSchema), MapAdminController.deleteMapApi);

// ==================== MAP API PERMISSIONS ====================
// ROUTE: GET /apis/:id/permissions - Truy vấn quản trị bản đồ. Xử lý bởi MapAdminController.listApiPermissions. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:read.
router.get('/apis/:id/permissions', authenticateToken, checkPermission('map_admin', 'read'), validateParams(idParamSchema), MapAdminController.listApiPermissions);
// ROUTE: PUT /apis/:id/permissions - Cập nhật toàn phần quản trị bản đồ. Xử lý bởi MapAdminController.upsertApiPermission. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:update.
router.put('/apis/:id/permissions', authenticateToken, checkPermission('map_admin', 'update'), validateParams(idParamSchema), validateBody(upsertPermissionSchema), MapAdminController.upsertApiPermission);
// ROUTE: DELETE /apis/:id/permissions/:permissionId - Xóa quản trị bản đồ. Xử lý bởi MapAdminController.deleteApiPermission. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:delete.
router.delete('/apis/:id/permissions/:permissionId', authenticateToken, checkPermission('map_admin', 'delete'), validateParams(permissionIdParamSchema), MapAdminController.deleteApiPermission);

// ==================== API KEYS ====================
// ROUTE: GET /api-keys - Truy vấn quản trị bản đồ. Xử lý bởi MapAdminController.listApiKeys. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:read.
router.get('/api-keys', authenticateToken, checkPermission('map_admin', 'read'), validateQuery(apiKeyQuerySchema), MapAdminController.listApiKeys);
// ROUTE: POST /api-keys - Tạo mới quản trị bản đồ. Xử lý bởi MapAdminController.createApiKey. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:create.
router.post('/api-keys', authenticateToken, checkPermission('map_admin', 'create'), validateBody(createApiKeySchema), MapAdminController.createApiKey);
// ROUTE: PATCH /api-keys/:id/revoke - Cập nhật một phần quản trị bản đồ. Xử lý bởi MapAdminController.revokeApiKey. Truy cập: yêu cầu đăng nhập, cần quyền map_admin:update.
router.patch('/api-keys/:id/revoke', authenticateToken, checkPermission('map_admin', 'update'), validateParams(idParamSchema), MapAdminController.revokeApiKey);

module.exports = router;
