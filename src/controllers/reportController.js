const folderService = require("../services/folderService");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/responseHandler");
const { HTTP_STATUS, STATEMENT_TYPES, FOLDER_STATUS } = require("../config/constants");
const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");

class ReportController {
  /**
   * Get reports (folders) with filtering
   * GET /api/v1/reports
   * Query params: workspaceId, statementType, status, startDate, endDate, minCompliance, maxCompliance, search, page, limit, sortBy, sortOrder
   */
  async getReports(req, res) {
    try {
      const userId = req.user.id;
      const { workspaceId } = req.query;

      if (!workspaceId) {
        return errorResponse(
          res,
          "Workspace ID is required",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Extract filters from query
      const filters = {
        statementType: req.query.statementType, // BANK or CARD
        status: req.query.status,
        type: "RECONCILIATION", // Only show reconciliation folders in reports
        search: req.query.search, // Search by folder name
      };

      // Date range filter (for closing date)
      if (req.query.startDate || req.query.endDate) {
        filters.closingDateRange = {
          start: req.query.startDate,
          end: req.query.endDate,
        };
      }

      // Compliance score filter
      if (req.query.minCompliance || req.query.maxCompliance) {
        filters.complianceRange = {
          min: req.query.minCompliance ? parseFloat(req.query.minCompliance) : 0,
          max: req.query.maxCompliance ? parseFloat(req.query.maxCompliance) : 100,
        };
      }

      // Extract pagination from query
      const pagination = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
        sortBy: req.query.sortBy || "closingDate",
        sortOrder: req.query.sortOrder || "DESC",
      };

      const result = await folderService.getFolders(
        userId,
        parseInt(workspaceId),
        filters,
        pagination,
        'statementTypes' // Return counts by statement type (BANK/CARD) for reports
      );

      return paginatedResponse(
        res,
        "Reports fetched successfully",
        result.folders,
        result.pagination,
        HTTP_STATUS.OK
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get report statistics
   * GET /api/v1/reports/statistics
   * Query params: workspaceId, statementType
   */
  async getReportStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { workspaceId, statementType } = req.query;

      if (!workspaceId) {
        return errorResponse(
          res,
          "Workspace ID is required",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const filters = {
        type: "RECONCILIATION",
        statementType,
      };

      // Get all folders without pagination
      const result = await folderService.getFolders(
        userId,
        parseInt(workspaceId),
        filters,
        { page: 1, limit: 10000 } // Get all
      );

      const folders = result.folders;

      // Calculate statistics
      const statistics = {
        total: folders.length,
        byStatus: {
          TO_DO: folders.filter(f => f.status === FOLDER_STATUS.TO_DO).length,
          IN_PROGRESS: folders.filter(f => f.status === FOLDER_STATUS.IN_PROGRESS).length,
          IN_REVIEW: folders.filter(f => f.status === FOLDER_STATUS.IN_REVIEW).length,
          CLOSED: folders.filter(f => f.status === FOLDER_STATUS.CLOSED).length,
        },
        byStatementType: {
          BANK: folders.filter(f => f.statementType === STATEMENT_TYPES.BANK).length,
          CARD: folders.filter(f => f.statementType === STATEMENT_TYPES.CARD).length,
        },
        compliance: {
          average: folders.length > 0
            ? folders.reduce((sum, f) => sum + (f.complianceScore || 0), 0) / folders.length
            : 0,
          ranges: {
            low: folders.filter(f => (f.complianceScore || 0) < 30).length,
            medium: folders.filter(f => (f.complianceScore || 0) >= 30 && (f.complianceScore || 0) < 70).length,
            high: folders.filter(f => (f.complianceScore || 0) >= 70).length,
          },
        },
      };

      return successResponse(
        res,
        "Report statistics fetched successfully",
        statistics,
        HTTP_STATUS.OK
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Download reports as PDF
   * GET /api/v1/reports/download/pdf
   * Query params: workspaceId, statementType, status
   */
  async downloadReportsPDF(req, res) {
    try {
      const userId = req.user.id;
      const { workspaceId, statementType } = req.query;

      if (!workspaceId) {
        return errorResponse(
          res,
          "Workspace ID is required",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const filters = {
        type: "RECONCILIATION",
        statementType,
        status: req.query.status,
      };

      // Get all folders without pagination
      const result = await folderService.getFolders(
        userId,
        parseInt(workspaceId),
        filters,
        { page: 1, limit: 10000 }
      );

      const folders = result.folders;

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=reports-${Date.now()}.pdf`
      );

      // Pipe PDF to response
      doc.pipe(res);

      // Add title
      doc.fontSize(20).text("Compliance Reports", { align: "center" });
      doc.moveDown();

      // Add report type
      const reportType = statementType === STATEMENT_TYPES.BANK
        ? "Bank Statements"
        : statementType === STATEMENT_TYPES.CARD
        ? "Card Statements"
        : "All Statements";

      doc.fontSize(14).text(reportType, { align: "center" });
      doc.moveDown();

      // Add date
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
      doc.moveDown(2);

      // Add table headers
      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 100;
      const col3X = 250;
      const col4X = 350;
      const col5X = 450;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Sr. No", col1X, tableTop);
      doc.text("Folder Name", col2X, tableTop);
      doc.text("Compliance", col3X, tableTop);
      doc.text("Closing Date", col4X, tableTop);
      doc.text("Status", col5X, tableTop);

      // Add line
      doc.moveTo(col1X, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      // Add data rows
      doc.font("Helvetica");
      let currentY = tableTop + 25;

      folders.forEach((folder, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.text((index + 1).toString(), col1X, currentY);
        doc.text(folder.name || "N/A", col2X, currentY, { width: 140 });
        doc.text(`${folder.complianceScore || 0}%`, col3X, currentY);
        doc.text(
          folder.closingDate
            ? new Date(folder.closingDate).toLocaleDateString()
            : "N/A",
          col4X,
          currentY
        );
        doc.text(folder.status || "N/A", col5X, currentY);

        currentY += 25;
      });

      // Finalize PDF
      doc.end();
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Download reports as Excel
   * GET /api/v1/reports/download/excel
   * Query params: workspaceId, statementType, status
   */
  async downloadReportsExcel(req, res) {
    try {
      const userId = req.user.id;
      const { workspaceId, statementType } = req.query;

      if (!workspaceId) {
        return errorResponse(
          res,
          "Workspace ID is required",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const filters = {
        type: "RECONCILIATION",
        statementType,
        status: req.query.status,
      };

      // Get all folders without pagination
      const result = await folderService.getFolders(
        userId,
        parseInt(workspaceId),
        filters,
        { page: 1, limit: 10000 }
      );

      const folders = result.folders;

      // Prepare data for Excel
      const data = folders.map((folder, index) => ({
        "Sr. No": index + 1,
        "Folder Name": folder.name || "N/A",
        "Compliance Score": `${folder.complianceScore || 0}%`,
        "Closing Date": folder.closingDate
          ? new Date(folder.closingDate).toLocaleDateString()
          : "N/A",
        "Status": folder.status || "N/A",
        "Statement Type": folder.statementType || "N/A",
        "Priority": folder.priority || "N/A",
        "Assigned To": folder.assignedTo
          ? `${folder.assignedTo.firstName} ${folder.assignedTo.lastName}`
          : "Unassigned",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 8 },  // Sr. No
        { wch: 30 }, // Folder Name
        { wch: 18 }, // Compliance Score
        { wch: 15 }, // Closing Date
        { wch: 15 }, // Status
        { wch: 15 }, // Statement Type
        { wch: 12 }, // Priority
        { wch: 20 }, // Assigned To
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=reports-${Date.now()}.xlsx`
      );

      // Send buffer
      return res.send(buffer);
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get report by ID (same as folder by ID)
   * GET /api/v1/reports/:id
   */
  async getReportById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const folder = await folderService.getFolderById(userId, parseInt(id));

      // Verify it's a reconciliation folder
      if (folder.type !== "RECONCILIATION") {
        return errorResponse(
          res,
          "This folder is not a reconciliation report",
          null,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      return successResponse(
        res,
        "Report fetched successfully",
        folder,
        HTTP_STATUS.OK
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error,
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new ReportController();
