const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const envConfig = require("../config/environment");
const { USER_ROLES } = require("../config/constants");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: "Please provide a valid email",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [8, 100],
            msg: "Password must be at least 8 characters long",
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [2, 100],
            msg: "Name must be between 2 and 100 characters",
          },
        },
      },
      role: {
        type: DataTypes.ENUM(
          USER_ROLES.ADMIN,
          USER_ROLES.AUDIT_PARTNER,
          USER_ROLES.SME_USER,
          USER_ROLES.VIEWER
        ),
        allowNull: false,
        defaultValue: USER_ROLES.SME_USER,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_email_verified",
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_login",
      },
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true,
      hooks: {
        // Hash password before creating user
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        // Hash password before updating if password changed
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  // Instance method to compare password
  User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Instance method to generate JWT token
  User.prototype.generateAuthToken = function () {
    return jwt.sign(
      { id: this.id, email: this.email, role: this.role },
      envConfig.jwt.secret,
      { expiresIn: envConfig.jwt.expire }
    );
  };

  // Remove password from JSON response
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};
