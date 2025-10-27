"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if users table already exists
    const tables = await queryInterface.showAllTables();

    if (tables.includes("users")) {
      console.log("ℹ️  Users table already exists, skipping creation...");
      return;
    }

    // Create users table
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM("ADMIN", "AUDIT_PARTNER", "SME_USER", "VIEWER"),
        allowNull: false,
        defaultValue: "SME_USER",
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      last_login: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex("users", ["email"], {
      name: "users_email_idx",
      unique: true,
    });

    await queryInterface.addIndex("users", ["role"], {
      name: "users_role_idx",
    });

    console.log("✅ Users table created successfully");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};
