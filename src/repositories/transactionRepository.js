const { Transaction } = require("../models");
const { Op } = require("sequelize");

class TransactionRepository {
  async create(transactionData) {
    return await Transaction.create(transactionData);
  }

  async bulkCreate(transactionsArray) {
    return await Transaction.bulkCreate(transactionsArray);
  }

  async findById(id) {
    return await Transaction.findByPk(id);
  }

  async findByFolderId(folderId, filters = {}, pagination = {}) {
    const where = { folderId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.flagged !== undefined) {
      where.flagged = filters.flagged;
    }

    if (filters.startDate && filters.endDate) {
      where.date = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    }

    if (filters.category) {
      where.category = filters.category;
    }

    const query = {
      where,
      order: [["date", "DESC"]],
    };

    // Add pagination if provided
    if (pagination.limit !== undefined) {
      query.limit = pagination.limit;
      query.offset = pagination.offset || 0;
    }

    const { count, rows } = await Transaction.findAndCountAll(query);

    return {
      transactions: rows,
      total: count,
    };
  }

  async update(id, updateData) {
    const transaction = await this.findById(id);
    if (!transaction) return null;
    return await transaction.update(updateData);
  }

  async updateStatus(id, status) {
    return await this.update(id, { status });
  }

  async toggleFlag(id) {
    const transaction = await this.findById(id);
    if (!transaction) return null;
    return await transaction.update({ flagged: !transaction.flagged });
  }

  async linkReceipt(transactionId, receiptId) {
    return await this.update(transactionId, { receiptId });
  }

  async linkInvoice(transactionId, invoiceId) {
    return await this.update(transactionId, { invoiceId });
  }

  async delete(id) {
    const transaction = await this.findById(id);
    if (!transaction) return null;
    await transaction.destroy();
    return transaction;
  }

  async getStatistics(folderId) {
    const result = await this.findByFolderId(folderId);
    const transactions = result.transactions;

    return {
      total: transactions.length,
      matched: transactions.filter((t) => t.status === "MATCHED").length,
      exceptions: transactions.filter((t) => t.status === "EXCEPTION").length,
      fees: transactions.filter((t) => t.status === "FEE").length,
      pending: transactions.filter((t) => t.status === "PENDING").length,
      flagged: transactions.filter((t) => t.flagged).length,
      totalValue: transactions.reduce((sum, t) => sum + parseFloat(t.value), 0),
    };
  }

  async getTransactionCountsByFolders(folderIds) {
    if (!folderIds || folderIds.length === 0) {
      return {};
    }

    const transactions = await Transaction.findAll({
      where: {
        folderId: {
          [Op.in]: folderIds,
        },
      },
      attributes: ["folderId", "status"],
    });

    const counts = {};
    folderIds.forEach((id) => {
      counts[id] = {
        matchedTransactions: 0,
        exceptionTransactions: 0,
      };
    });

    transactions.forEach((transaction) => {
      const folderId = transaction.folderId;
      if (transaction.status === "MATCHED") {
        counts[folderId].matchedTransactions += 1;
      } else if (transaction.status === "EXCEPTION") {
        counts[folderId].exceptionTransactions += 1;
      }
    });

    return counts;
  }
}

module.exports = new TransactionRepository();
