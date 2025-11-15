const Joi = require("joi");

// Get Reports Query Schema
const getReportsQuerySchema = Joi.object({
  workspaceId: Joi.number().integer().positive().required().messages({
    "number.base": "Workspace ID must be a number",
    "number.integer": "Workspace ID must be an integer",
    "number.positive": "Workspace ID must be positive",
    "any.required": "Workspace ID is required",
  }),
  statementType: Joi.string().valid("BANK", "CARD").optional().messages({
    "any.only": "Statement type must be either BANK or CARD",
  }),
  status: Joi.string()
    .valid("TO_DO", "IN_PROGRESS", "IN_REVIEW", "CLOSED")
    .optional()
    .messages({
      "any.only": "Status must be one of: TO_DO, IN_PROGRESS, IN_REVIEW, CLOSED",
    }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid date",
    "date.format": "Start date must be in ISO format",
  }),
  endDate: Joi.date().iso().optional().messages({
    "date.base": "End date must be a valid date",
    "date.format": "End date must be in ISO format",
  }),
  minCompliance: Joi.number().min(0).max(100).optional().messages({
    "number.base": "Minimum compliance must be a number",
    "number.min": "Minimum compliance must be at least 0",
    "number.max": "Minimum compliance cannot exceed 100",
  }),
  maxCompliance: Joi.number().min(0).max(100).optional().messages({
    "number.base": "Maximum compliance must be a number",
    "number.min": "Maximum compliance must be at least 0",
    "number.max": "Maximum compliance cannot exceed 100",
  }),
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
  sortBy: Joi.string()
    .valid(
      "name",
      "complianceScore",
      "closingDate",
      "status",
      "createdAt",
      "updatedAt"
    )
    .optional()
    .messages({
      "any.only":
        "Sort by must be one of: name, complianceScore, closingDate, status, createdAt, updatedAt",
    }),
  sortOrder: Joi.string().valid("ASC", "DESC").optional().messages({
    "any.only": "Sort order must be either ASC or DESC",
  }),
  search: Joi.string().min(1).max(200).optional().messages({
    "string.min": "Search query must be at least 1 character",
    "string.max": "Search query cannot exceed 200 characters",
  }),
});

// Get Report Statistics Query Schema
const getReportStatisticsQuerySchema = Joi.object({
  workspaceId: Joi.number().integer().positive().required().messages({
    "number.base": "Workspace ID must be a number",
    "number.integer": "Workspace ID must be an integer",
    "number.positive": "Workspace ID must be positive",
    "any.required": "Workspace ID is required",
  }),
  statementType: Joi.string().valid("BANK", "CARD").optional().messages({
    "any.only": "Statement type must be either BANK or CARD",
  }),
});

// Download Reports Query Schema
const downloadReportsQuerySchema = Joi.object({
  workspaceId: Joi.number().integer().positive().required().messages({
    "number.base": "Workspace ID must be a number",
    "number.integer": "Workspace ID must be an integer",
    "number.positive": "Workspace ID must be positive",
    "any.required": "Workspace ID is required",
  }),
  statementType: Joi.string().valid("BANK", "CARD").optional().messages({
    "any.only": "Statement type must be either BANK or CARD",
  }),
  status: Joi.string()
    .valid("TO_DO", "IN_PROGRESS", "IN_REVIEW", "CLOSED")
    .optional()
    .messages({
      "any.only": "Status must be one of: TO_DO, IN_PROGRESS, IN_REVIEW, CLOSED",
    }),
});

module.exports = {
  getReportsQuerySchema,
  getReportStatisticsQuerySchema,
  downloadReportsQuerySchema,
};
