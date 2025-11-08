"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("invoices", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folder_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "folders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      invoice_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      vendor_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      net_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes
    await queryInterface.addIndex("invoices", ["folder_id"]);
    await queryInterface.addIndex("invoices", ["invoice_date"]);
    await queryInterface.addIndex("invoices", ["uploaded_by"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("invoices");
  },
};
