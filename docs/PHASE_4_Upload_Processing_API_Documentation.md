# Phase 4 - Upload & Processing API Documentation

**Base URL**: `https://api.complifi.api/api/v1`
**Authentication**: Bearer Token (JWT)

---

## Overview

The Upload & Processing System provides:

- **Statement Upload & OCR**: Upload bank/card statements with automatic transaction extraction
- **Receipt Upload & Processing**: Upload receipts (max 5 at once) for CARD reconciliation
- **Invoice Upload & Processing**: Upload invoices (max 5 at once) for BANK reconciliation
- **Automatic Reconciliation**: Fuzzy matching algorithm with ±3 day and ±5% amount tolerance
- **Compliance Scoring**: Automatic calculation of matched vs total transactions
- **Transaction Management**: View, update, flag, and manage transactions
- **Manual Linking**: Manually link/unlink documents to transactions

---

## System Architecture

### Upload & Processing Flow

```
BANK Statement Workflow:
1. Upload BANK statement (PDF/CSV/XLSX)
   ↓
2. OCR extracts all transactions automatically
   ↓
3. System creates RECONCILIATION folder (type: BANK)
   ↓
4. Transactions classified as FEE or EXCEPTION
   ↓
5. User uploads invoices (max 5 at once)
   ↓
6. OCR processes invoices
   ↓
7. Fuzzy matching runs automatically
   ↓
8. Matched transactions → MATCHED status
   ↓
9. Compliance score updated
   ↓
10. Review and finalize

CARD Statement Workflow:
1. Upload CARD statement (PDF/CSV/XLSX)
   ↓
2. OCR extracts all transactions automatically
   ↓
3. System creates RECONCILIATION folder (type: CARD)
   ↓
4. Transactions classified as FEE or EXCEPTION
   ↓
5. User uploads receipts (max 5 at once)
   ↓
6. OCR processes receipts
   ↓
7. Fuzzy matching runs automatically
   ↓
8. Matched transactions → MATCHED status
   ↓
9. Compliance score updated
   ↓
10. Review and finalize
```

---

## OCR Processing Capabilities

### Statement OCR (Google Gemini 2.5 Pro)

**Supported Formats**:
- PDF (digital or scanned)
- Images (JPG, PNG, WEBP, TIFF, HEIC)
- CSV, XLSX (spreadsheets)

**Features**:
- Multi-language support (English, Urdu, Arabic, Chinese, Japanese, Korean, European)
- Multi-currency (USD, PKR, EUR, GBP, INR, JPY, SAR, AED, CAD, AUD, CNY, KRW, etc.)
- Handles rotated, skewed, watermarked, and blurred documents
- Extracts comprehensive transaction data
- Detects fees, subscriptions, duplicates, hidden fees
- Calculates interest rates, APR, balances
- Provides financial tips and card suggestions

**Extracted Data**:
```json
{
  "currency": "USD",
  "transactions": [...],
  "totalFees": 45.50,
  "totalSpend": 1234.56,
  "subscriptions": ["Netflix", "Spotify"],
  "duplicates": [],
  "feeByCategory": {
    "Foreign Transaction Fee": 12.50,
    "Late Payment Fee": 0,
    "Interest Charge": 23.00,
    "Service Fee": 10.00
  },
  "topFeeMerchants": {...},
  "feesOverTime": {"2024-01": 45.50},
  "hiddenFees": [...],
  "flagged": [...],
  "tips": ["Enable autopay", "Waive service fees"],
  "cardSuggestions": ["No FX fee cards"],
  "interest_paid_amount": 23.00,
  "monthly_interest_rate_percent": 1.92,
  "apr_percent_nominal": 23.04,
  "average_daily_balance": 1200.00,
  "opening_balance": 1000.00,
  "closing_balance": 1500.00,
  // Additional dynamic fields from statement...
}
```

### Receipt OCR

**Supported Types**:
- Store receipts (grocery, retail, pharmacy, electronics)
- Restaurant bills (dine-in, takeaway, delivery)
- Online purchase receipts
- Service receipts (repair, maintenance)
- Fuel/gas station receipts
- Hotel/accommodation receipts
- Transportation receipts (taxi, parking)
- Medical/healthcare receipts
- Educational receipts

**Extracted Data**:
```json
{
  "receipt_type": "restaurant|store|online|service|fuel|hotel|transport|medical|education",
  "receipt_number": "R12345",
  "merchant_name": "ABC Restaurant",
  "merchant_address": "123 Main St",
  "receipt_date": "2024-01-20",
  "receipt_time": "14:30:00",
  "currency": "USD",
  "items": [
    {
      "item_name": "Burger",
      "quantity": 2,
      "unit_price": 12.50,
      "total_price": 25.00,
      "discount": 0,
      "tax": 2.00
    }
  ],
  "subtotal": 25.00,
  "tax_total": 2.00,
  "tip_amount": 5.00,
  "total": 32.00,
  "payment_method": "card",
  // Additional dynamic fields...
}
```

### Invoice OCR

**Supported Types**:
- Business invoices (B2B)
- Purchase orders
- Proforma invoices
- Tax invoices
- Utility bills (electricity, water, gas, internet)
- Service invoices
- Subscription invoices
- Rental invoices
- Credit/Debit notes

