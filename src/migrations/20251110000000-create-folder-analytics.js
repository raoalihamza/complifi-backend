"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("folder_analytics", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folder_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "folders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: "Currency code (e.g., USD, EUR)",
      },
      total_fees: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: "Total fees extracted from statement",
      },
      total_spend: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: "Total spend amount from statement",
      },
      interest_paid_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "Total interest paid",
      },
      monthly_interest_rate_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: "Monthly interest rate percentage",
      },
      apr_percent_nominal: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: "Annual Percentage Rate (nominal)",
      },
      average_daily_balance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "Average daily balance for the period",
      },
      opening_balance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "Opening balance from statement",
      },
      closing_balance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "Closing balance from statement",
      },
      subscriptions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of detected subscription transactions",
      },
      duplicates: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of detected duplicate transactions",
      },
      fee_by_category: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
        comment: "Breakdown of fees by category",
      },
      top_fee_merchants: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
        comment: "Top merchants by fee amount",
      },
      fees_over_time: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
        comment: "Fee trends over time",
      },
      hidden_fees: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of detected hidden fees",
      },
      flagged_transactions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of flagged transaction details",
      },
      tips: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of financial tips based on analysis",
      },
      card_suggestions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of credit card recommendations",
      },
      additional_data: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
        comment: "Additional dynamic OCR fields",
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

    // Add indexes
    await queryInterface.addIndex("folder_analytics", ["folder_id"], {
      unique: true,
      name: "folder_analytics_folder_id_unique",
    });
    await queryInterface.addIndex("folder_analytics", ["created_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("folder_analytics");
  },
};
