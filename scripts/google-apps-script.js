/**
 * Google Sheets lead capture + email notification
 *
 * Setup:
 * 1. Create a Google Sheet with headers in row 1 (see docs/GOOGLE-SHEETS.md)
 * 2. Extensions → Apps Script → paste this file → Save
 * 3. Project settings → Script properties → add:
 *      NOTIFICATION_EMAIL = your-inbox@example.com
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into .env as GOOGLE_SHEETS_WEBHOOK_URL
 *
 * Email is sent from the Google account that owns the script (GmailApp).
 * This works on Render free tier — Render blocks SMTP ports 587/465.
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

    let emailSent = false;
    try {
      emailSent = sendLeadNotificationEmail(data);
    } catch (mailErr) {
      console.error('Lead email failed:', mailErr.message);
    }

    return jsonResponse({ success: true, emailSent: emailSent });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function sendLeadNotificationEmail(data) {
  const notifyTo = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL');
  if (!notifyTo) {
    console.warn('NOTIFICATION_EMAIL script property not set — skipping email');
    return false;
  }

  const property = data.property || 'The Villa Above Antibes';
  const subject = 'New lead — ' + property;
  const body = formatLeadEmailBody(data);

  GmailApp.sendEmail(notifyTo, subject, body, {
    replyTo: data.email || undefined,
    name: 'Finlay Brewer International',
  });

  return true;
}

function formatLeadEmailBody(data) {
  const lines = [
    'New private presentation request',
    '',
    'Property: ' + (data.property || '—'),
    'Name: ' + (data.name || '—'),
    'Email: ' + (data.email || '—'),
    'Phone: ' + (data.phone || '—'),
    'Country: ' + (data.country || '—'),
    'Timeline: ' + (data.purchaseTimeline || '—'),
    'Language: ' + (data.language || '—'),
    'Message: ' + (data.message || '—'),
    '',
    'Submitted: ' + (data.submittedAt || new Date().toISOString()),
  ];
  return lines.join('\n');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
