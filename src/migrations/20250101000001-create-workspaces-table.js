"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("workspaces", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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

    // Add index on owner_id for faster lookups
    await queryInterface.addIndex("workspaces", ["owner_id"], {
      name: "workspaces_owner_id_idx",
    });

    // Add index on created_at for sorting
    await queryInterface.addIndex("workspaces", ["created_at"], {
      name: "workspaces_created_at_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("workspaces");
  },
};
