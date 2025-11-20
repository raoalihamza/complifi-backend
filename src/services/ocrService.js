const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

class OCRService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // this.model = this.genAI.getGenerativeModel({
    //   model: "gemini-1.5-pro-latest",
    // });

    // this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
      requestOptions: {
        timeout: 300000, // 5 minutes timeout (300,000ms)
      },
    });
  }

  /**
   * Retry logic for API calls with exponential backoff
   */
  async retryWithBackoff(fn, maxRetries = 3, initialDelay = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRetriableError = error.message?.includes('fetch failed') ||
                                error.message?.includes('ECONNRESET') ||
                                error.message?.includes('ETIMEDOUT') ||
                                error.message?.includes('503') ||
                                error.message?.includes('Service Unavailable') ||
                                error.message?.includes('timed out') ||
                                error.message?.includes('timeout') ||
                                error.message?.includes('429') ||
                                error.message?.includes('Too Many Requests') ||
                                error.message?.includes('500') ||
                                error.message?.includes('502') ||
                                error.message?.includes('504');

        if (isLastAttempt || !isRetriableError) {
          throw error;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⚠️ API call failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Convert XLSX file to CSV format
   */
  convertXlsxToCsv(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return csv;
    } catch (error) {
      console.error("XLSX to CSV conversion error:", error);
      throw new Error(`Failed to convert XLSX to CSV: ${error.message}`);
    }
  }

  /**
   * Convert CSV/XLSX to PDF for better Gemini processing
   */
  async convertToPdf(filePath, ext) {
    return new Promise((resolve, reject) => {
      try {
        console.log("📄 Converting to PDF format for better processing...");

        // Get original filename without extension for title
        const originalFileName = path.basename(filePath, ext);

        // Read data based on file type
        let data;
        if (ext === ".xlsx" || ext === ".xls") {
          const workbook = XLSX.readFile(filePath);
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else if (ext === ".csv") {
          const csvContent = fs.readFileSync(filePath, "utf-8");
          data = csvContent.split("\n").map((row) => row.split(","));
        } else {
          throw new Error("Unsupported file type for PDF conversion");
        }

        // Create PDF
        const outputPath = filePath.replace(/\.(csv|xlsx|xls)$/i, "_converted.pdf");
        const doc = new PDFDocument({
          size: "A4",
          margin: 30,
          autoFirstPage: true
        });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Add title with original filename
        doc.fontSize(14).text(originalFileName, { align: "center" });
        doc.moveDown();

        // Calculate column widths
        const pageWidth = doc.page.width - 60; // margins
        const maxCols = data[0] ? data[0].length : 0;
        const colWidth = maxCols > 0 ? pageWidth / maxCols : 100;

        // Add table data
        doc.fontSize(8);
        let y = doc.y;

        data.forEach((row, rowIndex) => {
          // Check if need new page
          if (y > doc.page.height - 100) {
            doc.addPage();
            y = 50;
          }

          let x = 30;
          row.forEach((cell, cellIndex) => {
            const cellText = String(cell || "").substring(0, 50); // Limit cell length
            doc.text(cellText, x, y, {
              width: colWidth - 5,
              height: 20,
              ellipsis: true,
            });
            x += colWidth;
          });

          y += 20;
          doc.y = y;

          // Add separator line after header
          if (rowIndex === 0) {
            doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();
            y += 5;
            doc.y = y;
          }
        });

        doc.end();

        stream.on("finish", () => {
          console.log("✅ PDF conversion completed");
          resolve(outputPath);
        });

        stream.on("error", (error) => {
          reject(new Error(`PDF creation failed: ${error.message}`));
        });
      } catch (error) {
        console.error("PDF conversion error:", error);
        reject(new Error(`Failed to convert to PDF: ${error.message}`));
      }
    });
  }

  /**
   * Process Bank/Card Statement - ADVANCED OCR with PHP Prompt
   * Extracts ALL transactions with comprehensive analytics
   */
  async processStatement(filePath) {
    let pdfPath = null;
    try {
      console.log(`📄 Processing statement file: ${path.basename(filePath)}`);
      const startTime = Date.now();

      const ext = path.extname(filePath).toLowerCase();
      let fileBuffer;
      let mimeType;
      let base64Data;
      let processPath = filePath;

      // Convert CSV/XLSX to PDF for better Gemini processing
      if (ext === ".csv" || ext === ".xlsx" || ext === ".xls") {
        pdfPath = await this.convertToPdf(filePath, ext);
        processPath = pdfPath;
        mimeType = "application/pdf";
        fileBuffer = fs.readFileSync(pdfPath);
        base64Data = fileBuffer.toString("base64");
      } else {
        console.log(`📖 Reading ${ext} file...`);
        fileBuffer = fs.readFileSync(filePath);
        mimeType = this.getMimeType(filePath);
        base64Data = fileBuffer.toString("base64");
      }

      console.log(`🤖 Sending to Gemini AI (${mimeType})...`);

      // Use retry logic for Gemini API call
      const result = await this.retryWithBackoff(async () => {
        const prompt = `
SYSTEM ROLE
You are a world-class financial statement parser and auditor.  
You must robustly extract transactions from ANY type of bank/credit/debit statement, regardless of:  
- File type: PDF (digital or scanned), image/photo (JPG/PNG/TIFF/HEIC), CSV/TSV, TXT.  
- Layout: single/multi-column, multi-page, landscape/portrait, rotated, duplex scanned, skewed, stamped, watermarked, blurred.  
- Language/script: English, Urdu, Arabic, Chinese, Japanese, Korean, European formats (French, German, Spanish, etc.), RTL (Right-to-Left).  
- Currency: Any (USD, PKR, EUR, GBP, INR, JPY, SAR, AED, CAD, AUD, CNY, KRW, etc.).  
- Numeric format: "." or "," as decimal/thousands separators, spaces or apostrophes, parentheses for negatives, trailing/leading minus.  
- Statement type: credit card, debit card, current/savings account, prepaid card, corporate card, joint accounts.  

Your goal: **recover every transaction reliably, capture even the smallest charges, normalize globally, detect the correct account currency, and output only valid JSON. Never hallucinate.**

-----------------------------------------------------
OUTPUT CONTRACT (MANDATORY)
Return ONLY a valid, pretty-printed JSON object with EXACTLY these keys and types:

{
  "currency": "USD|PKR|EUR|GBP|INR|JPY|SAR|AED|CAD|AUD|CNY|KRW|...",
  "transactions": [
    { 
      "date": "YYYY-MM-DD", 
      "description": "string", 
      "merchant": "string", 
      "amount": -12.34, 
      "category": "purchase|subscription|cash_advance|transfer|payment|refund|fee|interest", 
      "flags": ["string"] 
    }
  ],
  "totalFees": 0.00,
  "totalSpend": 0.00,
  "subscriptions": ["string"],
  "duplicates": [{"date":"YYYY-MM-DD","description":"string","amount":-0.00}],
  "feeByCategory": {"Foreign Transaction Fee": 0.00, "Late Payment Fee": 0.00, "Interest Charge": 0.00, "Service Fee": 0.00},
  "topFeeMerchants": {"bank fee": 0.00},
  "feesOverTime": {"YYYY-MM": 0.00},
  "tips": ["string"],
  "cardSuggestions": ["string"],
  "hiddenFees": [{"date":"YYYY-MM-DD","description":"string","merchant":"string","amount":-0.00,"labels":["string"]}],
  "flagged": [{"date":"YYYY-MM-DD","description":"string","amount":-0.00,"reason":"string"}],
  "interest_paid_amount": 0.00,
  "monthly_interest_rate_percent": null,
  "apr_percent_nominal": null,
  "total_transactions": 0,
  "average_daily_balance": null,
  "opening_balance": null,
  "closing_balance": null
}

**IMPORTANT:** If the statement contains ANY additional fields not listed above (like account number, statement period, bank name, customer name, credit limit, available credit, minimum payment due, payment due date, reward points, cashback earned, etc.), include them as additional root-level keys in the JSON. DO NOT discard any information present in the statement.

If no transactions exist → return empty arrays and zeros for numeric fields.  
NEVER add fictional data. NEVER return prose.  

-----------------------------------------------------
GLOBAL DATA EXTRACTION POLICY

⚠️ ⚠️ ⚠️ **CRITICAL EXTRACTION REQUIREMENT - READ THIS FIRST** ⚠️ ⚠️ ⚠️

**YOU MUST EXTRACT ALL TRANSACTION TYPES:**
1. **MERCHANT PURCHASES** (stores, restaurants, online shopping, services) - THESE ARE THE MAJORITY OF TRANSACTIONS
2. Bank fees (service charges, late fees, annual fees)
3. Government taxes (VAT, advance tax, withholding tax)
4. Interest charges
5. Payments received
6. Refunds/credits

**COMMON ERROR TO AVOID:**
- DO NOT extract only fees/taxes/interest and skip merchant purchases
- DO NOT ignore transaction rows just because they look like regular purchases
- MERCHANT PURCHASES are usually the MOST NUMEROUS transactions on a statement

**Example of what you MUST extract (from a typical statement):**
- "ASTROLINE.TODAY 539-2142611 US" with amount 2,868.63 → MUST extract as purchase, merchant: "ASTROLINE.TODAY"
- "DOCKERS MM ALAM LAHORE PK" with amount 9,536.00 → MUST extract as purchase, merchant: "DOCKERS MM ALAM"
- "Netflix.com Los Gatos SG" with amount 450.00 → MUST extract as subscription, merchant: "Netflix.com"
- "FOREIGN TRANSACTION FEE" with amount 129.09 → Extract as fee, merchant: "Bank"
- "LATE PAYMENT CHARGE" with amount 2,500.00 → Extract as fee, merchant: "Bank"

**Validation:** After extraction, check your transaction count:
- If you have MORE fees than purchases, you have likely MISSED merchant purchases. Re-scan the statement.
- A typical statement has 60-80% merchant purchases, 20-40% fees/taxes/interest.

-----------------------------------------------------

1) Transaction Line Discovery
   - Prefer table blocks (Date | Description | Amount | Balance).
   - If no tables, infer transactions from repeating patterns (date + amount + text).
   - Handle multi-column pages, headers/footers, balance carryovers, watermarks.
   - Merge wrapped lines into the parent transaction if no new date/amount appears.
   - Skip non-transactional rows (balance carried forward, opening balance, closing balance, credit limit, interest rate notices).
   - **Every row with a date, description, and amount is a transaction - extract it regardless of whether it's a purchase, fee, tax, or payment.**

2) Dates
   - Accept any global date format: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, YYYY/MM/DD, DD.MM.YYYY, YYYY.MM.DD, DD-MMM-YYYY, 01 Jan 2025, 1-June-25, etc.  
   - Normalize all to ISO YYYY-MM-DD.  
   - Use statement context to disambiguate (e.g., if locale is EU → DD/MM/YYYY by default).  
   - Continuation lines inherit previous transaction's date.  
   - Ignore statement period dates unless attached to a fee/charge.

3) Amount Parsing & Currency
   - Capture signs consistently: minus "-", trailing minus, parentheses = negative.  
   - Credits/refunds/payments = inflow (positive). Purchases/fees/interest = outflow (negative).  
   - **Important:** Many credit card statements show charges as positive numbers (no minus). If a line is clearly a debit/charge, always treat it as negative outflow.  
   - Detect thousands/decimal separators: 1,234.56 vs 1.234,56. Normalize to dot decimal.  
   - Detect currency codes/symbols anywhere: $, PKR, €, £, ¥, د.إ, etc.  
   - Always set the root "currency" key to the ISO 4217 code of the account/statement currency.  
   - OCR correction: fix O/0, S/$, ,/., l/1.  
   - Record posted/settled amount in account currency (not original FX currency unless statement explicitly posts both).  
   - Preserve micro-values (0.01). Always output with 2 decimals.

4) Description vs Merchant - **CRITICAL FOR MATCHING**
   - **NEVER use generic merchant names like "Restaurant", "Grocery Store", "Gas Station", "Utilities", "Online Purchase", etc.**
   - description = raw text exactly as shown (human readable).
   - merchant = **EXTRACT THE ACTUAL BUSINESS NAME from the description field. This is critical for reconciliation matching.**

   - **MERCHANT EXTRACTION RULES (MANDATORY - APPLIES TO ALL BANKS GLOBALLY):**
     • **Primary rule: The merchant field MUST contain the actual business/store/service provider name, NOT the issuing bank's name (e.g., NOT "Bank Alfalah", "HDFC", "Citibank", "Emirates NBD", etc.).**
     • **Universal Pattern: In the description column, the merchant/business name typically appears FIRST, before location/country codes or transaction details.**
     • **Generic Examples (Pattern applies to ALL banks worldwide):**
       * "[Business Name] [Location] [Country Code]" → merchant: "[Business Name]" ✓ (NOT "[Bank Name]" ✗)
       * "ASTROLINE.TODAY 539-2142611 US" → merchant: "ASTROLINE.TODAY" ✓
       * "DOCKERS MM ALAM LAHORE PK" → merchant: "DOCKERS MM ALAM" ✓
       * "Netflix.com Los Gatos SG" → merchant: "Netflix.com" ✓
       * "Starbucks Coffee Seattle US" → merchant: "Starbucks Coffee" ✓
       * "Amazon.com AMZN.COM/BILL WA" → merchant: "Amazon.com" ✓
       * "مطعم البيك الرياض SA" → merchant: "Mataam Al Baik" ✓ (transliterated)
     • **Bank/System Fees (Universal across all banks):**
       * "FOREIGN TRANSACTION FEE" → merchant: "Bank" ✓
       * "LATE PAYMENT CHARGE" / "LATE FEE" → merchant: "Bank" ✓
       * "SERVICE CHARGE" / "ANNUAL FEE" → merchant: "Bank" ✓
       * "OVERLIMIT FEE" / "CASH ADVANCE FEE" → merchant: "Bank" ✓
       * "SMS BANKING FEE" / "STATEMENT FEE" → merchant: "Bank" ✓
       * "EXCISE DUTY ON CHARGES" / "GST ON FEES" → merchant: "Bank" ✓
     • **Government Taxes (Universal):**
       * "Adv Tax-236Y" / "TDS" / "Withholding Tax" → merchant: "Tax Authority" ✓
       * "PRA IT Services Tax" / "VAT" / "Sales Tax" → merchant: "Tax Authority" ✓
     • **Key distinction applicable to ALL banks worldwide:**
       - **Merchant purchases**: Extract the actual business name from description (restaurant, store, service provider, etc.)
       - **Bank fees**: Use "Bank" as merchant (ANY fee/charge imposed by the card-issuing bank)
       - **Government taxes**: Use "Tax Authority" as merchant (ANY government-imposed tax)
     • If transaction description contains a specific business name, USE IT. Do not replace with generic category or the bank's name.
     • Only use "Bank" for bank-imposed fees/charges with no external merchant.
     • This pattern works for ALL banks: American Express, Visa, Mastercard, regional banks in Pakistan/India/UAE/Saudi/Egypt/Turkey/Malaysia/Indonesia, etc.
   - **DO NOT categorize first, extract names first. The actual business name must be in the merchant field for successful matching.**

   - **MANDATORY ARABIC TRANSLITERATION RULE (CRITICAL):**
     ⚠️ **ABSOLUTE REQUIREMENT: ALL Arabic script MUST be converted to Latin script (English letters) in the merchant field.**
     • If you see Arabic characters (ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي), you MUST transliterate to English.
     • **NEVER output Arabic script in the merchant field. Only Latin alphabet is allowed.**
     • Transliteration examples (phonetic conversion, NOT translation):
       * "مطعم البيك" → merchant: "Mataam Al Baik" ✓ (NOT "مطعم البيك" ✗)
       * "صيدلية النهدي" → merchant: "Saydaliyat Al Nahdi" ✓ (NOT "صيدلية النهدي" ✗)
       * "هايبر بنده" → merchant: "Hyper Panda" ✓ (NOT "هايبر بنده" ✗)
       * "كافيه نجد" → merchant: "Cafe Najd" ✓ (NOT "كافيه نجد" ✗)
       * "محطة أرامكو" → merchant: "Mahatta Aramco" ✓ (NOT "محطة أرامكو" ✗)
       * "مكتبة جرير" → merchant: "Maktabat Jarir" ✓ (NOT "مكتبة جرير" ✗)
       * "الشركة السعودية للكهرباء" → merchant: "Al Sharika Al Saudiya Lil Kahraba" ✓
       * "شركة الاتصالات السعودية" → merchant: "Sharikat Al Itisalat Al Saudiya (STC)" ✓
     • **Validation check: Before finalizing, scan every merchant value. If you detect ANY Arabic character, you have failed this requirement. Retry with proper transliteration.**
     • This applies to ALL name fields: merchant, person names, company names, etc.

5) Categories (must match one of these only)
   - purchase → POS/online buys.  
   - subscription → recurring monthly/weekly services (Netflix, Spotify, iCloud, telecom plans).  
   - cash_advance → ATM withdrawal or cash at bank counter.  
   - transfer → Raast, IBFT, ACH, SEPA, FasterPayments, Zelle, Venmo, etc.  
   - payment → user bill payments to card or bank inflows.  
   - refund → merchant reversal/chargeback/credit.  
   - fee → service fees, excise/GST/VAT, withholding, annual, overlimit, SMS banking, giro reject, card replacement.  
   - interest → markup/finance/interest charges.

6) Flags (multi-label possible)
   - "foreign_tx_fee" → explicit foreign transaction fee line.  
   - "currency_conversion" → international merchant/FX indicator.  
   - "service_fee" → service/processing/ATM/SMS/annual/maintenance/IT/PRA/withholding/advance tax/excise duty.  
   - "late_payment" → late fee line.  
   - "interest_accrual" → finance charge/interest.  
   - "reversal" → refunds.  
   - "cash" → ATM/cash advances.  
   - "tax" → VAT/GST/excise/PRA/withholding/advance tax.  
   - "overlimit" → overlimit fee.  
   - Add others if explicit (e.g., "fx_pair", "posting_delay").

7) Hidden Fees
   - Always include lines customers usually miss:  
     • Foreign transaction fees.  
     • Excise/GST/VAT.  
     • PRA/withholding/advance tax.  
     • Service/processing/SMS banking fees.  
     • Annual fee, card maintenance fee.  
     • Overlimit fee.  
     • Rejected giro/penalty.  
     • Small markup/interest charges.  
   - Each entry: add "labels": ["human friendly type"].

8) Fee Aggregation
   - feeByCategory:  
     • "Foreign Transaction Fee" = sum of FX fee lines.  
     • "Late Payment Fee" = sum of late payment lines.  
     • "Interest Charge" = sum of interest/finance/markup lines.  
     • "Service Fee" = sum of all operational charges, excise/VAT/GST, PRA/withholding/advance tax, SMS, annual, rejected giro, overlimit, etc.  
   - topFeeMerchants: group by normalized merchant. Bank/system charges use "bank fee".

9) Totals
   - totalFees = sum of all "fee" + "interest".  
   - totalSpend = sum of "purchase" + "subscription" + "cash_advance" (absolute).  
   - duplicates: if same date±1 day + same amount + similar description/merchant, keep one and push others into "duplicates".

10) Fees Over Time
   - Group all "fee" + "interest" by "YYYY-MM".

11) Subscriptions
   - Detect recurring cadence (same merchant, same/similar amount, monthly).  
   - Add merchant once in "subscriptions".

12) Anomalies ("flagged")
   - Flag if:  
     • Fee ≥ 1000 (account currency).  
     • Late payment fee.  
     • Rejected giro fee.  
     • Overlimit fee.  
     • Interest spike (interest > 2× mean of prior interest).  
     • FX fee > 3.5% of related purchase.  
   - Format: {"date":"YYYY-MM-DD","description":"string","amount":-0.00,"reason":"string"}.

13) Quality Gates
   - No hallucinations. Never invent missing data.  
   - Dates must be ISO.  
   - Amounts must be numeric with 2 decimals.  
   - JSON must be syntactically valid, no trailing commas.  
   - Skip header/footer totals unless explicit transactions.  
   - If unsure of category, pick safest + add clarifying flag.

14) Coaching
   - tips: 3–5 plain actionable steps (avoid late fees, use autopay, waive service fees, pick no-FX card, track subscriptions).  
   - cardSuggestions: 2–4 concise suggestions (cashback, no-FX, fee-free, low markup).

15) Interest & Rate Derivation
   - interest_paid_amount = absolute sum of lines categorized as "interest" or clearly labeled "interest/finance/markup charge" in the account currency.  
   - apr_percent_nominal:
       • If APR text appears (e.g., "APR 29.99%"), set to 29.99 (percent number, not 0.2999).  
       • If multiple APRs exist, pick the one applicable to this account/plan; otherwise null.  
   - monthly_interest_rate_percent:
       • If apr_percent_nominal exists → round(APR/12, 2).  
       • Else if average_daily_balance > 0 → round(100 * interest_paid_amount / average_daily_balance, 2).  
       • Else null.  
   - average_daily_balance/opening_balance/closing_balance:
       • Only set if explicitly printed on the statement; otherwise null.  
       • Do NOT compute ADB from transactions—only parse printed values.  
   - total_transactions = length of "transactions".

16) Additional Fields Extraction
   - Extract ANY additional information present in the statement such as:
     • account_number, account_holder_name, statement_period_start, statement_period_end
     • bank_name, bank_address, customer_service_phone
     • credit_limit, available_credit, cash_advance_limit
     • minimum_payment_due, payment_due_date, last_payment_amount, last_payment_date
     • reward_points, cashback_earned, promotional_offers
     • statement_date, statement_number
     • previous_balance, new_balance, total_credits, total_debits
   - Include these as additional root-level keys in the JSON output
   - Use snake_case for field names
   - Set to null if field exists in statement structure but has no value

RETURN ONLY THE JSON. NO EXTRA TEXT. NO MARKDOWN FENCES.
`;

        return await this.model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          prompt,
        ]);
      });

      const response = result.response.text();
      console.log("✅ Gemini AI response received");

      // Strip markdown fences if present
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/^\s*```json\s*/i, "");
      cleanedResponse = cleanedResponse.replace(/^\s*```/i, "");
      cleanedResponse = cleanedResponse.replace(/```\s*$/i, "");

      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Invalid OCR response format");
      }

      console.log("🔄 Parsing JSON response...");
      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate transactions array
      if (!parsedData.transactions || !Array.isArray(parsedData.transactions)) {
        throw new Error("No transactions found in statement");
      }

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Statement processing completed in ${elapsedTime}s`);
      console.log(`📊 Extracted ${parsedData.transactions.length} transactions`);

      // Clean up converted PDF
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log("🧹 Cleaned up temporary PDF file");
      }

      return parsedData;
    } catch (error) {
      console.error("Statement OCR Error:", error);

      // Clean up converted PDF on error
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }

      throw new Error(`Failed to process statement: ${error.message}`);
    }
  }

  /**
   * Process Receipt - ADVANCED OCR (Flexible for all receipt types)
   * Handles store receipts, restaurant bills, online receipts, delivery receipts, etc.
   */
  async processReceipt(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString("base64");

      const prompt = `
SYSTEM ROLE
You are an expert OCR specialist for receipts of ALL types. Extract complete receipt data from ANY receipt format, including:
- Store receipts (grocery, retail, pharmacy, electronics)
- Restaurant bills (dine-in, takeaway, delivery)
- Online purchase receipts (e-commerce, digital services)
- Service receipts (repair, maintenance, professional services)
- Fuel/gas station receipts
- Hotel/accommodation receipts
- Transportation receipts (taxi, ride-share, parking, toll)
- Medical/healthcare receipts
- Educational receipts (tuition, courses, books)

Handle ANY layout: thermal printed, A4 printed, email receipts, mobile app screenshots, handwritten receipts, multi-language receipts.

-----------------------------------------------------
OUTPUT CONTRACT (MANDATORY)
Return ONLY a valid JSON object. Include ALL fields found in the receipt. At minimum, include these standard fields:

{
  "receipt_type": "store|restaurant|online|service|fuel|hotel|transport|medical|education|other",
  "receipt_number": "string or null",
  "merchant_name": "string",
  "merchant_address": "string or null",
  "merchant_phone": "string or null",
  "merchant_email": "string or null",
  "merchant_website": "string or null",
  "tax_id": "string or null",
  "receipt_date": "YYYY-MM-DD or null",
  "receipt_time": "HH:MM:SS or null",
  "currency": "USD|PKR|EUR|GBP|...",
  "items": [
    {
      "item_name": "string",
      "quantity": 0,
      "unit_price": 0.00,
      "total_price": 0.00,
      "discount": 0.00,
      "tax": 0.00,
      "category": "string or null"
    }
  ],
  "subtotal": 0.00,
  "discount_total": 0.00,
  "tax_breakdown": {
    "VAT": 0.00,
    "GST": 0.00,
    "Sales Tax": 0.00,
    "Service Charge": 0.00
  },
  "tax_total": 0.00,
  "tip_amount": 0.00,
  "service_charge": 0.00,
  "delivery_fee": 0.00,
  "total": 0.00,
  "amount_paid": 0.00,
  "change_given": 0.00,
  "payment_method": "cash|card|online|wallet|other or null",
  "card_last_4_digits": "string or null",
  "cashier_name": "string or null",
  "server_name": "string or null",
  "table_number": "string or null",
  "order_number": "string or null",
  "invoice_number": "string or null",
  "transaction_id": "string or null",
  "barcode": "string or null",
  "qr_code_data": "string or null"
}

**CRITICAL:** If the receipt contains ANY additional fields not listed above (like loyalty points, rewards, promotional offers, warranty info, return policy, customer details, delivery address, special instructions, etc.), include them as additional keys in the JSON. DO NOT discard any information.

Use snake_case for all field names. Set to null if field is not present. NEVER hallucinate data.

-----------------------------------------------------
EXTRACTION RULES

1) Receipt Type Detection
   - Analyze merchant name, items, and layout to determine type
   - Store: retail products, grocery items
   - Restaurant: food/beverage items, table/server info
   - Online: order number, delivery tracking
   - Service: labor charges, service description
   - Fuel: fuel type, volume, price per unit
   - Hotel: room charges, check-in/out dates
   - Transport: fare, distance, time
   - Medical: consultation, medicines, procedures
   - Education: course fees, materials

2) Merchant Information
   - Extract complete business name (not just brand)
   - Include full address if available
   - Capture all contact information (phone, email, website)
   - Extract tax ID, business registration, VAT number

   - **MANDATORY ARABIC TRANSLITERATION RULE (CRITICAL):**
     ⚠️ **ABSOLUTE REQUIREMENT: ALL Arabic script MUST be converted to Latin script (English letters) in merchant_name, cashier_name, server_name fields.**
     • If you see Arabic characters (ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي), you MUST transliterate to English.
     • **NEVER output Arabic script in name fields. Only Latin alphabet is allowed.**
     • Transliteration examples (phonetic conversion, NOT translation):
       * "مطعم البيك" → merchant_name: "Mataam Al Baik" ✓ (NOT "مطعم البيك" ✗)
       * "صيدلية النهدي" → merchant_name: "Saydaliyat Al Nahdi" ✓ (NOT "صيدلية النهدي" ✗)
       * "كافيه نجد" → merchant_name: "Cafe Najd" ✓ (NOT "كافيه نجد" ✗)
       * "علی" → cashier_name: "Ali" ✓ (NOT "علی" ✗)
       * "محمد" → server_name: "Muhammad" ✓ (NOT "محمد" ✗)
     • **Validation check: Before finalizing, scan every name field. If you detect ANY Arabic character, you have failed this requirement. Retry with proper transliteration.**
     • Always store names in Latin script for consistency and matching.

3) Date & Time
   - Support all date formats globally
   - Normalize to ISO YYYY-MM-DD
   - Extract time if present (HH:MM:SS format)
   - Handle timezone if mentioned

4) Items Extraction
   - Extract EVERY line item
   - Capture quantity, unit price, total for each item
   - Include item-level discounts and taxes
   - Identify item categories when obvious
   - Handle multi-line item descriptions
   - Merge wrapped item names

5) Amounts & Currency
   - Detect currency symbol/code
   - Handle all decimal/thousands separators
   - Parse subtotal (pre-tax amount)
   - Break down all taxes separately (VAT, GST, Sales Tax, Service Charge)
   - Capture discounts, coupons, promotions
   - Extract tip/gratuity if present
   - Calculate total (must match printed total)
   - Record payment amount and change

6) Payment Details
   - Identify payment method (cash, card, digital wallet, online)
   - Extract card type (Visa, Mastercard, Amex) and last 4 digits
   - Capture transaction ID, approval code
   - Include payment reference numbers

7) Additional Receipt Details
   - Cashier/server name
   - Table number (restaurants)
   - Order/invoice number
   - Barcode/QR code data
   - Loyalty card number, points earned/redeemed
   - Promotional messages
   - Return policy period
   - Warranty information

8) Quality Checks
   - Subtotal + taxes + fees - discounts = total (validate math)
   - Sum of item totals = subtotal (validate)
   - No negative values unless explicitly marked as refund/discount
   - All monetary values with 2 decimal places
   - Never invent missing data - use null
   - Preserve original text formatting for item names

9) Special Handling
   - For restaurant receipts: separate food/drink items, capture tip suggestions
   - For fuel receipts: include fuel type, volume, price per unit
   - For online receipts: order number, tracking number, estimated delivery
   - For service receipts: itemize labor vs parts
   - For medical receipts: separate consultation, medicines, tests

RETURN ONLY THE JSON. NO EXTRA TEXT. NO MARKDOWN FENCES.
`;

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: this.getMimeType(filePath),
            data: base64Data,
          },
        },
        prompt,
      ]);

      const response = result.response.text();

      // Strip markdown fences
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/^\s*```json\s*/i, "");
      cleanedResponse = cleanedResponse.replace(/^\s*```/i, "");
      cleanedResponse = cleanedResponse.replace(/```\s*$/i, "");

      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Invalid OCR response format");
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsedData.merchant_name || !parsedData.total) {
        throw new Error(
          "Could not extract required receipt data (merchant and total)"
        );
      }

      return parsedData;
    } catch (error) {
      console.error("Receipt OCR Error:", error);
      throw new Error(`Failed to process receipt: ${error.message}`);
    }
  }

  /**
   * Process Invoice - ADVANCED OCR (Flexible for all invoice types)
   * Handles business invoices, utility bills, purchase orders, proforma invoices, etc.
   */
  async processInvoice(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString("base64");

      const prompt = `
SYSTEM ROLE
You are an expert OCR specialist for invoices and bills of ALL types. Extract complete invoice data from ANY invoice format, including:
- Business invoices (B2B sales invoices)
- Purchase orders
- Proforma invoices
- Commercial invoices
- Tax invoices
- Utility bills (electricity, water, gas, internet, phone)
- Service invoices (consulting, freelance, professional services)
- Subscription invoices (SaaS, memberships)
- Shipping/freight invoices
- Medical invoices
- Legal invoices
- Construction/contracting invoices
- Rental invoices
- Credit notes / Debit notes

Handle ANY layout: formal business format, simple bills, government forms, multi-page invoices, multi-currency invoices.

-----------------------------------------------------
OUTPUT CONTRACT (MANDATORY)
Return ONLY a valid JSON object. Include ALL fields found in the invoice. At minimum, include these standard fields:

{
  "document_type": "invoice|bill|purchase_order|proforma|credit_note|debit_note|estimate|quote",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "issue_date": "YYYY-MM-DD or null",
  "purchase_order_number": "string or null",
  "reference_number": "string or null",
  
  "vendor": {
    "name": "string",
    "address": "string or null",
    "city": "string or null",
    "state": "string or null",
    "postal_code": "string or null",
    "country": "string or null",
    "phone": "string or null",
    "email": "string or null",
    "website": "string or null",
    "tax_id": "string or null",
    "company_registration": "string or null",
    "bank_account": "string or null",
    "bank_name": "string or null",
    "swift_code": "string or null"
  },
  
  "customer": {
    "name": "string or null",
    "address": "string or null",
    "city": "string or null",
    "state": "string or null",
    "postal_code": "string or null",
    "country": "string or null",
    "phone": "string or null",
    "email": "string or null",
    "tax_id": "string or null",
    "customer_id": "string or null"
  },
  
  "currency": "USD|PKR|EUR|GBP|...",
  
  "line_items": [
    {
      "item_number": "string or null",
      "description": "string",
      "quantity": 0,
      "unit": "string or null",
      "unit_price": 0.00,
      "discount_percent": 0.00,
      "discount_amount": 0.00,
      "tax_rate": 0.00,
      "tax_amount": 0.00,
      "line_total": 0.00,
      "category": "string or null",
      "hs_code": "string or null"
    }
  ],
  
  "subtotal": 0.00,
  "discount_total": 0.00,
  "discount_percent": 0.00,
  
  "tax_breakdown": {
    "VAT": 0.00,
    "GST": 0.00,
    "Sales Tax": 0.00,
    "Income Tax": 0.00,
    "Withholding Tax": 0.00
  },
  
  "tax_total": 0.00,
  "shipping_cost": 0.00,
  "handling_fee": 0.00,
  "adjustment": 0.00,
  "total_amount": 0.00,
  "amount_paid": 0.00,
  "balance_due": 0.00,
  
  "payment_terms": "string or null",
  "payment_method": "string or null",
  "late_fee_terms": "string or null",
  
  "notes": "string or null",
  "terms_and_conditions": "string or null",
  
  "status": "draft|sent|paid|overdue|cancelled|pending or null"
}

**CRITICAL:** If the invoice contains ANY additional fields not listed above (like:
- Shipping details (tracking number, carrier, ship date, ship to address)
- Project details (project name, project code, milestone)
- Contract reference
- Billing period (from date, to date)
- Previous balance, payments received
- Meter readings (for utility bills)
- Account number (for utility bills)
- Connection details
- Usage details (units consumed, rate per unit)
- Discounts, promotions, offers
- Authorized signatory
- Stamp/seal information
- QR code for payment
- Bank details, payment QR codes
- Delivery date, delivery location
- Warranty information
- Return policy
- etc.), include them as additional keys in the JSON. DO NOT discard any information.

Use snake_case for all field names. Set to null if field is not present. NEVER hallucinate data.

-----------------------------------------------------
EXTRACTION RULES

1) Document Type Classification
   - Invoice: standard billing document
   - Bill: utility/service bill
   - Purchase Order: buyer's order to vendor
   - Proforma: preliminary invoice
   - Credit Note: refund/adjustment document
   - Debit Note: additional charges document
   - Estimate/Quote: pricing proposal

