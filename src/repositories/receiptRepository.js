const { Receipt } = require("../models");

class ReceiptRepository {
  async create(receiptData) {
    return await Receipt.create(receiptData);
  }

  async bulkCreate(receiptsArray) {
    return await Receipt.bulkCreate(receiptsArray);
  }

  async findById(id) {
    return await Receipt.findByPk(id);
  }

  async findByFolderId(folderId, pagination = {}) {
    const query = {
      where: { folderId },
      order: [["createdAt", "DESC"]],
    };

    // Add pagination if provided
    if (pagination.limit !== undefined) {
      query.limit = pagination.limit;
      query.offset = pagination.offset || 0;
    }

    const { count, rows } = await Receipt.findAndCountAll(query);

    return {
      receipts: rows,
      total: count,
    };
  }

  async update(id, updateData) {
    const receipt = await this.findById(id);
    if (!receipt) return null;
    return await receipt.update(updateData);
  }

  async delete(id) {
    const receipt = await this.findById(id);
    if (!receipt) return null;
    await receipt.destroy();
    return receipt;
  }

  async countByFolder(folderId) {
    return await Receipt.count({ where: { folderId } });
  }
}

module.exports = new ReceiptRepository();
