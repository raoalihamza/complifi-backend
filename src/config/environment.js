require("dotenv").config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

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

  // Mailgun Configuration
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    from: process.env.MAILGUN_FROM || "Complifi AI <noreply@complifi.ai>",
  },

  // Email Configuration
  email: {
    verificationExpires: process.env.EMAIL_VERIFICATION_EXPIRES || "24h",
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
    passwordResetExpires: process.env.PASSWORD_RESET_EXPIRES || "1h",
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
