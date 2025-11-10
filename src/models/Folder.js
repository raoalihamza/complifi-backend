const {
  FOLDER_TYPES,
  FOLDER_STATUS,
  PRIORITY,
  STATEMENT_TYPES,
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
      statementType: {
        type: DataTypes.ENUM(STATEMENT_TYPES.BANK, STATEMENT_TYPES.CARD),
        allowNull: true,
        field: "statement_type",
        validate: {
          isIn: {
            args: [[STATEMENT_TYPES.BANK, STATEMENT_TYPES.CARD]],
            msg: "Invalid statement type. Must be 'BANK' or 'CARD'",
          },
          customValidator(value) {
            if (this.type === FOLDER_TYPES.RECONCILIATION && !value) {
              throw new Error("Statement type is required for reconciliation folders");
            }
            if (this.type === FOLDER_TYPES.GENERAL && value) {
              throw new Error("General folders cannot have a statement type");
            }
          },
        },
      },
      parentFolderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "parent_folder_id",
        references: {
          model: "folders",
          key: "id",
        },
        onDelete: "CASCADE",
        validate: {
          async customValidator(value) {
            if (value) {
              // Check if parent folder is a GENERAL folder
              const parentFolder = await this.constructor.findByPk(value);
              if (!parentFolder) {
                throw new Error("Parent folder does not exist");
              }
              if (parentFolder.type !== FOLDER_TYPES.GENERAL) {
                throw new Error("Parent folder must be a GENERAL folder");
              }
              // Only RECONCILIATION folders can have a parent
              if (this.type !== FOLDER_TYPES.RECONCILIATION) {
                throw new Error("Only reconciliation folders can have a parent folder");
              }
            }
          },
        },
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "created_by",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      statementFileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "statement_file_url",
        validate: {
          customValidator(value) {
            // Statement file URL is required for reconciliation folders
            if (this.type === FOLDER_TYPES.RECONCILIATION && !value) {
              throw new Error("Statement file is required for reconciliation folders");
            }
            // General folders should not have statement file
            if (this.type === FOLDER_TYPES.GENERAL && value) {
              throw new Error("General folders cannot have a statement file");
            }
          },
        },
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

    // Folder belongs to User (createdBy)
    Folder.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });

    // Folder belongs to Folder (parent)
    Folder.belongsTo(models.Folder, {
      foreignKey: "parentFolderId",
      as: "parentFolder",
    });

    // Folder has many Folders (children)
    Folder.hasMany(models.Folder, {
      foreignKey: "parentFolderId",
      as: "childFolders",
    });

    // Folder has many Transactions
    Folder.hasMany(models.Transaction, {
      foreignKey: "folderId",
      as: "transactions",
    });

    // Folder has many Receipts
    Folder.hasMany(models.Receipt, {
      foreignKey: "folderId",
      as: "receipts",
    });

    // Folder has many Invoices
    Folder.hasMany(models.Invoice, {
      foreignKey: "folderId",
      as: "invoices",
    });

    // Folder has many GeneralFolderFiles (for direct file uploads to general folders)
    Folder.hasMany(models.GeneralFolderFile, {
      foreignKey: "folderId",
      as: "files",
    });

    // Folder has one FolderAnalytics (for OCR analytics data)
    Folder.hasOne(models.FolderAnalytics, {
      foreignKey: "folderId",
      as: "analytics",
    });
  };

  return Folder;
};
