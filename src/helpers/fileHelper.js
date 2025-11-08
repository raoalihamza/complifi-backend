const fs = require("fs");
const path = require("path");

class FileHelper {
  /**
   * Delete file from filesystem
   */
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filePath}`);
        return true;
      }
      console.log(`File not found: ${filePath}`);
      return false;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  fileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      console.error(`Error checking file existence ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.error(`Error getting file size ${filePath}:`, error);
      return 0;
    }
  }

  /**
   * Format file size to human readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Ensure directory exists, create if not
   */
  ensureDirectoryExists(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory created: ${dirPath}`);
      }
      return true;
    } catch (error) {
      console.error(`Error creating directory ${dirPath}:`, error);
      return false;
    }
  }

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Validate file type
   */
  isValidFileType(filename, allowedTypes) {
    const ext = this.getFileExtension(filename);
    return allowedTypes.includes(ext);
  }

  /**
   * Generate unique filename
   */
  generateUniqueFilename(originalFilename) {
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${basename}-${timestamp}-${random}${ext}`;
  }

  /**
   * Delete multiple files
   */
  deleteMultipleFiles(filePaths) {
    const results = {
      success: [],
      failed: [],
    };

    filePaths.forEach((filePath) => {
      if (this.deleteFile(filePath)) {
        results.success.push(filePath);
      } else {
        results.failed.push(filePath);
      }
    });

    return results;
  }

  /**
   * Move file from one location to another
   */
  moveFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      this.ensureDirectoryExists(destDir);

      // Move file
      fs.renameSync(sourcePath, destinationPath);
      console.log(`File moved from ${sourcePath} to ${destinationPath}`);
      return true;
    } catch (error) {
      console.error(
        `Error moving file from ${sourcePath} to ${destinationPath}:`,
        error
      );
      return false;
    }
  }

  /**
   * Copy file from one location to another
   */
  copyFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      this.ensureDirectoryExists(destDir);

      // Copy file
      fs.copyFileSync(sourcePath, destinationPath);
      console.log(`File copied from ${sourcePath} to ${destinationPath}`);
      return true;
    } catch (error) {
      console.error(
        `Error copying file from ${sourcePath} to ${destinationPath}:`,
        error
      );
      return false;
    }
  }
}

module.exports = new FileHelper();
