const express = require("express");
const router = express.Router();
const workspaceController = require("../controllers/workspaceController");
const { protect } = require("../middlewares/authMiddleware");
const { checkWorkspaceAccess } = require("../middlewares/workspaceMiddleware");
const validate = require("../middlewares/validator");
const {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
} = require("../validations/workspaceValidation");
const folderController = require("../controllers/folderController");
const { createFolderSchema } = require("../validations/foldervalidation");
const checkSuperAdmin = require("../middlewares/checkSuperAdmin");

/**
 * All workspace routes require authentication
 */

// Create workspace
// POST /api/v1/workspaces
router.post(
  "/",
  protect,
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace
);

// Get all user workspaces
// GET /api/v1/workspaces
router.get("/", protect, workspaceController.getUserWorkspaces);

// Get workspace by ID
// GET /api/v1/workspaces/:id
router.get(
  "/:id",
  protect,
  checkWorkspaceAccess,
  workspaceController.getWorkspaceById
);

// Update workspace
// PUT /api/v1/workspaces/:id
// Only SUPER_ADMIN can update workspaces
router.put(
  "/:id",
  protect,
  checkSuperAdmin,
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace
);

// Delete workspace
// DELETE /api/v1/workspaces/:id
// Only SUPER_ADMIN can delete workspaces
router.delete(
  "/:id",
  protect,
  checkSuperAdmin,
  workspaceController.deleteWorkspace
);

// Get workspace members
// GET /api/v1/workspaces/:id/members
router.get(
  "/:id/members",
  protect,
  checkWorkspaceAccess,
  workspaceController.getWorkspaceMembers
);

/**
 * @route   POST /api/v1/workspaces/:id/invite
 * @desc    Invite member (Super Admin only)
 * @access  Private (Super Admin)
 */
router.post(
  "/:id/invite",
  protect,
  checkSuperAdmin,
  validate(inviteMemberSchema),
  workspaceController.inviteMember
);

/**
 * @route   POST /api/v1/workspaces/accept-invitation
 * @desc    Accept workspace invitation
 * @access  Public
 */
router.post(
  "/accept-invitation",
  validate(acceptInvitationSchema),
  workspaceController.acceptInvitation
);

// Remove member from workspace
// DELETE /api/v1/workspaces/:id/members/:memberId
// Only SUPER_ADMIN can remove members
router.delete(
  "/:id/members/:memberId",
  protect,
  checkSuperAdmin,
  workspaceController.removeMember
);

// Update member role
// PATCH /api/v1/workspaces/:id/members/:memberId
// Only SUPER_ADMIN can update member roles
router.patch(
  "/:id/members/:memberId",
  protect,
  checkSuperAdmin,
  validate(updateMemberRoleSchema),
  workspaceController.updateMemberRole
);

// Switch workspace (for UI)
// GET /api/v1/workspaces/:id/switch
router.get("/:id/switch", protect, workspaceController.switchWorkspace);

// Nested folder routes
// POST /api/v1/workspaces/:workspaceId/folders
router.post(
  "/:workspaceId/folders",
  protect,
  checkWorkspaceAccess,
  validate(createFolderSchema),
  folderController.createFolder
);

// GET /api/v1/workspaces/:workspaceId/folders
router.get(
  "/:workspaceId/folders",
  protect,
  checkWorkspaceAccess,
  folderController.getFolders
);

// GET /api/v1/workspaces/:workspaceId/job-board
router.get(
  "/:workspaceId/job-board",
  protect,
  checkWorkspaceAccess,
  folderController.getJobBoard
);

module.exports = router;
