const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');
const GovernanceService = require('../services/governance.service');

class GovernanceController {
    // ==================== BỘ ====================
    static getMinistryOverview = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getMinistryOverview(req.query, req.user);
        return OK(res, 'Tổng quan điều hành cấp Bộ', result);
    });

    static getMinistryCapacityAlerts = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getMinistryCapacityAlerts(req.query, req.user);
        return OK(res, 'Danh sách cảnh báo quá tải cấp Bộ', result);
    });

    static getMinistryConservationSummary = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getMinistryConservationSummary(req.query, req.user);
        return OK(res, 'Tổng hợp giám sát khu bảo tồn cấp Bộ', result);
    });

    // ==================== SỞ ====================
    static getBusinessRegistrations = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getBusinessRegistrations(req.query, req.user);
        return OK(res, 'Danh sách đăng ký doanh nghiệp', result);
    });

    static updateBusinessRegistration = asyncHandler(async (req, res) => {
        const result = await GovernanceService.updateBusinessRegistration(req.params.id, req.body, req.user);
        return OK(res, 'Cập nhật trạng thái đăng ký doanh nghiệp thành công', result);
    });

    static getSpotRegistrations = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getSpotRegistrations(req.query, req.user);
        return OK(res, 'Danh sách đăng ký điểm du lịch', result);
    });

    static updateSpotRegistration = asyncHandler(async (req, res) => {
        const result = await GovernanceService.updateSpotRegistration(req.params.id, req.body, req.user);
        return OK(res, 'Cập nhật trạng thái đăng ký điểm du lịch thành công', result);
    });

    static getDepartmentFeedbacks = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getDepartmentFeedbacks(req.query, req.user);
        return OK(res, 'Danh sách phản ánh người dân', result);
    });

    static createDepartmentReport = asyncHandler(async (req, res) => {
        const result = await GovernanceService.createDepartmentReport(req.body, req.user);
        return CREATED(res, 'Tạo báo cáo Sở thành công', result);
    });

    static listDepartmentReports = asyncHandler(async (req, res) => {
        const result = await GovernanceService.listDepartmentReports(req.query, req.user);
        return OK(res, 'Danh sách báo cáo Sở', result);
    });

    static sendDepartmentReport = asyncHandler(async (req, res) => {
        const result = await GovernanceService.sendDepartmentReport(req.params.id, req.body, req.user);
        return OK(res, 'Gửi báo cáo thành công', result);
    });

    static getDepartmentCapacityAlerts = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getDepartmentCapacityAlerts(req.query, req.user);
        return OK(res, 'Danh sách cảnh báo quá tải cấp Sở', result);
    });

    static getDepartmentConservationSummary = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getDepartmentConservationSummary(req.query, req.user);
        return OK(res, 'Tổng hợp giám sát khu bảo tồn cấp Sở', result);
    });

    // ==================== DOANH NGHIỆP ====================
    static createBusinessActivityReport = asyncHandler(async (req, res) => {
        const result = await GovernanceService.createBusinessActivityReport(req.body, req.user);
        return CREATED(res, 'Tạo báo cáo hoạt động doanh nghiệp thành công', result);
    });

    static listBusinessActivityReports = asyncHandler(async (req, res) => {
        const result = await GovernanceService.listBusinessActivityReports(req.query, req.user);
        return OK(res, 'Danh sách báo cáo hoạt động doanh nghiệp', result);
    });

    static getBusinessDashboard = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getBusinessDashboard(req.params.businessId, req.query, req.user);
        return OK(res, 'Dashboard doanh nghiệp', result);
    });

    static updateBusinessInfo = asyncHandler(async (req, res) => {
        const result = await GovernanceService.updateBusinessInfo(req.params.businessId, req.body, req.user);
        return OK(res, 'Cập nhật thông tin doanh nghiệp thành công', result);
    });

    static getEnterpriseFeedbacks = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getEnterpriseFeedbacks(req.params.businessId, req.query, req.user);
        return OK(res, 'Danh sách phản ánh theo doanh nghiệp', result);
    });

    // ==================== ADMIN ====================
    static getAdminDashboard = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getAdminDashboard(req.user);
        return OK(res, 'Dashboard quản trị hệ thống', result);
    });

    static getTrafficAnalytics = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getTrafficAnalytics(req.query, req.user);
        return OK(res, 'Thống kê lưu lượng truy cập', result);
    });

    static listPermissions = asyncHandler(async (req, res) => {
        const result = await GovernanceService.listPermissions(req.query, req.user);
        return OK(res, 'Danh sách quyền hệ thống', result);
    });

    static createPermission = asyncHandler(async (req, res) => {
        const result = await GovernanceService.createPermission(req.body, req.user);
        return CREATED(res, 'Tạo quyền hệ thống thành công', result);
    });

    static getRolePermissions = asyncHandler(async (req, res) => {
        const result = await GovernanceService.getRolePermissions(req.params.roleId, req.user);
        return OK(res, 'Danh sách quyền của vai trò', result);
    });

    static replaceRolePermissions = asyncHandler(async (req, res) => {
        const result = await GovernanceService.replaceRolePermissions(req.params.roleId, req.body, req.user);
        return OK(res, 'Cập nhật quyền cho vai trò thành công', result);
    });
}

module.exports = GovernanceController;
