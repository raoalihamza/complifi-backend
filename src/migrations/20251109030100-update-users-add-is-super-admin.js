"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove role column if exists
    const table = await queryInterface.describeTable("users");

    if (table.role) {
      await queryInterface.removeColumn("users", "role");
    }

    // Add isSuperAdmin column
    await queryInterface.addColumn("users", "is_super_admin", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: "password",
    });

    // Add index
    await queryInterface.addIndex("users", ["is_super_admin"], {
      name: "idx_users_is_super_admin",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    await queryInterface.removeIndex("users", "idx_users_is_super_admin");

    // Remove column
    await queryInterface.removeColumn("users", "is_super_admin");

    // Add back role column (for rollback)
    await queryInterface.addColumn("users", "role", {
      type: Sequelize.ENUM("ADMIN", "SME_USER", "VIEWER"),
      allowNull: false,
      defaultValue: "SME_USER",
    });
  },
};
