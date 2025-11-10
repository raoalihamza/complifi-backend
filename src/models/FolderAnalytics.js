module.exports = (sequelize, DataTypes) => {
  const FolderAnalytics = sequelize.define(
    "FolderAnalytics",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "folder_id",
        references: {
          model: "folders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: "Currency code (e.g., USD, EUR)",
      },
      totalFees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        field: "total_fees",
        comment: "Total fees extracted from statement",
      },
      totalSpend: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        field: "total_spend",
        comment: "Total spend amount from statement",
      },
      interestPaidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "interest_paid_amount",
        comment: "Total interest paid",
      },
      monthlyInterestRatePercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: "monthly_interest_rate_percent",
        comment: "Monthly interest rate percentage",
      },
      aprPercentNominal: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: "apr_percent_nominal",
        comment: "Annual Percentage Rate (nominal)",
      },
      averageDailyBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "average_daily_balance",
        comment: "Average daily balance for the period",
      },
      openingBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "opening_balance",
        comment: "Opening balance from statement",
      },
      closingBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "closing_balance",
        comment: "Closing balance from statement",
      },
      subscriptions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of detected subscription transactions",
      },
      duplicates: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of detected duplicate transactions",
      },
      feeByCategory: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        field: "fee_by_category",
        comment: "Breakdown of fees by category",
      },
      topFeeMerchants: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        field: "top_fee_merchants",
        comment: "Top merchants by fee amount",
      },
      feesOverTime: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        field: "fees_over_time",
        comment: "Fee trends over time",
      },
      hiddenFees: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        field: "hidden_fees",
        comment: "Array of detected hidden fees",
      },
      flaggedTransactions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        field: "flagged_transactions",
        comment: "Array of flagged transaction details",
      },
      tips: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of financial tips based on analysis",
      },
      cardSuggestions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        field: "card_suggestions",
        comment: "Array of credit card recommendations",
      },
      additionalData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        field: "additional_data",
        comment: "Additional dynamic OCR fields",
      },
    },
    {
      tableName: "folder_analytics",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ["folder_id"],
          unique: true,
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  );

  // Associations
  FolderAnalytics.associate = (models) => {
    // FolderAnalytics belongs to Folder (one-to-one)
    FolderAnalytics.belongsTo(models.Folder, {
      foreignKey: "folderId",
      as: "folder",
    });
  };

  return FolderAnalytics;
};
