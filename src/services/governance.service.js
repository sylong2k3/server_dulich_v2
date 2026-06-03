const GovernanceRepository = require('../models/repositories/governance.repository');
const NotificationService = require('./notification.service');
const { Api403Error, Api404Error, Api409Error } = require('../core/error.response');

class GovernanceService {
    static ADMIN_CODES = ['system_admin'];
    static MINISTRY_CODES = ['ministry_manager'];
    static DEPARTMENT_CODES = ['department_manager'];
    static ENTERPRISE_CODES = ['spot_operator', 'travel_company', 'service_provider'];

    static ensureAccess(user, allowedCodes = []) {
        const code = String(user?.role?.code || '').toLowerCase();

        // Khi hệ thống chưa gán role code đầy đủ, vẫn cho phép để tránh chặn API nội bộ.
        if (!code) return;

        const whitelist = new Set([
            ...allowedCodes.map((c) => c.toLowerCase()),
            ...this.ADMIN_CODES,
        ]);

        if (!whitelist.has(code)) {
            throw new Api403Error('Bạn không có quyền truy cập chức năng này');
        }
    }

    static normalizeDateRange(fromDate, toDate) {
        const now = new Date();
        const end = toDate ? new Date(toDate) : now;
        const start = fromDate
            ? new Date(fromDate)
            : new Date(end.getFullYear(), end.getMonth(), 1);

        return {
            fromDate: start.toISOString(),
            toDate: end.toISOString(),
        };
    }

    static normalizeStatuses(input) {
        if (!input) return ['near_full', 'overloaded'];
        if (Array.isArray(input)) return input;

        return String(input)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }

