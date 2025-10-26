const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

/**
 * Public routes (no authentication required)
 */

// Register new user
// POST /api/v1/auth/register
router.post("/register", authController.register);

// Login user
// POST /api/v1/auth/login
router.post("/login", authController.login);

/**
 * Protected routes (authentication required)
 */

// Get current user profile
// GET /api/v1/auth/me
router.get("/me", protect, authController.getMe);

// Change password
// POST /api/v1/auth/change-password
router.post("/change-password", protect, authController.changePassword);

// Logout user (client-side token removal)
// POST /api/v1/auth/logout
router.post("/logout", protect, authController.logout);

module.exports = router;
