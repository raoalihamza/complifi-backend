const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");
const { protect } = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

// All routes require authentication
router.use(protect);

/**
 * @route   POST /folders/:folderId/receipts
 * @desc    Upload and process receipts (single or multiple)
 * @access  Private
 */
router.post(
  "/folders/:folderId/receipts",
  uploadMiddleware.array("receipts", 5), // Max 5 receipts at once
  receiptController.uploadReceipts
);

/**
 * @route   GET /folders/:folderId/receipts
 * @desc    Get all receipts for a folder
 * @access  Private
 */
router.get("/folders/:folderId/receipts", receiptController.getReceipts);

/**
 * @route   GET /receipts/:id
 * @desc    Get single receipt
 * @access  Private
 */
router.get("/receipts/:id", receiptController.getReceipt);

/**
 * @route   GET /receipts/:id/view
 * @desc    View receipt image
 * @access  Private
 */
router.get("/receipts/:id/view", receiptController.viewReceipt);

/**
 * @route   PUT /receipts/:id
 * @desc    Update receipt
 * @access  Private
 */
router.put("/receipts/:id", receiptController.updateReceipt);

/**
 * @route   DELETE /receipts/:id
 * @desc    Delete receipt
 * @access  Private
 */
router.delete("/receipts/:id", receiptController.deleteReceipt);

module.exports = router;
