const authService = require("../services/authService");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const { HTTP_STATUS } = require("../config/constants");

class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   * Note: Does not return token - requires email verification
   */
  async register(req, res) {
    try {
      const { email, password, name, role } = req.body;

      const result = await authService.register({
        email,
        password,
        name,
        role,
      });

      return successResponse(
        res,
        "User registered successfully. Please verify your email.",
        result,
        HTTP_STATUS.CREATED
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
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return successResponse(res, "Login successful", result, HTTP_STATUS.OK);
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
   * Change password
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