**Extracted Data**:
```json
{
  "document_type": "invoice|bill|purchase_order",
  "invoice_number": "INV-2024-001",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "vendor": {
    "name": "ABC Corp",
    "address": "123 Business St",
    "tax_id": "12-3456789",
    "bank_account": "123456789"
  },
  "currency": "USD",
  "line_items": [...],
  "subtotal": 1000.00,
  "tax_total": 100.00,
  "total_amount": 1100.00,
  "balance_due": 1100.00,
  // Additional dynamic fields...
}
```

---

## Matching Algorithm

### Fuzzy Matching Details

**Algorithm**: Levenshtein Distance (String Similarity)

**Matching Criteria** (all must match):
1. **Merchant Name**: ≥ 75% similarity using Levenshtein distance
2. **Date**: Within ±3 days tolerance
3. **Amount**: Within ±5% tolerance

**Tolerance Settings**:
- **Date Tolerance**: ±3 days
- **Amount Tolerance**: ±5% of average amount

**Priority**: Best match selected based on highest combined similarity score

**Example**:
```javascript
Transaction: {
  merchant: "AMAZON.COM",
  date: "2024-01-15",
  amount: 50.00
}

Receipt: {
  merchant: "Amazon",
  date: "2024-01-16",  // Within 3 days
  total: 51.00         // Within 5% (difference: 2%)
}

Result: MATCH (85% merchant similarity + date/amount within tolerance)
```

---

## Transaction Statuses

| Status | Description | How Set |
|--------|-------------|---------|
| `EXCEPTION` | Unmatched transaction | Default for all non-fee transactions |
| `FEE` | Bank/card fee or interest charge | Auto-detected from transaction category |
| `MATCHED` | Matched with receipt/invoice | Set by matching algorithm |
| `PENDING` | Awaiting review/action | Legacy status (rarely used) |

---

## Compliance Score Calculation

```
Formula: (Matched Transactions / Total Non-Fee Transactions) × 100

Example:
- Total transactions: 100
- FEE transactions: 10
- MATCHED transactions: 70
- EXCEPTION transactions: 20

Non-fee transactions: 100 - 10 = 90
Compliance score: (70 / 90) × 100 = 77.78%
```

**Important**: FEE transactions are excluded from compliance score calculation.

---

## File Upload Limits

| File Type | Max Size | Max Files Per Upload | Allowed Formats |
|-----------|----------|----------------------|-----------------|
| Statement | 10 MB | 1 | PDF, CSV, XLSX, JPG, PNG |
| Receipt | 10 MB | 5 | PDF, JPG, PNG, WEBP |
| Invoice | 10 MB | 5 | PDF, JPG, PNG |

---

## API Endpoints

### 1. Create Reconciliation Folder (Upload Statement)

**Purpose**: Upload bank/card statement to create a reconciliation folder with extracted transactions

**Endpoint**: `POST /transactions/reconciliation/create`

**Authentication**: Required
**Authorization**: SUPER_ADMIN or EDITOR

**Request Headers**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (multipart/form-data)**:
```
statementType: "BANK" | "CARD"  (required)
workspaceId: 1                   (required, integer)
statement: <file>                (required, max 10MB)
```

**Validation Rules**:
- `statementType`: Required, must be "BANK" or "CARD"
- `workspaceId`: Required, integer
- `statement`: Required, file, max 10MB, formats: PDF, CSV, XLSX, JPG, PNG
- User must be workspace member with EDITOR role or above

**Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Reconciliation folder created successfully",
  "data": {
    "folder": {
      "id": 25,
      "name": "January 2024 - Bank Data",
      "workspaceId": 1,
      "type": "RECONCILIATION",
      "statementType": "BANK",
      "status": "TO_DO",
      "complianceScore": 0,
      "statementFileUrl": "/uploads/statements/statement_1234.pdf",
      "createdBy": 1,
      "createdAt": "2024-01-20T10:30:00.000Z"
    },
    "totalTransactions": 45,
    "feeTransactions": 5,
    "exceptionTransactions": 40,
    "transactions": [
      {
        "id": 101,
        "folderId": 25,
        "merchantName": "Amazon.com",
        "date": "2024-01-15T00:00:00.000Z",
        "value": -49.99,
        "category": "purchase",
        "status": "EXCEPTION",
        "flagged": false,
        "notes": null
      },
      {
        "id": 102,
        "folderId": 25,
        "merchantName": "Bank Fee",
        "date": "2024-01-20T00:00:00.000Z",
        "value": -10.00,
        "category": "fee",
        "status": "FEE",
        "flagged": false,
        "notes": null
      }
    ],
    "fileInfo": {
      "filename": "january_statement.pdf",
      "size": "2.34 MB",
      "uploadedAt": "2024-01-20T10:30:00.000Z"
    },
    "analytics": {
      "currency": "USD",
      "totalFees": 45.50,
      "totalSpend": 1234.56,
      "subscriptions": ["Netflix", "Spotify", "Apple iCloud"],
      "duplicates": [],
      "feeByCategory": {
        "Foreign Transaction Fee": 12.50,
        "Late Payment Fee": 0,
        "Interest Charge": 23.00,
        "Service Fee": 10.00
      },
      "topFeeMerchants": {
        "bank fee": 33.00
      },
      "feesOverTime": {
        "2024-01": 45.50
      },
      "hiddenFees": [
        {
          "date": "2024-01-05",
          "description": "Foreign transaction fee",
          "merchant": "bank fee",
          "amount": -2.50,
          "labels": ["Foreign Transaction Fee"]
        }
      ],
      "flagged": [
        {
          "date": "2024-01-22",
          "description": "Late payment fee",
          "amount": -25.00,
          "reason": "Late payment fee charged"
        }
      ],
      "interestPaidAmount": 23.00,
      "monthlyInterestRatePercent": 1.92,
      "aprPercentNominal": 23.04,
      "averageDailyBalance": 1200.50,
      "openingBalance": 1000.00,
      "closingBalance": 1500.00
    },
    "tips": [
      "Enable autopay to avoid late fees",
      "Consider a no-foreign-transaction-fee card",
      "Review subscription services regularly"
    ],
    "cardSuggestions": [
      "Cash back cards for regular purchases",
      "No FX fee cards for international spending"
    ]
  }
}
```

**Important Notes**:
- Folder name is auto-generated from statement date (if available)
- All transactions are created in database
- Transactions auto-classified as FEE or EXCEPTION
- FEE transactions: category contains "fee", "charge", or "interest"
- EXCEPTION transactions: all non-fee transactions (awaiting matching)
- OCR analytics include tips, suggestions, hidden fees, and more
- File is uploaded to server storage

**Error Responses**:

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Statement type and workspace ID are required"
}
```

