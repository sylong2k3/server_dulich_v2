const Joi = require('joi');
const patterns = require('./patterns');
const msg = require('./messages');
const {
    LIMITS,
    PAGINATION,
    SORT_ORDER,
} = require('./constants');

const applyOptional = (schema, { required = false, allowEmpty = true, allowNull = true } = {}) => {
    let s = required ? schema.required() : schema.optional();
    const allowed = [];
    if (allowEmpty && !required) allowed.push('');
    if (allowNull) allowed.push(null);
    if (allowed.length) s = s.allow(...allowed);
    return s;
};

const uuid = () => Joi.string().guid({ version: ['uuidv4'] });

const uuidParam = (fieldName = 'id') => Joi.object({
    [fieldName]: uuid().required().messages(msg.id(fieldName, 'uuid')),
});

const numericId = () => Joi.number().integer().positive();

const numericIdParam = (fieldName = 'id') => Joi.object({
    [fieldName]: numericId().required().messages(msg.id(fieldName, 'number')),
});

const emailField = ({ required = true, max = LIMITS.EMAIL_MAX } = {}) => {
    const base = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(max);
    return applyOptional(base, { required, allowEmpty: !required, allowNull: !required })
        .messages(msg.email());
};

const phoneField = ({ required = false } = {}) => {
    const base = Joi.string().trim().pattern(patterns.phone).max(LIMITS.PHONE_MAX);
    return applyOptional(base, { required, allowEmpty: !required, allowNull: !required })
        .messages(msg.phone());
};

const passwordField = ({ required = true } = {}) => {
    const base = Joi.string()
        .min(LIMITS.PASSWORD_MIN)
        .max(LIMITS.PASSWORD_MAX)
        .pattern(patterns.password);
    return (required ? base.required() : base.optional()).messages(msg.password());
};

const slugPattern = /^[a-z0-9-]+$/;

const slugField = ({ required = false, min = LIMITS.SLUG_MIN, max = LIMITS.SLUG_MAX } = {}) => {
    const base = Joi.string().trim().min(min).max(max).pattern(slugPattern);
    return (required ? base.required() : base.optional()).messages(msg.slug());
};
const latField = ({ required = false } = {}) => {
    const base = Joi.number().min(-90).max(90);
    return applyOptional(base, { required, allowEmpty: false, allowNull: !required })
        .messages(msg.lat());
};

const lngField = ({ required = false } = {}) => {
    const base = Joi.number().min(-180).max(180);
    return applyOptional(base, { required, allowEmpty: false, allowNull: !required })
        .messages(msg.lng());
};

const provinceCodeField = ({ required = false, max = LIMITS.PROVINCE_CODE_MAX } = {}) => {
    const base = Joi.string().trim().max(max);
    return applyOptional(base, { required, allowEmpty: !required, allowNull: !required });
};

const paginationQuery = ({
    defaultLimit = PAGINATION.DEFAULT_LIMIT,
    maxLimit = PAGINATION.MAX_LIMIT,
} = {}) => ({
    page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
    limit: Joi.number().integer().min(PAGINATION.MIN_LIMIT).max(maxLimit).default(defaultLimit),
});

const sortQuery = (allowedSortBy = [], { defaultSortBy, defaultSortOrder = 'DESC' } = {}) => {
    const sortBySchema = allowedSortBy.length
        ? Joi.string().valid(...allowedSortBy)
        : Joi.string();
    return {
        sortBy: defaultSortBy ? sortBySchema.default(defaultSortBy) : sortBySchema.optional(),
        sortOrder: Joi.string().uppercase().valid(...SORT_ORDER).default(defaultSortOrder),
    };
};

const makeOptional = (schema) => {
    const keys = Object.keys(schema.describe().keys || {});
    return schema.fork(keys, (s) => s.optional()).min(1);
};

module.exports = {
    // UUID
    uuid,
    uuidParam,

    // Numeric ID
    numericId,
    numericIdParam,

    // Strings
    emailField,
    phoneField,
    passwordField,
    slugField,
    slugPattern,

    // Geography
    latField,
    lngField,
    provinceCodeField,

    // Query helpers
    paginationQuery,
    sortQuery,

    // Schema helpers
    makeOptional,
};
