const { Workspace, WorkspaceMember, User } = require("../models");
const { Op } = require("sequelize");

class WorkspaceRepository {
  /**
   * Create new workspace
   */
  async create(workspaceData, transaction = null) {
    try {
      const options = transaction ? { transaction } : {};
      return await Workspace.create(workspaceData, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find workspace by ID
   */
  async findById(id, includeMembers = false, transaction = null) {
    try {
      const options = {
        where: { id },
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
      };

      if (transaction) {
        options.transaction = transaction;
      }

      if (includeMembers) {
        options.include.push({
          model: WorkspaceMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        });
      }

      return await Workspace.findOne(options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find all workspaces owned by user
   */
  async findByOwnerId(ownerId) {
    try {
      // ownerId here represents the creator's user id
      return await Workspace.findAll({
        where: { createdBy: ownerId },
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find all workspaces where user is member or owner
   */
  async findUserWorkspaces(userId) {
    try {
      // Get all workspace IDs where user is creator
      const ownedWorkspaces = await Workspace.findAll({
        where: { createdBy: userId },
        attributes: ["id"],
      });

      // Get all workspace IDs where user is a member
      const memberWorkspaces = await WorkspaceMember.findAll({
        where: { userId, status: "active" },
        attributes: ["workspaceId"],
      });

      // Combine all workspace IDs
      const workspaceIds = [
        ...ownedWorkspaces.map((w) => w.id),
        ...memberWorkspaces.map((m) => m.workspaceId),
      ];

      // Remove duplicates
      const uniqueWorkspaceIds = [...new Set(workspaceIds)];

      // Fetch all workspaces with their members
      const workspaces = await Workspace.findAll({
        where: { id: uniqueWorkspaceIds },
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Fetch all active members for each workspace
      for (const workspace of workspaces) {
        const members = await WorkspaceMember.findAll({
          where: { workspaceId: workspace.id, status: "active" },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
          order: [["joinedAt", "ASC"]],
        });
        workspace.dataValues.members = members;
      }

      return workspaces;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update workspace
   */
  async update(id, updateData) {
    try {
      const workspace = await Workspace.findByPk(id);
      if (!workspace) return null;

      return await workspace.update(updateData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete workspace
   */
  async delete(id) {
    try {
      const workspace = await Workspace.findByPk(id);
      if (!workspace) return null;

      await workspace.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add member to workspace
   */
  async addMember(
    workspaceId,
    userId,
    role,
    invitedBy = null,
    transaction = null
  ) {
    try {
      // Fetch user's email
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error("User not found");
      }

      const memberData = {
        workspaceId,
        userId,
        email: user.email, // Add email from user
        role,
        invitedBy,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitationAccepted: true,
        status: "active", // Set as active when directly adding a member
      };

      const options = transaction ? { transaction } : {};
      return await WorkspaceMember.create(memberData, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId, userId) {
    try {
      const member = await WorkspaceMember.findOne({
        where: { workspaceId, userId },
      });

      if (!member) return null;

      await member.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(workspaceId, userId, newRole) {
    try {
      const member = await WorkspaceMember.findOne({
        where: { workspaceId, userId },
      });

      if (!member) return null;

      return await member.update({ role: newRole });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all members of workspace
   */
  async getMembers(workspaceId) {
    try {
      return await WorkspaceMember.findAll({
        where: { workspaceId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["joinedAt", "DESC"]],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is member of workspace
   */
  async isMember(workspaceId, userId) {
    try {
      // Check if user is creator
      const workspace = await Workspace.findOne({
        where: { id: workspaceId, createdBy: userId },
      });

      if (workspace) return true;

      // Check if user is member
      const member = await WorkspaceMember.findOne({
        where: { workspaceId, userId },
      });

      return !!member;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's role in workspace
   */
  async getMemberRole(workspaceId, userId) {
    try {
      // Check if user is creator
      const workspace = await Workspace.findOne({
        where: { id: workspaceId, createdBy: userId },
      });

      if (workspace) return "owner";

      // Check member role
      const member = await WorkspaceMember.findOne({
        where: { workspaceId, userId },
      });

      return member ? member.role : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find workspace member by invitation token
   */
  async findByInvitationToken(token) {
    try {
      const { WorkspaceMember, Workspace, User } = require("../models");

      const member = await WorkspaceMember.findOne({
        where: {
          invitationToken: token,
          invitationTokenExpiry: {
            [require("sequelize").Op.gt]: new Date(),
          },
        },
        include: [
          {
            model: Workspace,
            as: "workspace",
          },
          {
            model: User,
            as: "inviter",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      return member;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create pending workspace member with invitation
   */
  async createPendingMember(
    workspaceId,
    email,
    role,
    invitedBy,
    invitationToken
  ) {
    try {
      const { WorkspaceMember } = require("../models");
      const crypto = require("crypto");

      console.log("Creating pending member", {
        workspaceId,
        email,
        role,
        invitedBy,
        invitationToken,
      });

      // Check if invitation already exists
      const existingInvitation = await WorkspaceMember.findOne({
        where: {
          workspaceId,
          invitationToken: { [require("sequelize").Op.ne]: null },
          status: "pending",
        },
        include: [
          {
            model: require("../models").User,
            as: "user",
            where: { email },
          },
        ],
      });

      if (existingInvitation) {
        // Update existing invitation
        return await existingInvitation.update({
          email, // Update email as well
          role,
          invitationToken,
          invitationTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          invitedBy,
          invitedAt: new Date(),
        });
      }

      // Create new pending member
      return await WorkspaceMember.create({
        workspaceId,
        userId: null, // Will be set when invitation is accepted
        email, // Store email for pending invitations
        role,
        invitationToken,
        invitationTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedBy,
        invitedAt: new Date(),
        status: "pending",
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activate pending member after accepting invitation
   */
  async activatePendingMember(invitationToken, userId) {
    try {
      const { WorkspaceMember } = require("../models");

      const member = await WorkspaceMember.findOne({
        where: { invitationToken },
      });

      if (!member) return null;

      return await member.update({
        userId,
        status: "active",
        joinedAt: new Date(),
        invitationToken: null,
        invitationTokenExpiry: null,
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WorkspaceRepository();
