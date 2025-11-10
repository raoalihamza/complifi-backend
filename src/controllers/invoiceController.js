const invoiceRepository = require("../repositories/invoiceRepository");
const folderRepository = require("../repositories/folderRepository");
const ocrService = require("../services/ocrService");
const reconciliationService = require("../services/reconciliationService");
const fileHelper = require("../helpers/fileHelper");
const path = require("path");
const { STATEMENT_TYPES, FOLDER_TYPES } = require("../config/constants");

class InvoiceController {
  /**
   * Upload and process invoices (single or multiple)
   * POST /folders/:folderId/invoices
   */
  async uploadInvoices(req, res) {
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

      // Validate folder is a BANK reconciliation folder
      if (folder.type !== FOLDER_TYPES.RECONCILIATION) {
        return res.status(400).json({
          success: false,
          message: "Invoices can only be uploaded to reconciliation folders",
        });
      }

      if (folder.statementType !== STATEMENT_TYPES.BANK) {
        return res.status(400).json({
          success: false,
          message: "Invoices can only be uploaded to BANK statement folders. For CARD statements, please upload receipts instead.",
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
          message: "Maximum 5 invoices can be uploaded at once",
        });
      }

      const processedInvoices = [];
      const errors = [];

      // Process each invoice
      for (const file of req.files) {
        try {
          // Run OCR on invoice
          const ocrData = await ocrService.processInvoice(file.path);

          // Create invoice record
          const invoiceData = {
            folderId: parseInt(folderId),
            invoiceNumber: ocrData.invoiceNumber || null,
            invoiceDate: ocrData.invoiceDate
              ? new Date(ocrData.invoiceDate)
              : null,
            dueDate: ocrData.dueDate ? new Date(ocrData.dueDate) : null,
            vendorName: ocrData.vendorName,
            amount: parseFloat(ocrData.amount),
            tax: ocrData.tax ? parseFloat(ocrData.tax) : null,
            netAmount: parseFloat(ocrData.netAmount),
            imageUrl: `/uploads/invoices/${file.filename}`,
            uploadedBy: userId,
          };

          const invoice = await invoiceRepository.create(invoiceData);
          processedInvoices.push(invoice);
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

      // Perform automatic reconciliation if invoices were processed
      let reconciliationResult = null;
      if (processedInvoices.length > 0) {
        try {
          // Run reconciliation to match transactions with invoices
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
          // The invoices are still uploaded successfully
        }
      }

      res.status(201).json({
        success: true,
        message: `${processedInvoices.length} invoice(s) processed successfully`,
        data: {
          invoices: processedInvoices,
          totalProcessed: processedInvoices.length,
          errors: errors.length > 0 ? errors : undefined,
          reconciliation: reconciliationResult,
        },
      });
    } catch (error) {
      console.error("Upload Invoices Error:", error);

      // Clean up all uploaded files on error
      if (req.files) {
        req.files.forEach((file) => fileHelper.deleteFile(file.path));
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to process invoices",
      });
    }
  }

  /**
   * Get all invoices for a folder
   * GET /folders/:folderId/invoices
   */
  async getInvoices(req, res) {
    try {
      const { folderId } = req.params;
      const invoices = await invoiceRepository.findByFolderId(folderId);

      res.status(200).json({
        success: true,
        data: {
          invoices,
          total: invoices.length,
        },
      });
    } catch (error) {
      console.error("Get Invoices Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve invoices",
      });
    }
  }

  /**
   * Get single invoice
   * GET /invoices/:id
   */
  async getInvoice(req, res) {
    try {
      const { id } = req.params;
      const invoice = await invoiceRepository.findById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      console.error("Get Invoice Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve invoice",
      });
    }
  }

  /**
   * View invoice image
   * GET /invoices/:id/view
   */
  async viewInvoice(req, res) {
    try {
      const { id } = req.params;
      const invoice = await invoiceRepository.findById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      const filePath = path.join(__dirname, "../../", invoice.imageUrl);
      res.sendFile(filePath);
    } catch (error) {
      console.error("View Invoice Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve invoice image",
      });
    }
  }

  /**
   * Update invoice
   * PUT /invoices/:id
   */
  async updateInvoice(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const invoice = await invoiceRepository.update(id, updateData);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Invoice updated",
        data: invoice,
      });
    } catch (error) {
      console.error("Update Invoice Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update invoice",
      });
    }
  }

  /**
   * Delete invoice
   * DELETE /invoices/:id
   */
  async deleteInvoice(req, res) {
    try {
      const { id } = req.params;
      const invoice = await invoiceRepository.findById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Delete file from storage
      const filePath = path.join(__dirname, "../../", invoice.imageUrl);
      fileHelper.deleteFile(filePath);

      // Delete database record
      await invoiceRepository.delete(id);

      res.status(200).json({
        success: true,
        message: "Invoice deleted",
      });
    } catch (error) {
      console.error("Delete Invoice Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete invoice",
      });
    }
  }
}

module.exports = new InvoiceController();
