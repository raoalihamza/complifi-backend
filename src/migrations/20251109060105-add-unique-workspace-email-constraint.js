'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add unique constraint on workspace_id + email (where email is not null)
    await queryInterface.addIndex("workspace_members", ["workspace_id", "email"], {
      name: "unique_workspace_email",
      unique: true,
      where: {
        email: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the unique constraint
    await queryInterface.removeIndex("workspace_members", "unique_workspace_email");
  }
};
