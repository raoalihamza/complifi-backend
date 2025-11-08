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

  async findByFolderId(folderId) {
    return await Receipt.findAll({
      where: { folderId },
      order: [["createdAt", "DESC"]],
    });
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
