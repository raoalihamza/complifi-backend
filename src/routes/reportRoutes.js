const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validator");
const {
  getReportsQuerySchema,
  getReportStatisticsQuerySchema,
  downloadReportsQuerySchema,
} = require("../validations/reportValidation");

/**
 * Report Routes
 * Base path: /api/v1/reports
 */

// Get all reports with filtering
// GET /api/v1/reports
// Query params: workspaceId, statementType, status, startDate, endDate, minCompliance, maxCompliance, search, page, limit, sortBy, sortOrder
router.get(
  "/",
  protect,
  validate(getReportsQuerySchema, "query"),
  reportController.getReports
);

// Get report statistics
// GET /api/v1/reports/statistics
// Query params: workspaceId, statementType
router.get(
  "/statistics",
  protect,
  validate(getReportStatisticsQuerySchema, "query"),
  reportController.getReportStatistics
);

// Download reports as PDF
// GET /api/v1/reports/download/pdf
// Query params: workspaceId, statementType, status
router.get(
  "/download/pdf",
  protect,
  validate(downloadReportsQuerySchema, "query"),
  reportController.downloadReportsPDF
);

// Download reports as Excel
// GET /api/v1/reports/download/excel
// Query params: workspaceId, statementType, status
router.get(
  "/download/excel",
  protect,
  validate(downloadReportsQuerySchema, "query"),
  reportController.downloadReportsExcel
);

// Get report by ID
// GET /api/v1/reports/:id
router.get("/:id", protect, reportController.getReportById);

module.exports = router;
