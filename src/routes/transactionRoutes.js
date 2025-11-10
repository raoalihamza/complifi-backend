const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const {protect} = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

// All routes require authentication
router.use(protect);

/**
 * @route   POST /reconciliation/create
 * @desc    Create reconciliation folder by uploading statement
 * @access  Private
 * @body    { statementType: 'BANK' | 'CARD', workspaceId: number }
 * @file    statement file (PDF, CSV, XLSX)
 */
router.post(
  "/reconciliation/create",
  uploadMiddleware.single("statement"),
  transactionController.createReconciliationFolder
);

/**
 * @route   POST /folders/:folderId/statements
 * @desc    Upload and process bank statement
 * @access  Private
 */
router.post(
  "/folders/:folderId/statements",
  uploadMiddleware.single("statement"),
  transactionController.uploadStatement
);

/**
 * @route   GET /folders/:folderId/transactions
 * @desc    Get all transactions for a folder
 * @access  Private
 */
router.get(
  "/folders/:folderId/transactions",
  transactionController.getTransactions
);

/**
 * @route   GET /transactions/:id
 * @desc    Get single transaction
 * @access  Private
 */
router.get("/transactions/:id", transactionController.getTransaction);

/**
 * @route   PATCH /transactions/:id/status
 * @desc    Update transaction status
 * @access  Private
 */
router.patch("/transactions/:id/status", transactionController.updateStatus);

/**
 * @route   PATCH /transactions/:id/flag
 * @desc    Toggle transaction flag
 * @access  Private
 */
router.patch("/transactions/:id/flag", transactionController.toggleFlag);

/**
 * @route   PUT /transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
router.put("/transactions/:id", transactionController.updateTransaction);

/**
 * @route   DELETE /transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.delete("/transactions/:id", transactionController.deleteTransaction);

module.exports = router;
