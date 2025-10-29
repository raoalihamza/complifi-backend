"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("folders", {
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
      type: {
        type: Sequelize.ENUM("GENERAL", "RECONCILIATION"),
        allowNull: false,
      },
      compliance_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM("TO_DO", "IN_PROGRESS", "IN_REVIEW", "CLOSED"),
        allowNull: false,
        defaultValue: "TO_DO",
      },
      priority: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH"),
        allowNull: true,
      },
      assigned_to_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      closing_date: {
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

    // Add constraint for compliance_score between 0 and 100
    await queryInterface.addConstraint("folders", {
      fields: ["compliance_score"],
      type: "check",
      where: {
        compliance_score: {
          [Sequelize.Op.gte]: 0,
          [Sequelize.Op.lte]: 100,
        },
      },
      name: "folders_compliance_score_range",
    });

    // Add index on workspace_id
    await queryInterface.addIndex("folders", ["workspace_id"], {
      name: "folders_workspace_id_idx",
    });

    // Add index on assigned_to_id
    await queryInterface.addIndex("folders", ["assigned_to_id"], {
      name: "folders_assigned_to_id_idx",
    });

    // Add index on status
    await queryInterface.addIndex("folders", ["status"], {
      name: "folders_status_idx",
    });

    // Add index on created_at for sorting
    await queryInterface.addIndex("folders", ["created_at"], {
      name: "folders_created_at_idx",
    });

    // Add composite index on workspace_id and status
    await queryInterface.addIndex("folders", ["workspace_id", "status"], {
      name: "folders_workspace_status_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("folders");
  },
};
