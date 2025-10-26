const { HTTP_STATUS, ERROR_MESSAGES } = require("../config/constants");
const { errorResponse } = require("../utils/responseHandler");

/**
 * Authorize specific roles
 * Usage: authorize(USER_ROLES.ADMIN, USER_ROLES.AUDIT_PARTNER)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        "User not authenticated",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        ERROR_MESSAGES.FORBIDDEN,
        `User role '${req.user.role}' is not authorized to access this resource`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

module.exports = { authorize };
