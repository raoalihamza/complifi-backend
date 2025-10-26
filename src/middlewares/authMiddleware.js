const jwt = require("jsonwebtoken");
const { User } = require("../models");
const envConfig = require("../config/environment");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../config/constants");
const { errorResponse } = require("../utils/responseHandler");

/**
 * Protect routes - JWT Authentication Middleware
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return errorResponse(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        "No token provided",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Verify token
    const decoded = jwt.verify(token, envConfig.jwt.secret);

    // Find user by ID from token
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return errorResponse(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        "User not found",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return errorResponse(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        "Invalid token",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (error.name === "TokenExpiredError") {
      return errorResponse(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        "Token expired",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    return errorResponse(
      res,
      ERROR_MESSAGES.INTERNAL_SERVER,
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = { protect };
