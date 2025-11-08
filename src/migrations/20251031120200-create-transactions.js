"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("transactions", {
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
      merchant_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("MATCHED", "EXCEPTION", "PENDING"),
        defaultValue: "PENDING",
      },
      flagged: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      receipt_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "receipts",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      invoice_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex("transactions", ["folder_id"]);
    await queryInterface.addIndex("transactions", ["date"]);
    await queryInterface.addIndex("transactions", ["status"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("transactions");
  },
};
