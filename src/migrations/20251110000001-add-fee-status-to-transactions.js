"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add FEE to the transaction status enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_transactions_status" ADD VALUE IF NOT EXISTS 'FEE';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values directly
    // You would need to recreate the enum type without FEE if rollback is needed
    console.log(
      "Warning: Removing enum values in PostgreSQL requires recreating the enum type."
    );
    console.log(
      "Manual intervention required to rollback this migration if necessary."
    );
  },
};
