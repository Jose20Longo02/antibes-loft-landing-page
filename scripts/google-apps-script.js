/**
 * Google Sheets lead capture — paste into Google Apps Script
 *
 * Setup:
 * 1. Create a Google Sheet with headers in row 1 (see docs/GOOGLE-SHEETS.md)
 * 2. Extensions → Apps Script → paste this file → Save
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL into .env as GOOGLE_SHEETS_WEBHOOK_URL
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.property || '',
      data.name || '',
      data.email || '',
      data.phone || '',
      data.country || '',
      data.purchaseTimeline || '',
      data.language || '',
      data.message || '',
    ]);

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
