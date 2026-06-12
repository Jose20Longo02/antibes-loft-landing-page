/**
 * Google Sheets lead capture + email notification
 *
 * SETUP
 * 1. Sheet with headers (see docs/GOOGLE-SHEETS.md)
 * 2. Paste this file in Extensions → Apps Script → Save
 * 3. Project Settings → Script properties → add:
 *      NOTIFICATION_EMAIL = your-inbox@example.com
 * 4. Run testLeadEmail() once from the editor and authorize Gmail
 * 5. Deploy → Web app (Execute as: Me, Who has access: Anyone)
 * 6. Copy URL to GOOGLE_SHEETS_WEBHOOK_URL in Render / .env
 *
 * TEST FROM EDITOR (do not run doPost manually — it has no data):
 *   Select function: testLeadEmail → Run
 */

function doPost(e) {
  try {
    logStep('doPost started');

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Missing POST body — this function runs via the web app URL, not the Run button.');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    logStep('Lead received: ' + (data.email || 'no email'));

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
    logStep('Row appended to sheet');

    let emailSent = false;
    try {
      emailSent = sendLeadNotificationEmail(data);
      logStep('Email sent: ' + emailSent);
    } catch (mailErr) {
      logStep('Email error: ' + mailErr.message);
    }

    return jsonResponse({ success: true, emailSent: emailSent });
  } catch (err) {
    logStep('doPost failed: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

/**
 * Run THIS from the Apps Script editor to test email.
 * Dropdown: testLeadEmail → Run (Ejecutar)
 */
function testLeadEmail() {
  logStep('=== testLeadEmail started ===');

  const notifyTo = getNotificationEmail();
  if (!notifyTo) {
    logStep('STOP: Set NOTIFICATION_EMAIL in Project Settings → Script properties');
    return;
  }

  logStep('Sending test email to: ' + notifyTo);

  const sample = {
    submittedAt: new Date().toISOString(),
    property: 'The Villa Above Antibes (TEST)',
    name: 'Test Lead',
    email: 'test@example.com',
    phone: '+33 6 00 00 00 00',
    country: 'France',
    purchaseTimeline: 'Within 3 months',
    language: 'English (en)',
    message: 'This is a test from Apps Script — testLeadEmail()',
  };

  const sent = sendLeadNotificationEmail(sample);
  logStep(sent ? 'SUCCESS: Check inbox and spam for: ' + notifyTo : 'FAILED: email not sent');
  logStep('=== testLeadEmail finished ===');
}

/**
 * Run to verify Script properties without sending email.
 */
function checkSetup() {
  logStep('=== checkSetup ===');
  const notifyTo = getNotificationEmail();
  if (notifyTo) {
    logStep('OK: NOTIFICATION_EMAIL = ' + notifyTo);
  } else {
    logStep('MISSING: Add NOTIFICATION_EMAIL in Project Settings → Script properties');
  }
  logStep('Sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getName());
  logStep('=== done ===');
}

function getNotificationEmail() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL');
}

function sendLeadNotificationEmail(data) {
  const notifyTo = getNotificationEmail();
  if (!notifyTo) {
    logStep('NOTIFICATION_EMAIL not set — skipping email');
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

function logStep(message) {
  Logger.log(message);
  console.log(message);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
