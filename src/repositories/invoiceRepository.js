const { Invoice } = require("../models");

class InvoiceRepository {
  async create(invoiceData) {
    return await Invoice.create(invoiceData);
  }

  async bulkCreate(invoicesArray) {
    return await Invoice.bulkCreate(invoicesArray);
  }

  async findById(id) {
    return await Invoice.findByPk(id);
  }

  async findByFolderId(folderId) {
    return await Invoice.findAll({
      where: { folderId },
      order: [["invoiceDate", "DESC"]],
    });
  }

  async update(id, updateData) {
    const invoice = await this.findById(id);
    if (!invoice) return null;
    return await invoice.update(updateData);
  }

  async delete(id) {
    const invoice = await this.findById(id);
    if (!invoice) return null;
    await invoice.destroy();
    return invoice;
  }

  async countByFolder(folderId) {
    return await Invoice.count({ where: { folderId } });
  }
}

module.exports = new InvoiceRepository();
