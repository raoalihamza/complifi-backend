const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const {
  verifyEmailSchema,
  resendOTPSchema,
  loginSchema,
  companyInfoSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validations/authValidation");

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }
    next();
  };
};

/**
 * ========================================
 * PUBLIC ROUTES (No authentication required)
 * ========================================
 */

/**
 * Verify email with OTP
 * POST /api/v1/auth/verify-email
 */
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail
);

/**
 * Resend OTP verification email
 * POST /api/v1/auth/resend-otp
 */
router.post("/resend-otp", validate(resendOTPSchema), authController.resendOTP);

/**
 * Login user
 * POST /api/v1/auth/login
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * Forgot password - Send reset link
 * POST /api/v1/auth/forgot-password
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * Reset password with token
 * POST /api/v1/auth/reset-password
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * ========================================
 * PROTECTED ROUTES (Authentication required)
 * ========================================
 */

/**
 * Submit company information (Onboarding Step 1)
 * POST /api/v1/auth/company-info
 */
router.post(
  "/company-info",
  protect,
  validate(companyInfoSchema),
  authController.submitCompanyInfo
);

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
router.get("/me", protect, authController.getMe);

/**
 * Change password (user knows old password)
 * POST /api/v1/auth/change-password
 */
router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * Logout user (client-side token removal)
 * POST /api/v1/auth/logout
 */
router.post("/logout", protect, authController.logout);

module.exports = router;
