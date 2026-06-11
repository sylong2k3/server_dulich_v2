/**
 * DashboardResolver — Strategy pattern entrypoint.
 *
 * Ánh xạ (người dùng + doanh nghiệp) → một "dashboard variant" hợp lệ và provider
 * tương ứng. Hàm `resolveVariant` là HÀM THUẦN (pure): không side-effect, không truy vấn DB.
 *
 * Quy tắc resolve (theo design.md):
 *   1. Nếu role.code của người gọi ∈ ENTERPRISE_CODES → dùng chính role.code đó.
 *   2. Ngược lại, nếu người gọi là admin và có `override` hợp lệ → dùng override.
 *   3. Ngược lại suy ra từ business.business_type theo bảng ánh xạ.
 *   4. Mọi trường hợp không khớp → mặc định an toàn `service_provider`.
 */

const VARIANTS = {
    SPOT_OPERATOR: 'spot_operator',
    TRAVEL_COMPANY: 'travel_company',
    SERVICE_PROVIDER: 'service_provider',
};

const VALID_VARIANTS = Object.freeze([
    VARIANTS.SPOT_OPERATOR,
    VARIANTS.TRAVEL_COMPANY,
    VARIANTS.SERVICE_PROVIDER,
]);

// Đồng bộ với GovernanceService.ENTERPRISE_CODES / ADMIN_CODES.
const ENTERPRISE_CODES = Object.freeze(['spot_operator', 'travel_company', 'service_provider']);
const ADMIN_CODES = Object.freeze(['system_admin']);

const DEFAULT_VARIANT = VARIANTS.SERVICE_PROVIDER;

function lower(value) {
    return String(value || '').toLowerCase();
}

function isAdmin(user) {
    return ADMIN_CODES.includes(lower(user && user.role && user.role.code));
}

function isValidVariant(variant) {
    return VALID_VARIANTS.includes(variant);
}

/**
 * @param {{ role?: { code?: string } }} user
 * @param {{ business_type?: string }} business
 * @param {string} [override] variant ép buộc (chỉ admin)
 * @returns {string} một giá trị thuộc VALID_VARIANTS
 */
function resolveVariant(user, business, override) {
    const code = lower(user && user.role && user.role.code);

    // (1) Ưu tiên tuyệt đối role.code của enterprise user.
    if (ENTERPRISE_CODES.includes(code)) {
        return code;
    }

    // (2) Admin có thể override để kiểm thử / giám sát.
    if (isAdmin(user) && isValidVariant(lower(override))) {
        return lower(override);
    }

    // (3) Suy ra từ business_type.
    const type = lower(business && business.business_type);
    switch (type) {
        case VARIANTS.TRAVEL_COMPANY:
            return VARIANTS.TRAVEL_COMPANY;
        case VARIANTS.SPOT_OPERATOR:
            return VARIANTS.SPOT_OPERATOR;
        default:
            // (4) hotel, restaurant, transport, giá trị lạ, hoặc rỗng.
            return DEFAULT_VARIANT;
    }
}

/**
 * Lấy provider tương ứng với variant. Lazy-require để tránh phụ thuộc vòng.
 * @param {string} variant
 * @returns {{ variant: string, build: (ctx: object) => Promise<object> }}
 */
function getProvider(variant) {
    const resolved = isValidVariant(variant) ? variant : DEFAULT_VARIANT;

    switch (resolved) {
        case VARIANTS.SPOT_OPERATOR:
            return require('./providers/spot-operator.provider');
        case VARIANTS.TRAVEL_COMPANY:
            return require('./providers/travel-company.provider');
        case VARIANTS.SERVICE_PROVIDER:
        default:
            return require('./providers/service-provider.provider');
    }
}

module.exports = {
    VARIANTS,
    VALID_VARIANTS,
    ENTERPRISE_CODES,
    ADMIN_CODES,
    DEFAULT_VARIANT,
    isAdmin,
    isValidVariant,
    resolveVariant,
    getProvider,
};
