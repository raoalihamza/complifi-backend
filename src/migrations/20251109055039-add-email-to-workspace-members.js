'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if email column already exists
    const table = await queryInterface.describeTable("workspace_members");

    if (!table.email) {
      await queryInterface.addColumn("workspace_members", "email", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("workspace_members", "email");
  }
};
