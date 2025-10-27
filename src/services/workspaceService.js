const workspaceRepository = require("../repositories/workspaceRepository");
const userRepository = require("../repositories/userRepository");
const { HTTP_STATUS, WORKSPACE_ROLES } = require("../config/constants");
const { sequelize } = require("../models");

class WorkspaceService {
  /**
   * Create new workspace
   * Automatically adds creator as admin member
   */
  async createWorkspace(userId, workspaceData) {
    const transaction = await sequelize.transaction();

    try {
      // Create workspace
      const workspace = await workspaceRepository.create({
        ...workspaceData,
        ownerId: userId,
      });

      // Add creator as admin member
      await workspaceRepository.addMember(
        workspace.id,
        userId,
        WORKSPACE_ROLES.ADMIN
      );

      await transaction.commit();

      // Fetch workspace with members
      return await workspaceRepository.findById(workspace.id, true);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all workspaces where user is owner or member
   */
  async getUserWorkspaces(userId) {
    try {
      const workspaces = await workspaceRepository.findUserWorkspaces(userId);

      // Add user's role to each workspace
      const workspacesWithRole = await Promise.all(
        workspaces.map(async (workspace) => {
          const role = await workspaceRepository.getMemberRole(
            workspace.id,
            userId
          );
          return {
            ...workspace.toJSON(),
            userRole: role,
          };
        })
      );

      return workspacesWithRole;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get workspace by ID
   * Verifies user has access
   */
  async getWorkspaceById(workspaceId, userId) {
    try {
      // Check if user has access
      const hasAccess = await workspaceRepository.isMember(workspaceId, userId);

      if (!hasAccess) {
        const error = new Error("Access denied to this workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Get workspace with members
      const workspace = await workspaceRepository.findById(workspaceId, true);

      if (!workspace) {
        const error = new Error("Workspace not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Get user's role
      const userRole = await workspaceRepository.getMemberRole(
        workspaceId,
        userId
      );

      return {
        ...workspace.toJSON(),
        userRole,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update workspace
   * Only owner or admin can update
   */
  async updateWorkspace(workspaceId, userId, updateData) {
    try {
      // Get user's role
      const userRole = await workspaceRepository.getMemberRole(
        workspaceId,
        userId
      );

      // Check permission (only owner or admin)
      if (userRole !== "owner" && userRole !== WORKSPACE_ROLES.ADMIN) {
        const error = new Error(
          "Only workspace owner or admin can update workspace"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Update workspace
      const updatedWorkspace = await workspaceRepository.update(
        workspaceId,
        updateData
      );

      if (!updatedWorkspace) {
        const error = new Error("Workspace not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      return await workspaceRepository.findById(workspaceId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete workspace
   * Only owner can delete
   */
  async deleteWorkspace(workspaceId, userId) {
    try {
      // Get workspace
      const workspace = await workspaceRepository.findById(workspaceId);

      if (!workspace) {
        const error = new Error("Workspace not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if user is owner
      if (workspace.ownerId !== userId) {
        const error = new Error("Only workspace owner can delete workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Delete workspace (cascade will delete members)
      await workspaceRepository.delete(workspaceId);

      return { message: "Workspace deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Invite member to workspace
   * Only owner or admin can invite
   */
  async inviteMember(workspaceId, inviterId, memberEmail, role) {
    try {
      // Check inviter's permission
      const inviterRole = await workspaceRepository.getMemberRole(
        workspaceId,
        inviterId
      );

      if (inviterRole !== "owner" && inviterRole !== WORKSPACE_ROLES.ADMIN) {
        const error = new Error(
          "Only workspace owner or admin can invite members"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Find user by email
      const user = await userRepository.findByEmail(memberEmail);

      if (!user) {
        const error = new Error("User with this email not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if user is already a member
      const isMember = await workspaceRepository.isMember(workspaceId, user.id);

      if (isMember) {
        const error = new Error("User is already a member of this workspace");
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }

      // Add member
      await workspaceRepository.addMember(workspaceId, user.id, role);

      // Get updated members list
      const members = await workspaceRepository.getMembers(workspaceId);

      return members.find((m) => m.userId === user.id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove member from workspace
   * Only owner or admin can remove
   * Cannot remove owner
   */
  async removeMember(workspaceId, removerId, memberId) {
    try {
      // Check remover's permission
      const removerRole = await workspaceRepository.getMemberRole(
        workspaceId,
        removerId
      );

      if (removerRole !== "owner" && removerRole !== WORKSPACE_ROLES.ADMIN) {
        const error = new Error(
          "Only workspace owner or admin can remove members"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Get workspace
      const workspace = await workspaceRepository.findById(workspaceId);

      // Cannot remove owner
      if (workspace.ownerId === memberId) {
        const error = new Error("Cannot remove workspace owner");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Remove member
      const removed = await workspaceRepository.removeMember(
        workspaceId,
        memberId
      );

      if (!removed) {
        const error = new Error("Member not found in workspace");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      return { message: "Member removed successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update member role
   * Only owner or admin can update roles
   * Cannot change owner's role
   */
  async updateMemberRole(workspaceId, updaterId, memberId, newRole) {
    try {
      // Check updater's permission
      const updaterRole = await workspaceRepository.getMemberRole(
        workspaceId,
        updaterId
      );

      if (updaterRole !== "owner" && updaterRole !== WORKSPACE_ROLES.ADMIN) {
        const error = new Error(
          "Only workspace owner or admin can update member roles"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Get workspace
      const workspace = await workspaceRepository.findById(workspaceId);

      // Cannot change owner's role
      if (workspace.ownerId === memberId) {
        const error = new Error("Cannot change workspace owner's role");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Update role
      const updatedMember = await workspaceRepository.updateMemberRole(
        workspaceId,
        memberId,
        newRole
      );

      if (!updatedMember) {
        const error = new Error("Member not found in workspace");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Get updated member with user details
      const members = await workspaceRepository.getMembers(workspaceId);
      return members.find((m) => m.userId === memberId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Switch workspace (for UI)
   * Verifies user is member
   */
  async switchWorkspace(userId, workspaceId) {
    try {
      // Check if user has access
      const hasAccess = await workspaceRepository.isMember(workspaceId, userId);

      if (!hasAccess) {
        const error = new Error("Access denied to this workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Get workspace details
      return await this.getWorkspaceById(workspaceId, userId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WorkspaceService();
