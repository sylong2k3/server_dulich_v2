const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');
const MapAdminService = require('../services/map-admin.service');

class MapAdminController {
    // ==================== CATEGORIES ====================
    static listCategories = asyncHandler(async (req, res) => {
        const result = await MapAdminService.listCategories(req.query, req.user);
        return OK(res, 'Danh sách danh mục bản đồ', result);
    });

    static createCategory = asyncHandler(async (req, res) => {
        const result = await MapAdminService.createCategory(req.body, req.user);
        return CREATED(res, 'Tạo danh mục bản đồ thành công', result);
    });

    static updateCategory = asyncHandler(async (req, res) => {
        const result = await MapAdminService.updateCategory(req.params.id, req.body, req.user);
        return OK(res, 'Cập nhật danh mục bản đồ thành công', result);
    });

    static deleteCategory = asyncHandler(async (req, res) => {
        const result = await MapAdminService.deleteCategory(req.params.id, req.user);
        return OK(res, 'Ẩn danh mục bản đồ thành công', result);
    });

    // ==================== LAYERS ====================
    static listLayers = asyncHandler(async (req, res) => {
        const result = await MapAdminService.listLayers(req.query, req.user);
        return OK(res, 'Danh sách lớp dữ liệu bản đồ', result);
    });

    static createLayer = asyncHandler(async (req, res) => {
        const result = await MapAdminService.createLayer(req.body, req.user);
        return CREATED(res, 'Tạo lớp bản đồ thành công', result);
    });

    static updateLayer = asyncHandler(async (req, res) => {
        const result = await MapAdminService.updateLayer(req.params.id, req.body, req.user);
        return OK(res, 'Cập nhật lớp bản đồ thành công', result);
    });

    static deleteLayer = asyncHandler(async (req, res) => {
        const result = await MapAdminService.deleteLayer(req.params.id, req.user);
        return OK(res, 'Ẩn lớp bản đồ thành công', result);
    });

    static toggleLayerStatus = asyncHandler(async (req, res) => {
        const result = await MapAdminService.toggleLayerStatus(req.params.id, req.user);
        const msg = result.status === 'active' ? 'Đã bật lớp bản đồ' : 'Đã tắt lớp bản đồ';
        return OK(res, msg, result);
    });

    // ==================== MAP APIS ====================
    static listMapApis = asyncHandler(async (req, res) => {
        const result = await MapAdminService.listMapApis(req.query, req.user);
        return OK(res, 'Danh sách API lớp bản đồ', result);
    });

    static createMapApi = asyncHandler(async (req, res) => {
        const result = await MapAdminService.createMapApi(req.body, req.user);
        return CREATED(res, 'Tạo API lớp bản đồ thành công', result);
    });

    static updateMapApi = asyncHandler(async (req, res) => {
        const result = await MapAdminService.updateMapApi(req.params.id, req.body, req.user);
        return OK(res, 'Cập nhật API lớp bản đồ thành công', result);
    });

    static deleteMapApi = asyncHandler(async (req, res) => {
        const result = await MapAdminService.deleteMapApi(req.params.id, req.user);
        return OK(res, 'Xóa API lớp bản đồ thành công', result);
    });

    // ==================== API PERMISSIONS ====================
    static listApiPermissions = asyncHandler(async (req, res) => {
        const result = await MapAdminService.listApiPermissions(req.params.id, req.user);
        return OK(res, 'Danh sách phân quyền API', result);
    });

    static upsertApiPermission = asyncHandler(async (req, res) => {
        const result = await MapAdminService.upsertApiPermission(req.params.id, req.body, req.user);
        return OK(res, 'Cập nhật phân quyền API thành công', result);
    });

    static deleteApiPermission = asyncHandler(async (req, res) => {
        const result = await MapAdminService.deleteApiPermission(req.params.permissionId, req.user);
        return OK(res, 'Xóa phân quyền API thành công', result);
    });

    // ==================== API KEYS ====================
    static listApiKeys = asyncHandler(async (req, res) => {
        const result = await MapAdminService.listApiKeys(req.query, req.user);
        return OK(res, 'Danh sách API key', result);
    });

    static createApiKey = asyncHandler(async (req, res) => {
        const result = await MapAdminService.createApiKey(req.body, req.user);
        return CREATED(res, 'Tạo API key thành công', result);
    });

    static revokeApiKey = asyncHandler(async (req, res) => {
        const result = await MapAdminService.revokeApiKey(req.params.id, req.user);
        return OK(res, 'Thu hồi API key thành công', result);
    });
}

module.exports = MapAdminController;
