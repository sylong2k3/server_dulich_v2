const { Api400Error } = require("../core/error.response");
const { parseJsonBodyBySchema } = require("./parse-json");

const validate = (schema, source = "body", options = {}) => {
  return (req, res, next) => {
    const defaultOptions = {
      abortEarly: false,
      convert: true,
      stripUnknown: true,
      ...options,
    };

    if (source === "body") {
      try {
        parseJsonBodyBySchema(req.body, schema);
      } catch (err) {
        return next(err);
      }
    }

    const { error, value } = schema.validate(req[source], defaultOptions);
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join(".") || source,
        message: detail.context?.message || detail.message,
        type: detail.type,
      }));

      return next(new Api400Error("Dữ liệu đầu vào không hợp lệ", errors));
    }

    // Cập nhật request với dữ liệu đã được validate
    req[source] = value;
    next();
  };
};

const validateBody = (schema, options) => validate(schema, "body", options);

const validateParams = (schema, options) => validate(schema, "params", options);

const validateQuery = (schema, options) => validate(schema, "query", options);

const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    try {
      for (const [source, schema] of Object.entries(schemas)) {
        if (!schema) continue;

        if (source === "body") {
          try {
            parseJsonBodyBySchema(req.body, schema);
          } catch (err) {
            return next(err);
          }
        }

        const { error, value } = schema.validate(req[source], {
          abortEarly: false,
          convert: true,
          stripUnknown: true,
        });

        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              source,
              field: detail.path.join(".") || source,
              message: detail.context?.message || detail.message,
              type: detail.type,
            })),
          );
        } else {
          req[source] = value;
        }
      }

      if (errors.length > 0) {
        return next(new Api400Error("Dữ liệu đầu vào không hợp lệ", errors));
      }

      next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  validateMultiple,
};
