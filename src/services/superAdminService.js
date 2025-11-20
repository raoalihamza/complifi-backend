const { User } = require("../models");
const { HTTP_STATUS } = require("../config/constants");
const { Op } = require("sequelize");

class SuperAdminService {
  /**
   * Create a new Super Admin
   * Only Owner can create super admins
   */
  async createSuperAdmin(superAdminData) {
    try {
      const { email, password, name, companyName, companySize, companyLocation } = superAdminData;

      // Check if user with email already exists
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        const error = new Error("User with this email already exists");
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }

      // Create super admin user
      const superAdmin = await User.create({
        email,
        password,
        name,
        isSuperAdmin: true,
        isEmailVerified: true, // Auto-verify super admin created by owner
        hasCompletedOnboarding: true,
        companyName,
        companySize,
        companyLocation,
        onboardingCompletedAt: new Date(),
      });

      return {
        superAdmin: superAdmin.toJSON(),
        message: "Super Admin created successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all Super Admins
   * Returns list of all super admins (excludes owners and regular users)
   */
  async getAllSuperAdmins(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        where: {
          isSuperAdmin: true,
          isOwner: false, // Exclude owners from the list
        },
        attributes: { exclude: ["password"] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      return {
        superAdmins: rows.map((admin) => admin.toJSON()),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
        message: "Super Admins fetched successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single Super Admin by ID
   */
  async getSuperAdminById(superAdminId) {
    try {
      const superAdmin = await User.findOne({
        where: {
          id: superAdminId,
          isSuperAdmin: true,
          isOwner: false, // Ensure we don't return owner details
        },
        attributes: { exclude: ["password"] },
      });

      if (!superAdmin) {
        const error = new Error("Super Admin not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      return {
        superAdmin: superAdmin.toJSON(),
        message: "Super Admin fetched successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Super Admin
   * Owner can update all fields of a super admin
   */
  async updateSuperAdmin(superAdminId, updateData) {
    try {
      const { email, name, companyName, companySize, companyLocation, password } = updateData;

      // Find super admin
      const superAdmin = await User.findOne({
        where: {
          id: superAdminId,
          isSuperAdmin: true,
          isOwner: false, // Cannot update owner through this endpoint
        },
      });

      if (!superAdmin) {
        const error = new Error("Super Admin not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== superAdmin.email) {
        const existingUser = await User.findOne({
          where: {
            email,
            id: { [Op.ne]: superAdminId },
          },
        });

        if (existingUser) {
          const error = new Error("Email already in use");
          error.statusCode = HTTP_STATUS.CONFLICT;
          throw error;
        }
      }

      // Prepare update object
      const updateObject = {};
      if (email) updateObject.email = email;
      if (name) updateObject.name = name;
      if (companyName !== undefined) updateObject.companyName = companyName;
      if (companySize) updateObject.companySize = companySize;
      if (companyLocation !== undefined) updateObject.companyLocation = companyLocation;
      if (password) updateObject.password = password; // Will be hashed by model hook

      // Update super admin
      await superAdmin.update(updateObject);

      // Fetch updated super admin
      const updatedSuperAdmin = await User.findByPk(superAdminId, {
        attributes: { exclude: ["password"] },
      });

      return {
        superAdmin: updatedSuperAdmin.toJSON(),
        message: "Super Admin updated successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Super Admin
   * Owner can delete super admin accounts
   */
  async deleteSuperAdmin(superAdminId) {
    try {
      // Find super admin
      const superAdmin = await User.findOne({
        where: {
          id: superAdminId,
          isSuperAdmin: true,
          isOwner: false, // Cannot delete owner through this endpoint
        },
      });

      if (!superAdmin) {
        const error = new Error("Super Admin not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Delete the super admin
      await superAdmin.destroy();

      return {
        message: "Super Admin deleted successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle Super Admin account status (enable/disable)
   * Temporarily suspends or activates a super admin account
   * When disabled, the super admin cannot login but retains their role
   */
  async toggleSuperAdminStatus(superAdminId, isActive) {
    try {
      // Find super admin by ID (don't filter by isSuperAdmin to allow re-enabling)
      const superAdmin = await User.findOne({
        where: {
          id: superAdminId,
          isSuperAdmin: true, // Must be a super admin (not a regular user)
          isOwner: false, // Cannot modify owner accounts
        },
      });

      if (!superAdmin) {
        const error = new Error("Super Admin not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      // Update the account active status (not the role)
      await superAdmin.update({
        isActive: isActive,
      });

      const updatedSuperAdmin = await User.findByPk(superAdminId, {
        attributes: { exclude: ["password"] },
      });

      return {
        superAdmin: updatedSuperAdmin.toJSON(),
        message: `Super Admin account ${isActive ? "activated" : "suspended"} successfully`,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SuperAdminService();
