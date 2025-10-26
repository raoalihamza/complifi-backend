const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const envConfig = require("./src/config/environment");
const db = require("./src/models");
const routes = require("./src/routes");

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: envConfig.rateLimit.windowMs,
  max: envConfig.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: envConfig.nodeEnv,
  });
});

// API Routes
app.use("/api/v1", routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: envConfig.nodeEnv === "development" ? err.message : undefined,
  });
});

// Database Connection & Server Start
const PORT = envConfig.port;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Database connected successfully");

    if (envConfig.nodeEnv === "development") {
      await db.sequelize.sync({ alter: false });
      console.log("✅ Models synced with database");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${envConfig.nodeEnv}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