**400 Bad Request** - Invalid statement type
```json
{
  "success": false,
  "message": "Statement type must be either 'BANK' or 'CARD'"
}
```

**400 Bad Request** - No file
```json
{
  "success": false,
  "message": "No statement file uploaded"
}
```

**403 Forbidden** - Not authorized
```json
{
  "success": false,
  "message": "Only company owner or editor can create folders"
}
```

---

### 2. Upload Receipts (CARD Reconciliation)

**Purpose**: Upload receipts (max 5 at once) to match with CARD statement transactions

**Endpoint**: `POST /transactions/folders/:folderId/receipts`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `folderId` (integer): Reconciliation folder ID

**Request Headers**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (multipart/form-data)**:
```
receipts: <file[]>   (required, max 5 files, each max 10MB)
```

**Validation Rules**:
- Folder must exist and be RECONCILIATION type
- Folder must have statementType = CARD
- Maximum 5 files per request
- Each file max 10MB
- Supported formats: PDF, JPG, PNG, WEBP

**Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "3 receipt(s) uploaded successfully",
  "data": {
    "processedReceipts": [
      {
        "id": 15,
        "folderId": 25,
        "receiptNumber": "R12345",
        "merchantName": "Amazon",
        "taxPaid": 4.50,
        "total": 54.50,
        "receiptDate": "2024-01-15T00:00:00.000Z",
        "imageUrl": "/uploads/receipts/receipt_5678.pdf",
        "uploadedBy": 1,
        "linkedTransactionId": 101,
        "createdAt": "2024-01-20T11:00:00.000Z",
        "ocrData": {
          "receipt_type": "online",
          "receipt_number": "R12345",
          "merchant_name": "Amazon",
          "merchant_address": null,
          "receipt_date": "2024-01-15",
          "currency": "USD",
          "items": [
            {
              "item_name": "Wireless Mouse",
              "quantity": 1,
              "unit_price": 49.99,
              "total_price": 49.99
            }
          ],
          "subtotal": 49.99,
          "tax_total": 4.50,
          "total": 54.50,
          "payment_method": "card"
        }
      }
    ],
    "errors": [],
    "reconciliationResult": {
      "totalMatched": 1,
      "totalUnmatched": 2,
      "complianceScore": 45.5,
      "matchedTransactions": [
        {
          "transactionId": 101,
          "receiptId": 15,
          "merchantName": "Amazon.com",
          "matchScore": 85.5,
          "previousStatus": "EXCEPTION",
          "newStatus": "MATCHED"
        }
      ]
    }
  }
}
```

**Important Notes**:
- All files processed with OCR automatically
- Automatic fuzzy matching runs after upload
- Matched transactions updated to MATCHED status
- Compliance score recalculated automatically
- Full OCR data included in response for each receipt
- Partial success supported (some receipts may fail)

**Error Responses**:

**400 Bad Request** - Not a CARD folder
```json
{
  "success": false,
  "message": "Receipts can only be uploaded to CARD statement folders. For BANK statements, please upload invoices instead."
}
```

**400 Bad Request** - Too many files
```json
{
  "success": false,
  "message": "Maximum 5 receipts can be uploaded at once"
}
```

**400 Bad Request** - Not a reconciliation folder
```json
{
  "success": false,
  "message": "Receipts can only be uploaded to reconciliation folders"
}
```

---

### 3. Upload Invoices (BANK Reconciliation)

**Purpose**: Upload invoices (max 5 at once) to match with BANK statement transactions

**Endpoint**: `POST /transactions/folders/:folderId/invoices`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `folderId` (integer): Reconciliation folder ID

**Request Headers**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (multipart/form-data)**:
```
invoices: <file[]>   (required, max 5 files, each max 10MB)
```

**Validation Rules**:
- Folder must exist and be RECONCILIATION type
- Folder must have statementType = BANK
- Maximum 5 files per request
- Each file max 10MB
- Supported formats: PDF, JPG, PNG

**Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "2 invoice(s) uploaded successfully",
  "data": {
    "processedInvoices": [
      {
        "id": 22,
        "folderId": 25,
        "invoiceNumber": "INV-2024-001",
        "invoiceDate": "2024-01-10T00:00:00.000Z",
        "dueDate": "2024-02-10T00:00:00.000Z",
        "vendorName": "ABC Supplier",
        "amount": 500.00,
        "tax": 50.00,
        "netAmount": 450.00,
        "imageUrl": "/uploads/invoices/invoice_9876.pdf",
        "uploadedBy": 1,
        "linkedTransactionId": 105,
        "createdAt": "2024-01-20T12:00:00.000Z"
      }
    ],
    "errors": [],
    "reconciliationResult": {
      "totalMatched": 2,
      "totalUnmatched": 38,
      "complianceScore": 50.0,
      "matchedTransactions": [
        {
          "transactionId": 105,
          "invoiceId": 22,
          "merchantName": "ABC Supplier",
          "matchScore": 92.3,
          "previousStatus": "EXCEPTION",
          "newStatus": "MATCHED"
        }
      ]
    }
  }
}
```

