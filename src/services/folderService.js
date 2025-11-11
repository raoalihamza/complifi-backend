const folderRepository = require("../repositories/folderRepository");
const workspaceRepository = require("../repositories/workspaceRepository");
const userRepository = require("../repositories/userRepository");
const {
  HTTP_STATUS,
  WORKSPACE_ROLES,
  FOLDER_TYPES,
  FOLDER_STATUS
} = require("../config/constants");

class FolderService {
  /**
   * Create new folder
   * SUPER_ADMIN and EDITOR can create folders
   */
  async createFolder(userId, workspaceId, folderData) {
    try {
      // Verify user has access to workspace
      const hasAccess = await workspaceRepository.isMember(workspaceId, userId);

      if (!hasAccess) {
        const error = new Error("Access denied to this workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Check if user is SUPER_ADMIN
      const user = await userRepository.findById(userId);
      const isSuperAdmin = user && user.isSuperAdmin;

      // Get user's workspace role
      const userRole = await workspaceRepository.getMemberRole(
        workspaceId,
        userId
      );

      // Only SUPER_ADMIN or EDITOR can create folders
      if (!isSuperAdmin && userRole !== WORKSPACE_ROLES.EDITOR) {
        const error = new Error(
          "Only company owner or editor can create folders"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Create folder
      const folder = await folderRepository.create({
        ...folderData,
        workspaceId,
      });

      return await folderRepository.findById(folder.id, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all folders in workspace with filters
   */
  async getFolders(userId, workspaceId, filters = {}, pagination = {}) {
    try {
      // Verify user has access to workspace
      const hasAccess = await workspaceRepository.isMember(workspaceId, userId);

      if (!hasAccess) {
        const error = new Error("Access denied to this workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Get folders with filters and pagination
      const result = await folderRepository.findByWorkspaceId(
        workspaceId,
        filters,
        pagination
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get folder by ID
   */
  async getFolderById(userId, folderId) {
    try {
      // Get folder
      const folder = await folderRepository.findById(folderId, true);

      if (!folder) {
        const error = new Error("Folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Verify user has access to folder's workspace
      const hasAccess = await workspaceRepository.isMember(
        folder.workspaceId,
        userId
      );

      if (!hasAccess) {
        const error = new Error("Access denied to this folder");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // TODO Phase 4: Include counts for transactions, receipts, invoices
      return folder;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update folder
   * SUPER_ADMIN and EDITOR can update folders
   */
  async updateFolder(userId, folderId, updateData) {
    try {
      // Get folder
      const folder = await folderRepository.findById(folderId);

      if (!folder) {
        const error = new Error("Folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if user is SUPER_ADMIN
      const user = await userRepository.findById(userId);
      const isSuperAdmin = user && user.isSuperAdmin;

      // Get user's workspace role
      const userRole = await workspaceRepository.getMemberRole(
        folder.workspaceId,
        userId
      );

      // Only SUPER_ADMIN or EDITOR can update folders
      if (!isSuperAdmin && userRole !== WORKSPACE_ROLES.EDITOR) {
        const error = new Error(
          "Only company owner or editor can update folders"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Cannot change type after creation
      if (updateData.type && updateData.type !== folder.type) {
        const error = new Error("Cannot change folder type after creation");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Update allowed fields
      const allowedFields = ["name", "priority", "assignedToId", "closingDate"];
      const filteredData = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      await folderRepository.update(folderId, filteredData);
      return await folderRepository.findById(folderId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete folder
   * RECONCILIATION folders: Only SUPER_ADMIN can delete
   * GENERAL folders: Creator or SUPER_ADMIN can delete
   */
  async deleteFolder(userId, folderId) {
    try {
      // Get folder
      const folder = await folderRepository.findById(folderId);

      if (!folder) {
        const error = new Error("Folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Verify user is Super Admin
      const user = await userRepository.findById(userId);
      const isSuperAdmin = user && user.isSuperAdmin;

      // Permission check based on folder type
      if (folder.type === FOLDER_TYPES.RECONCILIATION) {
        // Only SUPER_ADMIN can delete reconciliation folders
        if (!isSuperAdmin) {
          const error = new Error(
            "Only company owner can delete reconciliation folders"
          );
          error.statusCode = HTTP_STATUS.FORBIDDEN;
          throw error;
        }
      } else if (folder.type === FOLDER_TYPES.GENERAL) {
        // Creator or SUPER_ADMIN can delete general folders
        const isCreator = folder.createdBy === userId;
        if (!isSuperAdmin && !isCreator) {
          const error = new Error(
            "Only the folder creator or company owner can delete general folders"
          );
          error.statusCode = HTTP_STATUS.FORBIDDEN;
          throw error;
        }
      }

      await folderRepository.delete(folderId);

      return { message: "Folder deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign folder to user
   * SUPER_ADMIN and EDITOR can assign folders
   * Only RECONCILIATION folders can be assigned
   */
  async assignFolder(userId, folderId, assigneeId) {
    try {
      // Get folder
      const folder = await folderRepository.findById(folderId);

      if (!folder) {
        const error = new Error("Folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Only reconciliation folders can be assigned
      if (folder.type !== FOLDER_TYPES.RECONCILIATION) {
        const error = new Error("Only reconciliation folders can be assigned");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Check if user is SUPER_ADMIN
      const user = await userRepository.findById(userId);
      const isSuperAdmin = user && user.isSuperAdmin;

      // Get user's workspace role
      const userRole = await workspaceRepository.getMemberRole(
        folder.workspaceId,
        userId
      );

      // Only SUPER_ADMIN or EDITOR can assign folders
      if (!isSuperAdmin && userRole !== WORKSPACE_ROLES.EDITOR) {
        const error = new Error(
          "Only company owner or editor can assign folders"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Verify assignee is workspace member
      const assigneeIsMember = await workspaceRepository.isMember(
        folder.workspaceId,
        assigneeId
      );

      if (!assigneeIsMember) {
        const error = new Error("Assignee must be a member of the workspace");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Verify assignee is not a viewer
      const assigneeRole = await workspaceRepository.getMemberRole(
        folder.workspaceId,
        assigneeId
      );

      if (assigneeRole === WORKSPACE_ROLES.VIEWER) {
        const error = new Error("Cannot assign folders to viewers");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Assign folder
      await folderRepository.updateAssignee(folderId, assigneeId);
      return await folderRepository.findById(folderId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update folder status
   * Only RECONCILIATION folders have statuses
   * SUPER_ADMIN and EDITOR can update status
   */
  async updateFolderStatus(userId, folderId, newStatus) {
    try {
      // Get folder
      const folder = await folderRepository.findById(folderId);

      if (!folder) {
        const error = new Error("Folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Only reconciliation folders have statuses
      if (folder.type !== FOLDER_TYPES.RECONCILIATION) {
        const error = new Error(
          "Only reconciliation folders can have status changes"
        );
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Check if user is SUPER_ADMIN
      const user = await userRepository.findById(userId);
      const isSuperAdmin = user && user.isSuperAdmin;

      // Get user's workspace role
      const userRole = await workspaceRepository.getMemberRole(
        folder.workspaceId,
        userId
      );

      // Only SUPER_ADMIN or EDITOR can update status
      if (!isSuperAdmin && userRole !== WORKSPACE_ROLES.EDITOR) {
        const error = new Error(
          "Only company owner or editor can update folder status"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Update status
      await folderRepository.updateStatus(folderId, newStatus);

      return await folderRepository.findById(folderId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update folder priority
   * SUPER_ADMIN and EDITOR can update priority
   */
  async updateFolderPriority(userId, folderId, newPriority) {
    try {
      // Get folder
      const folder = await folderRepository.findById(folderId);

      if (!folder) {
        const error = new Error("Folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if user is SUPER_ADMIN
      const user = await userRepository.findById(userId);
      const isSuperAdmin = user && user.isSuperAdmin;

      // Get user's workspace role
      const userRole = await workspaceRepository.getMemberRole(
        folder.workspaceId,
        userId
      );

      // Only SUPER_ADMIN or EDITOR can update priority
      if (!isSuperAdmin && userRole !== WORKSPACE_ROLES.EDITOR) {
        const error = new Error(
          "Only company owner or editor can update folder priority"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Update priority
      await folderRepository.updatePriority(folderId, newPriority);

      return await folderRepository.findById(folderId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Job Board (folders grouped by status for Kanban view)
   * Only shows RECONCILIATION folders
   */
  async getJobBoard(userId, workspaceId, filters = {}) {
    try {
      // Verify user has access to workspace
      const hasAccess = await workspaceRepository.isMember(workspaceId, userId);

      if (!hasAccess) {
        const error = new Error("Access denied to this workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Get all RECONCILIATION folders only
      const allFolders = await folderRepository.findByWorkspaceId(
        workspaceId,
        { ...filters, type: FOLDER_TYPES.RECONCILIATION },
        { page: 1, limit: 1000 } // Get all folders
      );

      // Group by status
      const jobBoard = {
        TO_DO: [],
        IN_PROGRESS: [],
        IN_REVIEW: [],
        CLOSED: [],
      };

      allFolders.folders.forEach((folder) => {
        jobBoard[folder.status].push(folder);
      });

      return {
        TO_DO: {
          count: jobBoard.TO_DO.length,
          folders: jobBoard.TO_DO,
        },
        IN_PROGRESS: {
          count: jobBoard.IN_PROGRESS.length,
          folders: jobBoard.IN_PROGRESS,
        },
        IN_REVIEW: {
          count: jobBoard.IN_REVIEW.length,
          folders: jobBoard.IN_REVIEW,
        },
        CLOSED: {
          count: jobBoard.CLOSED.length,
          folders: jobBoard.CLOSED,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a General Folder (empty folder for organization)
   * SUPER_ADMIN and EDITOR can create general folders
   */
  async createGeneralFolder(userId, workspaceId, folderName, statementType) {
    try {
      // Verify user has access to workspace
      const hasAccess = await workspaceRepository.isMember(workspaceId, userId);

      if (!hasAccess) {
        const error = new Error("Access denied to this workspace");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Check if user is SUPER_ADMIN
      const user = await userRepository.findById(userId);
      const isSuperAdmin = user && user.isSuperAdmin;

      // Get user's workspace role
      const userRole = await workspaceRepository.getMemberRole(
        workspaceId,
        userId
      );

      // Only SUPER_ADMIN or EDITOR can create folders
      if (!isSuperAdmin && userRole !== WORKSPACE_ROLES.EDITOR) {
        const error = new Error(
          "Only company owner or editor can create folders"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Create general folder
      const folder = await folderRepository.create({
        name: folderName,
        workspaceId,
        type: FOLDER_TYPES.GENERAL,
        statementType,
        createdBy: userId,
        status: FOLDER_STATUS.TO_DO,
        complianceScore: 0,
      });

      return await folderRepository.findById(folder.id, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a Reconciliation Folder (after statement upload)
   * Called internally from transaction controller
   */
  async createReconciliationFolder(
    userId,
    workspaceId,
    statementType,
    folderName,
    statementFileUrl
  ) {
    try {
      // Create reconciliation folder
      const folder = await folderRepository.create({
        name: folderName,
        workspaceId,
        type: FOLDER_TYPES.RECONCILIATION,
        statementType,
        statementFileUrl,
        createdBy: userId,
        status: FOLDER_STATUS.TO_DO,
        complianceScore: 0,
      });

      return await folderRepository.findById(folder.id, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Copy reconciliation folder to a general folder
   */
  async copyFolderToGeneral(userId, folderId, targetGeneralFolderId) {
    try {
      // Get source folder
      const sourceFolder = await folderRepository.findById(folderId);

      if (!sourceFolder) {
        const error = new Error("Source folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Verify source is a reconciliation folder
      if (sourceFolder.type !== FOLDER_TYPES.RECONCILIATION) {
        const error = new Error("Can only copy reconciliation folders");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Get target folder
      const targetFolder = await folderRepository.findById(targetGeneralFolderId);

      if (!targetFolder) {
        const error = new Error("Target folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Verify target is a general folder
      if (targetFolder.type !== FOLDER_TYPES.GENERAL) {
        const error = new Error("Target must be a general folder");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Verify both folders are in same workspace
      if (sourceFolder.workspaceId !== targetFolder.workspaceId) {
        const error = new Error("Folders must be in the same workspace");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Verify user has access
      const hasAccess = await workspaceRepository.isMember(
        sourceFolder.workspaceId,
        userId
      );

      if (!hasAccess) {
        const error = new Error("Access denied");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Update source folder to have parent
      await folderRepository.update(folderId, {
        parentFolderId: targetGeneralFolderId,
      });

      return await folderRepository.findById(folderId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get child folders of a general folder
   */
  async getChildFolders(userId, parentFolderId) {
    try {
      // Get parent folder
      const parentFolder = await folderRepository.findById(parentFolderId);

      if (!parentFolder) {
        const error = new Error("Folder not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Verify user has access
      const hasAccess = await workspaceRepository.isMember(
        parentFolder.workspaceId,
        userId
      );

      if (!hasAccess) {
        const error = new Error("Access denied");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Get child folders
      const childFolders = await folderRepository.findByWorkspaceId(
        parentFolder.workspaceId,
        { parentFolderId: parentFolderId },
        { page: 1, limit: 1000 }
      );

      return childFolders;
    } catch (error) {
      throw error;
    }
  }
}


module.exports = new FolderService();
