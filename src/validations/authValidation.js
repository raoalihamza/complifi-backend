const Joi = require("joi");

// Verify Email Schema
const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    "string.length": "OTP must be 6 digits",
    "string.pattern.base": "OTP must contain only numbers",
    "any.required": "OTP is required",
  }),
});

// Resend OTP Schema
const resendOTPSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
});

// User Login Schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// Company Information Schema (Onboarding Step 1)
const companyInfoSchema = Joi.object({
  companyName: Joi.string().min(2).max(200).required().messages({
    "string.min": "Company name must be at least 2 characters",
    "string.max": "Company name cannot exceed 200 characters",
    "any.required": "Company name is required",
  }),
  companySize: Joi.string()
    .valid("0-10", "11-25", "OVER_25")
    .required()
    .messages({
      "any.only": "Company size must be one of: 0-10, 11-25, OVER_25",
      "any.required": "Company size is required",
    }),
  companyLocation: Joi.string().min(2).max(200).required().messages({
    "string.min": "Company location must be at least 2 characters",
    "string.max": "Company location cannot exceed 200 characters",
    "any.required": "Company location is required",
  }),
});

// Change Password Schema
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "New password must be at least 8 characters long",
    "any.required": "New password is required",
  }),
});

// Forgot Password Schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
});

// Reset Password Schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "New password is required",
  }),
});

module.exports = {
  verifyEmailSchema,
  resendOTPSchema,
  loginSchema,
  companyInfoSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
