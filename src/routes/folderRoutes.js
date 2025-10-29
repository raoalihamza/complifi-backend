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

module.exports = router;
