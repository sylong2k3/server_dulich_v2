const crypto = require('crypto');
const { query } = require('../configs/database');
const DashboardResolver = require('./dashboard/dashboard-resolver');

// Helpers for mock data generation
const randomUUID = () => crypto.randomUUID();
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => Number((Math.random() * (max - min) + min).toFixed(decimals));
const randomElem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ==================== PREMIUM FALLBACK DATASETS ====================
// Used if the database has 0 records or queries fail.
const DEFAULT_PROVINCES = [
    { code: '35', name: 'Ninh Bình' },
    { code: '01', name: 'Hà Nội' },
    { code: '22', name: 'Quảng Ninh' },
    { code: '48', name: 'Đà Nẵng' },
    { code: '68', name: 'Lâm Đồng' },
    { code: '56', name: 'Khánh Hòa' },
    { code: '79', name: 'TP. Hồ Chí Minh' },
    { code: '91', name: 'Kiên Giang' },
    { code: '46', name: 'Thừa Thiên Huế' },
    { code: '10', name: 'Lào Cai' }
];

const DEFAULT_TOURIST_SPOTS = [
    { id: 'spot-1', name_vi: 'Khu du lịch sinh thái Tràng An', province_code: '35', province_name: 'Ninh Bình', max_capacity: 15000 },
    { id: 'spot-2', name_vi: 'Chùa Bái Đính', province_code: '35', province_name: 'Ninh Bình', max_capacity: 25000 },
    { id: 'spot-3', name_vi: 'Tam Cốc - Bích Động', province_code: '35', province_name: 'Ninh Bình', max_capacity: 8000 },
    { id: 'spot-4', name_vi: 'Vịnh Hạ Long', province_code: '22', province_name: 'Quảng Ninh', max_capacity: 30000 },
    { id: 'spot-5', name_vi: 'Phố cổ Hội An', province_code: '48', province_name: 'Quảng Nam', max_capacity: 12000 },
    { id: 'spot-6', name_vi: 'Bà Nà Hills', province_code: '48', province_name: 'Đà Nẵng', max_capacity: 20000 },
    { id: 'spot-7', name_vi: 'Khu du lịch Thung lũng Tình Yêu', province_code: '68', province_name: 'Lâm Đồng', max_capacity: 10000 },
    { id: 'spot-8', name_vi: 'Chợ Bến Thành', province_code: '79', province_name: 'TP. Hồ Chí Minh', max_capacity: 15000 },
    { id: 'spot-9', name_vi: 'Đảo Phú Quốc', province_code: '91', province_name: 'Kiên Giang', max_capacity: 50000 },
    { id: 'spot-10', name_vi: 'Đỉnh Phan-xi-păng (Sa Pa)', province_code: '10', province_name: 'Lào Cai', max_capacity: 6000 }
];

const DEFAULT_CONSERVATION_AREAS = [
    { id: 'cons-1', name_vi: 'Vườn quốc gia Cúc Phương', province_code: '35', province_name: 'Ninh Bình' },
    { id: 'cons-2', name_vi: 'Vườn quốc gia Phong Nha - Kẻ Bàng', province_code: '44', province_name: 'Quảng Bình' },
    { id: 'cons-3', name_vi: 'Vườn quốc gia Cát Bà', province_code: '31', province_name: 'Hải Phòng' },
    { id: 'cons-4', name_vi: 'Khu bảo tồn thiên nhiên Vân Long', province_code: '35', province_name: 'Ninh Bình' },
    { id: 'cons-5', name_vi: 'Vườn quốc gia Bạch Mã', province_code: '46', province_name: 'Thừa Thiên Huế' }
];

