const { User } = require("../models");

class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      return await User.findByPk(id, {
        attributes: { exclude: ["password"] },
      });
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
   * Update user
   */
  async update(id, updateData) {
    try {
      const user = await User.findByPk(id);
      if (!user) return null;

      return await user.update(updateData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) return null;

      await user.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id) {
    try {
      return await this.update(id, { lastLogin: new Date() });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find all users with filters and pagination
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
}

module.exports = new UserRepository();
