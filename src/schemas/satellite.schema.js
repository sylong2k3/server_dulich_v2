"use strict";

const Joi = require("joi");

// =============================================================================
//  CUSTOM GEOMETRY VALIDATOR
// =============================================================================

const VALID_GEOMETRY_TYPES = [
  "Point",
  "LineString",
  "Polygon",
  "MultiPolygon",
  "MultiPoint",
  "MultiLineString",
];

const validateGeometryObject = (geometry, path = "geometry") => {
  if (!geometry || typeof geometry !== "object") {
    return { error: `${path} phải là object` };
  }

  const { type, coordinates } = geometry;

  if (!type || !VALID_GEOMETRY_TYPES.includes(type)) {
    return { error: `${path}.type phải là một trong: ${VALID_GEOMETRY_TYPES.join(", ")}` };
  }

  if (!coordinates) {
    return { error: `${path} phải có coordinates` };
  }

  if (Array.isArray(coordinates) && coordinates.length === 0) {
    return { error: `${path}.coordinates không được trống` };
  }

  if (type === "Polygon" && Array.isArray(coordinates)) {
    if (coordinates.length === 0) {
      return { error: `${path} phải có ít nhất 1 ring` };
    }
    if (!Array.isArray(coordinates[0]) || coordinates[0].length < 4) {
      return { error: `${path} ring phải có ít nhất 4 điểm` };
    }
  }

  if (type === "MultiPolygon" && Array.isArray(coordinates) && coordinates.length === 0) {
    return { error: `${path} phải có ít nhất 1 polygon` };
  }

  return { error: null };
};

const validateGeometryShape = (geometry) => {
  if (!geometry || typeof geometry !== "object") {
    return { error: "Geometry phải là object" };
  }

  if (geometry.type === "FeatureCollection") {
    if (!Array.isArray(geometry.features) || geometry.features.length === 0) {
      return { error: "FeatureCollection phải có features và không được rỗng" };
    }

    for (let i = 0; i < geometry.features.length; i += 1) {
      const feature = geometry.features[i];
      if (!feature || feature.type !== "Feature") {
        return { error: `features[${i}] phải là GeoJSON Feature` };
      }

      const geoValidation = validateGeometryObject(feature.geometry, `features[${i}].geometry`);
      if (geoValidation.error) {
        return geoValidation;
      }
    }

    return { error: null };
  }

  if (geometry.type === "Feature") {
    return validateGeometryObject(geometry.geometry, "geometry.geometry");
  }

  return validateGeometryObject(geometry, "geometry");
};

// =============================================================================
//  REUSABLE FIELD SCHEMAS
// =============================================================================

const dateField = (label) =>
  Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": `${label} phải có định dạng YYYY-MM-DD`,
      "any.required": `${label} là bắt buộc`,
    });

const collectionSchema = Joi.alternatives()
  .try(
    Joi.string().valid("S2", "L8", "L9", "ALL"),
    Joi.array().items(Joi.string().valid("S2", "L8", "L9")).min(1),
  )
  .default("S2");

const geometrySchema = Joi.object()
  .required()
  .custom((value, helpers) => {
    const validation = validateGeometryShape(value);
    if (validation.error) {
      return helpers.error("any.custom", { error: validation.error });
    }
    return value;
  })
  .messages({
    "any.required": "geometry là bắt buộc",
    "object.base": "geometry phải là object",
    "any.custom": "{#error}",
  });

// =============================================================================
//  REQUEST BODY SCHEMAS
// =============================================================================

const singlePeriodSchema = Joi.object({
  geometry: geometrySchema,
  startDate: dateField("startDate"),
  endDate: dateField("endDate"),
  collection: collectionSchema,
  cloudCover: Joi.number().min(0).max(100).default(30),
});

const ndviSchema = singlePeriodSchema.keys({
  ndviMinThresh: Joi.number().min(-1).max(1).default(0.2),
});

const dualPeriodSchema = Joi.object({
  geometry: geometrySchema,
  startDate1: dateField("startDate1"),
  endDate1: dateField("endDate1"),
  startDate2: dateField("startDate2"),
  endDate2: dateField("endDate2"),
  collection: collectionSchema,
  cloudCover: Joi.number().min(0).max(100).default(30),
});

module.exports = {
  // Geometry validator (reusable)
  validateGeometryShape,
  // Field builders
  dateField,
  collectionSchema,
  geometrySchema,
  // Satellite computation schemas
  singlePeriodSchema,
  ndviSchema,
  dualPeriodSchema,
};
