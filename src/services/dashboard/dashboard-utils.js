/**
 * Tiện ích dùng chung cho các dashboard provider.
 */

/**
 * Chuẩn hoá về số hữu hạn ≥ 0; mọi giá trị null/undefined/NaN/âm → 0.
 * Dùng cho MỌI field số trong `summary` để đảm bảo Property 7 (số mặc định an toàn).
 * @param {*} value
 * @returns {number}
 */
function toNonNegativeNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
        return 0;
    }
    return n;
}

/**
 * Chuẩn hoá về số hữu hạn (cho phép null) — dùng cho min/max giá có thể không tồn tại.
 * @param {*} value
 * @returns {number|null}
 */
function toNullableNumber(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * Bọc một promise truy vấn: nếu lỗi runtime, log cảnh báo và trả về `fallback`
 * thay vì làm sập toàn bộ dashboard (Requirement 4.4 — theo tiền lệ getConservationMonitoring).
 * @template T
 * @param {string} label
 * @param {Promise<T>} promise
 * @param {T} fallback
 * @returns {Promise<T>}
 */
async function safeQuery(label, promise, fallback) {
    try {
        return await promise;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[DashboardProvider] ${label} skipped:`, err.message);
        return fallback;
    }
}

/**
 * Tính tỉ lệ sử dụng voucher an toàn (tránh chia 0). Kết quả % làm tròn 2 chữ số,
 * luôn là số hữu hạn ≥ 0.
 * @param {number} used
 * @param {number} max
 * @returns {number}
 */
function safeRedemptionRate(used, max) {
    const u = toNonNegativeNumber(used);
    const m = toNonNegativeNumber(max);
    if (m <= 0) {
        return 0;
    }
    return Math.round((u / m) * 10000) / 100;
}

module.exports = {
    toNonNegativeNumber,
    toNullableNumber,
    safeQuery,
    safeRedemptionRate,
};
