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

  async findByFolderId(folderId, pagination = {}) {
    const query = {
      where: { folderId },
      order: [["invoiceDate", "DESC"]],
    };

    // Add pagination if provided
    if (pagination.limit !== undefined) {
      query.limit = pagination.limit;
      query.offset = pagination.offset || 0;
    }

    const { count, rows } = await Invoice.findAndCountAll(query);

    return {
      invoices: rows,
      total: count,
    };
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
