const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const workspaceRoutes = require("./workspaceRoutes");
const folderRoutes = require("./folderRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/folders", folderRoutes);

// Health check for API
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Complifi API v1",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      workspaces: "/api/v1/workspaces",
      folders: "/api/v1/folders",
    },
  });
});

module.exports = router;