    static normalizePagination(query = {}) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
        return { page, limit };
    }

    static isAdmin(user) {
        return this.ADMIN_CODES.includes(String(user?.role?.code || '').toLowerCase());
    }

    static assertOwnsBusiness(business, user, message = 'Access denied for this business') {
        if (this.isAdmin(user)) return;
        if (!business || business.owner_id !== user?.id) {
            throw new Api403Error(message);
        }
    }

    static async ensureBusinessAccess(businessId, user, message) {
        const business = await GovernanceRepository.findBusinessById(businessId);
        if (!business) return null;

        this.assertOwnsBusiness(business, user, message);
        return business;
    }

    static buildPagination(total, page, limit) {
        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    static resolvePeriodRange(period = 'month', year = new Date().getFullYear()) {
        const y = Number(year);
        const formatDate = (date) => {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${date.getFullYear()}-${month}-${day}`;
        };

        if (period === 'year') {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            const end = y === currentYear ? new Date(y, currentMonth + 1, 0) : null;
            return {
                dateFrom: `${y}-01-01`,
                dateTo: end ? formatDate(end) : `${y}-12-31`,
            };
        }

        if (period === 'quarter') {
            const currentQuarter = Math.floor(new Date().getMonth() / 3);
            const startMonth = currentQuarter * 3;
            const start = new Date(y, startMonth, 1);
            const end = new Date(y, startMonth + 3, 0);
            return {
                dateFrom: formatDate(start),
                dateTo: formatDate(end),
            };
        }

        const currentYear = new Date().getFullYear();
        const targetMonth = y === currentYear ? new Date().getMonth() : 11;
        const start = new Date(y, 0, 1);
        const end = new Date(y, targetMonth + 1, 0);

        return {
            dateFrom: formatDate(start),
            dateTo: formatDate(end),
        };
    }

    // ==================== BỘ VH-TT&DL ====================

    static async getMinistryOverview(query, user) {
        this.ensureAccess(user, this.MINISTRY_CODES);

        const range = this.normalizeDateRange(query.from_date, query.to_date);

        const [provinceReports, capacityAlerts, conservationMonitoring] = await Promise.all([
            GovernanceRepository.getProvinceOperationalReport(range),
            GovernanceRepository.getCapacityAlerts({
                provinceId: null,
                statuses: ['near_full', 'overloaded'],
                limit: 100,
            }),
            GovernanceRepository.getConservationMonitoring({
                provinceId: null,
                days: 30,
            }),
        ]);

        const aggregate = provinceReports.reduce(
            (acc, row) => {
                acc.total_spots += Number(row.spot_count || 0);
                acc.total_service_units += Number(row.service_unit_count || 0);
                acc.new_businesses += Number(row.new_business_count || 0);
                acc.reported_revenue_vnd += Number(row.reported_revenue_vnd || 0);
                return acc;
            },
            {
                total_spots: 0,
                total_service_units: 0,
                new_businesses: 0,
                reported_revenue_vnd: 0,
            }
        );

        return {
            period: range,
            aggregate,
            provinces: provinceReports,
            overload_alerts: {
                total: capacityAlerts.length,
                items: capacityAlerts,
            },
            conservation_monitoring: {
                total: conservationMonitoring.length,
                items: conservationMonitoring,
            },
        };
    }

    static async getMinistryCapacityAlerts(query, user) {
        this.ensureAccess(user, this.MINISTRY_CODES);

        const statuses = this.normalizeStatuses(query.statuses);
        const limit = Math.max(1, Math.min(200, Number(query.limit) || 50));

        const rows = await GovernanceRepository.getCapacityAlerts({
            provinceId: query.province_code || null,
            statuses,
            limit,
        });

        return {
            total: rows.length,
            items: rows,
        };
    }

    static async getMinistryConservationSummary(query, user) {
        this.ensureAccess(user, this.MINISTRY_CODES);

        const rows = await GovernanceRepository.getConservationMonitoring({
            provinceId: query.province_code || null,
            days: Number(query.days) || 30,
        });

        return {
            total: rows.length,
            items: rows,
        };
    }

    // ==================== SỞ VH-TT&DL ====================

    static async getBusinessRegistrations(query, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await GovernanceRepository.getBusinessRegistrations({
            status: query.status || 'pending',
            provinceId: query.province_code,
            page,
            limit,
        });

        return {
            items: rows,
            pagination: this.buildPagination(total, page, limit),
        };
    }

    // NV-39: Duyệt/Từ chối doanh nghiệp — cập nhật status + thông báo chủ doanh nghiệp
    static async updateBusinessRegistration(id, body, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const updated = await GovernanceRepository.updateBusinessRegistration(id, {
            status: body.status,
            rejection_note: body.rejection_note,
            approved_by: user?.id || null,
        });

        if (!updated) {
            throw new Api404Error('Không tìm thấy doanh nghiệp cần xử lý');
        }

        // Thông báo cho chủ doanh nghiệp
        if (updated.owner_id) {
            const isApproved = body.status === 'approved';
            const isRejected = body.status === 'rejected';
            if (isApproved || isRejected) {
                NotificationService.createNotification({
                    user_id: updated.owner_id,
                    title: isApproved ? 'Doanh nghiệp đã được phê duyệt' : 'Doanh nghiệp bị từ chối',
                    body: isApproved
                        ? `"${updated.business_name}" đã được phê duyệt. Bạn có thể đăng dịch vụ ngay bây giờ.`
                        : `"${updated.business_name}" bị từ chối. Lý do: ${body.rejection_note || 'Không có lý do'}`,
                    type: isApproved ? 'business_approved' : 'business_rejected',
                    reference_id: updated.id,
                    reference_type: 'business',
                }, { broadcastChannel: false, broadcastUser: true }).catch(() => {});
            }
        }

        return updated;
    }

    static async getSpotRegistrations(query, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await GovernanceRepository.getSpotRegistrations({
            status: query.status || 'pending',
            provinceId: query.province_code,
            page,
            limit,
        });

        return {
            items: rows,
            pagination: this.buildPagination(total, page, limit),
        };
    }

    static async updateSpotRegistration(id, body, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const updated = await GovernanceRepository.updateSpotRegistration(id, {
            status: body.status,
            updated_by: user?.id || null,
        });

        if (!updated) {
            throw new Api404Error('Không tìm thấy điểm du lịch cần xử lý');
        }

        return updated;
    }

    static async getDepartmentFeedbacks(query, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await GovernanceRepository.getDepartmentFeedbacks({
            ...query,
            page,
            limit,
        });

        return {
            items: rows,
            pagination: this.buildPagination(total, page, limit),
        };
    }

    static async createDepartmentReport(body, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        return GovernanceRepository.createDepartmentReport({
            ...body,
            created_by: user?.id || null,
        });
    }

    static async listDepartmentReports(query, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await GovernanceRepository.listDepartmentReports({
            ...query,
            page,
            limit,
        });

        return {
            items: rows,
            pagination: this.buildPagination(total, page, limit),
        };
    }

    static async sendDepartmentReport(reportId, body, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const report = await GovernanceRepository.findDepartmentReportById(reportId);
        if (!report) {
            throw new Api404Error('Không tìm thấy báo cáo để gửi');
        }

        const title =
            body.title_vi ||
            `Báo cáo ${report.report_type} (${report.period_from} - ${report.period_to})`;

        const notificationResult = await GovernanceRepository.sendDepartmentReportNotification({
            report,
            targetRoles: body.target_roles,
            title,
            body:
                body.body_vi ||
                `Báo cáo "${report.title}" đã sẵn sàng. Vui lòng truy cập hệ thống để xem chi tiết.`,
            triggeredBy: user?.id || 'department',
        });

        return {
            report,
            notification: notificationResult,
        };
    }

    static async getDepartmentCapacityAlerts(query, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const statuses = this.normalizeStatuses(query.statuses);
        const limit = Math.max(1, Math.min(200, Number(query.limit) || 50));

        const rows = await GovernanceRepository.getCapacityAlerts({
            provinceId: query.province_code || null,
            statuses,
            limit,
        });

        return {
            total: rows.length,
            items: rows,
        };
    }

    static async getDepartmentConservationSummary(query, user) {
        this.ensureAccess(user, this.DEPARTMENT_CODES);

        const rows = await GovernanceRepository.getConservationMonitoring({
            provinceId: query.province_code || null,
            days: Number(query.days) || 30,
        });

        return {
            total: rows.length,
            items: rows,
        };
    }

    // ==================== DOANH NGHIỆP ====================

    static async createBusinessActivityReport(body, user) {
        this.ensureAccess(user, this.ENTERPRISE_CODES);
        const business = await this.ensureBusinessAccess(
            body.business_id,
            user,
            'Bạn không có quyền tạo báo cáo cho doanh nghiệp này'
        );

        if (!business) {
            throw new Api404Error('Không tìm thấy doanh nghiệp để tạo báo cáo');
        }

        return GovernanceRepository.createBusinessActivityReport({
            ...body,
            submitted_by: user?.id || null,
        });
    }

    static async listBusinessActivityReports(query, user) {
        this.ensureAccess(user, this.ENTERPRISE_CODES);

        try {
            const { page, limit } = this.normalizePagination(query);
            const scopedBusiness = query.business_id
                ? await this.ensureBusinessAccess(
                    query.business_id,
                    user,
                    'Bạn không có quyền xem báo cáo của doanh nghiệp này'
                )
                : null;
            const { rows, total } = await GovernanceRepository.listBusinessActivityReports({
                ...query,
                business_id: scopedBusiness?.id || query.business_id,
                owner_id: this.isAdmin(user) || query.business_id ? undefined : user?.id,
                page,
                limit,
            });

            return {
                items: rows,
                pagination: this.buildPagination(total, page, limit),
            };
        } catch (error) {
            throw error;
        }
    }

    static async getBusinessDashboard(businessId, query, user) {
        this.ensureAccess(user, this.ENTERPRISE_CODES);

        try {
            const business = await GovernanceRepository.findBusinessById(businessId);
            if (!business) {
                throw new Api404Error('KhÃ´ng tÃ¬m tháº¥y doanh nghiá»‡p');
            }

            // NV-42: Doanh nghiệp chỉ xem dashboard của chính mình; admin không bị giới hạn
            const isAdmin = this.ADMIN_CODES.includes(String(user?.role?.code || '').toLowerCase());
            if (!isAdmin && business.owner_id !== user?.id) {
                throw new Api403Error('Bạn không có quyền xem dashboard của doanh nghiệp này');
            }

            const { dateFrom, dateTo } = this.resolvePeriodRange(query.period, query.year);

            const dashboard = await GovernanceRepository.getBusinessDashboardSummary(businessId, {
                dateFrom,
                dateTo,
            });

            return {
                period: {
                    type: query.period || 'month',
                    year: Number(query.year) || new Date().getFullYear(),
                    from: dateFrom,
                    to: dateTo,
                },
                business,
                ...dashboard,
            };
        } catch (error) {
            throw error;
        }
    }

    static async updateBusinessInfo(businessId, body, user) {
        this.ensureAccess(user, this.ENTERPRISE_CODES);
        const business = await this.ensureBusinessAccess(
            businessId,
            user,
            'Bạn không có quyền cập nhật doanh nghiệp này'
        );

        if (!business) {
            throw new Api404Error('KhÃ´ng tÃ¬m tháº¥y doanh nghiá»‡p Ä‘á»ƒ cáº­p nháº­t');
        }

        const updated = await GovernanceRepository.updateBusinessInfo(businessId, body);
        if (!updated) {
            throw new Api404Error('Không tìm thấy doanh nghiệp để cập nhật');
        }

        return updated;
    }

    static async getEnterpriseFeedbacks(businessId, query, user) {
        this.ensureAccess(user, this.ENTERPRISE_CODES);

        try {
            const business = await GovernanceRepository.findBusinessById(businessId);
            if (!business) {
                throw new Api404Error('KhÃ´ng tÃ¬m tháº¥y doanh nghiá»‡p');
            }
            this.assertOwnsBusiness(business, user, 'Bạn không có quyền xem phản ánh của doanh nghiệp này');

            const { page, limit } = this.normalizePagination(query);
            const radiusMeters = Math.round((Number(query.radius_km) || 20) * 1000);

            const { rows, total } = await GovernanceRepository.getEnterpriseFeedbacks({
                businessId,
                radiusMeters,
                page,
                limit,
            });

            return {
                business_id: businessId,
                radius_km: radiusMeters / 1000,
                items: rows,
                pagination: this.buildPagination(total, page, limit),
            };
        } catch (error) {
            throw error;
        }
    }

    // ==================== QUẢN TRỊ HỆ THỐNG ====================

    static async getAdminDashboard(user, query = {}) {
        this.ensureAccess(user, this.ADMIN_CODES);

        try {
            const dashboard = await GovernanceRepository.getAdminDashboard(30);
            return dashboard;
        } catch (error) {
            throw error;
        }
    }

    static async getTrafficAnalytics(query, user) {
        this.ensureAccess(user, this.ADMIN_CODES);

        try {
            const result = await GovernanceRepository.getTrafficAnalytics({
                days: Number(query.days) || 30,
                groupBy: query.group_by || 'day',
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    static async listPermissions(query, user) {
        this.ensureAccess(user, this.ADMIN_CODES);

        const { page, limit } = this.normalizePagination(query);
        const { rows, total } = await GovernanceRepository.listPermissions({
            page,
            limit,
            search: query.search,
        });

        return {
            items: rows,
            pagination: this.buildPagination(total, page, limit),
        };
    }

    static async createPermission(body, user) {
        this.ensureAccess(user, this.ADMIN_CODES);

        try {
            return await GovernanceRepository.createPermission(body);
        } catch (error) {
            if (error?.code === '23505') {
                throw new Api409Error('Quyền đã tồn tại với resource/action này');
            }
            throw error;
        }
    }

    static async getRolePermissions(roleId, user) {
        this.ensureAccess(user, this.ADMIN_CODES);
        const items = await GovernanceRepository.getRolePermissions(roleId);
        return {
            role_id: Number(roleId),
            items,
            total: items.length,
        };
    }

    static async replaceRolePermissions(roleId, body, user) {
        this.ensureAccess(user, this.ADMIN_CODES);

        const items = await GovernanceRepository.replaceRolePermissions(
            roleId,
            body.permission_ids,
            user?.id || null
        );

        return {
            role_id: Number(roleId),
            items,
            total: items.length,
        };
    }
}

module.exports = GovernanceService;