**Important Notes**:
- Identical behavior to receipt upload but for BANK statements
- OCR processes invoice data
- Fuzzy matching runs automatically
- Compliance score updated
- Partial success supported

**Error Responses**:

**400 Bad Request** - Not a BANK folder
```json
{
  "success": false,
  "message": "Invoices can only be uploaded to BANK statement folders. For CARD statements, please upload receipts instead."
}
```

**400 Bad Request** - Too many files
```json
{
  "success": false,
  "message": "Maximum 5 invoices can be uploaded at once"
}
```

---

### 4. Get Transactions

**Purpose**: Retrieves all transactions for a folder with filtering

**Endpoint**: `GET /folders/:folderId/transactions`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `folderId` (integer): Folder ID

**Query Parameters**:
```
?status=MATCHED              // Filter by status
&flagged=true               // Filter flagged transactions
&startDate=2024-01-01       // Date range start
&endDate=2024-01-31         // Date range end
&category=purchase          // Filter by category
```

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 101,
        "folderId": 25,
        "merchantName": "Amazon.com",
        "date": "2024-01-15T00:00:00.000Z",
        "value": -49.99,
        "category": "purchase",
        "status": "MATCHED",
        "flagged": false,
        "notes": null,
        "linkedReceiptId": 15,
        "linkedInvoiceId": null,
        "createdAt": "2024-01-20T10:30:00.000Z",
        "Receipt": {
          "id": 15,
          "merchantName": "Amazon",
          "total": 54.50,
          "receiptDate": "2024-01-15T00:00:00.000Z"
        }
      }
    ],
    "statistics": {
      "total": 45,
      "matched": 20,
      "exceptions": 20,
      "fees": 5,
      "pending": 0,
      "flagged": 3,
      "totalValue": 1234.56
    },
    "filters": {
      "status": "MATCHED"
    },
    "analytics": {
      "currency": "USD",
      "totalFees": 45.50,
      "totalSpend": 1234.56,
      "interestPaidAmount": 12.50,
      "monthlyInterestRatePercent": 1.5,
      "aprPercentNominal": 18.0,
      "averageDailyBalance": 2500.00,
      "openingBalance": 2000.00,
      "closingBalance": 2500.00,
      "subscriptions": [
        {
          "merchant": "Netflix",
          "amount": 15.99,
          "frequency": "monthly"
        }
      ],
      "duplicates": [],
      "feeByCategory": {
        "Foreign Transaction Fee": 12.50,
        "Late Fee": 35.00
      },
      "topFeeMerchants": {
        "Bank ABC": 25.00,
        "Merchant XYZ": 20.50
      },
      "feesOverTime": {
        "2024-01": 45.50
      },
      "hiddenFees": [
        {
          "description": "International Transaction Fee",
          "amount": 3.50
        }
      ],
      "flaggedTransactions": [
        {
          "transactionId": 101,
          "reason": "Unusual amount"
        }
      ],
      "tips": [
        "Consider switching to a card with no foreign transaction fees"
      ],
      "cardSuggestions": [
        {
          "cardName": "Travel Rewards Card",
          "reason": "No foreign transaction fees"
        }
      ],
      "additionalData": {}
    }
  }
}
```

**Response Fields**:
- `transactions`: Array of transaction objects
- `statistics`: Transaction counts and totals
  - `total`: Total number of transactions
  - `matched`: Number of matched transactions
  - `exceptions`: Number of exception transactions
  - `fees`: Number of fee transactions
  - `pending`: Number of pending transactions
  - `flagged`: Number of flagged transactions
  - `totalValue`: Sum of all transaction values
- `filters`: Applied filters from query parameters
- `analytics`: OCR-extracted analytics (only for reconciliation folders)
  - `currency`: Currency code
  - `totalFees`: Total fees extracted from statement
  - `totalSpend`: Total spend amount
  - `interestPaidAmount`: Total interest paid
  - `monthlyInterestRatePercent`: Monthly interest rate
  - `aprPercentNominal`: Annual percentage rate
  - `averageDailyBalance`: Average daily balance
  - `openingBalance`: Opening balance from statement
  - `closingBalance`: Closing balance from statement
  - `subscriptions`: Detected recurring subscriptions
  - `duplicates`: Detected duplicate transactions
  - `feeByCategory`: Breakdown of fees by category
  - `topFeeMerchants`: Top merchants by fee amount
  - `feesOverTime`: Fee trends over time
  - `hiddenFees`: Detected hidden fees
  - `flaggedTransactions`: Flagged transaction details
  - `tips`: Financial tips based on analysis
  - `cardSuggestions`: Credit card recommendations
  - `additionalData`: Any additional dynamic OCR fields

**Important Notes**:
- The `analytics` field is only present for **reconciliation folders** (folders created from statement uploads)
- For **general folders**, the `analytics` field will not be included in the response
- Analytics data is persisted in the database and can be retrieved at any time
- Users can view analytics even without uploading receipts or invoices

**Use Cases**:
- Display all transactions in folder
- Show comprehensive analytics including fees, subscriptions, and tips
- Display "Fee Auto-Classified" total from `analytics.totalFees`
- Filter matched transactions only
- Show flagged transactions for review
- View transactions by date range
- Category-based filtering
- Present financial insights and card recommendations

---

### 5. Get Single Transaction

**Purpose**: Retrieves detailed information about a specific transaction

**Endpoint**: `GET /transactions/:id`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Transaction ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "folderId": 25,
    "merchantName": "Amazon.com",
    "date": "2024-01-15T00:00:00.000Z",
    "value": -49.99,
    "category": "purchase",
    "status": "MATCHED",
    "flagged": false,
    "notes": null,
    "linkedReceiptId": 15,
    "linkedInvoiceId": null,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T11:05:00.000Z",
    "Receipt": {
      "id": 15,
      "receiptNumber": "R12345",
      "merchantName": "Amazon",
      "total": 54.50,
      "taxPaid": 4.50,
      "receiptDate": "2024-01-15T00:00:00.000Z",
      "imageUrl": "/uploads/receipts/receipt_5678.pdf"
    }
  }
}
```

