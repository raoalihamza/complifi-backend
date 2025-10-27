const { WORKSPACE_ROLES } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const Workspace = sequelize.define(
    "Workspace",
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
            args: [2, 100],
            msg: "Workspace name must be between 2 and 100 characters",
          },
          notEmpty: {
            msg: "Workspace name is required",
          },
        },
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "owner_id",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "workspaces",
      underscored: true,
      timestamps: true,
    }
  );

  // Associations
  Workspace.associate = (models) => {
    // Workspace belongs to a User (owner)
    Workspace.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner",
    });

    // Workspace has many members through WorkspaceMember
    Workspace.hasMany(models.WorkspaceMember, {
      foreignKey: "workspaceId",
      as: "members",
    });

    // Workspace has many folders (will be added in Phase 3)
    // Workspace.hasMany(models.Folder, {
    //   foreignKey: "workspaceId",
    //   as: "folders",
    // });
  };

  return Workspace;
};
