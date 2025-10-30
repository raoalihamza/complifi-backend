const { User } = require("../models");

class UserRepository {
  /**
   * Create new user
   */
  async create(userData) {
    try {
      return await User.create(userData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id, includePassword = false) {
    try {
      const options = {};
      if (!includePassword) {
        options.attributes = { exclude: ["password"] };
      }
      return await User.findByPk(id, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      return await User.findOne({ where: { email } });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by password reset token
   */
  async findByPasswordResetToken(token) {
    return await User.findOne({
      where: {
        passwordResetToken: token,
      },
    });
  }

  /**
   * Update user
   */
  async update(id, updateData) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error("User not found");
    }
    return await user.update(updateData);
  }

  /**
   * Update last login
   */
  async updateLastLogin(id) {
    try {
      return await this.update(id, { lastLogin: new Date() });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error("User not found");
    }
    return await user.destroy();
  }

  /**
   * Find all users with filters and pagination (for admin purposes)
   */
  async findAll(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        where: filters,
        attributes: { exclude: ["password"] },
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      return {
        users: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Count users
   */
  async count(where = {}) {
    return await User.count({ where });
  }
}

module.exports = new UserRepository();
