const { Api400Error } = require("../core/error.response");

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isSafeObject = (obj, depth = 0) => {
  if (depth > 10 || obj === null || typeof obj !== 'object') return true;
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.has(key)) return false;
    if (!isSafeObject(obj[key], depth + 1)) return false;
  }
  return true;
};

const parseJsonFields = (fields = []) => {
  return (req, res, next) => {
    if (!req.body) {
      return next();
    }

    for (const field of fields) {
      const value = req.body[field];

      if (typeof value !== "string") {
        continue;
      }

      try {
        const parsed = JSON.parse(value);
        if (!isSafeObject(parsed)) {
          return next(new Api400Error(`${field} chứa dữ liệu không hợp lệ`));
        }
        req.body[field] = parsed;
      } catch (err) {
        if (err instanceof Api400Error) return next(err);
        return next(new Api400Error(`${field} phải là JSON hợp lệ`));
      }
    }

    return next();
  };
};

const isJsonFieldDescription = (description = {}) => {
  if (!description || typeof description !== "object") {
    return false;
  }

  // Chỉ parse JSON nếu field là object hoặc array NHƯNG không phải alternatives (xử lý multiple types)
  if (description.type === "object") {
    return true;
  }

  // Không parse array trực tiếp từ alternatives - để Joi xử lý
  if (description.type === "array" && !description.matches) {
    return true;
  }

  // Không parse alternatives (chứa nhiều type)
  if (description.type === "alternatives") {
    return false;
  }

  return false;
};

const getJsonFieldNamesFromSchema = (schema) => {
  if (!schema || typeof schema.describe !== "function") {
    return [];
  }

  const description = schema.describe();
  const keys = description.keys || {};

  return Object.entries(keys)
    .filter(([, fieldDescription]) => isJsonFieldDescription(fieldDescription))
    .map(([fieldName]) => fieldName);
};

const parseJsonBodyBySchema = (body, schema) => {
  if (!body || !schema) {
    return;
  }

  const jsonFields = getJsonFieldNamesFromSchema(schema);

  for (const field of jsonFields) {
    if (typeof body[field] !== "string") {
      continue;
    }

    try {
      const parsed = JSON.parse(body[field]);
      if (!isSafeObject(parsed)) {
        throw new Api400Error(`${field} chứa dữ liệu không hợp lệ`);
      }
      body[field] = parsed;
    } catch (err) {
      if (err instanceof Api400Error) throw err;
      throw new Api400Error(`${field} phải là JSON hợp lệ`);
    }
  }
};

module.exports = {
  parseJsonFields,
  parseJsonBodyBySchema,
};
