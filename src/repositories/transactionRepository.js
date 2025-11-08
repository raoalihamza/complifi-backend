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

  async findByFolderId(folderId, filters = {}) {
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

    return await Transaction.findAll({
      where,
      order: [["date", "DESC"]],
    });
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
    const transactions = await this.findByFolderId(folderId);

    return {
      total: transactions.length,
      matched: transactions.filter((t) => t.status === "MATCHED").length,
      exceptions: transactions.filter((t) => t.status === "EXCEPTION").length,
      pending: transactions.filter((t) => t.status === "PENDING").length,
      flagged: transactions.filter((t) => t.flagged).length,
      totalValue: transactions.reduce((sum, t) => sum + parseFloat(t.value), 0),
    };
  }
}

module.exports = new TransactionRepository();
