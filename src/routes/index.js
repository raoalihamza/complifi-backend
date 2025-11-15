const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const workspaceRoutes = require("./workspaceRoutes");
const folderRoutes = require("./folderRoutes");
const transactionRoutes = require("./transactionRoutes");
const receiptRoutes = require("./receiptRoutes");
const invoiceRoutes = require("./invoiceRoutes");
const reportRoutes = require("./reportRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/folders", folderRoutes);
router.use("/transactions", transactionRoutes);
router.use("/transactions", receiptRoutes);
router.use("/transactions", invoiceRoutes);
router.use("/reports", reportRoutes);

// Health check for API
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Complifi API v1",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      workspaces: "/api/v1/workspaces",
      folders: "/api/v1/folders",
      transactions: "/api/v1/transactions",
      receipts: "/api/v1/receipts",
      invoices: "/api/v1/invoices",
      reports: "/api/v1/reports",
    },
  });
});

module.exports = router;
