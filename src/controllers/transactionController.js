const transactionRepository = require("../repositories/transactionRepository");
const folderRepository = require("../repositories/folderRepository");
const ocrService = require("../services/ocrService");
const fileHelper = require("../helpers/fileHelper");

class TransactionController {
  /**
   * Upload and process bank/card statement
   * POST /folders/:folderId/statements
   */
  async uploadStatement(req, res) {
    try {
      const { folderId } = req.params;
      const userId = req.user.id;

      // Validate folder exists and user has access
      const folder = await folderRepository.findById(folderId);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }

      // Validate file upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Process statement with OCR
      const ocrData = await ocrService.processStatement(req.file.path);

      console.log("OCR Data:", ocrData);

      // Create transactions from OCR data
      const transactionsData = ocrData.transactions.map((transaction) => ({
        folderId: parseInt(folderId),
        merchantName: transaction.merchant || transaction.description,
        date: new Date(transaction.date),
        value: parseFloat(transaction.amount),
        category: transaction.category || null,
        status: "PENDING",
        flagged:
          transaction.flags && transaction.flags.length > 0 ? true : false,
        notes: transaction.flags ? JSON.stringify(transaction.flags) : null,
      }));

      const createdTransactions = await transactionRepository.bulkCreate(
        transactionsData
      );

      // Update folder status
      await folderRepository.update(folderId, {
        status: "IN_PROGRESS",
      });

      // Prepare comprehensive response with all OCR data
      const responseData = {
        totalTransactions: createdTransactions.length,
        extractedTransactions: createdTransactions,
        fileInfo: {
          filename: req.file.originalname,
          size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedAt: new Date().toISOString(),
        },
        // Include all analytics from OCR
        analytics: {
          currency: ocrData.currency || null,
          totalFees: ocrData.totalFees || 0,
          totalSpend: ocrData.totalSpend || 0,
          subscriptions: ocrData.subscriptions || [],
          duplicates: ocrData.duplicates || [],
          feeByCategory: ocrData.feeByCategory || {},
          topFeeMerchants: ocrData.topFeeMerchants || {},
          feesOverTime: ocrData.feesOverTime || {},
          hiddenFees: ocrData.hiddenFees || [],
          flagged: ocrData.flagged || [],
          interestPaidAmount: ocrData.interest_paid_amount || 0,
          monthlyInterestRatePercent:
            ocrData.monthly_interest_rate_percent || null,
          aprPercentNominal: ocrData.apr_percent_nominal || null,
          averageDailyBalance: ocrData.average_daily_balance || null,
          openingBalance: ocrData.opening_balance || null,
          closingBalance: ocrData.closing_balance || null,
        },
        // Include tips and suggestions
        tips: ocrData.tips || [],
        cardSuggestions: ocrData.cardSuggestions || [],
      };

      // Include any additional fields from OCR (dynamic fields)
      const standardFields = [
        "transactions",
        "currency",
        "totalFees",
        "totalSpend",
        "subscriptions",
        "duplicates",
        "feeByCategory",
        "topFeeMerchants",
        "feesOverTime",
        "tips",
        "cardSuggestions",
        "hiddenFees",
        "flagged",
        "interest_paid_amount",
        "monthly_interest_rate_percent",
        "apr_percent_nominal",
        "total_transactions",
        "average_daily_balance",
        "opening_balance",
        "closing_balance",
      ];

      const additionalFields = {};
      Object.keys(ocrData).forEach((key) => {
        if (!standardFields.includes(key)) {
          additionalFields[key] = ocrData[key];
        }
      });

      if (Object.keys(additionalFields).length > 0) {
        responseData.additionalData = additionalFields;
      }

      res.status(201).json({
        success: true,
        message: "Statement processed successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("Upload Statement Error:", error);

      // Clean up uploaded file on error
      if (req.file) {
        fileHelper.deleteFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to process statement",
      });
    }
  }

  /**
   * Get all transactions for a folder
   * GET /folders/:folderId/transactions
   */
  async getTransactions(req, res) {
    try {
      const { folderId } = req.params;
      const { status, flagged, startDate, endDate, category } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (flagged !== undefined) filters.flagged = flagged === "true";
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      if (category) filters.category = category;

      const transactions = await transactionRepository.findByFolderId(
        folderId,
        filters
      );
      const statistics = await transactionRepository.getStatistics(folderId);

      res.status(200).json({
        success: true,
        data: {
          transactions,
          statistics,
          filters: filters,
        },
      });
    } catch (error) {
      console.error("Get Transactions Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve transactions",
      });
    }
  }

  /**
   * Get single transaction
   * GET /transactions/:id
   */
  async getTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await transactionRepository.findById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      console.error("Get Transaction Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve transaction",
      });
    }
  }

  /**
   * Update transaction status
   * PATCH /transactions/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["MATCHED", "EXCEPTION", "PENDING"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      const transaction = await transactionRepository.updateStatus(id, status);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transaction status updated",
        data: transaction,
      });
    } catch (error) {
      console.error("Update Status Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update status",
      });
    }
  }

  /**
   * Toggle transaction flag
   * PATCH /transactions/:id/flag
   */
  async toggleFlag(req, res) {
    try {
      const { id } = req.params;
      const transaction = await transactionRepository.toggleFlag(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Transaction ${transaction.flagged ? "flagged" : "unflagged"}`,
        data: transaction,
      });
    } catch (error) {
      console.error("Toggle Flag Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle flag",
      });
    }
  }

  /**
   * Update transaction
   * PUT /transactions/:id
   */
  async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const transaction = await transactionRepository.update(id, updateData);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transaction updated",
        data: transaction,
      });
    } catch (error) {
      console.error("Update Transaction Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update transaction",
      });
    }
  }

  /**
   * Delete transaction
   * DELETE /transactions/:id
   */
  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await transactionRepository.delete(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transaction deleted",
      });
    } catch (error) {
      console.error("Delete Transaction Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete transaction",
      });
    }
  }
}

module.exports = new TransactionController();
