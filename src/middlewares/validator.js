const { HTTP_STATUS } = require("../config/constants");
const { errorResponse } = require("../utils/responseHandler");

/**
 * Validate request body against Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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

    req.body = value;
    next();
  };
};

module.exports = validate;
