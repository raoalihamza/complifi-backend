const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { protect } = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

// All routes require authentication
router.use(protect);

/**
 * @route   POST /folders/:folderId/invoices
 * @desc    Upload and process invoices (single or multiple)
 * @access  Private
 */
router.post(
  "/folders/:folderId/invoices",
  uploadMiddleware.array("invoices", 5), // Max 5 invoices at once
  invoiceController.uploadInvoices
);

/**
 * @route   GET /folders/:folderId/invoices
 * @desc    Get all invoices for a folder
 * @access  Private
 */
router.get("/folders/:folderId/invoices", invoiceController.getInvoices);

/**
 * @route   GET /invoices/:id
 * @desc    Get single invoice
 * @access  Private
 */
router.get("/invoices/:id", invoiceController.getInvoice);

/**
 * @route   GET /invoices/:id/view
 * @desc    View invoice image
 * @access  Private
 */
router.get("/invoices/:id/view", invoiceController.viewInvoice);

/**
 * @route   PUT /invoices/:id
 * @desc    Update invoice
 * @access  Private
 */
router.put("/invoices/:id", invoiceController.updateInvoice);

/**
 * @route   DELETE /invoices/:id
 * @desc    Delete invoice
 * @access  Private
 */
router.delete("/invoices/:id", invoiceController.deleteInvoice);

module.exports = router;
