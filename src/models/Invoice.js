module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
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
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      invoiceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      vendorName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      netAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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
    },
    {
      tableName: "invoices",
      timestamps: true,
      underscored: true,
    }
  );

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Folder, {
      foreignKey: "folderId",
      as: "folder",
    });
    Invoice.belongsTo(models.User, {
      foreignKey: "uploadedBy",
      as: "uploader",
    });
    Invoice.hasMany(models.Transaction, {
      foreignKey: "invoiceId",
      as: "transactions",
    });
  };

  return Invoice;
};
