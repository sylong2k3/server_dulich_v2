/**
 * Helper sinh message lỗi tiếng Việt nhất quán.
 * Dùng để chuẩn hoá custom messages trong Joi schemas.
 *
 * Ví dụ:
 *   const msg = require('./messages');
 *   Joi.string().email().messages(msg.email('Email'))
 */

const required = (field) => `${field} là bắt buộc`;
const empty = (field) => `${field} không được để trống`;
const min = (field, n) => `${field} phải có ít nhất ${n} ký tự`;
const max = (field, n) => `${field} không được quá ${n} ký tự`;
const pattern = (field) => `${field} không đúng định dạng`;
const invalid = (field) => `${field} không hợp lệ`;
const oneOf = (field, values) => `${field} phải là một trong: ${values.join(', ')}`;
const numberBase = (field) => `${field} phải là một số`;
const integer = (field) => `${field} phải là số nguyên`;
const positive = (field) => `${field} phải là số dương`;
const numMin = (field, n) => `${field} phải từ ${n} trở lên`;
const numMax = (field, n) => `${field} không được quá ${n}`;

// ──────────────────────────────────────────────────────────────────────────────
// Preset bundles cho các loại field phổ biến
// ──────────────────────────────────────────────────────────────────────────────

const email = (field = 'Email') => ({
    'string.base': invalid(field),
    'string.email': invalid(field),
    'string.empty': empty(field),
    'string.max': max(field, 255),
    'any.required': required(field),
});

const password = (field = 'Mật khẩu') => ({
    'string.empty': empty(field),
    'string.min': min(field, 8),
    'string.max': max(field, 128),
    'string.pattern.base': `${field} phải có chữ thường, chữ hoa, số và ký tự đặc biệt`,
    'any.required': required(field),
});

const phone = (field = 'Số điện thoại') => ({
    'string.pattern.base': pattern(field),
    'string.max': max(field, 20),
});

const slug = (field = 'Slug') => ({
    'string.pattern.base': `${field} chỉ được chứa chữ thường, số và dấu gạch ngang`,
    'string.min': min(field, 3),
    'string.max': max(field, 300),
});

const id = (field = 'ID', type = 'number') => type === 'uuid'
    ? {
        'string.base': `${field} phải là chuỗi`,
        'string.guid': `${field} phải là UUID hợp lệ`,
        'any.required': required(field),
    }
    : {
        'number.base': numberBase(field),
        'number.integer': integer(field),
        'number.positive': positive(field),
        'any.required': required(field),
    };

const lat = (field = 'Vĩ độ') => ({
    'number.base': numberBase(field),
    'number.min': numMin(field, -90),
    'number.max': numMax(field, 90),
});

const lng = (field = 'Kinh độ') => ({
    'number.base': numberBase(field),
    'number.min': numMin(field, -180),
    'number.max': numMax(field, 180),
});

module.exports = {
    // Builders
    required,
    empty,
    min,
    max,
    pattern,
    invalid,
    oneOf,
    numberBase,
    integer,
    positive,
    numMin,
    numMax,

    // Presets
    email,
    password,
    phone,
    slug,
    id,
    lat,
    lng,
};
