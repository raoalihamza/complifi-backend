const { FolderAnalytics } = require("../models");

class FolderAnalyticsRepository {
  /**
   * Create new folder analytics record
   * @param {Object} analyticsData - OCR analytics data
   * @returns {Promise<FolderAnalytics>}
   */
  async create(analyticsData) {
    try {
      return await FolderAnalytics.create(analyticsData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find analytics by folder ID
   * @param {number} folderId - Folder ID
   * @returns {Promise<FolderAnalytics|null>}
   */
  async findByFolderId(folderId) {
    try {
      return await FolderAnalytics.findOne({
        where: { folderId },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update analytics for a folder
   * @param {number} folderId - Folder ID
   * @param {Object} updateData - Updated analytics data
   * @returns {Promise<FolderAnalytics|null>}
   */
  async update(folderId, updateData) {
    try {
      const analytics = await this.findByFolderId(folderId);

      if (!analytics) {
        return null;
      }

      await analytics.update(updateData);
      return analytics;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create or update analytics (upsert)
   * @param {number} folderId - Folder ID
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<FolderAnalytics>}
   */
  async upsert(folderId, analyticsData) {
    try {
      const [analytics, created] = await FolderAnalytics.upsert({
        folderId,
        ...analyticsData,
      }, {
        returning: true,
      });

      return analytics;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete analytics by folder ID
   * @param {number} folderId - Folder ID
   * @returns {Promise<boolean>}
   */
  async delete(folderId) {
    try {
      const deleted = await FolderAnalytics.destroy({
        where: { folderId },
      });

      return deleted > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FolderAnalyticsRepository();
