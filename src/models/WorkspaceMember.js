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
        allowNull: true, // Allow null for pending invitations
        field: "user_id",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true, // Email for pending invitations
        validate: {
          isEmail: true,
        },
      },
      role: {
        type: DataTypes.ENUM("editor", "viewer"),
        allowNull: false,
        defaultValue: "viewer",
        validate: {
          isIn: {
            args: [["editor", "viewer"]],
            msg: "Invalid workspace role",
          },
        },
      },
      invitedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        field: "invited_by",
      },
      invitationToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: "invitation_token",
      },
      invitationTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "invitation_token_expiry",
      },
      invitationAccepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "invitation_accepted",
      },
      invitedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "invited_at",
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "accepted_at",
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "joined_at",
      },
      status: {
        type: DataTypes.ENUM("pending", "active", "inactive"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      tableName: "workspace_members",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["workspace_id", "user_id"],
          name: "unique_workspace_user",
          where: {
            user_id: {
              [require("sequelize").Op.ne]: null,
            },
          },
        },
        {
          unique: true,
          fields: ["workspace_id", "email"],
          name: "unique_workspace_email",
          where: {
            email: {
              [require("sequelize").Op.ne]: null,
            },
          },
        },
        {
          unique: true,
          fields: ["invitation_token"],
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
    WorkspaceMember.belongsTo(models.Workspace, {
      foreignKey: "workspaceId",
      as: "workspace",
    });

    WorkspaceMember.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    WorkspaceMember.belongsTo(models.User, {
      foreignKey: "invitedBy",
      as: "inviter",
    });
  };

  return WorkspaceMember;
};
