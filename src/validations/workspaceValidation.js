const Joi = require("joi");

// Create Workspace Schema
const createWorkspaceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Workspace name must be at least 2 characters long",
    "string.max": "Workspace name cannot exceed 100 characters",
    "any.required": "Workspace name is required",
  }),
});

// Update Workspace Schema
const updateWorkspaceSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Workspace name must be at least 2 characters long",
    "string.max": "Workspace name cannot exceed 100 characters",
  }),
});

// Invite Member Schema
const inviteMemberSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  role: Joi.string().valid("admin", "editor", "viewer").required().messages({
    "any.only": "Role must be one of: admin, editor, viewer",
    "any.required": "Role is required",
  }),
});

// Update Member Role Schema
const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid("admin", "editor", "viewer").required().messages({
    "any.only": "Role must be one of: admin, editor, viewer",
    "any.required": "Role is required",
  }),
});

module.exports = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
};