2) Document Numbers & Dates
   - Extract invoice/bill number (unique identifier)
   - Parse invoice date (when issued)
   - Parse due date (payment deadline)
   - Extract PO number if referenced
   - Capture any reference numbers
   - Support all global date formats → normalize to YYYY-MM-DD

3) Party Information (Vendor & Customer)
   - Vendor = seller/service provider (biller)
   - Customer = buyer/recipient
   - Extract COMPLETE address (street, city, state, postal, country)
   - Capture all contact details (phone, email, website)
   - Extract tax IDs (VAT, GST, TIN, EIN, etc.)
   - Get company registration numbers
   - Include bank details for payment (account, bank name, SWIFT/IBAN)

   - **MANDATORY ARABIC TRANSLITERATION RULE (CRITICAL):**
     ⚠️ **ABSOLUTE REQUIREMENT: ALL Arabic script MUST be converted to Latin script (English letters) in vendor.name, customer.name, and all name fields.**
     • If you see Arabic characters (ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي), you MUST transliterate to English.
     • **NEVER output Arabic script in name fields. Only Latin alphabet is allowed.**
     • Transliteration examples (phonetic conversion, NOT translation):
       * "شركة النور" → vendor.name: "Sharikat Al Noor" ✓ (NOT "شركة النور" ✗)
       * "علی أحمد" → customer.name: "Ali Ahmad" ✓ (NOT "علی أحمد" ✗)
       * "مؤسسة الخليج" → vendor.name: "Muassasat Al Khaleej" ✓ (NOT "مؤسسة الخليج" ✗)
       * "صيدلية النهدي" → vendor.name: "Saydaliyat Al Nahdi" ✓ (NOT "صيدلية النهدي" ✗)
     • **Validation check: Before finalizing, scan every name field. If you detect ANY Arabic character, you have failed this requirement. Retry with proper transliteration.**
     • Always store names in Latin script for consistency and matching.
     • This applies to all name fields: vendor.name, customer.name, authorized signatories, etc.

