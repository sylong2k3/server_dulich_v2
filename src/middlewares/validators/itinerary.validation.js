const Joi = require('joi');
const {
    uuid,
    uuidParam,
    numericId,
    latField,
    lngField,
    paginationQuery,
    sortQuery,
    makeOptional,
} = require('./common/base-schemas');
const { ITINERARY_STATUS, LIMITS } = require('./common/constants');
const msg = require('./common/messages');

// Itinerary chỉ chấp nhận create với 'draft' / 'published' (không có 'archived')
const ITINERARY_CREATE_STATUS = ['draft', 'published'];

// ── Params ───────────────────────────────────────────────────────────────────

const idParamSchema = uuidParam('id');

const dayIdParamSchema = Joi.object({
    id: uuid().required().messages(msg.id('ID lịch trình', 'uuid')),
    dayId: numericId().required().messages(msg.id('ID ngày')),
});

const stopIdParamSchema = Joi.object({
    id: uuid().required().messages(msg.id('ID lịch trình', 'uuid')),
    stopId: uuid().required().messages(msg.id('ID điểm dừng', 'uuid')),
});

// ── Query ────────────────────────────────────────────────────────────────────

const itineraryQuerySchema = Joi.object({
    ...paginationQuery({ maxLimit: 50 }),
    ...sortQuery(
        ['created_at', 'updated_at', 'start_date', 'title'],
        { defaultSortBy: 'updated_at' }
    ),
    status: Joi.string().valid(...ITINERARY_STATUS).optional(),
});

// ── Itinerary body ───────────────────────────────────────────────────────────

const itineraryBaseFields = {
    title: Joi.string().trim().min(3).max(LIMITS.NAME_MAX),
    description: Joi.string().trim().allow('', null),
    start_date: Joi.date().iso().allow(null),
    end_date: Joi.date().iso().allow(null),
    budget_vnd: Joi.number().min(0).allow(null),
    is_public: Joi.boolean(),
    status: Joi.string().valid(...ITINERARY_STATUS),
};

const createItinerarySchema = Joi.object({
    ...itineraryBaseFields,
    title: itineraryBaseFields.title.required().messages({
        'string.empty': msg.empty('Tiêu đề'),
        'string.min': msg.min('Tiêu đề', 3),
        'string.max': msg.max('Tiêu đề', LIMITS.NAME_MAX),
        'any.required': msg.required('Tiêu đề'),
    }),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).optional().allow(null),
    is_public: itineraryBaseFields.is_public.default(false),
    // Create chỉ cho 'draft' / 'published'
    status: Joi.string().valid(...ITINERARY_CREATE_STATUS).default('draft'),
});

const updateItinerarySchema = makeOptional(Joi.object(itineraryBaseFields));

// ── Day body ─────────────────────────────────────────────────────────────────

const dayBaseFields = {
    day_number: Joi.number().integer().min(1),
    title: Joi.string().trim().max(LIMITS.NAME_MAX).allow('', null),
    date_actual: Joi.date().iso().allow(null),
    notes: Joi.string().trim().allow('', null),
};

const createDaySchema = Joi.object({
    ...dayBaseFields,
    day_number: dayBaseFields.day_number.required().messages({
        'number.base': msg.numberBase('Số ngày'),
        'number.integer': msg.integer('Số ngày'),
        'number.min': msg.numMin('Số ngày', 1),
        'any.required': msg.required('Số ngày'),
    }),
});

const updateDaySchema = makeOptional(Joi.object(dayBaseFields));

// ── Stop body ────────────────────────────────────────────────────────────────

const stopBaseFields = {
    spot_id: uuid().allow(null),
    business_id: uuid().allow(null),
    custom_name: Joi.string().trim().max(LIMITS.NAME_MAX).allow('', null),
    sort_order: Joi.number().integer().min(1),
    planned_arrival: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null),
    planned_duration_min: Joi.number().integer().min(1).allow(null),
    notes: Joi.string().trim().allow('', null),
    lng: lngField(),
    lat: latField(),
};

const createStopSchema = Joi.object({
    ...stopBaseFields,
    sort_order: stopBaseFields.sort_order.required().messages({
        'number.base': msg.numberBase('Thứ tự'),
        'number.integer': msg.integer('Thứ tự'),
        'number.min': msg.numMin('Thứ tự', 1),
        'any.required': msg.required('Thứ tự'),
    }),
});

const updateStopSchema = makeOptional(Joi.object({
    ...stopBaseFields,
    is_completed: Joi.boolean(),
}));

// ── AI generate ──────────────────────────────────────────────────────────────

const aiGenerateSchema = Joi.object({
    num_days: Joi.number().integer().min(1).max(14).required(),
    preferences: Joi.array().items(Joi.string().trim().max(50)).max(10).default([]),
    budget_vnd: Joi.number().min(0).optional().allow(null),
    start_location: Joi.string().trim().max(LIMITS.NAME_MAX).optional().allow('', null),
    language: Joi.string().valid('vi', 'en').default('vi'),
});

module.exports = {
    idParamSchema,
    dayIdParamSchema,
    stopIdParamSchema,
    itineraryQuerySchema,
    createItinerarySchema,
    updateItinerarySchema,
    createDaySchema,
    updateDaySchema,
    createStopSchema,
    updateStopSchema,
    aiGenerateSchema,
};
