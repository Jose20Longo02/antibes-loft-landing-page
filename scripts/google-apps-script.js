/** Bump when you deploy — open the /exec URL in a browser to confirm live version */
const SCRIPT_VERSION = '2026-10-08-intent-v1';

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
 *   Or: simulateWebhookLead → Run (full doPost path + sheet row + email)
 */

function doGet() {
  const notifyTo = getNotificationEmail();
  return jsonResponse({
    ok: true,
    version: SCRIPT_VERSION,
    hasNotificationEmail: Boolean(notifyTo),
    notificationEmailHint: notifyTo ? maskEmail(notifyTo) : null,
    hint: 'POST JSON to this URL from the site. Run testLeadEmail() in the editor to test Gmail.',
  });
}

function doPost(e) {
  try {
    logStep('doPost started (version ' + SCRIPT_VERSION + ')');

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
      data.inquiryIntent || '',
    ]);
    logStep('Row appended to sheet');

    let emailSent = false;
    let emailError = null;
    try {
      emailSent = sendLeadNotificationEmail(data);
      logStep('Email sent: ' + emailSent);
      if (!emailSent) {
        emailError = 'NOTIFICATION_EMAIL script property is missing';
      }
    } catch (mailErr) {
      emailError = mailErr.message || String(mailErr);
      logStep('Email error: ' + emailError);
    }

    return jsonResponse({
      success: true,
      version: SCRIPT_VERSION,
      emailSent: emailSent,
      emailError: emailError,
    });
  } catch (err) {
    logStep('doPost failed: ' + err.message);
    return jsonResponse({ success: false, error: err.message, version: SCRIPT_VERSION });
  }
}

/**
 * Simulates a real website POST (same code path as the live webhook).
 * Adds one row to the sheet and sends email — use before deploying.
 */
function simulateWebhookLead() {
  logStep('=== simulateWebhookLead started ===');

  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        submittedAt: new Date().toISOString(),
        property: 'Antibes Loft - €1,980,000 (WEBHOOK TEST)',
        name: 'Webhook Test Lead',
        email: 'webhook-test@example.com',
        phone: '+33 6 00 00 00 00',
        country: 'France',
        purchaseTimeline: 'Within 3 months',
        language: 'English (en)',
        message: 'Test from simulateWebhookLead() in Apps Script editor',
        inquiryIntent: 'dossier',
      }),
    },
  };

  const result = doPost(fakeEvent);
  logStep('Response: ' + result.getContent());
  logStep('=== simulateWebhookLead finished ===');
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
    property: 'Antibes Loft - €1,980,000 (TEST)',
    name: 'Test Lead',
    email: 'test@example.com',
    phone: '+33 6 00 00 00 00',
    country: 'France',
    purchaseTimeline: 'Within 3 months',
    language: 'English (en)',
    message: 'This is a test from Apps Script — testLeadEmail()',
    inquiryIntent: 'viewing',
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
  data = data || {};
  const notifyTo = getNotificationEmail();
  if (!notifyTo) {
    logStep('NOTIFICATION_EMAIL not set — skipping email');
    return false;
  }

  const property = data.property || 'Antibes Loft - €1,980,000';
  const intent = data.inquiryIntent === 'viewing' ? 'viewing' : 'dossier';
  const subject = 'New lead — ' + intent + ' — ' + property;
  const body = formatLeadEmailBody(data);

  const options = { name: 'Finlay Brewer International' };
  if (data.email) {
    options.replyTo = data.email;
  }
  GmailApp.sendEmail(notifyTo, subject, body, options);

  return true;
}

function formatLeadEmailBody(data) {
  data = data || {};
  const intent = data.inquiryIntent === 'viewing' ? 'viewing' : 'dossier';
  const intentLine = intent === 'viewing'
    ? 'Request to arrange a private viewing'
    : 'Request for the full property details';
  const lines = [
    intentLine,
    '',
    'Intent: ' + intent,
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

function maskEmail(email) {
  const parts = String(email).split('@');
  if (parts.length !== 2) return 'set';
  const local = parts[0];
  const masked = local.length <= 2 ? local + '***' : local.slice(0, 2) + '***';
  return masked + '@' + parts[1];
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
