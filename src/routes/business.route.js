const express = require('express');
const router = express.Router();
const BusinessController = require('../controllers/business.controller');
const { authenticateToken, checkPermission, optionalAuth, requireRole } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const {
    businessQuerySchema,
    registerBusinessSchema,
    updateBusinessSchema,
    updateBusinessStatusSchema,
    businessIdParamSchema,
    businessServiceParamSchema,
    serviceQuerySchema,
    createServiceSchema,
    updateServiceSchema,
} = require('../middlewares/validators/business.validation');
const {
    businessVoucherParamSchema,
    voucherItemParamSchema,
    voucherQuerySchema,
    createVoucherSchema,
    updateVoucherSchema,
    validateVoucherSchema,
    nearbyVoucherQuerySchema,
} = require('../middlewares/validators/voucher.validation');

// Role map:
// - system_admin: Quản trị hệ thống
// - ministry_manager: Bộ Văn hóa Thể thao và Du lịch
// - department_manager: Sở Văn hóa Thể thao và Du lịch
// - spot_operator: Đơn vị vận hành điểm du lịch
// - travel_company: Công ty lữ hành
// - service_provider: Đơn vị cung cấp dịch vụ du lịch
// Roles được phép thao tác business/service/voucher của mình
const BUSINESS_OWNER_ROLES = ['spot_operator', 'travel_company', 'service_provider', 'system_admin'];
const BUSINESS_REVIEWER_ROLES = ['system_admin', 'ministry_manager', 'department_manager'];

// ==================== PUBLIC ====================
// ROUTE: GET /public - Lấy danh sách đã được duyệt công khai doanh nghiệp du lịch. Xử lý bởi BusinessController.getApproved. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/public', validateQuery(businessQuerySchema), BusinessController.getApproved);
// ROUTE: GET /vouchers/nearby - Tìm các mục ở gần vị trí người dùng doanh nghiệp du lịch. Xử lý bởi BusinessController.getNearbyVouchers. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/vouchers/nearby', validateQuery(nearbyVoucherQuerySchema), BusinessController.getNearbyVouchers);
// ROUTE: POST /vouchers/validate - Kiểm tra tính hợp lệ doanh nghiệp du lịch. Xử lý bởi BusinessController.validateVoucher. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.post('/vouchers/validate', validateBody(validateVoucherSchema), BusinessController.validateVoucher);

// ==================== NV-38: Đăng ký doanh nghiệp ====================
// Nhóm đơn vị du lịch được đăng ký doanh nghiệp
// ROUTE: POST / - Tạo mới doanh nghiệp du lịch. Xử lý bởi BusinessController.register. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.post('/', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateBody(registerBusinessSchema), BusinessController.register);
// ROUTE: GET /me - Lấy thông tin thuộc về tài khoản đang đăng nhập doanh nghiệp du lịch. Xử lý bởi BusinessController.getMyBusiness. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.get('/me', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), BusinessController.getMyBusiness);

// ==================== ADMIN: Xem tất cả doanh nghiệp ====================
// ROUTE: GET / - Lấy toàn bộ danh sách cho quản trị doanh nghiệp du lịch. Xử lý bởi BusinessController.getAll. Truy cập: yêu cầu đăng nhập, cần quyền businesses:read.
router.get('/', authenticateToken, checkPermission('businesses', 'read'), validateQuery(businessQuerySchema), BusinessController.getAll);

// ==================== SINGLE BUSINESS ====================
// ROUTE: GET /:businessId - Lấy chi tiết theo ID doanh nghiệp du lịch. Xử lý bởi BusinessController.getById. Truy cập: cho phép đăng nhập tùy chọn.
router.get('/:businessId', optionalAuth, validateParams(businessIdParamSchema), BusinessController.getById);
// Chủ sở hữu thuộc nhóm đơn vị du lịch cập nhật thông tin doanh nghiệp của mình
// Ownership được kiểm tra thêm trong business.service.js (owner_id !== userId → 403)
// ROUTE: PATCH /:businessId - Cập nhật doanh nghiệp du lịch. Xử lý bởi BusinessController.update. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.patch('/:businessId', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateParams(businessIdParamSchema), validateBody(updateBusinessSchema), BusinessController.update);

// ==================== ADMIN: Kiểm duyệt doanh nghiệp ====================
// ROUTE: PATCH /:businessId/status - Cập nhật doanh nghiệp du lịch. Xử lý bởi BusinessController.updateStatus. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_REVIEWER_ROLES.
router.patch('/:businessId/status', authenticateToken, requireRole(BUSINESS_REVIEWER_ROLES), validateParams(businessIdParamSchema), validateBody(updateBusinessStatusSchema), BusinessController.updateStatus);

// ==================== NV-40: Dịch vụ du lịch ====================
// ROUTE: GET /:businessId/services - Truy vấn doanh nghiệp du lịch. Xử lý bởi BusinessController.getServices. Truy cập: Không yêu cầu đăng nhập nếu middleware không chặn.
router.get('/:businessId/services', validateParams(businessIdParamSchema), validateQuery(serviceQuerySchema), BusinessController.getServices);
// Chỉ owner mới được thêm/sửa/xóa dịch vụ (ownership check trong service)
// ROUTE: POST /:businessId/services - Tạo mới doanh nghiệp du lịch. Xử lý bởi BusinessController.createService. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.post('/:businessId/services', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateParams(businessIdParamSchema), validateBody(createServiceSchema), BusinessController.createService);
// ROUTE: PATCH /:businessId/services/:serviceId - Cập nhật doanh nghiệp du lịch. Xử lý bởi BusinessController.updateService. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.patch('/:businessId/services/:serviceId', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateParams(businessServiceParamSchema), validateBody(updateServiceSchema), BusinessController.updateService);
// ROUTE: DELETE /:businessId/services/:serviceId - Xóa doanh nghiệp du lịch. Xử lý bởi BusinessController.deleteService. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.delete('/:businessId/services/:serviceId', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateParams(businessServiceParamSchema), BusinessController.deleteService);

// ==================== NV-41: Voucher ====================
// Chỉ owner mới được xem/tạo/sửa/vô-hiệu-hóa voucher của mình (ownership check trong voucher.service.js)
// ROUTE: GET /:businessId/vouchers - Truy vấn doanh nghiệp du lịch. Xử lý bởi BusinessController.getVouchers. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.get('/:businessId/vouchers', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateParams(businessVoucherParamSchema), validateQuery(voucherQuerySchema), BusinessController.getVouchers);
// ROUTE: POST /:businessId/vouchers - Tạo mới doanh nghiệp du lịch. Xử lý bởi BusinessController.createVoucher. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.post('/:businessId/vouchers', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateParams(businessVoucherParamSchema), validateBody(createVoucherSchema), BusinessController.createVoucher);
// ROUTE: PATCH /:businessId/vouchers/:voucherId - Cập nhật doanh nghiệp du lịch. Xử lý bởi BusinessController.updateVoucher. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.patch('/:businessId/vouchers/:voucherId', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateParams(voucherItemParamSchema), validateBody(updateVoucherSchema), BusinessController.updateVoucher);
// ROUTE: DELETE /:businessId/vouchers/:voucherId - Vô hiệu hóa doanh nghiệp du lịch. Xử lý bởi BusinessController.deactivateVoucher. Truy cập: yêu cầu đăng nhập, giới hạn vai trò BUSINESS_OWNER_ROLES.
router.delete('/:businessId/vouchers/:voucherId', authenticateToken, requireRole(BUSINESS_OWNER_ROLES), validateParams(voucherItemParamSchema), BusinessController.deactivateVoucher);

module.exports = router;