---

### 6. Update Transaction Status

**Purpose**: Manually update transaction status

**Endpoint**: `PATCH /transactions/:id/status`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Transaction ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "status": "MATCHED"
}
```

**Validation Rules**:
- `status`: Required, enum: MATCHED, EXCEPTION, PENDING
- Cannot manually set status to FEE

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction status updated",
  "data": {
    "id": 101,
    "status": "MATCHED",
    "updatedAt": "2024-01-20T13:00:00.000Z"
  }
}
```

**Important Notes**:
- Useful for manual override of matching
- Updating status recalculates compliance score
- FEE status cannot be manually set (auto-detected only)

**Error Responses**:

**400 Bad Request** - Invalid status
```json
{
  "success": false,
  "message": "Invalid status value"
}
```

---

### 7. Toggle Transaction Flag

**Purpose**: Flags or unflags a transaction for review

**Endpoint**: `PATCH /transactions/:id/flag`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Transaction ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction flagged",
  "data": {
    "id": 101,
    "flagged": true,
    "updatedAt": "2024-01-20T14:00:00.000Z"
  }
}
```

**Use Cases**:
- Mark suspicious transactions
- Flag transactions for review
- Highlight discrepancies

---

### 8. Update Transaction

**Purpose**: Updates transaction details (merchant name, date, value, notes, etc.)

**Endpoint**: `PUT /transactions/:id`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Transaction ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "merchantName": "Amazon.com Inc",
  "date": "2024-01-16T00:00:00.000Z",
  "value": -51.00,
  "category": "online_purchase",
  "notes": "Corrected transaction details"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction updated",
  "data": {
    "id": 101,
    "merchantName": "Amazon.com Inc",
    "date": "2024-01-16T00:00:00.000Z",
    "value": -51.00,
    "category": "online_purchase",
    "notes": "Corrected transaction details",
    "updatedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

---

### 9. Delete Transaction

**Purpose**: Deletes a transaction from the folder

**Endpoint**: `DELETE /transactions/:id`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Transaction ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction deleted"
}
```

**Important Notes**:
- Deleting a transaction recalculates compliance score
- Linked receipts/invoices are NOT deleted (just unlinked)
- Use with caution - deletion is permanent

---

### 10. Get Invoices for Folder

**Purpose**: Retrieves all invoices uploaded to a BANK reconciliation folder with full OCR data

