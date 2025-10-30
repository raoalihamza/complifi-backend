"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add Email Verification OTP Fields (is_email_verified already exists in original migration)
    await queryInterface.addColumn("users", "email_verification_otp", {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "email_verification_otp_expires", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add Password Reset Fields
    await queryInterface.addColumn("users", "password_reset_token", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "password_reset_expires", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add Company Onboarding Fields
    await queryInterface.addColumn("users", "company_name", {
      type: Sequelize.STRING(200),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "company_size", {
      type: Sequelize.ENUM("0-10", "11-25", "OVER_25"),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "company_location", {
      type: Sequelize.STRING(200),
      allowNull: true,
    });

    // Add Onboarding Status Tracking
    await queryInterface.addColumn("users", "has_completed_onboarding", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn("users", "onboarding_completed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add indexes for new columns
    // Note: is_email_verified index not needed as it's not being added
    await queryInterface.addIndex("users", ["password_reset_token"], {
      name: "users_password_reset_token_idx",
    });

    await queryInterface.addIndex("users", ["has_completed_onboarding"], {
      name: "users_has_completed_onboarding_idx",
    });

    console.log("✅ User authentication fields added successfully");
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex("users", "users_password_reset_token_idx");
    await queryInterface.removeIndex(
      "users",
      "users_has_completed_onboarding_idx"
    );

    // Remove columns (only the ones we added)
    await queryInterface.removeColumn("users", "email_verification_otp");
    await queryInterface.removeColumn(
      "users",
      "email_verification_otp_expires"
    );
    await queryInterface.removeColumn("users", "password_reset_token");
    await queryInterface.removeColumn("users", "password_reset_expires");
    await queryInterface.removeColumn("users", "company_name");
    await queryInterface.removeColumn("users", "company_size");
    await queryInterface.removeColumn("users", "company_location");
    await queryInterface.removeColumn("users", "has_completed_onboarding");
    await queryInterface.removeColumn("users", "onboarding_completed_at");

    console.log("✅ User authentication fields removed successfully");
  },
};
