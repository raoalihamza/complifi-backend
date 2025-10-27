"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("workspace_members", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      workspace_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "workspaces",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.ENUM("admin", "editor", "viewer"),
        allowNull: false,
        defaultValue: "viewer",
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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

    // Add unique constraint to prevent duplicate memberships
    await queryInterface.addConstraint("workspace_members", {
      fields: ["workspace_id", "user_id"],
      type: "unique",
      name: "unique_workspace_user",
    });

    // Add indexes for faster lookups
    await queryInterface.addIndex("workspace_members", ["workspace_id"], {
      name: "workspace_members_workspace_id_idx",
    });

    await queryInterface.addIndex("workspace_members", ["user_id"], {
      name: "workspace_members_user_id_idx",
    });

    // Composite index for workspace + user queries
    await queryInterface.addIndex(
      "workspace_members",
      ["workspace_id", "user_id"],
      {
        name: "workspace_members_workspace_user_idx",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("workspace_members");
  },
};
