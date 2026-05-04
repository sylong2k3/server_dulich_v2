const BusinessService = require('../services/business.service');
const VoucherService = require('../services/voucher.service');
const asyncHandler = require('../helpers/async-handler');
const { OK, CREATED } = require('../core/success.response');

class BusinessController {
    // ==================== BUSINESSES ====================

    static getAll = asyncHandler(async (req, res) => {
        const result = await BusinessService.getAll(req.query);
        return OK(res, 'Danh sách doanh nghiệp', result);
    });

    static getApproved = asyncHandler(async (req, res) => {
        const result = await BusinessService.getApproved(req.query);
        return OK(res, 'Danh sách doanh nghiệp đã phê duyệt', result);
    });

    static getById = asyncHandler(async (req, res) => {
        const business = await BusinessService.getById(req.params.businessId);
        return OK(res, 'Chi tiết doanh nghiệp', { business });
    });

    static getMyBusiness = asyncHandler(async (req, res) => {
        const businesses = await BusinessService.getByOwner(req.user.id);
        return OK(res, 'Doanh nghiệp của bạn', { businesses });
    });

    // NV-38: Đăng ký doanh nghiệp
    static register = asyncHandler(async (req, res) => {
        const business = await BusinessService.create(req.body, req.user.id);
        return CREATED(res, 'Đăng ký doanh nghiệp thành công, đang chờ duyệt', { business });
    });

    static update = asyncHandler(async (req, res) => {
        const business = await BusinessService.update(req.params.businessId, req.body, req.user.id);
        return OK(res, 'Cập nhật thông tin doanh nghiệp thành công', { business });
    });

    static updateStatus = asyncHandler(async (req, res) => {
        const business = await BusinessService.updateStatus(req.params.businessId, req.body, req.user.id);
        return OK(res, 'Cập nhật trạng thái doanh nghiệp thành công', { business });
    });

    // ==================== NV-40: SERVICES ====================

    static getServices = asyncHandler(async (req, res) => {
        const result = await BusinessService.getServices(req.params.businessId, req.query);
        return OK(res, 'Danh sách dịch vụ', result);
    });

    static createService = asyncHandler(async (req, res) => {
        const service = await BusinessService.createService(req.params.businessId, req.body, req.user.id);
        return CREATED(res, 'Thêm dịch vụ thành công', { service });
    });

    static updateService = asyncHandler(async (req, res) => {
        const service = await BusinessService.updateService(req.params.businessId, req.params.serviceId, req.body, req.user.id);
        return OK(res, 'Cập nhật dịch vụ thành công', { service });
    });

    static deleteService = asyncHandler(async (req, res) => {
        await BusinessService.deleteService(req.params.businessId, req.params.serviceId, req.user.id);
        return OK(res, 'Xóa dịch vụ thành công');
    });

    // ==================== NV-41: VOUCHERS ====================

    static getVouchers = asyncHandler(async (req, res) => {
        const result = await VoucherService.getByBusiness(req.params.businessId, req.user.id, req.query);
        return OK(res, 'Danh sách voucher', result);
    });

    static createVoucher = asyncHandler(async (req, res) => {
        const voucher = await VoucherService.create(req.params.businessId, req.body, req.user.id);
        return CREATED(res, 'Tạo voucher thành công', { voucher });
    });

    static updateVoucher = asyncHandler(async (req, res) => {
        const voucher = await VoucherService.update(req.params.businessId, req.params.voucherId, req.body, req.user.id);
        return OK(res, 'Cập nhật voucher thành công', { voucher });
    });

    static deactivateVoucher = asyncHandler(async (req, res) => {
        await VoucherService.deactivate(req.params.businessId, req.params.voucherId, req.user.id);
        return OK(res, 'Voucher đã được vô hiệu hoá');
    });

    // Public voucher endpoints
    static getNearbyVouchers = asyncHandler(async (req, res) => {
        const { lng, lat, radius_m } = req.query;
        const vouchers = await VoucherService.getNearby(Number(lng), Number(lat), Number(radius_m) || 5000);
        return OK(res, 'Voucher gần đây', { vouchers });
    });

    static validateVoucher = asyncHandler(async (req, res) => {
        const result = await VoucherService.validate(req.body.code, req.body);
        return OK(res, 'Voucher hợp lệ', result);
    });
}

module.exports = BusinessController;
