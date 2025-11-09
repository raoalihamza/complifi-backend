'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update all existing workspace members where:
    // - user_id is NOT NULL (they've accepted/joined)
    // - status is 'pending'
    // Set them to 'active' and add joined_at timestamp if missing
    await queryInterface.sequelize.query(`
      UPDATE workspace_members
      SET
        status = 'active',
        joined_at = COALESCE(joined_at, invited_at, created_at)
      WHERE user_id IS NOT NULL
        AND status = 'pending'
        AND invitation_accepted = true;
    `);
  },

  async down (queryInterface, Sequelize) {
    // Revert back to pending (only if needed for rollback)
    await queryInterface.sequelize.query(`
      UPDATE workspace_members
      SET status = 'pending'
      WHERE user_id IS NOT NULL
        AND status = 'active';
    `);
  }
};