**Endpoint**: `GET /transactions/folders/:folderId/invoices`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `folderId` (integer): Folder ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 22,
        "folderId": 25,
        "invoiceNumber": "INV-2024-001",
        "invoiceDate": "2024-01-10T00:00:00.000Z",
        "dueDate": "2024-02-10T00:00:00.000Z",
        "vendorName": "ABC Supplier",
        "amount": 500.00,
        "tax": 50.00,
        "netAmount": 450.00,
        "imageUrl": "/uploads/invoices/invoice_9876.pdf",
        "uploadedBy": 1,
        "ocrData": {
          "document_type": "invoice",
          "invoice_number": "INV-2024-001",
          "invoice_date": "2024-01-10",
          "due_date": "2024-02-10",
          "vendor": {
            "name": "ABC Supplier",
            "address": "123 Business St, City",
            "phone": "+1-555-0123",
            "email": "billing@abcsupplier.com",
            "tax_id": "12-3456789"
          },
          "customer": {
            "name": "Your Company",
            "address": "456 Main St"
          },
          "currency": "USD",
          "line_items": [
            {
              "description": "Professional Services",
              "quantity": 10,
              "unit_price": 45.00,
              "line_total": 450.00
            }
          ],
          "subtotal": 450.00,
          "tax_total": 50.00,
          "total_amount": 500.00,
          "balance_due": 500.00,
          "payment_terms": "Net 30",
          "notes": "Thank you for your business"
        },
        "createdAt": "2024-01-20T12:00:00.000Z",
        "updatedAt": "2024-01-20T12:00:00.000Z"
      }
    ],
    "total": 3
  }
}
```

**Response Fields**:
- `invoices`: Array of invoice objects with complete OCR data
- `total`: Total number of invoices in the folder
- `ocrData`: Complete OCR extraction including vendor details, line items, amounts, payment terms, etc.

**Use Cases**:
- Display all invoices for a BANK reconciliation folder
- Show invoice details with full OCR extraction
- Render invoice table in UI with vendor, amount, date, etc.
- Access detailed line items and payment information

**Important Notes**:
- Returns all invoices for the folder with stored OCR data
- OCR data is persisted in database and available anytime
- Only available for BANK reconciliation folders
- No need to re-upload invoices to view OCR data

---

### 11. Get Single Invoice

**Purpose**: Retrieves detailed information about a specific invoice with full OCR data

**Endpoint**: `GET /transactions/invoices/:id`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Invoice ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 22,
    "folderId": 25,
    "invoiceNumber": "INV-2024-001",
    "invoiceDate": "2024-01-10T00:00:00.000Z",
    "dueDate": "2024-02-10T00:00:00.000Z",
    "vendorName": "ABC Supplier",
    "amount": 500.00,
    "tax": 50.00,
    "netAmount": 450.00,
    "imageUrl": "/uploads/invoices/invoice_9876.pdf",
    "uploadedBy": 1,
    "ocrData": {
      "document_type": "invoice",
      "invoice_number": "INV-2024-001",
      "invoice_date": "2024-01-10",
      "due_date": "2024-02-10",
      "vendor": {
        "name": "ABC Supplier",
        "address": "123 Business St, City, State 12345",
        "phone": "+1-555-0123",
        "email": "billing@abcsupplier.com",
        "website": "www.abcsupplier.com",
        "tax_id": "12-3456789",
        "bank_account": "987654321",
        "bank_name": "First National Bank"
      },
      "customer": {
        "name": "Your Company",
        "address": "456 Main St, City, State 67890",
        "phone": "+1-555-9876",
        "email": "accounts@yourcompany.com"
      },
      "currency": "USD",
      "line_items": [
        {
          "item_number": "SVC-001",
          "description": "Professional Services - January 2024",
          "quantity": 10,
          "unit": "hours",
          "unit_price": 45.00,
          "tax_rate": 10.00,
          "tax_amount": 45.00,
          "line_total": 450.00
        }
      ],
      "subtotal": 450.00,
      "discount_total": 0.00,
      "tax_breakdown": {
        "Sales Tax": 50.00
      },
      "tax_total": 50.00,
      "total_amount": 500.00,
      "amount_paid": 0.00,
      "balance_due": 500.00,
      "payment_terms": "Net 30",
      "payment_method": "Bank Transfer",
      "notes": "Thank you for your business",
      "terms_and_conditions": "Payment due within 30 days"
    },
    "createdAt": "2024-01-20T12:00:00.000Z",
    "updatedAt": "2024-01-20T12:00:00.000Z"
  }
}
```

**Use Cases**:
- View complete invoice details
- Display full OCR extraction data
- Show vendor and customer information
- Access line items and payment terms
- Display invoice in detail view/modal

---

### 12. View Invoice Image

**Purpose**: Retrieves the invoice file/image for viewing or download

**Endpoint**: `GET /transactions/invoices/:id/view`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Invoice ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
- Returns the invoice file (PDF, JPG, PNG)
- Content-Type header set based on file type
- File is sent directly for browser viewing or download

**Use Cases**:
- Display invoice image in UI
- Allow users to download original invoice file
- Preview invoice in modal/lightbox
- Verify OCR extraction accuracy

**Error Responses**:

**404 Not Found** - Invoice not found
```json
{
  "success": false,
  "message": "Invoice not found"
}
```

---

### 13. Get Receipts for Folder

**Purpose**: Retrieves all receipts uploaded to a CARD reconciliation folder with full OCR data

