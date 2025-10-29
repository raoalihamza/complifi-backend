const folderRepository = require("../repositories/folderRepository");
const workspaceRepository = require("../repositories/workspaceRepository");
const { HTTP_STATUS, WORKSPACE_ROLES } = require("../config/constants");

class FolderService {
  /**
   * Create new folder
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

      // Verify user has permission (admin/editor)
      const userRole = await workspaceRepository.getMemberRole(
        workspaceId,
        userId
      );

      if (
        userRole !== "owner" &&
        userRole !== WORKSPACE_ROLES.ADMIN &&
        userRole !== WORKSPACE_ROLES.EDITOR
      ) {
        const error = new Error(
          "Only workspace owner, admin or editor can create folders"
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

      // Verify user has permission
      const userRole = await workspaceRepository.getMemberRole(
        folder.workspaceId,
        userId
      );

      if (
        userRole !== "owner" &&
        userRole !== WORKSPACE_ROLES.ADMIN &&
        userRole !== WORKSPACE_ROLES.EDITOR
      ) {
        const error = new Error(
          "Only workspace owner, admin or editor can update folders"
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

      const updatedFolder = await folderRepository.update(
        folderId,
        filteredData
      );
      return await folderRepository.findById(folderId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete folder
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

      // Verify user has permission (owner/admin)
      const userRole = await workspaceRepository.getMemberRole(
        folder.workspaceId,
        userId
      );

      if (userRole !== "owner" && userRole !== WORKSPACE_ROLES.ADMIN) {
        const error = new Error(
          "Only workspace owner or admin can delete folders"
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // TODO Phase 4: Check if folder has associated data
      // For now, allow delete (cascade will handle relations)

      await folderRepository.delete(folderId);

      return { message: "Folder deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign folder to user
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

      // Verify user has permission
      const userRole = await workspaceRepository.getMemberRole(
        folder.workspaceId,
        userId
      );

      if (
        userRole !== "owner" &&
        userRole !== WORKSPACE_ROLES.ADMIN &&
        userRole !== WORKSPACE_ROLES.EDITOR
      ) {
        const error = new Error(
          "Only workspace owner, admin or editor can assign folders"
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

      // Assign folder
      await folderRepository.updateAssignee(folderId, assigneeId);
      return await folderRepository.findById(folderId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update folder status
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

      // Verify user has access
      const hasAccess = await workspaceRepository.isMember(
        folder.workspaceId,
        userId
      );

      if (!hasAccess) {
        const error = new Error("Access denied to this folder");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Update status
      await folderRepository.updateStatus(folderId, newStatus);

      // TODO Phase 6: Log status change activity

      return await folderRepository.findById(folderId, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update folder priority
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

      // Verify user has access
      const hasAccess = await workspaceRepository.isMember(
        folder.workspaceId,
        userId
      );

      if (!hasAccess) {
        const error = new Error("Access denied to this folder");
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

      // Get all folders without pagination
      const allFolders = await folderRepository.findByWorkspaceId(
        workspaceId,
        filters,
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
}

module.exports = new FolderService();
