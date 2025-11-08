const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDirs = {
  statements: path.join(__dirname, "../../uploads/statements"),
  receipts: path.join(__dirname, "../../uploads/receipts"),
  invoices: path.join(__dirname, "../../uploads/invoices"),
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on route/fieldname
    let uploadPath = uploadDirs.statements; // default

    if (file.fieldname === "receipts" || req.path.includes("/receipts")) {
      uploadPath = uploadDirs.receipts;
    } else if (
      file.fieldname === "invoices" ||
      req.path.includes("/invoices")
    ) {
      uploadPath = uploadDirs.invoices;
    } else if (
      file.fieldname === "statement" ||
      req.path.includes("/statements")
    ) {
      uploadPath = uploadDirs.statements;
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomnumber-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// File filter - allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    statements: [".pdf", ".csv", ".xlsx", ".xls"],
    receipts: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
    invoices: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
  };

  const ext = path.extname(file.originalname).toLowerCase();
  let isValid = false;

  // Check based on fieldname or route
  if (file.fieldname === "statement" || req.path.includes("/statements")) {
    isValid = allowedTypes.statements.includes(ext);
  } else if (file.fieldname === "receipts" || req.path.includes("/receipts")) {
    isValid = allowedTypes.receipts.includes(ext);
  } else if (file.fieldname === "invoices" || req.path.includes("/invoices")) {
    isValid = allowedTypes.invoices.includes(ext);
  }

  if (isValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${Object.values(allowedTypes)
          .flat()
          .join(", ")}`
      ),
      false
    );
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 10 files at once.",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

module.exports = {
  single: (fieldName) => [upload.single(fieldName), handleMulterError],
  array: (fieldName, maxCount) => [
    upload.array(fieldName, maxCount),
    handleMulterError,
  ],
  fields: (fields) => [upload.fields(fields), handleMulterError],
  uploadDirs,
};
