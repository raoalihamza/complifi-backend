const userRepository = require("../repositories/userRepository");
const emailService = require("../services/emailService");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../config/constants");

class AuthService {
  /**
   * Verify email with OTP
   */
  async verifyEmail(email, otp) {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(email);

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if already verified
      if (user.isEmailVerified) {
        const error = new Error("Email already verified");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Verify OTP
      const isValid = user.verifyOTP(otp);

      if (!isValid) {
        const error = new Error("Invalid or expired OTP");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Mark email as verified
      await userRepository.update(user.id, {
        isEmailVerified: true,
        emailVerificationOTP: null,
        emailVerificationOTPExpires: null,
      });

      const updatedUser = await userRepository.findById(user.id);

      return {
        user: updatedUser.toJSON(),
        message: "Email verified successfully!",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend OTP verification email
   */
  async resendOTP(email) {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(email);

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if already verified
      if (user.isEmailVerified) {
        const error = new Error("Email already verified");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Generate new OTP
      const otp = user.generateEmailVerificationOTP();
      await user.save();

      // Send verification email
      try {
        await emailService.sendOTPVerificationEmail(email, user.name, otp);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        const error = new Error(
          "Failed to send verification email. Please try again."
        );
        error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        throw error;
      }

      return {
        message: "Verification code sent successfully!",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(email);

      if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw error;
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        const error = new Error("Invalid email or password");
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw error;
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        const error = new Error("Please verify your email before logging in");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.needsVerification = true;
        throw error;
      }

      // Check if account is active
      if (!user.isActive) {
        const error = new Error("Your account has been suspended. Please contact support.");
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        throw error;
      }

      // Update last login
      await userRepository.updateLastLogin(user.id);

      // Generate token
      const token = user.generateAuthToken();

      // Return user without password
      const userResponse = user.toJSON();

      return {
        user: userResponse,
        token,
        message: "Login successful",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit company information (Onboarding Step 1)
   */
  async submitCompanyInfo(userId, companyData) {
    try {
      const { companyName, companySize, companyLocation } = companyData;

      // Update user with company information
      await userRepository.update(userId, {
        companyName,
        companySize,
        companyLocation,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date(),
      });

      const user = await userRepository.findById(userId);

      return {
        user: user.toJSON(),
        message: "Company information saved successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password (when user knows old password)
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Find user WITH password for comparison
      const user = await userRepository.findById(userId, true);

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Verify old password
      const isOldPasswordValid = await user.comparePassword(oldPassword);

      if (!isOldPasswordValid) {
        const error = new Error("Current password is incorrect");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Update password (will be hashed by model hook)
      await userRepository.update(userId, { password: newPassword });

      // Send confirmation email
      try {
        await emailService.sendPasswordChangedEmail(user.email, user.name);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      return { message: "Password changed successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Forgot password - Send reset link
   */
  async forgotPassword(email) {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(email);

      if (!user) {
        // Don't reveal if user exists or not (security)
        return {
          message:
            "If an account exists with that email, a password reset link has been sent.",
        };
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send reset email
      try {
        await emailService.sendPasswordResetEmail(email, user.name, resetToken);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Reset the token if email fails
        await userRepository.update(user.id, {
          passwordResetToken: null,
          passwordResetExpires: null,
        });

        const error = new Error(
          "Failed to send password reset email. Please try again."
        );
        error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        throw error;
      }

      return {
        message: "Password reset link sent to your email",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      // Hash the token to compare
      const { User } = require("../models");
      const hashedToken = User.verifyPasswordResetToken(token);

      // Find user with valid token
      const user = await userRepository.findByPasswordResetToken(hashedToken);

      if (!user) {
        const error = new Error("Invalid or expired reset token");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Check if token is expired
      if (user.passwordResetExpires < new Date()) {
        const error = new Error(
          "Reset token has expired. Please request a new one."
        );
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      // Update password
      await userRepository.update(user.id, {
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      // Send confirmation email
      try {
        await emailService.sendPasswordChangedEmail(user.email, user.name);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      return {
        message:
          "Password reset successful! You can now login with your new password.",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId) {
    try {
      const user = await userRepository.findById(userId);

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
