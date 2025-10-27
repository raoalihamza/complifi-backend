const workspaceRepository = require("../repositories/workspaceRepository");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../config/constants");
const { errorResponse } = require("../utils/responseHandler");

/**
 * Check if user has access to workspace
 * Attaches workspace to req.workspace
 */
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const workspaceId = req.params.id || req.params.workspaceId;
    const userId = req.user.id;

    if (!workspaceId) {
      return errorResponse(
        res,
        "Workspace ID is required",
        null,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check if user has access to workspace
    const hasAccess = await workspaceRepository.isMember(workspaceId, userId);

    if (!hasAccess) {
      return errorResponse(
        res,
        ERROR_MESSAGES.FORBIDDEN,
        "You do not have access to this workspace",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Attach workspace to request
    const workspace = await workspaceRepository.findById(workspaceId, true);
    req.workspace = workspace;

    next();
  } catch (error) {
    return errorResponse(
      res,
      ERROR_MESSAGES.INTERNAL_SERVER,
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Check if user has specific role in workspace
 * Usage: checkWorkspaceRole('admin', 'owner')
 */
const checkWorkspaceRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.id || req.params.workspaceId;
      const userId = req.user.id;

      if (!workspaceId) {
        return errorResponse(
          res,
          "Workspace ID is required",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Get user's role in workspace
      const userRole = await workspaceRepository.getMemberRole(
        workspaceId,
        userId
      );

      if (!userRole || !allowedRoles.includes(userRole)) {
        return errorResponse(
          res,
          ERROR_MESSAGES.FORBIDDEN,
          `Access denied. Required role: ${allowedRoles.join(" or ")}`,
          HTTP_STATUS.FORBIDDEN
        );
      }

      // Attach user's role to request
      req.userWorkspaceRole = userRole;

      next();
    } catch (error) {
      return errorResponse(
        res,
        ERROR_MESSAGES.INTERNAL_SERVER,
        error.message,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  };
};

module.exports = {
  checkWorkspaceAccess,
  checkWorkspaceRole,
};
