"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "is_owner", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: "is_super_admin",
    });

    // Add index for is_owner field
    await queryInterface.addIndex("users", ["is_owner"], {
      name: "users_is_owner",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex("users", "users_is_owner");

    // Remove column
    await queryInterface.removeColumn("users", "is_owner");
  },
};
