module.exports = (sequelize, DataTypes) => {
  const GeneralFolderFile = sequelize.define(
    "GeneralFolderFile",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "folder_id",
        references: {
          model: "folders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "file_name",
        validate: {
          notEmpty: {
            msg: "File name is required",
          },
        },
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "file_url",
        validate: {
          notEmpty: {
            msg: "File URL is required",
          },
        },
      },
      fileType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "file_type",
        validate: {
          isIn: {
            args: [["pdf", "excel", "image"]],
            msg: "Invalid file type. Must be pdf, excel, or image",
          },
        },
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "mime_type",
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "file_size",
        validate: {
          max: {
            args: [10485760], // 10MB in bytes
            msg: "File size cannot exceed 10MB",
          },
        },
      },
      uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "uploaded_by",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "general_folder_files",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ["folder_id"],
        },
        {
          fields: ["uploaded_by"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  );

  // Associations
  GeneralFolderFile.associate = (models) => {
    // GeneralFolderFile belongs to Folder
    GeneralFolderFile.belongsTo(models.Folder, {
      foreignKey: "folderId",
      as: "folder",
    });

    // GeneralFolderFile belongs to User (uploader)
    GeneralFolderFile.belongsTo(models.User, {
      foreignKey: "uploadedBy",
      as: "uploader",
    });
  };

  return GeneralFolderFile;
};
