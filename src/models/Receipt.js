module.exports = (sequelize, DataTypes) => {
  const Receipt = sequelize.define(
    "Receipt",
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
      receiptNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      merchantName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      taxPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      receiptDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      ocrData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "ocr_data",
        comment: "Complete OCR extraction data from receipt",
      },
    },
    {
      tableName: "receipts",
      timestamps: true,
      underscored: true,
    }
  );

  Receipt.associate = (models) => {
    Receipt.belongsTo(models.Folder, {
      foreignKey: "folderId",
      as: "folder",
    });
    Receipt.belongsTo(models.User, {
      foreignKey: "uploadedBy",
      as: "uploader",
    });
    Receipt.hasMany(models.Transaction, {
      foreignKey: "receiptId",
      as: "transactions",
    });
  };

  return Receipt;
};
