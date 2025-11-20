const workspaceRepository = require("../repositories/workspaceRepository");
const userRepository = require("../repositories/userRepository");
const { HTTP_STATUS } = require("../config/constants");
const { sequelize } = require("../models");
const { Workspace, WorkspaceMember, User } = require("../models");
const emailService = require("../services/emailService"); 

class WorkspaceService {
  /**
   * Create new workspace (Super Admin only)
   * Automatically adds Super Admin as workspace member
   */
  async createWorkspace(userId, workspaceData) {
    const transaction = await sequelize.transaction();

    try {
      // Verify user is Super Admin
      const user = await userRepository.findById(userId);

      if (!user || !user.isSuperAdmin) {
        const error = new Error("Only Super Admin can create workspaces");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Create workspace using repository
      const workspace = await workspaceRepository.create(
        {
          ...workspaceData,
          createdBy: userId,
        },
        transaction
      );

      // Add Super Admin as workspace member (editor role) using repository
      await workspaceRepository.addMember(
        workspace.id,
        userId,
        "editor", // Super Admin gets editor role in workspace
        userId, // Super Admin invites themselves (self-invitation)
        transaction
      );

      // Fetch workspace with members using repository (inside transaction)
      const workspaceWithMembers = await workspaceRepository.findById(
        workspace.id,
        true,
        transaction
      );

      await transaction.commit();

      return workspaceWithMembers;
    } catch (error) {
      // only rollback if transaction not finished (avoid rollback-after-commit error)
      if (transaction && !transaction.finished) {
        try {
          await transaction.rollback();
        } catch (_) {
          // swallow rollback errors
        }
      }
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
   * Only SUPER_ADMIN (company owner) can update
   */
  async updateWorkspace(workspaceId, userId, updateData) {
    try {
      // Verify user is Super Admin
      const user = await userRepository.findById(userId);

      if (!user || !user.isSuperAdmin) {
        const error = new Error("Only company owner can update workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Verify workspace exists
      const workspace = await workspaceRepository.findById(workspaceId);

      if (!workspace) {
        const error = new Error("Workspace not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Update workspace
      await workspaceRepository.update(workspaceId, updateData);

      return await workspaceRepository.findById(workspaceId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete workspace
   * Only SUPER_ADMIN (company owner) can delete
   */
  async deleteWorkspace(workspaceId, userId) {
    try {
      // Verify user is Super Admin
      const user = await userRepository.findById(userId);

      if (!user || !user.isSuperAdmin) {
        const error = new Error("Only company owner can delete workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Get workspace
      const workspace = await workspaceRepository.findById(workspaceId);

      if (!workspace) {
        const error = new Error("Workspace not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
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
   * Remove member from workspace
   * Only SUPER_ADMIN (company owner) can remove
   * Cannot remove the company owner themselves
   */
  async removeMember(workspaceId, removerId, memberId) {
    try {
      // Verify remover is Super Admin
      const remover = await userRepository.findById(removerId);

      if (!remover || !remover.isSuperAdmin) {
        const error = new Error("Only company owner can remove members");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Cannot remove themselves
      if (removerId === memberId) {
        const error = new Error("Cannot remove company owner from workspace");
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
   * Only SUPER_ADMIN (company owner) can update roles
   * Cannot change company owner's role
   */
  async updateMemberRole(workspaceId, updaterId, memberId, newRole) {
    try {
      // Verify updater is Super Admin
      const updater = await userRepository.findById(updaterId);

      if (!updater || !updater.isSuperAdmin) {
        const error = new Error("Only company owner can update member roles");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Cannot change their own role
      if (updaterId === memberId) {
        const error = new Error("Cannot change company owner's role");
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

  /**
   * Invite new member to workspace (Super Admin only)
   * Sends invitation email with token
   */
  async inviteMember(userId, workspaceId, invitationData) {
    try {
      console.log("Inviting member to workspace service", userId, workspaceId, invitationData);
      const { email, role } = invitationData;

      // Verify user is Super Admin
      const user = await userRepository.findById(userId);

      if (!user || !user.isSuperAdmin) {
        const error = new Error("Only Super Admin can invite members");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Verify workspace exists using repository
      const workspace = await workspaceRepository.findById(workspaceId);

      if (!workspace) {
        const error = new Error("Workspace not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if email is already invited to this workspace (pending or active)
      const existingMember = await WorkspaceMember.findOne({
        where: {
          workspaceId,
          email,
        },
      });

      if (existingMember) {
        const error = new Error(
          existingMember.status === "pending"
            ? "An invitation has already been sent to this email address"
            : "This email is already a member of this workspace"
        );
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);

      if (existingUser) {
        // Check if already a member using repository
        const isMember = await workspaceRepository.isMember(
          workspaceId,
          existingUser.id
        );

        if (isMember) {
          const error = new Error("User is already a member of this workspace");
          error.statusCode = HTTP_STATUS.CONFLICT;
          throw error;
        }
      }

      // Generate invitation token
      const crypto = require("crypto");
      const invitationToken = crypto.randomBytes(32).toString("hex");

      // Create pending member invitation using repository
      await workspaceRepository.createPendingMember(
        workspaceId,
        email,
        role,
        userId,
        invitationToken
      );

      // Send invitation email
      await emailService.sendWorkspaceInvitationEmail(
        email,
        user.name,
        workspace.name,
        role,
        invitationToken
      );

      return {
        message: "Invitation sent successfully",
        email,
        role,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify workspace invitation token
   * Checks if invitation is valid and if user already exists
   */
  async verifyInvitation(token) {
    try {
      // Find invitation using repository
      const invitation = await workspaceRepository.findByInvitationToken(token);

      if (!invitation) {
        const error = new Error("Invalid or expired invitation");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      const { workspace, email, role } = invitation;

      // Verify email is stored in invitation
      if (!email) {
        const error = new Error("Invalid invitation: email not found");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);

      return {
        isValidInvitation: true,
        isExistingUser: !!existingUser,
        email,
        userName: existingUser ? existingUser.name : null,
        workspaceName: workspace.name,
        role,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Accept workspace invitation
   * Auto-creates user account if doesn't exist
   * Auto-verifies email (no OTP needed)
   */
  async acceptInvitation(token, userData) {
    const transaction = await sequelize.transaction();

    try {
      // Find invitation using repository
      const invitation = await workspaceRepository.findByInvitationToken(token);

      if (!invitation) {
        const error = new Error("Invalid or expired invitation");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      const { workspace, email } = invitation;

      // Verify email is stored in invitation
      if (!email) {
        const error = new Error("Invalid invitation: email not found");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Check if user already exists
      let user = await userRepository.findByEmail(email);

      if (!user) {
        // Create new user (auto-verified) with email from invitation
        user = await userRepository.create(
          {
            ...userData, // name, password
            email, // Email from invitation
            isEmailVerified: true, // Auto-verify
            hasCompletedOnboarding: true,
            isSuperAdmin: false,
          },
          transaction
        );
      }

      // Activate pending member using repository
      await workspaceRepository.activatePendingMember(
        token,
        user.id,
        transaction
      );

      // Generate auth token
      const authToken = user.generateAuthToken();

      await transaction.commit();

      return {
        user: user.toJSON(),
        workspace,
        token: authToken,
      };
    } catch (error) {
      // only rollback if transaction not finished (avoid rollback-after-commit error)
      if (transaction && !transaction.finished) {
        try {
          await transaction.rollback();
        } catch (_) {
          // swallow rollback errors
        }
      }
      throw error;
    }
  }
}

module.exports = new WorkspaceService();
