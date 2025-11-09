const { HTTP_STATUS } = require("../config/constants");

/**
 * Middleware to check if user is Super Admin
 */
const checkSuperAdmin = (req, res, next) => {
  try {
    // User is attached by authenticate middleware
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.isSuperAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Access denied. Super Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error during authorization",
    });
  }
};

module.exports = checkSuperAdmin;
