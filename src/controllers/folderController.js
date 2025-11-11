const folderService = require("../services/folderService");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/responseHandler");
const { HTTP_STATUS } = require("../config/constants");

class FolderController {
  /**
   * Create folder
   * POST /api/v1/workspaces/:workspaceId/folders
   */
  async createFolder(req, res) {
    try {
      const { workspaceId } = req.params;
      const folderData = req.body;
      const userId = req.user.id;

      const folder = await folderService.createFolder(
        userId,
        parseInt(workspaceId),
        folderData
      );

      return successResponse(
        res,
        "Folder created successfully",
        folder,
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
   * Get all folders in workspace
   * GET /api/v1/workspaces/:workspaceId/folders
   */
  async getFolders(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.id;

      // Extract filters from query
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        assignedToId: req.query.assignedToId
          ? parseInt(req.query.assignedToId)
          : undefined,
        type: req.query.type,
        statementType: req.query.statementType,
        search: req.query.search,
      };

      // Extract pagination from query
      const pagination = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "DESC",
      };

      const result = await folderService.getFolders(
        userId,
        parseInt(workspaceId),
        filters,
        pagination
      );

      return paginatedResponse(
        res,
        "Folders fetched successfully",
        result.folders,
        result.pagination,
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
   * Get folder by ID
   * GET /api/v1/folders/:id
   */
  async getFolderById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const folder = await folderService.getFolderById(userId, parseInt(id));

      return successResponse(
        res,
        "Folder fetched successfully",
        folder,
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
   * Update folder
   * PUT /api/v1/folders/:id
   */
  async updateFolder(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const folder = await folderService.updateFolder(
        userId,
        parseInt(id),
        updateData
      );

      return successResponse(
        res,
        "Folder updated successfully",
        folder,
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
   * Delete folder
   * DELETE /api/v1/folders/:id
   */
  async deleteFolder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await folderService.deleteFolder(userId, parseInt(id));

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
   * Assign folder
   * PATCH /api/v1/folders/:id/assign
   */
  async assignFolder(req, res) {
    try {
      const { id } = req.params;
      const { assignedToId } = req.body;
      const userId = req.user.id;

      const folder = await folderService.assignFolder(
        userId,
        parseInt(id),
        parseInt(assignedToId)
      );

      return successResponse(
        res,
        "Folder assigned successfully",
        folder,
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
   * Update folder status
   * PATCH /api/v1/folders/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const folder = await folderService.updateFolderStatus(
        userId,
        parseInt(id),
        status
      );

      return successResponse(
        res,
        "Folder status updated successfully",
        folder,
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
   * Update folder priority
   * PATCH /api/v1/folders/:id/priority
   */
  async updatePriority(req, res) {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      const userId = req.user.id;

      const folder = await folderService.updateFolderPriority(
        userId,
        parseInt(id),
        priority
      );

      return successResponse(
        res,
        "Folder priority updated successfully",
        folder,
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
   * Get Job Board (Kanban view)
   * GET /api/v1/workspaces/:workspaceId/job-board
   */
  async getJobBoard(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.id;

      // Extract filters from query
      const filters = {
        priority: req.query.priority,
        assignedToId: req.query.assignedToId
          ? parseInt(req.query.assignedToId)
          : undefined,
        type: req.query.type,
        statementType: req.query.statementType,
      };

      const jobBoard = await folderService.getJobBoard(
        userId,
        parseInt(workspaceId),
        filters
      );

      return successResponse(
        res,
        "Job board fetched successfully",
        jobBoard,
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
   * Create general folder (empty folder for organization)
   * POST /api/v1/folders/general
   */
  async createGeneralFolder(req, res) {
    try {
      const { name, workspaceId, statementType } = req.body;
      const userId = req.user.id;

      if (!name || !workspaceId) {
        return errorResponse(
          res,
          "Folder name and workspace ID are required",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (!statementType) {
        return errorResponse(
          res,
          "Statement type is required (BANK or CARD)",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const folder = await folderService.createGeneralFolder(
        userId,
        parseInt(workspaceId),
        name,
        statementType
      );

      return successResponse(
        res,
        "General folder created successfully",
        folder,
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
   * Copy reconciliation folder to general folder
   * POST /api/v1/folders/:id/copy
   */
  async copyFolderToGeneral(req, res) {
    try {
      const { id } = req.params;
      const { targetGeneralFolderId } = req.body;
      const userId = req.user.id;

      if (!targetGeneralFolderId) {
        return errorResponse(
          res,
          "Target general folder ID is required",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const folder = await folderService.copyFolderToGeneral(
        userId,
        parseInt(id),
        parseInt(targetGeneralFolderId)
      );

      return successResponse(
        res,
        "Folder copied to general folder successfully",
        folder,
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
   * Get child folders of a general folder
   * GET /api/v1/folders/:id/children
   */
  async getChildFolders(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const childFolders = await folderService.getChildFolders(
        userId,
        parseInt(id)
      );

      return successResponse(
        res,
        "Child folders fetched successfully",
        childFolders,
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

module.exports = new FolderController();
