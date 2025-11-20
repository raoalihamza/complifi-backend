const Joi = require("joi");

// Create Super Admin Schema
const createSuperAdminSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),
  companyName: Joi.string().min(2).max(200).optional().allow(null, "").messages({
    "string.min": "Company name must be at least 2 characters",
    "string.max": "Company name cannot exceed 200 characters",
  }),
  companySize: Joi.string()
    .valid("0-10", "11-25", "OVER_25")
    .optional()
    .allow(null, "")
    .messages({
      "any.only": "Company size must be one of: 0-10, 11-25, OVER_25",
    }),
  companyLocation: Joi.string().min(2).max(200).optional().allow(null, "").messages({
    "string.min": "Company location must be at least 2 characters",
    "string.max": "Company location cannot exceed 200 characters",
  }),
});

// Update Super Admin Schema
const updateSuperAdminSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email",
  }),
  password: Joi.string().min(8).optional().messages({
    "string.min": "Password must be at least 8 characters long",
  }),
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),
  companyName: Joi.string().min(2).max(200).optional().allow(null, "").messages({
    "string.min": "Company name must be at least 2 characters",
    "string.max": "Company name cannot exceed 200 characters",
  }),
  companySize: Joi.string()
    .valid("0-10", "11-25", "OVER_25")
    .optional()
    .allow(null, "")
    .messages({
      "any.only": "Company size must be one of: 0-10, 11-25, OVER_25",
    }),
  companyLocation: Joi.string().min(2).max(200).optional().allow(null, "").messages({
    "string.min": "Company location must be at least 2 characters",
    "string.max": "Company location cannot exceed 200 characters",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

// Toggle Super Admin Status Schema
const toggleSuperAdminStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    "any.required": "isActive field is required",
    "boolean.base": "isActive must be a boolean value",
  }),
});

// Pagination Query Schema
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
});

module.exports = {
  createSuperAdminSchema,
  updateSuperAdminSchema,
  toggleSuperAdminStatusSchema,
  paginationSchema,
};
