const workspaceService = require("../services/workspaceService");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const { HTTP_STATUS } = require("../config/constants");

class WorkspaceController {
  /**
   * Create workspace
   * POST /api/v1/workspaces
   */
  async createWorkspace(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.id;

      const workspace = await workspaceService.createWorkspace(userId, {
        name,
      });

      return successResponse(
        res,
        "Workspace created successfully",
        workspace,
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
   * Get all user workspaces
   * GET /api/v1/workspaces
   */
  async getUserWorkspaces(req, res) {
    try {
      const userId = req.user.id;

      const workspaces = await workspaceService.getUserWorkspaces(userId);

      return successResponse(
        res,
        "Workspaces fetched successfully",
        workspaces,
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
   * Get workspace by ID
   * GET /api/v1/workspaces/:id
   */
  async getWorkspaceById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workspace = await workspaceService.getWorkspaceById(id, userId);

      return successResponse(
        res,
        "Workspace fetched successfully",
        workspace,
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
   * Update workspace
   * PUT /api/v1/workspaces/:id
   */
  async updateWorkspace(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const workspace = await workspaceService.updateWorkspace(
        id,
        userId,
        updateData
      );

      return successResponse(
        res,
        "Workspace updated successfully",
        workspace,
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
   * Delete workspace
   * DELETE /api/v1/workspaces/:id
   */
  async deleteWorkspace(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await workspaceService.deleteWorkspace(id, userId);

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
   * Invite member to workspace
   * POST /api/v1/workspaces/:id/members
   */
  // async inviteMember(req, res) {
  //   try {
  //     console.log("req params", req.params);
  //     console.log("req body", req.body);
  //     console.log("req user", req.user);

  //     const { id } = req.params;
  //     const { email, role } = req.body;
  //     const inviterId = req.user.id;

  //     const member = await workspaceService.inviteMember(
  //       id,
  //       inviterId,
  //       email,
  //       role
  //     );

  //     return successResponse(
  //       res,
  //       "Member invited successfully",
  //       member,
  //       HTTP_STATUS.CREATED
  //     );
  //   } catch (error) {
  //     return errorResponse(
  //       res,
  //       error.message,
  //       error,
  //       error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }

  /**
   * Get workspace members
   * GET /api/v1/workspaces/:id/members
   */
  async getWorkspaceMembers(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify user has access
      await workspaceService.getWorkspaceById(id, userId);

      const workspaceRepository = require("../repositories/workspaceRepository");
      const members = await workspaceRepository.getMembers(id);

      return successResponse(
        res,
        "Members fetched successfully",
        members,
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
   * Remove member from workspace
   * DELETE /api/v1/workspaces/:id/members/:memberId
   */
  async removeMember(req, res) {
    try {
      const { id, memberId } = req.params;
      const removerId = req.user.id;

      const result = await workspaceService.removeMember(
        id,
        removerId,
        parseInt(memberId)
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
   * Update member role
   * PATCH /api/v1/workspaces/:id/members/:memberId
   */
  async updateMemberRole(req, res) {
    try {
      const { id, memberId } = req.params;
      const { role } = req.body;
      const updaterId = req.user.id;

      const member = await workspaceService.updateMemberRole(
        id,
        updaterId,
        parseInt(memberId),
        role
      );

      return successResponse(
        res,
        "Member role updated successfully",
        member,
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
   * Switch workspace (for UI)
   * GET /api/v1/workspaces/:id/switch
   */
  async switchWorkspace(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workspace = await workspaceService.switchWorkspace(userId, id);

      return successResponse(
        res,
        "Workspace switched successfully",
        workspace,
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
   * Invite member to workspace
   */
  async inviteMember(req, res) {
    try {
      console.log("req params", req.params);
      console.log("req body", req.body);
      console.log("req user", req.user);
      const { id: workspaceId } = req.params;
      const userId = req.user.id;
      const invitationData = req.body;

      const result = await workspaceService.inviteMember(
        userId,
        parseInt(workspaceId),
        invitationData
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
          role: result.role,
        },
      });
    } catch (error) {
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Verify workspace invitation token
   * GET /api/v1/workspaces/verify-invitation/:token
   */
  async verifyInvitation(req, res) {
    try {
      const { token } = req.params;

      const result = await workspaceService.verifyInvitation(token);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Invitation verified successfully",
        data: result,
      });
    } catch (error) {
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Accept workspace invitation
   * POST /api/v1/workspaces/accept-invitation
   */
  async acceptInvitation(req, res) {
    try {
      const { token, userData } = req.body;

      const result = await workspaceService.acceptInvitation(token, userData);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Invitation accepted successfully",
        data: result,
      });
    } catch (error) {
      res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new WorkspaceController();