4) Line Items
   - Extract EVERY product/service line
   - Capture: description, quantity, unit, unit price
   - Calculate line totals
   - Include item-level discounts and taxes
   - Identify categories when obvious
   - Handle multi-line descriptions
   - Extract item/SKU numbers
   - Include HS codes for international invoices

5) Amounts & Calculations
   - Detect currency code/symbol
   - Parse subtotal (sum of line items before tax/discount)
   - Extract discount (percentage or fixed amount)
   - Break down ALL taxes separately by type
   - Include shipping, handling, adjustment charges
   - Calculate total (must match printed amount)
   - Record partial payments if shown
   - Calculate balance due (total - amount paid)
   - Validate: subtotal - discount + tax + fees = total

6) Payment Information
   - Payment terms (Net 30, Due on Receipt, etc.)
   - Payment method (Bank Transfer, Cheque, Cash, Card, etc.)
   - Late payment fees/penalties
   - Bank account details for payment
   - Payment instructions
   - Payment reference number

7) Additional Invoice Details
   - Notes/remarks from vendor
   - Terms and conditions
   - Billing period (for recurring services)
   - Project/contract reference
   - Authorized signature
   - Company stamp/seal
   - QR codes (payment, verification)
   - Delivery information
   - Shipping details

8) Utility Bill Specific
   - For electricity/water/gas bills:
     • Account number
     • Meter number
     • Previous reading, current reading
     • Units consumed
     • Rate per unit
     • Connection charges
     • Fixed charges
     • Billing period dates
     • Arrears/outstanding amount
     • Due date with late fee warning

