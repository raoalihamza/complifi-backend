const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController");
const { protect } = require("../middlewares/authMiddleware");
const { checkWorkspaceAccess } = require("../middlewares/workspaceMiddleware");
const validate = require("../middlewares/validator");
const {
  createFolderSchema,
  updateFolderSchema,
  updateStatusSchema,
  updatePrioritySchema,
  assignFolderSchema,
} = require("../validations/foldervalidation");

// Create general folder (empty folder)
// POST /api/v1/folders/general
router.post("/general", protect, folderController.createGeneralFolder);

// Direct folder routes (by ID)
// GET /api/v1/folders/:id
router.get("/:id", protect, folderController.getFolderById);

// PUT /api/v1/folders/:id
router.put(
  "/:id",
  protect,
  validate(updateFolderSchema),
  folderController.updateFolder
);

// DELETE /api/v1/folders/:id
router.delete("/:id", protect, folderController.deleteFolder);

// PATCH /api/v1/folders/:id/assign
router.patch(
  "/:id/assign",
  protect,
  validate(assignFolderSchema),
  folderController.assignFolder
);

// PATCH /api/v1/folders/:id/status
router.patch(
  "/:id/status",
  protect,
  validate(updateStatusSchema),
  folderController.updateStatus
);

// PATCH /api/v1/folders/:id/priority
router.patch(
  "/:id/priority",
  protect,
  validate(updatePrioritySchema),
  folderController.updatePriority
);

// POST /api/v1/folders/:id/copy
// Copy reconciliation folder to a general folder
router.post("/:id/copy", protect, folderController.copyFolderToGeneral);

// GET /api/v1/folders/:id/children
// Get child folders of a general folder
router.get("/:id/children", protect, folderController.getChildFolders);

module.exports = router;
