const { Transaction, Receipt, Invoice, Folder } = require("../models");
const { STATEMENT_TYPES, TRANSACTION_STATUS } = require("../config/constants");
const { Op } = require("sequelize");

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 and 1, where 1 is identical
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();

  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;

  // Create matrix
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  const similarity = 1 - matrix[len1][len2] / maxLen;

  return similarity;
}

/**
 * Check if two dates are within a tolerance range (in days)
 */
function areDatesWithinTolerance(date1, date2, toleranceDays = 3) {
  if (!date1 || !date2) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Set to start of day for comparison
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffMs = Math.abs(d1 - d2);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= toleranceDays;
}

/**
 * Check if two amounts match within a tolerance (±5%)
 */
function areAmountsMatching(amount1, amount2, tolerancePercent = 5) {
  if (!amount1 || !amount2) return false;

  const a1 = Math.abs(parseFloat(amount1));
  const a2 = Math.abs(parseFloat(amount2));

  // Calculate percentage-based tolerance
  const avgAmount = (a1 + a2) / 2;
  const maxDifference = avgAmount * (tolerancePercent / 100);

  return Math.abs(a1 - a2) <= maxDifference;
}

/**
 * Match a single transaction with receipts
 */
async function matchTransactionWithReceipts(transaction, receipts) {
  let bestMatch = null;
  let bestScore = 0;

  for (const receipt of receipts) {
    // Skip if already linked to another transaction
    if (receipt.transactionId && receipt.transactionId !== transaction.id) {
      continue;
    }

    // Calculate match score
    const dateMatch = areDatesWithinTolerance(
      transaction.date,
      receipt.receiptDate,
      1
    );
    const amountMatch = areAmountsMatching(
      transaction.value,
      receipt.total,
      0.01
    );
    const merchantSimilarity = calculateStringSimilarity(
      transaction.merchantName,
      receipt.merchantName
    );

    // Scoring criteria
    let score = 0;
    if (dateMatch) score += 30; // 30 points for date match
    if (amountMatch) score += 50; // 50 points for amount match
    score += merchantSimilarity * 20; // Up to 20 points for merchant name similarity

    // Consider it a match if score is above threshold (70%)
    if (score >= 70 && score > bestScore) {
      bestMatch = receipt;
      bestScore = score;
    }
  }

  return bestMatch;
}

/**
 * Match a single transaction with invoices
 */
async function matchTransactionWithInvoices(transaction, invoices) {
  let bestMatch = null;
  let bestScore = 0;

  for (const invoice of invoices) {
    // Skip if already linked to another transaction
    if (invoice.transactionId && invoice.transactionId !== transaction.id) {
      continue;
    }

    // Calculate match score
    const dateMatch = areDatesWithinTolerance(
      transaction.date,
      invoice.invoiceDate,
      1
    );
    const amountMatch = areAmountsMatching(
      transaction.value,
      invoice.netAmount || invoice.amount,
      0.01
    );
    const vendorSimilarity = calculateStringSimilarity(
      transaction.merchantName,
      invoice.vendorName
    );

    // Scoring criteria
    let score = 0;
    if (dateMatch) score += 30; // 30 points for date match
    if (amountMatch) score += 50; // 50 points for amount match
    score += vendorSimilarity * 20; // Up to 20 points for vendor name similarity

    // Consider it a match if score is above threshold (70%)
    if (score >= 70 && score > bestScore) {
      bestMatch = invoice;
      bestScore = score;
    }
  }

  return bestMatch;
}

/**
 * Perform automatic reconciliation for a folder
 * Matches transactions with receipts (for CARD statements) or invoices (for BANK statements)
 */
async function performReconciliation(folderId) {
  try {
    // Get folder with statement type
    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    if (!folder.statementType) {
      throw new Error("This is not a reconciliation folder");
    }

    // Get all transactions for this folder that are not FEE transactions
    const transactions = await Transaction.findAll({
      where: {
        folderId,
        status: {
          [Op.ne]: TRANSACTION_STATUS.FEE, // Exclude FEE transactions from matching
        },
      },
    });

    let matchedCount = 0;

    if (folder.statementType === STATEMENT_TYPES.CARD) {
      // Match with receipts
      const receipts = await Receipt.findAll({ where: { folderId } });

      for (const transaction of transactions) {
        const matchedReceipt = await matchTransactionWithReceipts(
          transaction,
          receipts
        );

        if (matchedReceipt) {
          await transaction.update({
            status: TRANSACTION_STATUS.MATCHED,
            receiptId: matchedReceipt.id,
          });
          matchedCount++;
        } else {
          // Keep as EXCEPTION if not matched
          if (transaction.status !== TRANSACTION_STATUS.EXCEPTION) {
            await transaction.update({
              status: TRANSACTION_STATUS.EXCEPTION,
            });
          }
        }
      }
    } else if (folder.statementType === STATEMENT_TYPES.BANK) {
      // Match with invoices
      const invoices = await Invoice.findAll({ where: { folderId } });

      for (const transaction of transactions) {
        const matchedInvoice = await matchTransactionWithInvoices(
          transaction,
          invoices
        );

        if (matchedInvoice) {
          await transaction.update({
            status: TRANSACTION_STATUS.MATCHED,
            invoiceId: matchedInvoice.id,
          });
          matchedCount++;
        } else {
          // Keep as EXCEPTION if not matched
          if (transaction.status !== TRANSACTION_STATUS.EXCEPTION) {
            await transaction.update({
              status: TRANSACTION_STATUS.EXCEPTION,
            });
          }
        }
      }
    }

    // Calculate compliance score
    const complianceScore = await calculateComplianceScore(folderId);

    // Update folder with new compliance score
    await folder.update({ complianceScore });

    return {
      success: true,
      matchedCount,
      totalTransactions: transactions.length,
      complianceScore,
    };
  } catch (error) {
    console.error("Error in performReconciliation:", error);
    throw error;
  }
}

