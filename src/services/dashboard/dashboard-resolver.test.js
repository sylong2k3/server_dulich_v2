'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fc = require('fast-check');

const {
    resolveVariant,
    VALID_VARIANTS,
    ENTERPRISE_CODES,
} = require('./dashboard-resolver');

// Bộ giá trị role/business_type "giống thật" để hệ sinh ngẫu nhiên bao phủ cả khớp lẫn không khớp.
const ROLE_CODES = [
    ...ENTERPRISE_CODES,
    'system_admin',
    'ministry_manager',
    'department_manager',
    'tourist',
    '',
    'UNKNOWN_ROLE',
    'Spot_Operator', // kiểm tra không phân biệt hoa thường
];

const BUSINESS_TYPES = [
    'travel_company',
    'spot_operator',
    'service_provider',
    'hotel',
    'restaurant',
    'transport',
    '',
    null,
    'weird_type',
];

// --- Unit examples (bảng quyết định) ---

test('resolveVariant: role.code enterprise được ưu tiên bất kể business_type', () => {
    for (const code of ENTERPRISE_CODES) {
        const result = resolveVariant(
            { role: { code } },
            { business_type: 'hotel' } // business_type khác hẳn
        );
        assert.equal(result, code);
    }
});

test('resolveVariant: không phân biệt hoa thường cho role.code', () => {
    const result = resolveVariant({ role: { code: 'TRAVEL_COMPANY' } }, { business_type: 'hotel' });
    assert.equal(result, 'travel_company');
});

test('resolveVariant: admin suy ra từ business_type', () => {
    assert.equal(
        resolveVariant({ role: { code: 'system_admin' } }, { business_type: 'travel_company' }),
        'travel_company'
    );
    assert.equal(
        resolveVariant({ role: { code: 'system_admin' } }, { business_type: 'spot_operator' }),
        'spot_operator'
    );
});

test('resolveVariant: business_type không khớp → mặc định service_provider', () => {
    assert.equal(resolveVariant({ role: { code: 'ministry_manager' } }, { business_type: 'hotel' }), 'service_provider');
    assert.equal(resolveVariant({ role: { code: 'tourist' } }, { business_type: 'weird' }), 'service_provider');
    assert.equal(resolveVariant({}, { business_type: null }), 'service_provider');
});

test('resolveVariant: override chỉ cho admin', () => {
    // Admin override hợp lệ → áp dụng
    assert.equal(
        resolveVariant({ role: { code: 'system_admin' } }, { business_type: 'hotel' }, 'travel_company'),
        'travel_company'
    );
    // Non-admin (không phải enterprise) cung cấp override → bị bỏ qua, dùng business_type
    assert.equal(
        resolveVariant({ role: { code: 'ministry_manager' } }, { business_type: 'hotel' }, 'travel_company'),
        'service_provider'
    );
    // Override không hợp lệ → bỏ qua
    assert.equal(
        resolveVariant({ role: { code: 'system_admin' } }, { business_type: 'hotel' }, 'nonsense'),
        'service_provider'
    );
});

// --- Property-based tests ---
// Validates: Requirements 1.1, 1.2, 1.3, 1.4

test('PROPERTY: resolveVariant luôn trả về đúng 1 trong 3 variant hợp lệ', () => {
    fc.assert(
        fc.property(
            fc.constantFrom(...ROLE_CODES),
            fc.constantFrom(...BUSINESS_TYPES),
            fc.option(fc.constantFrom(...VALID_VARIANTS, 'bad_variant'), { nil: undefined }),
            (code, businessType, override) => {
                const result = resolveVariant({ role: { code } }, { business_type: businessType }, override);
                assert.ok(VALID_VARIANTS.includes(result), `variant không hợp lệ: ${result}`);
            }
        )
    );
});

test('PROPERTY: nếu role.code ∈ ENTERPRISE_CODES thì kết quả = role.code', () => {
    fc.assert(
        fc.property(
            fc.constantFrom(...ENTERPRISE_CODES),
            fc.constantFrom(...BUSINESS_TYPES),
            (code, businessType) => {
                const result = resolveVariant({ role: { code } }, { business_type: businessType });
                assert.equal(result, code);
            }
        )
    );
});

test('PROPERTY: input role/business_type không khớp mapping → service_provider', () => {
    const nonMatchingRoles = ['ministry_manager', 'department_manager', 'tourist', '', 'UNKNOWN_ROLE'];
    const nonMatchingTypes = ['hotel', 'restaurant', 'transport', '', null, 'weird_type'];
    fc.assert(
        fc.property(
            fc.constantFrom(...nonMatchingRoles),
            fc.constantFrom(...nonMatchingTypes),
            (code, businessType) => {
                const result = resolveVariant({ role: { code } }, { business_type: businessType });
                assert.equal(result, 'service_provider');
            }
        )
    );
});
