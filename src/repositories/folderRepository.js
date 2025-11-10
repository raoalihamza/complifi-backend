const { Folder, Workspace, User } = require("../models");
const { Op } = require("sequelize");

class FolderRepository {
  /**
   * Create new folder
   */
  async create(folderData) {
    try {
      return await Folder.create(folderData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find folder by ID with optional relations
   */
  async findById(id, includeRelations = false) {
    try {
      const options = {
        where: { id },
      };

      if (includeRelations) {
        options.include = [
          {
            model: Workspace,
            as: "workspace",
            attributes: ["id", "name", "createdBy"],
          },
          {
            model: User,
            as: "assignedTo",
            attributes: ["id", "name", "email"],
          },
          // Transaction, Receipt, Invoice will be added in Phase 4
        ];
      }

      return await Folder.findOne(options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find folders by workspace with filters and pagination
   */
  async findByWorkspaceId(workspaceId, filters = {}, pagination = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where = { workspaceId };

      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.assignedToId) {
        where.assignedToId = filters.assignedToId;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.statementType) {
        where.statementType = filters.statementType;
      }

      if (filters.search) {
        where.name = {
          [Op.iLike]: `%${filters.search}%`,
        };
      }

      if (filters.dateRange) {
        where.createdAt = {
          [Op.between]: [filters.dateRange.start, filters.dateRange.end],
        };
      }

      const { count, rows } = await Folder.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "assignedTo",
            attributes: ["id", "name", "email"],
          },
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      });

      return {
        folders: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find folders assigned to user
   */
  async findByAssignee(userId, filters = {}) {
    try {
      const where = { assignedToId: userId };

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      return await Folder.findAll({
        where,
        include: [
          {
            model: Workspace,
            as: "workspace",
            attributes: ["id", "name"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update folder
   */
  async update(id, updateData) {
    try {
      const folder = await Folder.findByPk(id);
      if (!folder) return null;

      return await folder.update(updateData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete folder
   */
  async delete(id) {
    try {
      const folder = await Folder.findByPk(id);
      if (!folder) return null;

      await folder.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update folder status
   */
  async updateStatus(id, newStatus) {
    try {
      return await this.update(id, { status: newStatus });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update folder priority
   */
  async updatePriority(id, newPriority) {
    try {
      return await this.update(id, { priority: newPriority });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign folder to user
   */
  async updateAssignee(id, userId) {
    try {
      return await this.update(id, { assignedToId: userId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update compliance score
   */
  async updateComplianceScore(id, score) {
    try {
      return await this.update(id, { complianceScore: score });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get folder statistics for workspace
   */
  async getStatistics(workspaceId) {
    try {
      const folders = await Folder.findAll({
        where: { workspaceId },
        attributes: ["status", "priority", "assignedToId", "complianceScore"],
      });

      const stats = {
        total: folders.length,
        byStatus: {
          TO_DO: 0,
          IN_PROGRESS: 0,
          IN_REVIEW: 0,
          CLOSED: 0,
        },
        byPriority: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          NONE: 0,
        },
        avgComplianceScore: 0,
        assigned: 0,
        unassigned: 0,
      };

      folders.forEach((folder) => {
        // Count by status
        stats.byStatus[folder.status]++;

        // Count by priority
        if (folder.priority) {
          stats.byPriority[folder.priority]++;
        } else {
          stats.byPriority.NONE++;
        }

        // Count assigned/unassigned
        if (folder.assignedToId) {
          stats.assigned++;
        } else {
          stats.unassigned++;
        }

        // Sum compliance scores
        stats.avgComplianceScore += folder.complianceScore || 0;
      });

      // Calculate average
      if (folders.length > 0) {
        stats.avgComplianceScore = (
          stats.avgComplianceScore / folders.length
        ).toFixed(2);
      }

      return stats;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FolderRepository();
