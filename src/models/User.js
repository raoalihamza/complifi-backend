const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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
      isSuperAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_super_admin",
      },
      // Email Verification Fields
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_email_verified",
      },
      emailVerificationOTP: {
        type: DataTypes.STRING(6),
        allowNull: true,
        field: "email_verification_otp",
      },
      emailVerificationOTPExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "email_verification_otp_expires",
      },
      // Password Reset Fields
      passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "password_reset_token",
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "password_reset_expires",
      },
      // Company Onboarding Fields
      companyName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: "company_name",
      },
      companySize: {
        type: DataTypes.ENUM("0-10", "11-25", "OVER_25"),
        allowNull: true,
        field: "company_size",
      },
      companyLocation: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: "company_location",
      },
      // Onboarding Status Tracking
      hasCompletedOnboarding: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "has_completed_onboarding",
      },
      onboardingCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "onboarding_completed_at",
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
      indexes: [
        {
          unique: true,
          fields: ["email"],
        },
        {
          fields: ["is_email_verified"],
        },
        {
          fields: ["password_reset_token"],
        },
        {
          fields: ["has_completed_onboarding"],
        },
        {
          fields: ["is_super_admin"],
        },
      ],
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
      { id: this.id, email: this.email, isSuperAdmin: this.isSuperAdmin }, // ✅ Add isSuperAdmin
      envConfig.jwt.secret,
      { expiresIn: envConfig.jwt.expire }
    );
  };

  /**
   * Generate OTP for email verification
   */
  User.prototype.generateEmailVerificationOTP = function () {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    this.emailVerificationOTP = otp;
    this.emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return otp;
  };

  /**
   * Verify OTP
   */
  User.prototype.verifyOTP = function (otp) {
    if (!this.emailVerificationOTP || !this.emailVerificationOTPExpires) {
      return false;
    }

    // Check if OTP is expired
    if (this.emailVerificationOTPExpires < new Date()) {
      return false;
    }

    // Check if OTP matches
    return this.emailVerificationOTP === otp;
  };

  /**
   * Generate password reset token
   */
  User.prototype.generatePasswordResetToken = function () {
    // Generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token and set to passwordResetToken field
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire time (1 hour)
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Return unhashed token (to send via email)
    return resetToken;
  };

  /**
   * Verify password reset token (Static method)
   */
  User.verifyPasswordResetToken = function (token) {
    // Hash the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    return hashedToken;
  };

  // Remove sensitive fields from JSON response
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.emailVerificationOTP;
    delete values.emailVerificationOTPExpires;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    return values;
  };

  return User;
};
