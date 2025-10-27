const { Workspace, WorkspaceMember, User } = require("../models");
const { Op } = require("sequelize");

class WorkspaceRepository {
  /**
   * Create new workspace
   */
  async create(workspaceData) {
    try {
      return await Workspace.create(workspaceData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find workspace by ID
   */
  async findById(id, includeMembers = false) {
    try {
      const options = {
        where: { id },
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "name", "email"],
          },
        ],
      };

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
      return await Workspace.findAll({
        where: { ownerId },
        include: [
          {
            model: User,
            as: "owner",
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
      // Get workspaces where user is owner
      const ownedWorkspaces = await Workspace.findAll({
        where: { ownerId: userId },
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "name", "email"],
          },
          {
            model: WorkspaceMember,
            as: "members",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Get workspaces where user is member
      const memberWorkspaces = await Workspace.findAll({
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "name", "email"],
          },
          {
            model: WorkspaceMember,
            as: "members",
            where: { userId },
            required: true,
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Combine and remove duplicates
      const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces];
      const uniqueWorkspaces = Array.from(
        new Map(allWorkspaces.map((w) => [w.id, w])).values()
      );

      return uniqueWorkspaces;
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
  async addMember(workspaceId, userId, role) {
    try {
      return await WorkspaceMember.create({
        workspaceId,
        userId,
        role,
      });
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
      // Check if user is owner
      const workspace = await Workspace.findOne({
        where: { id: workspaceId, ownerId: userId },
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
      // Check if user is owner
      const workspace = await Workspace.findOne({
        where: { id: workspaceId, ownerId: userId },
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
}

module.exports = new WorkspaceRepository();
