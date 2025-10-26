require("dotenv").config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,

  database: {
    url: process.env.DATABASE_URL,
    // Fallback for individual configs (if needed later)
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || "7d",
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    uploadPath: process.env.UPLOAD_PATH || "./uploads",
  },

  ocr: {
    apiUrl: process.env.OCR_API_URL,
    apiKey: process.env.OCR_API_KEY,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};
