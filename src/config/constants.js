module.exports = {
  // User Roles
  USER_ROLES: {
    ADMIN: "ADMIN",
    AUDIT_PARTNER: "AUDIT_PARTNER",
    SME_USER: "SME_USER",
    VIEWER: "VIEWER",
  },

  // Workspace Member Roles
  WORKSPACE_ROLES: {
    EDITOR: "editor",
    VIEWER: "viewer",
  },

  // Folder Types
  FOLDER_TYPES: {
    GENERAL: "GENERAL",
    RECONCILIATION: "RECONCILIATION",
  },

  // Folder Status
  FOLDER_STATUS: {
    TO_DO: "TO_DO",
    IN_PROGRESS: "IN_PROGRESS",
    IN_REVIEW: "IN_REVIEW",
    CLOSED: "CLOSED",
  },

  // Priority Levels
  PRIORITY: {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
  },

  // Transaction Status (for Phase 4)
  TRANSACTION_STATUS: {
    MATCHED: "MATCHED",
    EXCEPTION: "EXCEPTION",
    PENDING: "PENDING",
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Error Messages
  ERROR_MESSAGES: {
    INTERNAL_SERVER: "Internal server error",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    NOT_FOUND: "Resource not found",
    VALIDATION_ERROR: "Validation error",
    DUPLICATE_ENTRY: "Duplicate entry",
  },
};
