const userRepository = require("../repositories/userRepository");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../config/constants");

class AuthService {
  /**
   * Register new user
   * Note: Does NOT return token - user must verify email first
   * TODO: Implement email verification with OTP
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(userData.email);

      if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }

      // Create user (password will be hashed by model hook)
      const user = await userRepository.create(userData);

      // TODO: Send verification email with OTP here
      // await emailService.sendVerificationEmail(user.email, otp);

      // Return user without password and WITHOUT token
      const userResponse = user.toJSON();

      return {
        user: userResponse,
        // token will be provided after email verification
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

      // Update last login
      await userRepository.updateLastLogin(user.id);

      // Generate token
      const token = user.generateAuthToken();

      // Return user without password
      const userResponse = user.toJSON();

      return {
        user: userResponse,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Find user
      const user = await userRepository.findByEmail(
        (
          await userRepository.findById(userId)
        ).email
      );

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

      return { message: "Password changed successfully" };
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

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
