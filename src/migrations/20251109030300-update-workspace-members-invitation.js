"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add invitation fields if they don't exist
    const table = await queryInterface.describeTable("workspace_members");

    if (table.user_id && table.user_id.allowNull === false) {
      await queryInterface.addColumn("workspace_members", "user_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!table.invitation_token) {
      await queryInterface.addColumn("workspace_members", "invitation_token", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.invitation_token_expiry) {
      await queryInterface.addColumn(
        "workspace_members",
        "invitation_token_expiry",
        {
          type: Sequelize.DATE,
          allowNull: true,
        }
      );
    }

    if (!table.invited_by) {
      await queryInterface.addColumn("workspace_members", "invited_by", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }

    if (!table.invited_at) {
      await queryInterface.addColumn("workspace_members", "invited_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.joined_at) {
      await queryInterface.addColumn("workspace_members", "joined_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.status) {
      await queryInterface.addColumn("workspace_members", "status", {
        type: Sequelize.ENUM("pending", "active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      });
    }

    // Add index for invitation token
    await queryInterface.addIndex("workspace_members", ["invitation_token"], {
      name: "idx_workspace_members_invitation_token",
    });

    // Add index for status
    await queryInterface.addIndex("workspace_members", ["status"], {
      name: "idx_workspace_members_status",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex(
      "workspace_members",
      "idx_workspace_members_invitation_token"
    );
    await queryInterface.removeIndex(
      "workspace_members",
      "idx_workspace_members_status"
    );

    // Remove columns
    await queryInterface.removeColumn("workspace_members", "invitation_token");
    await queryInterface.removeColumn(
      "workspace_members",
      "invitation_token_expiry"
    );
    await queryInterface.removeColumn("workspace_members", "invited_by");
    await queryInterface.removeColumn("workspace_members", "invited_at");
    await queryInterface.removeColumn("workspace_members", "status");
  },
};
