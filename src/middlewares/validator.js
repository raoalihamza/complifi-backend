const { HTTP_STATUS } = require("../config/constants");
const { errorResponse } = require("../utils/responseHandler");

/**
 * Validate request data against Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} source - Source of data to validate: 'body', 'query', 'params' (default: 'body')
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(
        res,
        "Validation error",
        errors,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;
