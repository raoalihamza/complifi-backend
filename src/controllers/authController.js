const authService = require("../services/authService");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const { HTTP_STATUS } = require("../config/constants");

class AuthController {
  /**
   * Verify email with OTP
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(req, res) {
    try {
      const { email, otp } = req.body;

      const result = await authService.verifyEmail(email, otp);

      return successResponse(res, result.message, result.user, HTTP_STATUS.OK);
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Resend OTP verification email
   * POST /api/v1/auth/resend-otp
   */
  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      const result = await authService.resendOTP(email);

      return successResponse(res, result.message, null, HTTP_STATUS.OK);
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return successResponse(
        res,
        result.message,
        {
          token: result.token,
          user: result.user,
        },
        HTTP_STATUS.OK
      );
    } catch (error) {
      // Special handling for email verification requirement
      if (error.needsVerification) {
        return errorResponse(
          res,
          error.message,
          { needsVerification: true },
          HTTP_STATUS.FORBIDDEN
        );
      }

      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Submit company information (Onboarding Step 1)
   * POST /api/v1/auth/company-info
   */
  async submitCompanyInfo(req, res) {
    try {
      const { companyName, companySize, companyLocation } = req.body;
      const userId = req.user.id;

      const result = await authService.submitCompanyInfo(userId, {
        companyName,
        companySize,
        companyLocation,
      });

      return successResponse(res, result.message, result.user, HTTP_STATUS.OK);
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async getMe(req, res) {
    try {
      const user = await authService.getCurrentUser(req.user.id);

      return successResponse(
        res,
        "User fetched successfully",
        user,
        HTTP_STATUS.OK
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Change password (when user knows old password)
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      const result = await authService.changePassword(
        req.user.id,
        oldPassword,
        newPassword
      );

      return successResponse(res, result.message, null, HTTP_STATUS.OK);
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Forgot password - Send reset link
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      return successResponse(res, result.message, null, HTTP_STATUS.OK);
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const result = await authService.resetPassword(token, newPassword);

      return successResponse(res, result.message, null, HTTP_STATUS.OK);
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Logout (optional - client-side removes token)
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      // In JWT, logout is typically handled client-side by removing the token
      // But we can track logout server-side if needed in future

      return successResponse(res, "Logout successful", null, HTTP_STATUS.OK);
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new AuthController();
