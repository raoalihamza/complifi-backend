const Joi = require("joi");

// Create Folder Schema
const createFolderSchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    "string.min": "Folder name must be at least 2 characters long",
    "string.max": "Folder name cannot exceed 200 characters",
    "any.required": "Folder name is required",
  }),
  type: Joi.string().valid("GENERAL", "RECONCILIATION").required().messages({
    "any.only": "Folder type must be either GENERAL or RECONCILIATION",
    "any.required": "Folder type is required",
  }),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH").optional().messages({
    "any.only": "Priority must be one of: LOW, MEDIUM, HIGH",
  }),
  assignedToId: Joi.number().integer().positive().optional().messages({
    "number.base": "Assigned user ID must be a number",
    "number.integer": "Assigned user ID must be an integer",
    "number.positive": "Assigned user ID must be positive",
  }),
  closingDate: Joi.date().iso().optional().messages({
    "date.base": "Closing date must be a valid date",
    "date.format": "Closing date must be in ISO format",
  }),
});

// Update Folder Schema
const updateFolderSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional().messages({
    "string.min": "Folder name must be at least 2 characters long",
    "string.max": "Folder name cannot exceed 200 characters",
  }),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH").optional().messages({
    "any.only": "Priority must be one of: LOW, MEDIUM, HIGH",
  }),
  assignedToId: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      "number.base": "Assigned user ID must be a number",
      "number.integer": "Assigned user ID must be an integer",
      "number.positive": "Assigned user ID must be positive",
    }),
  closingDate: Joi.date().iso().optional().allow(null).messages({
    "date.base": "Closing date must be a valid date",
    "date.format": "Closing date must be in ISO format",
  }),
});

// Update Status Schema
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("TO_DO", "IN_PROGRESS", "IN_REVIEW", "CLOSED")
    .required()
    .messages({
      "any.only":
        "Status must be one of: TO_DO, IN_PROGRESS, IN_REVIEW, CLOSED",
      "any.required": "Status is required",
    }),
});

// Update Priority Schema
const updatePrioritySchema = Joi.object({
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH").required().messages({
    "any.only": "Priority must be one of: LOW, MEDIUM, HIGH",
    "any.required": "Priority is required",
  }),
});

// Assign Folder Schema
const assignFolderSchema = Joi.object({
  assignedToId: Joi.number().integer().positive().required().messages({
    "number.base": "Assigned user ID must be a number",
    "number.integer": "Assigned user ID must be an integer",
    "number.positive": "Assigned user ID must be positive",
    "any.required": "Assigned user ID is required",
  }),
});

// Create General Folder Schema
const createGeneralFolderSchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    "string.min": "Folder name must be at least 2 characters long",
    "string.max": "Folder name cannot exceed 200 characters",
    "any.required": "Folder name is required",
  }),
  workspaceId: Joi.number().integer().positive().required().messages({
    "number.base": "Workspace ID must be a number",
    "number.integer": "Workspace ID must be an integer",
    "number.positive": "Workspace ID must be positive",
    "any.required": "Workspace ID is required",
  }),
  statementType: Joi.string().valid("BANK", "CARD").required().messages({
    "any.only": "Statement type must be either BANK or CARD",
    "any.required": "Statement type is required",
  }),
});

module.exports = {
  createFolderSchema,
  updateFolderSchema,
  updateStatusSchema,
  updatePrioritySchema,
  assignFolderSchema,
  createGeneralFolderSchema,
};
