const { WORKSPACE_ROLES } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const WorkspaceMember = sequelize.define(
    "WorkspaceMember",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      role: {
        type: DataTypes.ENUM(
          WORKSPACE_ROLES.ADMIN,
          WORKSPACE_ROLES.EDITOR,
          WORKSPACE_ROLES.VIEWER
        ),
        allowNull: false,
        defaultValue: WORKSPACE_ROLES.VIEWER,
        validate: {
          isIn: {
            args: [
              [
                WORKSPACE_ROLES.ADMIN,
                WORKSPACE_ROLES.EDITOR,
                WORKSPACE_ROLES.VIEWER,
              ],
            ],
            msg: "Invalid workspace role",
          },
        },
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "joined_at",
      },
    },
    {
      tableName: "workspace_members",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["workspace_id", "user_id"],
          name: "unique_workspace_user",
        },
        {
          fields: ["workspace_id"],
        },
        {
          fields: ["user_id"],
        },
      ],
    }
  );

  // Associations
  WorkspaceMember.associate = (models) => {
    // WorkspaceMember belongs to Workspace
    WorkspaceMember.belongsTo(models.Workspace, {
      foreignKey: "workspaceId",
      as: "workspace",
    });

    // WorkspaceMember belongs to User
    WorkspaceMember.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return WorkspaceMember;
};