9) Quality Checks
   - Validate arithmetic: sum of line items = subtotal
   - Validate: subtotal - discount + tax + fees = total
   - Ensure balance due = total - amount paid
   - All monetary values with 2 decimal places
   - Dates in ISO format
   - Never invent missing data - use null
   - Preserve original text for descriptions

10) Multi-Currency Handling
   - If invoice shows multiple currencies, extract all
   - Include exchange rate if mentioned
   - Clearly label original currency vs converted currency

11) Status Inference
   - If "PAID" stamp/watermark → status: "paid"
   - If "OVERDUE" or past due date → status: "overdue"
   - If "DRAFT" or "PROFORMA" → status: "draft"
   - If "CANCELLED" → status: "cancelled"
   - Otherwise → "pending" or null

RETURN ONLY THE JSON. NO EXTRA TEXT. NO MARKDOWN FENCES.
`;

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: this.getMimeType(filePath),
            data: base64Data,
          },
        },
        prompt,
      ]);

      const response = result.response.text();

      // Strip markdown fences
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/^\s*```json\s*/i, "");
      cleanedResponse = cleanedResponse.replace(/^\s*```/i, "");
      cleanedResponse = cleanedResponse.replace(/```\s*$/i, "");

      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Invalid OCR response format");
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (
        !parsedData.vendor ||
        !parsedData.vendor.name ||
        !parsedData.total_amount
      ) {
        throw new Error(
          "Could not extract required invoice data (vendor and total amount)"
        );
      }

      return parsedData;
    } catch (error) {
      console.error("Invoice OCR Error:", error);
      throw new Error(`Failed to process invoice: ${error.message}`);
    }
  }

  /**
   * Get MIME type based on file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".csv": "text/csv",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}

module.exports = new OCRService();
