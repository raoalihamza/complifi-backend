const superAdminService = require("../services/superAdminService");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const { HTTP_STATUS } = require("../config/constants");

class SuperAdminController {
  /**
   * Create a new Super Admin
   * POST /api/v1/super-admin
   */
  async createSuperAdmin(req, res) {
    try {
      const { email, password, name, companyName, companySize, companyLocation } = req.body;

      const result = await superAdminService.createSuperAdmin({
        email,
        password,
        name,
        companyName,
        companySize,
        companyLocation,
      });

      return successResponse(
        res,
        result.message,
        result.superAdmin,
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
   * Get all Super Admins with pagination
   * GET /api/v1/super-admin
   */
  async getAllSuperAdmins(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const result = await superAdminService.getAllSuperAdmins(page, limit);

      return successResponse(
        res,
        result.message,
        {
          superAdmins: result.superAdmins,
          pagination: result.pagination,
        },
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
   * Get a single Super Admin by ID
   * GET /api/v1/super-admin/:id
   */
  async getSuperAdminById(req, res) {
    try {
      const { id } = req.params;

      const result = await superAdminService.getSuperAdminById(id);

      return successResponse(
        res,
        result.message,
        result.superAdmin,
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
   * Update Super Admin
   * PUT /api/v1/super-admin/:id
   */
  async updateSuperAdmin(req, res) {
    try {
      const { id } = req.params;
      const { email, name, companyName, companySize, companyLocation, password } = req.body;

      const result = await superAdminService.updateSuperAdmin(id, {
        email,
        name,
        companyName,
        companySize,
        companyLocation,
        password,
      });

      return successResponse(
        res,
        result.message,
        result.superAdmin,
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
   * Delete Super Admin
   * DELETE /api/v1/super-admin/:id
   */
  async deleteSuperAdmin(req, res) {
    try {
      const { id } = req.params;

      const result = await superAdminService.deleteSuperAdmin(id);

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
   * Toggle Super Admin status (enable/disable)
   * PATCH /api/v1/super-admin/:id/toggle-status
   */
  async toggleSuperAdminStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const result = await superAdminService.toggleSuperAdminStatus(id, isActive);

      return successResponse(
        res,
        result.message,
        result.superAdmin,
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
}

module.exports = new SuperAdminController();
