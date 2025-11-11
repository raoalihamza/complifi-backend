"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add ocr_data column to invoices table
    await queryInterface.addColumn("invoices", "ocr_data", {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Complete OCR extraction data from invoice",
    });

    // Add ocr_data column to receipts table
    await queryInterface.addColumn("receipts", "ocr_data", {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Complete OCR extraction data from receipt",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove ocr_data column from invoices table
    await queryInterface.removeColumn("invoices", "ocr_data");

    // Remove ocr_data column from receipts table
    await queryInterface.removeColumn("receipts", "ocr_data");
  },
};