**Endpoint**: `GET /transactions/folders/:folderId/receipts`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `folderId` (integer): Folder ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "receipts": [
      {
        "id": 15,
        "folderId": 25,
        "receiptNumber": "R12345",
        "merchantName": "Amazon",
        "taxPaid": 4.50,
        "total": 54.50,
        "receiptDate": "2024-01-15T00:00:00.000Z",
        "imageUrl": "/uploads/receipts/receipt_5678.pdf",
        "uploadedBy": 1,
        "ocrData": {
          "receipt_type": "online",
          "receipt_number": "R12345",
          "merchant_name": "Amazon",
          "merchant_address": null,
          "merchant_phone": null,
          "receipt_date": "2024-01-15",
          "receipt_time": "14:30:00",
          "currency": "USD",
          "items": [
            {
              "item_name": "Wireless Mouse",
              "quantity": 1,
              "unit_price": 49.99,
              "total_price": 49.99,
              "discount": 0,
              "tax": 4.50
            }
          ],
          "subtotal": 49.99,
          "discount_total": 0.00,
          "tax_breakdown": {
            "Sales Tax": 4.50
          },
          "tax_total": 4.50,
          "tip_amount": 0.00,
          "service_charge": 0.00,
          "delivery_fee": 0.00,
          "total": 54.50,
          "amount_paid": 54.50,
          "change_given": 0.00,
          "payment_method": "card",
          "card_last_4_digits": "1234",
          "order_number": "112-7654321-1234567",
          "transaction_id": "TXN123456789"
        },
        "createdAt": "2024-01-20T11:00:00.000Z",
        "updatedAt": "2024-01-20T11:00:00.000Z"
      }
    ],
    "total": 5
  }
}
```

**Response Fields**:
- `receipts`: Array of receipt objects with complete OCR data
- `total`: Total number of receipts in the folder
- `ocrData`: Complete OCR extraction including merchant details, items, amounts, payment info, etc.

**Use Cases**:
- Display all receipts for a CARD reconciliation folder
- Show receipt details with full OCR extraction
- Render receipt table in UI with merchant, amount, date, etc.
- Access detailed line items and payment information

**Important Notes**:
- Returns all receipts for the folder with stored OCR data
- OCR data is persisted in database and available anytime
- Only available for CARD reconciliation folders
- No need to re-upload receipts to view OCR data

---

### 14. Get Single Receipt

**Purpose**: Retrieves detailed information about a specific receipt with full OCR data

**Endpoint**: `GET /transactions/receipts/:id`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Receipt ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "folderId": 25,
    "receiptNumber": "R12345",
    "merchantName": "Amazon",
    "taxPaid": 4.50,
    "total": 54.50,
    "receiptDate": "2024-01-15T00:00:00.000Z",
    "imageUrl": "/uploads/receipts/receipt_5678.pdf",
    "uploadedBy": 1,
    "ocrData": {
      "receipt_type": "online",
      "receipt_number": "R12345",
      "merchant_name": "Amazon",
      "merchant_address": "410 Terry Ave N, Seattle, WA 98109",
      "merchant_phone": "1-888-280-4331",
      "merchant_email": "support@amazon.com",
      "merchant_website": "www.amazon.com",
      "receipt_date": "2024-01-15",
      "receipt_time": "14:30:00",
      "currency": "USD",
      "items": [
        {
          "item_name": "Logitech Wireless Mouse",
          "quantity": 1,
          "unit_price": 49.99,
          "total_price": 49.99,
          "discount": 0.00,
          "tax": 4.50,
          "category": "Electronics"
        }
      ],
      "subtotal": 49.99,
      "discount_total": 0.00,
      "tax_breakdown": {
        "Sales Tax": 4.50
      },
      "tax_total": 4.50,
      "tip_amount": 0.00,
      "service_charge": 0.00,
      "delivery_fee": 0.00,
      "total": 54.50,
      "amount_paid": 54.50,
      "change_given": 0.00,
      "payment_method": "card",
      "card_last_4_digits": "1234",
      "order_number": "112-7654321-1234567",
      "transaction_id": "TXN123456789",
      "barcode": null,
      "qr_code_data": null
    },
    "createdAt": "2024-01-20T11:00:00.000Z",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  }
}
```

**Use Cases**:
- View complete receipt details
- Display full OCR extraction data
- Show merchant and item information
- Access payment details
- Display receipt in detail view/modal

---

### 15. View Receipt Image

**Purpose**: Retrieves the receipt file/image for viewing or download

**Endpoint**: `GET /transactions/receipts/:id/view`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Receipt ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
- Returns the receipt file (PDF, JPG, PNG, WEBP)
- Content-Type header set based on file type
- File is sent directly for browser viewing or download

**Use Cases**:
- Display receipt image in UI
- Allow users to download original receipt file
- Preview receipt in modal/lightbox
- Verify OCR extraction accuracy

**Error Responses**:

**404 Not Found** - Receipt not found
```json
{
  "success": false,
  "message": "Receipt not found"
}
```

---

## Error Handling

### Common Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 400 Bad Request | Invalid input, validation errors | Missing files, invalid file type, wrong folder type |
| 401 Unauthorized | Missing/invalid token | Not authenticated |
| 403 Forbidden | Insufficient permissions | Not workspace member |
| 404 Not Found | Resource doesn't exist | Folder/transaction not found |
| 413 Payload Too Large | File too large | File exceeds 10MB limit |
| 500 Server Error | Internal server error | OCR processing error, system error |

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed error (development only)"
}
```

---

## Quick Reference

### Base URL
```
https://api.complifi.ai/api/v1
```

### Authentication Header
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reconciliation/create` | ✅ | Create reconciliation folder with statement |
| POST | `/folders/:id/receipts` | ✅ | Upload receipts (CARD, max 5) |
| POST | `/folders/:id/invoices` | ✅ | Upload invoices (BANK, max 5) |
| GET | `/folders/:id/transactions` | ✅ | Get transactions with filters |
| GET | `/folders/:id/invoices` | ✅ | Get all invoices for folder with OCR data |
| GET | `/folders/:id/receipts` | ✅ | Get all receipts for folder with OCR data |
| GET | `/transactions/:id` | ✅ | Get single transaction |
| GET | `/invoices/:id` | ✅ | Get single invoice with OCR data |
| GET | `/invoices/:id/view` | ✅ | View invoice file/image |
| GET | `/receipts/:id` | ✅ | Get single receipt with OCR data |
| GET | `/receipts/:id/view` | ✅ | View receipt file/image |
| PATCH | `/transactions/:id/status` | ✅ | Update transaction status |
| PATCH | `/transactions/:id/flag` | ✅ | Toggle transaction flag |
| PUT | `/transactions/:id` | ✅ | Update transaction details |
| DELETE | `/transactions/:id` | ✅ | Delete transaction |

---

## Matching Algorithm Specifications

### Levenshtein Distance Formula

```
Similarity = 1 - (Levenshtein Distance / Max Length)
Threshold: 75% similarity required
```

### Date Tolerance

```javascript
toleranceDays = 3
dateDifference = Math.abs(date1 - date2) in days
Match if: dateDifference <= 3 days
```

### Amount Tolerance

```javascript
tolerancePercent = 5%
avgAmount = (amount1 + amount2) / 2
maxDifference = avgAmount * 0.05
Match if: Math.abs(amount1 - amount2) <= maxDifference
```

### Example Matching Scenarios