const DEFAULT_BUSINESSES = [
    { id: 'biz-1', business_name: 'Công ty Cổ phần Du lịch Tràng An Heritage', business_type: 'travel_company', province_code: '35', province_name: 'Ninh Bình', ward_code: '3501', ward_name: 'Trường Yên', owner_name: 'Nguyễn Văn Hùng', status: 'approved', created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
    { id: 'biz-2', business_name: 'Khách sạn Hoàng Cung Ninh Bình', business_type: 'hotel', province_code: '35', province_name: 'Ninh Bình', ward_code: '3502', ward_name: 'Ninh Khánh', owner_name: 'Trần Thị Mai', status: 'approved', created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
    { id: 'biz-3', business_name: 'Nhà Hàng Dê Núi Ninh Bình Premium', business_type: 'service_provider', province_code: '35', province_name: 'Ninh Bình', ward_code: '3503', ward_name: 'Ninh Hải', owner_name: 'Phạm Minh Tuấn', status: 'pending', created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    { id: 'biz-4', business_name: 'Ninh Binh Eco Homestay', business_type: 'hotel', province_code: '35', province_name: 'Ninh Bình', ward_code: '3503', ward_name: 'Ninh Hải', owner_name: 'Lê Hoàng Nam', status: 'pending', created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    { id: 'biz-5', business_name: 'Đại lý Vé Thuyền và Tour Tràng An Xanh', business_type: 'travel_company', province_code: '35', province_name: 'Ninh Bình', ward_code: '3501', ward_name: 'Trường Yên', owner_name: 'Vũ Thị Hồng', status: 'rejected', created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() }
];

const FEEDBACKS_POOL = [
    { title: 'Tắc nghẽn tại bến thuyền du lịch', content: 'Vào ngày cuối tuần lượng khách đổ về quá đông, thời gian chờ thuyền lâu khoảng 1-2 tiếng. Đề xuất mở rộng thêm bến hoặc phân luồng đón khách tốt hơn.', priority: 'high' },
    { title: 'Biển chỉ dẫn tại bãi đỗ xe chưa rõ ràng', content: 'Lối đi nội bộ rất rộng nhưng các biển chỉ dẫn hướng đi xe điện hoặc các điện thờ còn khá ít và khó nhìn cho người cao tuổi.', priority: 'medium' },
    { title: 'Rác thải nhựa tại khu danh thắng', content: 'Dọc dòng sông và lối đi vẫn còn xuất hiện vỏ chai nước và túi nilon trôi nổi do du khách vứt xuống. Cần tăng cường nhắc nhở và lắp thêm thùng rác nổi.', priority: 'high' },
    { title: 'Thái độ phục vụ của nhân viên giữ xe', content: 'Nhân viên bãi đỗ xe bên ngoài khu du lịch có thái độ khá gắt gỏng và thu phí cao hơn quy định niêm yết trong những ngày lễ.', priority: 'medium' },
    { title: 'Hạ tầng nhà vệ sinh công cộng xuống cấp', content: 'Nhà vệ sinh gần khu vực cổng phụ đã lâu không được dọn dẹp, bốc mùi khó chịu và thiếu nước rửa tay nghiêm trọng.', priority: 'high' }
];

// ==================== DYNAMIC DATABASE FETCHERS ====================
async function getActualProvinces() {
    try {
        const { rows } = await query('SELECT code, name FROM vn_units.provinces ORDER BY name ASC');
        if (rows && rows.length > 0) {
            return rows.map(r => ({ code: r.code, name: r.name }));
        }
    } catch (e) {
        console.warn('[GovernanceMock] Provinces query failed (table may not exist yet), using default data.');
    }
    return DEFAULT_PROVINCES;
}

async function getActualSpots() {
    try {
        const { rows } = await query('SELECT id, name_vi, province_code, COALESCE(max_capacity, 10000) AS max_capacity FROM tourism_spots WHERE status = \'active\'');
        if (rows && rows.length > 0) {
            return rows.map(r => ({
                id: r.id,
                name_vi: r.name_vi,
                province_code: r.province_code,
                province_name: '',
                max_capacity: Number(r.max_capacity) || 10000
            }));
        }
    } catch (e) {
        console.warn('[GovernanceMock] Tourist spots query failed, using default data.');
    }
    return DEFAULT_TOURIST_SPOTS;
}

async function getActualBusinesses() {
    try {
        const { rows } = await query(`
            SELECT b.id, b.business_name, b.business_type, b.province_code, b.ward_code, b.status, b.created_at,
                   u.full_name AS owner_name, u.id AS owner_id
            FROM businesses b
            LEFT JOIN users u ON u.id = b.owner_id
        `);
        if (rows && rows.length > 0) {
            return rows.map(r => ({
                id: r.id,
                business_name: r.business_name,
                business_type: r.business_type || 'hotel',
                province_code: r.province_code,
                province_name: '',
                ward_code: r.ward_code,
                ward_name: 'Phường/Xã',
                owner_id: r.owner_id,
                owner_name: r.owner_name || 'Nguyễn Văn A',
                status: r.status || 'approved',
                created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
            }));
        }
    } catch (e) {
        console.warn('[GovernanceMock] Businesses query failed, using default data.');
    }
    return DEFAULT_BUSINESSES;
}

async function getActualConservationAreas() {
    try {
        const { rows } = await query('SELECT id, name_vi, province_code FROM conservation_areas');
        if (rows && rows.length > 0) {
            return rows.map(r => ({
                id: r.id,
                name_vi: r.name_vi,
                province_code: r.province_code,
                province_name: ''
            }));
        }
    } catch (e) {
        // Table may not exist yet
    }
    return DEFAULT_CONSERVATION_AREAS;
}

async function getUnifiedData() {
    const provinces = await getActualProvinces();
    const provinceMap = new Map(provinces.map(p => [p.code, p.name]));

    const rawSpots = await getActualSpots();
    const spots = rawSpots.map(s => ({
        ...s,
        province_name: provinceMap.get(s.province_code) || 'Ninh Bình'
    }));

    const rawBusinesses = await getActualBusinesses();
    const businesses = rawBusinesses.map(b => ({
        ...b,
        province_name: provinceMap.get(b.province_code) || 'Ninh Bình'
    }));

    const rawConservation = await getActualConservationAreas();
    const conservationAreas = rawConservation.map(c => ({
        ...c,
        province_name: provinceMap.get(c.province_code) || 'Ninh Bình'
    }));

    return { provinces, spots, businesses, conservationAreas };
}

class GovernanceMock {
    // ==================== BỘ VH-TT&DL ====================
    static async getMinistryOverview(query) {
        const fromDate = query.from_date || new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
        const toDate = query.to_date || new Date().toISOString();

        const { provinces } = await getUnifiedData();

        // 1. Provinces reports based on DB records
        const provinceReports = provinces.map((prov) => {
            const spot_count = randomInt(3, 15);
            const service_unit_count = randomInt(5, 45);
            const new_business_count = randomInt(0, 8);
            const reported_revenue_vnd = randomInt(200, 3000) * 1000000;
            return {
                province_code: prov.code,
                province_name: prov.name,
                spot_count,
                service_unit_count,
                new_business_count,
                reported_revenue_vnd
            };
        }).sort((a, b) => b.reported_revenue_vnd - a.reported_revenue_vnd);

        // 2. Aggregate
        const aggregate = provinceReports.reduce(
            (acc, row) => {
                acc.total_spots += row.spot_count;
                acc.total_service_units += row.service_unit_count;
                acc.new_businesses += row.new_business_count;
                acc.reported_revenue_vnd += row.reported_revenue_vnd;
                return acc;
            },
            { total_spots: 0, total_service_units: 0, new_businesses: 0, reported_revenue_vnd: 0 }
        );

        // 3. Alerts
        const overload_alerts = await this.getMinistryCapacityAlerts({ limit: 5 });

        // 4. Conservation
        const conservation_monitoring = await this.getMinistryConservationSummary({ days: 30 });

        return {
            period: { fromDate, toDate },
            aggregate,
            provinces: provinceReports,
            overload_alerts,
            conservation_monitoring
        };
    }

    static async getMinistryCapacityAlerts(query) {
        const limit = Math.min(Number(query.limit) || 10, 20);
        const { spots } = await getUnifiedData();

        const filteredSpots = query.province_code
            ? spots.filter(s => s.province_code === query.province_code)
            : spots;

        const items = filteredSpots.map((spot, idx) => {
            const capacity_pct = idx === 0 ? randomFloat(100.1, 118.4) : randomFloat(72.0, 99.5);
            const visitor_count = Math.round(spot.max_capacity * (capacity_pct / 100));
            const status = capacity_pct >= 100 ? 'overloaded' : 'near_full';

            return {
                spot_id: spot.id,
                name_vi: spot.name_vi,
                visitor_count,
                capacity_pct,
                status,
                recorded_at: new Date(Date.now() - randomInt(5, 60) * 60000).toISOString(),
                max_capacity: spot.max_capacity,
                province_code: spot.province_code,
                province_name: spot.province_name
            };
        }).sort((a, b) => b.capacity_pct - a.capacity_pct).slice(0, limit);

        return {
            total: items.length,
            items
        };
    }

    static async getMinistryConservationSummary(query) {
        const { conservationAreas } = await getUnifiedData();
        const filteredAreas = query.province_code
            ? conservationAreas.filter(c => c.province_code === query.province_code)
            : conservationAreas;

        const items = filteredAreas.map((area) => {
            const detected_changes = randomInt(0, 3);
            const total_change_area_ha = detected_changes > 0 ? randomFloat(0.8, 12.4) : 0.0;
            return {
                conservation_id: area.id,
                conservation_name: area.name_vi,
                province_name: area.province_name,
                detected_changes,
                total_change_area_ha,
                latest_analyzed_at: new Date(Date.now() - randomInt(1, 10) * 24 * 3600 * 1000).toISOString()
            };
        }).sort((a, b) => b.detected_changes - a.detected_changes);

        return {
            total: items.length,
            items
        };
    }

    // ==================== SỞ VH-TT&DL ====================
    static async getBusinessRegistrations(query) {
        const status = query.status || 'pending';
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Number(query.limit) || 10);

        const { businesses } = await getUnifiedData();

        let filtered = businesses;
        if (status && status !== 'all') {
            filtered = businesses.filter(b => b.status === status);
        }
        if (query.province_code) {
            filtered = filtered.filter(b => b.province_code === query.province_code);
        }

        const total = filtered.length;
        const start = (page - 1) * limit;
        const items = filtered.slice(start, start + limit);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getSpotRegistrations(query) {
        const status = query.status || 'pending';
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Number(query.limit) || 10);

        const { spots } = await getUnifiedData();

        const itemsPool = spots.map((s, idx) => ({
            id: s.id,
            name_vi: s.name_vi,
            province_code: s.province_code,
            province_name: s.province_name,
            ward_code: s.province_code + '01',
            ward_name: 'Phường/Xã ' + (idx + 1),
            category_id: idx % 2 === 0 ? 'cat-cultural' : 'cat-nature',
            category_name: idx % 2 === 0 ? 'Di tích Lịch sử - Văn hóa' : 'Danh lam Thắng cảnh',
            created_by: randomUUID(),
            created_by_name: 'Cán bộ quản lý',
            status: idx % 3 === 0 ? 'pending' : (idx % 3 === 1 ? 'approved' : 'rejected'),
            created_at: new Date(Date.now() - idx * 2 * 24 * 3600 * 1000).toISOString()
        }));

        let filtered = itemsPool;
        if (status && status !== 'all') {
            filtered = itemsPool.filter(s => s.status === status);
        }
        if (query.province_code) {
            filtered = filtered.filter(s => s.province_code === query.province_code);
        }

        const total = filtered.length;
        const start = (page - 1) * limit;
        const items = filtered.slice(start, start + limit);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getDepartmentFeedbacks(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Number(query.limit) || 10);
        const priority = query.priority;
        const status = query.status;

        const { spots } = await getUnifiedData();

        let itemsPool = FEEDBACKS_POOL.map((f, idx) => {
            const spot = spots[idx % spots.length];
            return {
                id: `fb-dept-${idx + 1}`,
                user_id: randomUUID(),
                user_name: randomElem(['Phạm Sơn Tùng', 'Nguyễn Bích Ngọc', 'Vũ Anh Tuấn', 'Lê Khánh Linh']),
                user_avatar: null,
                title: `${f.title} tại ${spot.name_vi}`,
                content: f.content,
                location_text: `${spot.name_vi}, ${spot.province_name}`,
                priority: f.priority,
                status: idx % 2 === 0 ? 'resolved' : 'pending',
                moderation_status: 'approved',
                created_at: new Date(Date.now() - idx * 2 * 24 * 3600 * 1000).toISOString()
            };
        });

        if (priority) {
            itemsPool = itemsPool.filter(f => f.priority === priority);
        }
        if (status) {
            itemsPool = itemsPool.filter(f => f.status === status);
        }

        const total = itemsPool.length;
        const start = (page - 1) * limit;
        const items = itemsPool.slice(start, start + limit);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async listDepartmentReports(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Number(query.limit) || 10);
        const { provinces } = await getUnifiedData();

        const itemsPool = Array.from({ length: 8 }).map((_, idx) => {
            const reportMonth = 5 - idx > 0 ? 5 - idx : 12 + (5 - idx);
            const year = 5 - idx > 0 ? 2026 : 2025;
            const prov = provinces[idx % provinces.length];
            return {
                id: `report-dept-${idx + 1}`,
                schedule_id: randomUUID(),
                created_by: randomUUID(),
                created_by_name: `Sở Du lịch tỉnh/thành ${prov.name}`,
                report_type: 'monthly',
                period_from: `${year}-${String(reportMonth).padStart(2, '0')}-01`,
                period_to: `${year}-${String(reportMonth).padStart(2, '0')}-28`,
                title: `Báo cáo tình hình du lịch tháng ${reportMonth}/${year} — ${prov.name}`,
                file_url: `https://storage.dulichninhbinh.vn/reports/thang-${reportMonth}-${year}.pdf`,
                file_format: 'pdf',
                file_size_kb: randomInt(1100, 2900),
                sent_to_roles: [2, 3],
                generated_at: new Date(year, reportMonth - 1, 28, 17, 0, 0).toISOString()
            };
        });

        const total = itemsPool.length;
        const start = (page - 1) * limit;
        const items = itemsPool.slice(start, start + limit);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // ==================== DOANH NGHIỆP ====================
    static async listBusinessActivityReports(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Number(query.limit) || 10);

        const { businesses } = await getUnifiedData();
        const bizId = query.business_id || (businesses[0] ? businesses[0].id : 'business-1');
        const biz = businesses.find(b => b.id === bizId) || businesses[0] || { business_name: 'Doanh nghiệp Dịch vụ Du lịch' };

        const itemsPool = Array.from({ length: 6 }).map((_, idx) => {
            const reportMonth = 5 - idx > 0 ? 5 - idx : 12;
            const year = 5 - idx > 0 ? 2026 : 2025;
            return {
                id: `act-rep-${idx + 1}`,
                business_id: bizId,
                business_name: biz.business_name,
                report_period: 'month',
                period_from: `${year}-${String(reportMonth).padStart(2, '0')}-01`,
                period_to: `${year}-${String(reportMonth).padStart(2, '0')}-28`,
                total_revenue_vnd: randomInt(100, 500) * 1000000,
                total_bookings: randomInt(50, 250),
                total_visitors: randomInt(200, 1000),
                avg_capacity_pct: randomFloat(60.0, 90.0),
                notes: `Báo cáo hoạt động tự động cho doanh nghiệp ${biz.business_name} trong tháng ${reportMonth}/${year}`,
                status: idx === 0 ? 'submitted' : 'approved',
                created_at: new Date(year, reportMonth - 1, 28, 18, 0, 0).toISOString()
            };
        });

        const total = itemsPool.length;
        const start = (page - 1) * limit;
        const items = itemsPool.slice(start, start + limit);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getBusinessDashboard(businessId, query) {
        const periodType = query.period || 'month';
        const year = Number(query.year) || 2026;

        const { businesses, spots } = await getUnifiedData();

        const bizInfo = businesses.find(b => b.id === businessId) || businesses[0] || {
            id: businessId,
            business_name: 'Doanh nghiệp Premium',
            business_type: 'hotel',
            province_code: '35',
            province_name: 'Ninh Bình',
            ward_code: '3501',
            ward_name: 'Trường Yên',
            owner_name: 'Nguyễn Văn Minh',
            status: 'approved',
            created_at: new Date().toISOString()
        };

        // Resolve variant theo business_type (mock không có user) hoặc override hợp lệ.
        const variant = DashboardResolver.resolveVariant({}, bizInfo, query.variant);

        const period = {
            type: periodType,
            year,
            from: `${year}-01-01`,
            to: `${year}-05-28`
        };

        const reported_metrics = {
            total_revenue_vnd: randomInt(1200, 3600) * 1000000,
            total_bookings: randomInt(800, 1800),
            total_visitors: randomInt(3000, 8000),
            avg_capacity_pct: randomFloat(70.0, 92.4),
            report_count: 5,
            source: 'business_activity_reports',
            note: 'Số liệu doanh nghiệp tự báo cáo (dữ liệu mô phỏng).'
        };

        const monthlyTrend = (mapper) => [1, 2, 3, 4, 5].map(m => mapper(`${year}-${String(m).padStart(2, '0')}`));

        // Các spot cùng tỉnh để mô phỏng highlight.
        const provinceSpots = spots.filter(s => s.province_code === bizInfo.province_code);
        const activeSpots = provinceSpots.length > 0 ? provinceSpots : spots;

        const base = { variant, period, business: bizInfo, reported_metrics };

        if (variant === 'spot_operator') {
            const highlights = activeSpots.slice(0, 5).map((spot, idx) => {
                const capacity_pct = idx === 0 ? randomFloat(90.1, 98.4) : randomFloat(40.0, 85.0);
                return {
                    spot_id: spot.id,
                    name_vi: spot.name_vi,
                    visitor_count: Math.round(spot.max_capacity * (capacity_pct / 100)),
                    capacity_pct,
                    status: capacity_pct >= 100 ? 'overloaded' : (capacity_pct >= 85 ? 'near_full' : 'normal'),
                    recorded_at: new Date(Date.now() - idx * 30 * 60000).toISOString()
                };
            });
            return {
                ...base,
                summary: {
                    managed_spot_count: activeSpots.length,
                    current_visitors: randomInt(2000, 9000),
                    avg_capacity_pct: randomFloat(60.0, 88.0),
                    peak_capacity_pct: randomFloat(90.0, 99.0),
                    capacity_alert_count: randomInt(0, 3),
                    spot_rating_avg: randomFloat(3.8, 4.9),
                    spot_rating_count: randomInt(50, 500),
                    ticket_price_range: { min: 50000, max: 250000 },
                    experience_features: { vr360: randomInt(0, 3), ar: randomInt(0, 2), audio: randomInt(0, 4) }
                },
                trend: monthlyTrend(period => ({ period, visits: randomInt(500, 2500) })),
                highlights
            };
        }

        if (variant === 'travel_company') {
            const highlights = Array.from({ length: 5 }).map((_, idx) => ({
                id: `tour-${idx + 1}`,
                name_vi: `Tour khám phá Ninh Bình ${idx + 1} ngày`,
                rating_avg: randomFloat(3.9, 5.0),
                rating_count: randomInt(10, 200),
                price_from_vnd: randomInt(8, 40) * 100000,
                status: 'published',
                is_featured: idx === 0
            }));
            return {
                ...base,
                summary: {
                    tour_count: randomInt(8, 30),
                    active_tour_count: randomInt(5, 20),
                    featured_tour_count: randomInt(1, 5),
                    avg_tour_price_vnd: randomInt(15, 35) * 100000,
                    total_listed_capacity: randomInt(200, 1200),
                    avg_tour_duration_days: randomFloat(1.5, 5.0),
                    tour_rating_avg: randomFloat(4.0, 4.9),
                    tour_rating_count: randomInt(50, 600),
                    reported_bookings: randomInt(400, 1500),
                    reported_revenue_vnd: randomInt(800, 2800) * 1000000
                },
                trend: monthlyTrend(period => ({
                    period,
                    revenue_vnd: randomInt(200, 700) * 1000000,
                    bookings: randomInt(80, 400),
                    visitors: randomInt(300, 1500)
                })),
                highlights
            };
        }

        // service_provider (mặc định)
        return {
            ...base,
            summary: {
                service_count: randomInt(5, 40),
                active_service_count: randomInt(3, 30),
                service_category_breakdown: [
                    { category: 'accommodation', count: randomInt(1, 10) },
                    { category: 'food', count: randomInt(1, 12) },
                    { category: 'transport', count: randomInt(0, 6) }
                ],
                service_price_range: { min: 50000, max: 2500000 },
                voucher_count: randomInt(2, 15),
                active_voucher_count: randomInt(1, 10),
                voucher_used_count: randomInt(10, 400),
                voucher_redemption_rate: randomFloat(5.0, 75.0),
                ocop_count: randomInt(0, 12),
                active_ocop_count: randomInt(0, 8),
                avg_ocop_stars: randomFloat(3.0, 5.0),
                business_rating_avg: randomFloat(3.7, 4.9),
                business_rating_count: randomInt(20, 350),
                reported_revenue_vnd: randomInt(600, 2200) * 1000000
            },
            trend: monthlyTrend(period => ({
                period,
                revenue_vnd: randomInt(150, 600) * 1000000,
                bookings: randomInt(60, 350),
                visitors: randomInt(250, 1300)
            }))
        };
    }

    static async getEnterpriseFeedbacks(businessId, query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Number(query.limit) || 10);
        const radius_km = Number(query.radius_km) || 20;

        const { businesses, spots } = await getUnifiedData();
        const biz = businesses.find(b => b.id === businessId) || businesses[0] || { business_name: 'Doanh nghiệp Dịch vụ' };

        const itemsPool = FEEDBACKS_POOL.map((f, idx) => {
            const spot = spots[idx % spots.length];
            return {
                id: `fb-ent-${idx + 1}`,
                user_id: randomUUID(),
                user_name: randomElem(['Phan Hoàng Hải', 'Lê Khánh Vy', 'Trần Hùng Cường']),
                user_avatar: null,
                title: `${f.title} gần ${biz.business_name}`,
                content: `${f.content} Tình trạng này nằm gần khu vực của doanh nghiệp chúng tôi.`,
                location_text: `${spot.name_vi}, ${spot.province_name}`,
                priority: f.priority,
                status: 'pending',
                moderation_status: 'approved',
                created_at: new Date(Date.now() - idx * 24 * 3600 * 1000).toISOString()
            };
        });

        const total = itemsPool.length;
        const start = (page - 1) * limit;
        const items = itemsPool.slice(start, start + limit);

        return {
            business_id: businessId,
            radius_km,
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // ==================== QUẢN TRỊ HỆ THỐNG ====================
    static async getAdminDashboard() {
        // Query users count from DB if tables exist
        let totalUsers = 1458;
        let activeUsers = 1392;
        let totalNews = 124;

        try {
            const userRes = await query('SELECT COUNT(*) AS c FROM users');
            totalUsers = Number(userRes.rows[0].c) || totalUsers;
            const activeUserRes = await query('SELECT COUNT(*) AS c FROM users WHERE is_active = TRUE');
            activeUsers = Number(activeUserRes.rows[0].c) || activeUsers;
            const newsRes = await query('SELECT COUNT(*) AS c FROM news');
            totalNews = Number(newsRes.rows[0].c) || totalNews;
        } catch (e) {
            // Gracefully ignore and use static realistic numbers
        }

        return {
            total_users: totalUsers,
            active_users: activeUsers,
            total_news: totalNews,
            total_map_categories: 8,
            total_map_layers: 24,
            total_map_apis: 6,
            total_permissions: 64,
            audit_logs_in_range: 2840,
            visits_in_range: 24500,
            total_cuisine_items: 45,
            total_festivals: 18,
            total_ocop_products: 72
        };
    }

    static async getTrafficAnalytics(query) {
        const days = Number(query.days) || 30;
        const groupBy = query.group_by || 'day';

        const total_visits = randomInt(18000, 35000);
        const unique_visitors = Math.round(total_visits * 0.72);
        const avg_duration_seconds = randomInt(120, 240);
        const bounce_rate_pct = randomFloat(35.2, 48.5);

        const timeline = [];
        const now = new Date();

        if (groupBy === 'day') {
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
                const period = d.toISOString().slice(0, 10);
                timeline.push({
                    period,
                    visits: randomInt(400, 1200),
                    unique_visitors: randomInt(300, 900)
                });
            }
        } else if (groupBy === 'week') {
            const weeks = Math.ceil(days / 7);
            for (let i = weeks - 1; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
                const year = d.getFullYear();
                const weekNum = Math.floor(d.getDate() / 7) + 1;
                const period = `${year}-W${String(weekNum).padStart(2, '0')}`;
                timeline.push({
                    period,
                    visits: randomInt(2800, 8400),
                    unique_visitors: randomInt(2000, 6000)
                });
            }
        } else {
            const months = Math.ceil(days / 30);
            for (let i = months - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                timeline.push({
                    period,
                    visits: randomInt(12000, 36000),
                    unique_visitors: randomInt(9000, 27000)
                });
            }
        }

        return {
            total_visits,
            unique_visitors,
            avg_duration_seconds,
            bounce_rate_pct,
            timeline
        };
    }
}

module.exports = GovernanceMock;
