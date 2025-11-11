const receiptRepository = require("../repositories/receiptRepository");
const folderRepository = require("../repositories/folderRepository");
const ocrService = require("../services/ocrService");
const reconciliationService = require("../services/reconciliationService");
const fileHelper = require("../helpers/fileHelper");
const path = require("path");
const { STATEMENT_TYPES, FOLDER_TYPES } = require("../config/constants");

class ReceiptController {
  /**
   * Upload and process receipts (single or multiple)
   * POST /folders/:folderId/receipts
   */
  async uploadReceipts(req, res) {
    try {
      const { folderId } = req.params;
      const userId = req.user.id;

      // Validate folder exists
      const folder = await folderRepository.findById(folderId);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }

      // Validate folder is a CARD reconciliation folder
      if (folder.type !== FOLDER_TYPES.RECONCILIATION) {
        return res.status(400).json({
          success: false,
          message: "Receipts can only be uploaded to reconciliation folders",
        });
      }

      if (folder.statementType !== STATEMENT_TYPES.CARD) {
        return res.status(400).json({
          success: false,
          message: "Receipts can only be uploaded to CARD statement folders. For BANK statements, please upload invoices instead.",
        });
      }

      // Validate files uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      // Validate file count (max 5)
      if (req.files.length > 5) {
        // Clean up uploaded files
        req.files.forEach((file) => fileHelper.deleteFile(file.path));
        return res.status(400).json({
          success: false,
          message: "Maximum 5 receipts can be uploaded at once",
        });
      }

      const processedReceipts = [];
      const errors = [];

      // Process each receipt
      for (const file of req.files) {
        try {
          // Run OCR on receipt
          const ocrData = await ocrService.processReceipt(file.path);

          // Create receipt record with flexible data structure
          const receiptData = {
            folderId: parseInt(folderId),
            receiptNumber:
              ocrData.receipt_number ||
              ocrData.order_number ||
              ocrData.invoice_number ||
              null,
            merchantName: ocrData.merchant_name,
            taxPaid: ocrData.tax_total ? parseFloat(ocrData.tax_total) : null,
            total: parseFloat(ocrData.total),
            receiptDate: ocrData.receipt_date
              ? new Date(ocrData.receipt_date)
              : null,
            imageUrl: `/uploads/receipts/${file.filename}`,
            uploadedBy: userId,
            ocrData: ocrData, // Store full OCR data
          };

          const receipt = await receiptRepository.create(receiptData);

          // Attach full OCR data to response
          const enrichedReceipt = {
            ...receipt.toJSON(),
            ocrExtraction: ocrData, // Include complete OCR extraction
          };

          processedReceipts.push(enrichedReceipt);

          // Add delay between processing to avoid API overload
          if (req.files.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`Error processing ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message,
          });
          // Clean up failed file
          fileHelper.deleteFile(file.path);
        }
      }

      // Perform automatic reconciliation if receipts were processed
      let reconciliationResult = null;
      if (processedReceipts.length > 0) {
        try {
          // Run reconciliation to match transactions with receipts
          reconciliationResult = await reconciliationService.performReconciliation(
            folderId
          );

          // Update folder status to IN_PROGRESS
          await folderRepository.update(folderId, {
            status: "IN_PROGRESS",
          });
        } catch (reconciliationError) {
          console.error("Reconciliation error:", reconciliationError);
          // Don't fail the whole request if reconciliation fails
          // The receipts are still uploaded successfully
        }
      }

      res.status(201).json({
        success: true,
        message: `${processedReceipts.length} receipt(s) processed successfully`,
        data: {
          receipts: processedReceipts,
          totalProcessed: processedReceipts.length,
          errors: errors.length > 0 ? errors : undefined,
          reconciliation: reconciliationResult,
        },
      });
    } catch (error) {
      console.error("Upload Receipts Error:", error);

      // Clean up all uploaded files on error
      if (req.files) {
        req.files.forEach((file) => fileHelper.deleteFile(file.path));
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to process receipts",
      });
    }
  }

  /**
   * Get all receipts for a folder
   * GET /folders/:folderId/receipts
   */
  async getReceipts(req, res) {
    try {
      const { folderId } = req.params;
      const receipts = await receiptRepository.findByFolderId(folderId);

      res.status(200).json({
        success: true,
        data: {
          receipts,
          total: receipts.length,
        },
      });
    } catch (error) {
      console.error("Get Receipts Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve receipts",
      });
    }
  }

  /**
   * Get single receipt
   * GET /receipts/:id
   */
  async getReceipt(req, res) {
    try {
      const { id } = req.params;
      const receipt = await receiptRepository.findById(id);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      res.status(200).json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      console.error("Get Receipt Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve receipt",
      });
    }
  }

  /**
   * View receipt image
   * GET /receipts/:id/view
   */
  async viewReceipt(req, res) {
    try {
      const { id } = req.params;
      const receipt = await receiptRepository.findById(id);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      const filePath = path.join(__dirname, "../../", receipt.imageUrl);
      res.sendFile(filePath);
    } catch (error) {
      console.error("View Receipt Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve receipt image",
      });
    }
  }

  /**
   * Update receipt
   * PUT /receipts/:id
   */
  async updateReceipt(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const receipt = await receiptRepository.update(id, updateData);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Receipt updated",
        data: receipt,
      });
    } catch (error) {
      console.error("Update Receipt Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update receipt",
      });
    }
  }

  /**
   * Delete receipt
   * DELETE /receipts/:id
   */
  async deleteReceipt(req, res) {
    try {
      const { id } = req.params;
      const receipt = await receiptRepository.findById(id);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }

      // Delete file from storage
      const filePath = path.join(__dirname, "../../", receipt.imageUrl);
      fileHelper.deleteFile(filePath);

      // Delete database record
      await receiptRepository.delete(id);

      res.status(200).json({
        success: true,
        message: "Receipt deleted",
      });
    } catch (error) {
      console.error("Delete Receipt Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete receipt",
      });
    }
  }
}

module.exports = new ReceiptController();
