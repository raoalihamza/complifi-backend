"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "is_active", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: "is_owner",
    });

    // Add index for is_active field
    await queryInterface.addIndex("users", ["is_active"], {
      name: "users_is_active",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex("users", "users_is_active");

    // Remove column
    await queryInterface.removeColumn("users", "is_active");
  },
};