/**
 * Calculate compliance score for a folder
 * Score = (Matched Transactions / Total Non-FEE Transactions) * 100
 */
async function calculateComplianceScore(folderId) {
  try {
    // Count total non-FEE transactions
    const totalTransactions = await Transaction.count({
      where: {
        folderId,
        status: {
          [Op.ne]: TRANSACTION_STATUS.FEE,
        },
      },
    });

    if (totalTransactions === 0) {
      return 0;
    }

    // Count matched transactions
    const matchedTransactions = await Transaction.count({
      where: {
        folderId,
        status: TRANSACTION_STATUS.MATCHED,
      },
    });

    // Calculate percentage
    const score = (matchedTransactions / totalTransactions) * 100;

    return Math.round(score); // Round to nearest integer
  } catch (error) {
    console.error("Error in calculateComplianceScore:", error);
    throw error;
  }
}

/**
 * Get detailed reconciliation statistics for a folder
 */
async function getReconciliationStats(folderId) {
  try {
    const folder = await Folder.findByPk(folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    // Count transactions by status
    const totalTransactions = await Transaction.count({ where: { folderId } });
    const matchedTransactions = await Transaction.count({
      where: { folderId, status: TRANSACTION_STATUS.MATCHED },
    });
    const exceptionTransactions = await Transaction.count({
      where: { folderId, status: TRANSACTION_STATUS.EXCEPTION },
    });
    const feeTransactions = await Transaction.count({
      where: { folderId, status: TRANSACTION_STATUS.FEE },
    });
    const pendingTransactions = await Transaction.count({
      where: { folderId, status: TRANSACTION_STATUS.PENDING },
    });

    // Get sum of fees
    const feeSum = await Transaction.sum("value", {
      where: { folderId, status: TRANSACTION_STATUS.FEE },
    });

    // Count receipts/invoices
    const receiptsCount = await Receipt.count({ where: { folderId } });
    const invoicesCount = await Invoice.count({ where: { folderId } });

    return {
      totalTransactions,
      matchedTransactions,
      exceptionTransactions,
      feeTransactions,
      pendingTransactions,
      feeAutoClassified: feeSum || 0,
      receiptsCount,
      invoicesCount,
      complianceScore: folder.complianceScore,
      statementType: folder.statementType,
    };
  } catch (error) {
    console.error("Error in getReconciliationStats:", error);
    throw error;
  }
}

/**
 * Manually link a transaction to a receipt or invoice
 */
async function manuallyLinkDocument(transactionId, documentId, documentType) {
  try {
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (documentType === "receipt") {
      const receipt = await Receipt.findByPk(documentId);
      if (!receipt) {
        throw new Error("Receipt not found");
      }

      await transaction.update({
        receiptId: documentId,
        status: TRANSACTION_STATUS.MATCHED,
      });
    } else if (documentType === "invoice") {
      const invoice = await Invoice.findByPk(documentId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      await transaction.update({
        invoiceId: documentId,
        status: TRANSACTION_STATUS.MATCHED,
      });
    } else {
      throw new Error("Invalid document type");
    }

    // Recalculate compliance score
    const complianceScore = await calculateComplianceScore(transaction.folderId);
    await Folder.update(
      { complianceScore },
      { where: { id: transaction.folderId } }
    );

    return { success: true, transaction };
  } catch (error) {
    console.error("Error in manuallyLinkDocument:", error);
    throw error;
  }
}

/**
 * Unlink a document from a transaction
 */
async function unlinkDocument(transactionId) {
  try {
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await transaction.update({
      receiptId: null,
      invoiceId: null,
      status: TRANSACTION_STATUS.EXCEPTION,
    });

    // Recalculate compliance score
    const complianceScore = await calculateComplianceScore(transaction.folderId);
    await Folder.update(
      { complianceScore },
      { where: { id: transaction.folderId } }
    );

    return { success: true, transaction };
  } catch (error) {
    console.error("Error in unlinkDocument:", error);
    throw error;
  }
}

module.exports = {
  performReconciliation,
  calculateComplianceScore,
  getReconciliationStats,
  manuallyLinkDocument,
  unlinkDocument,
  // Export helper functions for testing
  calculateStringSimilarity,
  areDatesWithinTolerance,
  areAmountsMatching,
};
