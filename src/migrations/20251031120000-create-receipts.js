"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("receipts", {
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
      receipt_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      merchant_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tax_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      receipt_date: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.addIndex("receipts", ["folder_id"]);
    await queryInterface.addIndex("receipts", ["uploaded_by"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("receipts");
  },
};
