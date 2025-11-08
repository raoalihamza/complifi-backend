module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "folders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      merchantName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("MATCHED", "EXCEPTION", "PENDING"),
        defaultValue: "PENDING",
      },
      flagged: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      receiptId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "receipts",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "transactions",
      timestamps: true,
      underscored: true,
    }
  );

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Folder, {
      foreignKey: "folderId",
      as: "folder",
    });
    Transaction.belongsTo(models.Receipt, {
      foreignKey: "receiptId",
      as: "receipt",
    });
    Transaction.belongsTo(models.Invoice, {
      foreignKey: "invoiceId",
      as: "invoice",
    });
  };

  return Transaction;
};
