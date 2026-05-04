/**
 * Hằng số dùng chung cho validators.
 * Khi cần thay đổi giá trị status/enum, sửa ở đây thay vì rải rác từng file.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Status enums
// ──────────────────────────────────────────────────────────────────────────────

const SPOT_STATUS = ['active', 'inactive', 'pending'];
const TOUR_STATUS = ['draft', 'published', 'archived'];
const ITINERARY_STATUS = ['draft', 'published', 'archived'];
const VLOG_STATUS = ['pending', 'published', 'rejected', 'draft'];
const VLOG_MODERATE_STATUS = ['published', 'rejected'];
const NEWS_STATUS = ['draft', 'published', 'archived'];
const RATING_STATUS = ['published', 'hidden', 'pending'];
const BUSINESS_STATUS = ['pending', 'approved', 'rejected', 'suspended'];
const DOCUMENT_STATUS = ['active', 'archived', 'revoked', 'replaced'];
const MAP_LAYER_STATUS = ['draft', 'published'];
const MAP_RESOURCE_STATUS = ['active', 'inactive'];
const API_KEY_STATUS = ['active', 'revoked', 'expired'];
const NOTIFICATION_DELIVERY_STATUS = ['pending', 'sent', 'failed'];
const FEEDBACK_STATUS = ['pending', 'in_progress', 'resolved', 'closed'];
const FEEDBACK_MODERATION_STATUS = ['pending', 'approved', 'rejected'];

// ──────────────────────────────────────────────────────────────────────────────
// Type enums
// ──────────────────────────────────────────────────────────────────────────────

const MEDIA_TYPE = ['image', 'video', 'audio_guide', 'vr_360', 'panorama'];
const BUSINESS_TYPE = ['tour', 'hotel', 'restaurant', 'transport', 'entertainment', 'other'];
const SEARCH_TYPE = ['spots', 'businesses', 'vlogs', 'cuisine', 'festivals', 'ocop', 'users'];
const VLOG_PLATFORM = ['web', 'mobile', 'youtube', 'tiktok'];

// ──────────────────────────────────────────────────────────────────────────────
// Sort & Pagination
// ──────────────────────────────────────────────────────────────────────────────

const SORT_ORDER = ['ASC', 'DESC'];

const PAGINATION = Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MIN_LIMIT: 1,
    MAX_LIMIT: 100,
});

// ──────────────────────────────────────────────────────────────────────────────
// Field length limits
// ──────────────────────────────────────────────────────────────────────────────

const LIMITS = Object.freeze({
    EMAIL_MAX: 255,
    PHONE_MAX: 20,
    SLUG_MIN: 3,
    SLUG_MAX: 300,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 128,
    NAME_MIN: 2,
    NAME_MAX: 255,
    SHORT_TEXT_MAX: 500,
    PROVINCE_CODE_MAX: 20,
    SEARCH_QUERY_MAX: 200,
});

module.exports = {
    // Status
    SPOT_STATUS,
    TOUR_STATUS,
    ITINERARY_STATUS,
    VLOG_STATUS,
    VLOG_MODERATE_STATUS,
    NEWS_STATUS,
    RATING_STATUS,
    BUSINESS_STATUS,
    DOCUMENT_STATUS,
    MAP_LAYER_STATUS,
    MAP_RESOURCE_STATUS,
    API_KEY_STATUS,
    NOTIFICATION_DELIVERY_STATUS,
    FEEDBACK_STATUS,
    FEEDBACK_MODERATION_STATUS,

    // Types
    MEDIA_TYPE,
    BUSINESS_TYPE,
    SEARCH_TYPE,
    VLOG_PLATFORM,

    // Sort & Pagination
    SORT_ORDER,
    PAGINATION,

    // Limits
    LIMITS,
};
