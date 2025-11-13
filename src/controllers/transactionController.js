const path = require("path");
const transactionRepository = require("../repositories/transactionRepository");
const folderRepository = require("../repositories/folderRepository");
const folderAnalyticsRepository = require("../repositories/folderAnalyticsRepository");
const ocrService = require("../services/ocrService");
const folderService = require("../services/folderService");
const fileHelper = require("../helpers/fileHelper");
const { TRANSACTION_STATUS } = require("../config/constants");

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
   * Query params: status, flagged, startDate, endDate, category, page, limit
   */
  async getTransactions(req, res) {
    try {
      const { folderId } = req.params;
      const { status, flagged, startDate, endDate, category, page, limit } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (flagged !== undefined) filters.flagged = flagged === "true";
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      if (category) filters.category = category;

      // Pagination parameters
      const pageNumber = parseInt(page) || 1;
      const pageLimit = parseInt(limit) || 10;
      const offset = (pageNumber - 1) * pageLimit;

      const pagination = {
        limit: pageLimit,
        offset: offset,
      };

      const result = await transactionRepository.findByFolderId(
        folderId,
        filters,
        pagination
      );
      const statistics = await transactionRepository.getStatistics(folderId);

      // Fetch analytics data for the folder
      const analytics = await folderAnalyticsRepository.findByFolderId(folderId);

      const totalPages = Math.ceil(result.total / pageLimit);

      const responseData = {
        transactions: result.transactions,
        pagination: {
          currentPage: pageNumber,
          totalPages: totalPages,
          totalRecords: result.total,
          recordsPerPage: pageLimit,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
        statistics,
        filters: filters,
      };

      // Include analytics if available (for reconciliation folders)
      if (analytics) {
        responseData.analytics = {
          currency: analytics.currency,
          totalFees: parseFloat(analytics.totalFees || 0),
          totalSpend: parseFloat(analytics.totalSpend || 0),
          interestPaidAmount: analytics.interestPaidAmount ? parseFloat(analytics.interestPaidAmount) : null,
          monthlyInterestRatePercent: analytics.monthlyInterestRatePercent ? parseFloat(analytics.monthlyInterestRatePercent) : null,
          aprPercentNominal: analytics.aprPercentNominal ? parseFloat(analytics.aprPercentNominal) : null,
          averageDailyBalance: analytics.averageDailyBalance ? parseFloat(analytics.averageDailyBalance) : null,
          openingBalance: analytics.openingBalance ? parseFloat(analytics.openingBalance) : null,
          closingBalance: analytics.closingBalance ? parseFloat(analytics.closingBalance) : null,
          subscriptions: analytics.subscriptions,
          duplicates: analytics.duplicates,
          feeByCategory: analytics.feeByCategory,
          topFeeMerchants: analytics.topFeeMerchants,
          feesOverTime: analytics.feesOverTime,
          hiddenFees: analytics.hiddenFees,
          flaggedTransactions: analytics.flaggedTransactions,
          tips: analytics.tips,
          cardSuggestions: analytics.cardSuggestions,
          additionalData: analytics.additionalData,
        };
      }

      res.status(200).json({
        success: true,
        data: responseData,
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

  /**
   * Create reconciliation folder by uploading statement
   * POST /api/v1/reconciliation/create
   * Body: { statementType: 'BANK' | 'CARD', workspaceId: number }
   * File: statement file (PDF, CSV, XLSX)
   */
  async createReconciliationFolder(req, res) {
    try {
      const { statementType, workspaceId } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!statementType || !workspaceId) {
        if (req.file) fileHelper.deleteFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Statement type and workspace ID are required",
        });
      }

      // Validate statement type
      if (!["BANK", "CARD"].includes(statementType)) {
        if (req.file) fileHelper.deleteFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Statement type must be either 'BANK' or 'CARD'",
        });
      }

      // Validate file upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No statement file uploaded",
        });
      }

      // Process statement with OCR
      const ocrData = await ocrService.processStatement(req.file.path);

      // Generate folder name based on original filename
      const fileNameWithoutExt = path.basename(
        req.file.originalname,
        path.extname(req.file.originalname)
      );

      // Use filename, optionally with date if available
      let folderName = fileNameWithoutExt;
      if (ocrData.statement_period_start || ocrData.statement_period_end) {
        const date = new Date(
          ocrData.statement_period_end || ocrData.statement_period_start
        );
        const monthYear = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        folderName = `${fileNameWithoutExt} (${monthYear})`;
      }

      // Create reconciliation folder
      const folder = await folderService.createReconciliationFolder(
        userId,
        parseInt(workspaceId),
        statementType,
        folderName,
        `/uploads/statements/${req.file.filename}`
      );

      // Classify transactions: FEE vs EXCEPTION
      const transactionsData = ocrData.transactions.map((transaction) => {
        // Check if this is a fee transaction
        const isFee =
          transaction.category &&
          (transaction.category.toLowerCase().includes("fee") ||
            transaction.category.toLowerCase().includes("charge") ||
            transaction.category.toLowerCase().includes("interest"));

        return {
          folderId: folder.id,
          merchantName: transaction.merchant || transaction.description,
          date: new Date(transaction.date),
          value: parseFloat(transaction.amount),
          category: transaction.category || null,
          status: isFee ? TRANSACTION_STATUS.FEE : TRANSACTION_STATUS.EXCEPTION,
          flagged:
            transaction.flags && transaction.flags.length > 0 ? true : false,
          notes: transaction.flags
            ? JSON.stringify(transaction.flags)
            : null,
        };
      });

      // Create transactions
      const createdTransactions = await transactionRepository.bulkCreate(
        transactionsData
      );

      // Count FEE transactions
      const feeTransactions = createdTransactions.filter(
        (t) => t.status === TRANSACTION_STATUS.FEE
      );
      const exceptionTransactions = createdTransactions.filter(
        (t) => t.status === TRANSACTION_STATUS.EXCEPTION
      );

      // Save OCR analytics to database
      const analyticsData = {
        folderId: folder.id,
        currency: ocrData.currency || null,
        totalFees: ocrData.totalFees || 0,
        totalSpend: ocrData.totalSpend || 0,
        interestPaidAmount: ocrData.interest_paid_amount || null,
        monthlyInterestRatePercent: ocrData.monthly_interest_rate_percent || null,
        aprPercentNominal: ocrData.apr_percent_nominal || null,
        averageDailyBalance: ocrData.average_daily_balance || null,
        openingBalance: ocrData.opening_balance || null,
        closingBalance: ocrData.closing_balance || null,
        subscriptions: ocrData.subscriptions || [],
        duplicates: ocrData.duplicates || [],
        feeByCategory: ocrData.feeByCategory || {},
        topFeeMerchants: ocrData.topFeeMerchants || {},
        feesOverTime: ocrData.feesOverTime || {},
        hiddenFees: ocrData.hiddenFees || [],
        flaggedTransactions: ocrData.flagged || [],
        tips: ocrData.tips || [],
        cardSuggestions: ocrData.cardSuggestions || [],
      };

      // Handle any additional dynamic fields from OCR
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
        analyticsData.additionalData = additionalFields;
      }

      await folderAnalyticsRepository.create(analyticsData);

      // Prepare comprehensive response
      const responseData = {
        folder: folder,
        totalTransactions: createdTransactions.length,
        feeTransactions: feeTransactions.length,
        exceptionTransactions: exceptionTransactions.length,
        transactions: createdTransactions,
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
        tips: ocrData.tips || [],
        cardSuggestions: ocrData.cardSuggestions || [],
      };

      res.status(201).json({
        success: true,
        message: "Reconciliation folder created successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("Create Reconciliation Folder Error:", error);

      // Clean up uploaded file on error
      if (req.file) {
        fileHelper.deleteFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to create reconciliation folder",
      });
    }
  }
}

module.exports = new TransactionController();
