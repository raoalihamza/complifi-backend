const express = require("express");
const router = express.Router();
const workspaceController = require("../controllers/workspaceController");
const { protect } = require("../middlewares/authMiddleware");
const {
  checkWorkspaceAccess,
  checkWorkspaceRole,
} = require("../middlewares/workspaceMiddleware");
const validate = require("../middlewares/validator");
const {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} = require("../validations/workspaceValidation");

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
router.put(
  "/:id",
  protect,
  checkWorkspaceAccess,
  checkWorkspaceRole("owner", "admin"),
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace
);

// Delete workspace
// DELETE /api/v1/workspaces/:id
router.delete(
  "/:id",
  protect,
  checkWorkspaceAccess,
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

// Invite member to workspace
// POST /api/v1/workspaces/:id/members
router.post(
  "/:id/members",
  protect,
  checkWorkspaceAccess,
  checkWorkspaceRole("owner", "admin"),
  validate(inviteMemberSchema),
  workspaceController.inviteMember
);

// Remove member from workspace
// DELETE /api/v1/workspaces/:id/members/:memberId
router.delete(
  "/:id/members/:memberId",
  protect,
  checkWorkspaceAccess,
  checkWorkspaceRole("owner", "admin"),
  workspaceController.removeMember
);

// Update member role
// PATCH /api/v1/workspaces/:id/members/:memberId
router.patch(
  "/:id/members/:memberId",
  protect,
  checkWorkspaceAccess,
  checkWorkspaceRole("owner", "admin"),
  validate(updateMemberRoleSchema),
  workspaceController.updateMemberRole
);

// Switch workspace (for UI)
// GET /api/v1/workspaces/:id/switch
router.get("/:id/switch", protect, workspaceController.switchWorkspace);

module.exports = router;
