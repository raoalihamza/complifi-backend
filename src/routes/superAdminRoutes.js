const express = require("express");
const router = express.Router();
const superAdminController = require("../controllers/superAdminController");
const { protect } = require("../middlewares/authMiddleware");
const checkOwner = require("../middlewares/checkOwner");
const {
  createSuperAdminSchema,
  updateSuperAdminSchema,
  toggleSuperAdminStatusSchema,
  paginationSchema,
} = require("../validations/superAdminValidation");

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const dataToValidate = req.method === "GET" ? req.query : req.body;
    const { error } = schema.validate(dataToValidate, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }
    next();
  };
};

/**
 * ========================================
 * SUPER ADMIN MANAGEMENT ROUTES
 * All routes require Owner authentication
 * ========================================
 */

/**
 * Create a new Super Admin
 * POST /api/v1/super-admin
 */
router.post(
  "/",
  protect,
  checkOwner,
  validate(createSuperAdminSchema),
  superAdminController.createSuperAdmin
);

/**
 * Get all Super Admins with pagination
 * GET /api/v1/super-admin
 */
router.get(
  "/",
  protect,
  checkOwner,
  validate(paginationSchema),
  superAdminController.getAllSuperAdmins
);

/**
 * Get a single Super Admin by ID
 * GET /api/v1/super-admin/:id
 */
router.get(
  "/:id",
  protect,
  checkOwner,
  superAdminController.getSuperAdminById
);

/**
 * Update Super Admin
 * PUT /api/v1/super-admin/:id
 */
router.put(
  "/:id",
  protect,
  checkOwner,
  validate(updateSuperAdminSchema),
  superAdminController.updateSuperAdmin
);

/**
 * Delete Super Admin
 * DELETE /api/v1/super-admin/:id
 */
router.delete(
  "/:id",
  protect,
  checkOwner,
  superAdminController.deleteSuperAdmin
);

/**
 * Toggle Super Admin status (enable/disable)
 * PATCH /api/v1/super-admin/:id/toggle-status
 */
router.patch(
  "/:id/toggle-status",
  protect,
  checkOwner,
  validate(toggleSuperAdminStatusSchema),
  superAdminController.toggleSuperAdminStatus
);

module.exports = router;