**Scenario 1: Perfect Match**
```
Transaction: Amazon.com, 2024-01-15, $50.00
Receipt: Amazon, 2024-01-15, $50.00
Result: MATCH (100% merchant, 0 days, $0 difference)
```

**Scenario 2: Within Tolerance**
```
Transaction: STARBUCKS #1234, 2024-01-15, $12.50
Receipt: Starbucks, 2024-01-17, $12.99
Result: MATCH (85% merchant, 2 days, 3.9% amount diff)
```

**Scenario 3: No Match**
```
Transaction: Walmart, 2024-01-15, $100.00
Receipt: Target, 2024-01-15, $100.00
Result: NO MATCH (merchant similarity < 75%)
```

---

## File Upload Best Practices

1. **File Size**: Keep files under 10MB for faster processing
2. **Image Quality**: Use high-resolution images for better OCR accuracy
3. **File Format**: PDF preferred for statements, JPG/PNG for receipts
4. **Batch Uploads**: Upload multiple receipts/invoices together (max 5)
5. **File Naming**: Use descriptive names for easier tracking

---

## OCR Processing Times

| Document Type | Average Processing Time |
|---------------|-------------------------|
| Statement (PDF) | 10-30 seconds |
| Statement (Image) | 15-45 seconds |
| Receipt (single) | 5-15 seconds |
| Invoice (single) | 5-15 seconds |
| Batch (5 files) | 25-75 seconds |

**Note**: Processing times depend on file size, complexity, and server load.

---

## Data Models

### FolderAnalytics Model

The `FolderAnalytics` model stores comprehensive OCR-extracted analytics data for reconciliation folders. This enables persistent storage of financial insights, allowing users to view analytics at any time without re-uploading statements.

**Table Name**: `folder_analytics`

**Relationships**:
- Belongs to `Folder` (one-to-one relationship via `folderId`)

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | INTEGER | Yes | Primary key (auto-increment) |
| `folderId` | INTEGER | Yes | Foreign key to folders table (unique) |
| `currency` | STRING(10) | No | Currency code (e.g., USD, EUR) |
| `totalFees` | DECIMAL(10,2) | No | Total fees extracted from statement |
| `totalSpend` | DECIMAL(10,2) | No | Total spend amount from statement |
| `interestPaidAmount` | DECIMAL(10,2) | No | Total interest paid |
| `monthlyInterestRatePercent` | DECIMAL(5,2) | No | Monthly interest rate percentage |
| `aprPercentNominal` | DECIMAL(5,2) | No | Annual Percentage Rate (nominal) |
| `averageDailyBalance` | DECIMAL(10,2) | No | Average daily balance for period |
| `openingBalance` | DECIMAL(10,2) | No | Opening balance from statement |
| `closingBalance` | DECIMAL(10,2) | No | Closing balance from statement |
| `subscriptions` | JSON | No | Array of detected subscription transactions |
| `duplicates` | JSON | No | Array of detected duplicate transactions |
| `feeByCategory` | JSON | No | Breakdown of fees by category (object) |
| `topFeeMerchants` | JSON | No | Top merchants by fee amount (object) |
| `feesOverTime` | JSON | No | Fee trends over time (object) |
| `hiddenFees` | JSON | No | Array of detected hidden fees |
| `flaggedTransactions` | JSON | No | Array of flagged transaction details |
| `tips` | JSON | No | Array of financial tips based on analysis |
| `cardSuggestions` | JSON | No | Array of credit card recommendations |
| `additionalData` | JSON | No | Additional dynamic OCR fields |
| `createdAt` | TIMESTAMP | Yes | Record creation timestamp |
| `updatedAt` | TIMESTAMP | Yes | Record last update timestamp |

**JSON Field Examples**:

```json
{
  "subscriptions": [
    {
      "merchant": "Netflix",
      "amount": 15.99,
      "frequency": "monthly",
      "lastDate": "2024-01-15"
    }
  ],
  "feeByCategory": {
    "Foreign Transaction Fee": 12.50,
    "Late Payment Fee": 35.00,
    "Annual Fee": 95.00
  },
  "topFeeMerchants": {
    "Bank ABC": 25.00,
    "Merchant XYZ": 20.50
  },
  "hiddenFees": [
    {
      "description": "International Transaction Fee",
      "amount": 3.50,
      "date": "2024-01-10"
    }
  ],
  "tips": [
    "Consider switching to a card with no foreign transaction fees",
    "You could save $150/year by avoiding late payment fees"
  ],
  "cardSuggestions": [
    {
      "cardName": "Travel Rewards Card",
      "reason": "No foreign transaction fees, 2x points on travel"
    }
  ]
}
```

**Key Features**:
- **One-to-One Relationship**: Each folder can have only one analytics record
- **Automatic Persistence**: Analytics are automatically saved when a reconciliation folder is created
- **Single API Call**: Analytics are returned with transactions in `GET /folders/:folderId/transactions`
- **No Re-upload Required**: Users can view analytics anytime without re-uploading statements
- **Flexible Schema**: JSON fields support dynamic OCR data structures
- **Financial Insights**: Enables UI features like "Fee Auto-Classified: $X,XXX"

**Usage Example**:
```javascript
// When creating reconciliation folder
const analytics = await folderAnalyticsRepository.create({
  folderId: 25,
  currency: "USD",
  totalFees: 45.50,
  totalSpend: 1234.56,
  subscriptions: [...],
  tips: [...]
});

// When retrieving transactions
const analytics = await folderAnalyticsRepository.findByFolderId(25);
```

---

**End of Phase 4 Documentation**
