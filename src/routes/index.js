const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");

// Mount routes
router.use("/auth", authRoutes);

// Health check for API
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Complifi API v1",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
