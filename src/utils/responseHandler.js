const { HTTP_STATUS } = require("../config/constants");

/**
 * Send success response
 */
const successResponse = (
  res,
  message,
  data = null,
  statusCode = HTTP_STATUS.OK
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 */
const errorResponse = (
  res,
  message,
  error = null,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
) => {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === "development") {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
const paginatedResponse = (
  res,
  message,
  data,
  pagination,
  statusCode = HTTP_STATUS.OK
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
