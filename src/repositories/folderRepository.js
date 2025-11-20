const { Folder, Workspace, User } = require("../models");
const { Op } = require("sequelize");
const transactionRepository = require("./transactionRepository");

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
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
          // Transaction, Receipt, Invoice will be added in Phase 4
        ];
      }

      const folder = await Folder.findOne(options);

      if (folder && includeRelations) {
        // Get transaction counts for this folder
        const transactionCounts = await transactionRepository.getTransactionCountsByFolders([folder.id]);
        const counts = transactionCounts[folder.id] || {
          matchedTransactions: 0,
          exceptionTransactions: 0,
        };

        const folderJson = folder.toJSON();
        return {
          ...folderJson,
          matchedTransactions: counts.matchedTransactions,
          exceptionTransactions: counts.exceptionTransactions,
        };
      }

      return folder;
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
      // Status filter - supports single value or array
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { [Op.in]: filters.status };
        } else {
          where.status = filters.status;
        }
      }

      // Priority filter - supports single value or array
      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          where.priority = { [Op.in]: filters.priority };
        } else {
          where.priority = filters.priority;
        }
      }

      // Assignee filter - supports single value, array, and null (no assignee)
      if (filters.assignedToId !== undefined) {
        if (Array.isArray(filters.assignedToId)) {
          // Check if array contains null (no assignee)
          const hasNull = filters.assignedToId.includes(null);
          const nonNullIds = filters.assignedToId.filter(id => id !== null);

          if (hasNull && nonNullIds.length > 0) {
            // Filter for both null and specific IDs
            where.assignedToId = {
              [Op.or]: [
                { [Op.in]: nonNullIds },
                { [Op.is]: null }
              ]
            };
          } else if (hasNull) {
            // Only null (no assignee)
            where.assignedToId = { [Op.is]: null };
          } else {
            // Only specific IDs
            where.assignedToId = { [Op.in]: nonNullIds };
          }
        } else {
          // Single value
          where.assignedToId = filters.assignedToId;
        }
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

      // Filter by closing date range (for reports)
      if (filters.closingDateRange) {
        where.closingDate = {
          [Op.between]: [filters.closingDateRange.start, filters.closingDateRange.end],
        };
      }

      // Filter by compliance score range
      if (filters.complianceRange) {
        where.complianceScore = {
          [Op.between]: [filters.complianceRange.min, filters.complianceRange.max],
        };
      }

      // Filter by parent folder ID
      if (filters.parentFolderId !== undefined) {
        where.parentFolderId = filters.parentFolderId;
      }

      const { count, rows } = await Folder.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "assignedTo",
            attributes: ["id", "name", "email"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      });

      // Get transaction counts for all folders
      const folderIds = rows.map((folder) => folder.id);
      const transactionCounts = await transactionRepository.getTransactionCountsByFolders(folderIds);

      // Add transaction counts to each folder
      const foldersWithCounts = rows.map((folder) => {
        const folderJson = folder.toJSON();
        const counts = transactionCounts[folder.id] || {
          matchedTransactions: 0,
          exceptionTransactions: 0,
        };
        return {
          ...folderJson,
          matchedTransactions: counts.matchedTransactions,
          exceptionTransactions: counts.exceptionTransactions,
        };
      });

      // Get total counts by folder type for the workspace
      const totalReconciliationFolders = await Folder.count({
        where: {
          workspaceId,
          type: 'RECONCILIATION'
        },
      });

      const totalGeneralFolders = await Folder.count({
        where: {
          workspaceId,
          type: 'GENERAL'
        },
      });

      return {
        folders: foldersWithCounts,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          itemsPerPage: limit,
          totalReconciliationFolders,
          totalGeneralFolders,
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
