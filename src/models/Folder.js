const {
  FOLDER_TYPES,
  FOLDER_STATUS,
  PRIORITY,
} = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const Folder = sequelize.define(
    "Folder",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [2, 200],
            msg: "Folder name must be between 2 and 200 characters",
          },
          notEmpty: {
            msg: "Folder name is required",
          },
        },
      },
      workspaceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "workspace_id",
        references: {
          model: "workspaces",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.ENUM(FOLDER_TYPES.GENERAL, FOLDER_TYPES.RECONCILIATION),
        allowNull: false,
        validate: {
          isIn: {
            args: [[FOLDER_TYPES.GENERAL, FOLDER_TYPES.RECONCILIATION]],
            msg: "Invalid folder type",
          },
        },
      },
      complianceScore: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        field: "compliance_score",
        validate: {
          min: {
            args: [0],
            msg: "Compliance score cannot be less than 0",
          },
          max: {
            args: [100],
            msg: "Compliance score cannot be greater than 100",
          },
        },
      },
      status: {
        type: DataTypes.ENUM(
          FOLDER_STATUS.TO_DO,
          FOLDER_STATUS.IN_PROGRESS,
          FOLDER_STATUS.IN_REVIEW,
          FOLDER_STATUS.CLOSED
        ),
        allowNull: false,
        defaultValue: FOLDER_STATUS.TO_DO,
        validate: {
          isIn: {
            args: [
              [
                FOLDER_STATUS.TO_DO,
                FOLDER_STATUS.IN_PROGRESS,
                FOLDER_STATUS.IN_REVIEW,
                FOLDER_STATUS.CLOSED,
              ],
            ],
            msg: "Invalid folder status",
          },
        },
      },
      priority: {
        type: DataTypes.ENUM(PRIORITY.LOW, PRIORITY.MEDIUM, PRIORITY.HIGH),
        allowNull: true,
        validate: {
          isIn: {
            args: [[PRIORITY.LOW, PRIORITY.MEDIUM, PRIORITY.HIGH]],
            msg: "Invalid priority level",
          },
        },
      },
      assignedToId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "assigned_to_id",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      closingDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "closing_date",
      },
    },
    {
      tableName: "folders",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ["workspace_id"],
        },
        {
          fields: ["assigned_to_id"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["created_at"],
        },
        {
          fields: ["workspace_id", "status"],
          name: "folders_workspace_status_idx",
        },
      ],
    }
  );

  // Associations
  Folder.associate = (models) => {
    // Folder belongs to Workspace
    Folder.belongsTo(models.Workspace, {
      foreignKey: "workspaceId",
      as: "workspace",
    });

    // Folder belongs to User (assignedTo)
    Folder.belongsTo(models.User, {
      foreignKey: "assignedToId",
      as: "assignedTo",
    });

    // Folder has many Transactions (will be created in Phase 4)
    // Folder.hasMany(models.Transaction, {
    //   foreignKey: "folderId",
    //   as: "transactions",
    // });

    // Folder has many Receipts (will be created in Phase 4)
    // Folder.hasMany(models.Receipt, {
    //   foreignKey: "folderId",
    //   as: "receipts",
    // });

    // Folder has many Invoices (will be created in Phase 4)
    // Folder.hasMany(models.Invoice, {
    //   foreignKey: "folderId",
    //   as: "invoices",
    // });
  };

  return Folder;
};
