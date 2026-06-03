const { sendNewLeadNotification } = require('../services/emailService');
const { appendLead, isSheetsConfigured } = require('../services/sheetsService');
const { isEmailConfigured } = require('../services/emailService');
const { isSupported, DEFAULT_LOCALE } = require('../config/i18n');

function leadFromBody(body) {
  return {
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    country: body.country || null,
    purchase_timeline: body.purchase_timeline || null,
    message: body.message || null,
    language: isSupported(body.language) ? body.language : DEFAULT_LOCALE,
    created_at: new Date().toISOString(),
  };
}

async function createInquiry(req, res, next) {
  const lead = leadFromBody(req.body);
  let savedToSheets = false;
  let sentEmail = false;

  if (isSheetsConfigured()) {
    try {
      await appendLead(lead);
      savedToSheets = true;
    } catch (err) {
      console.error('[sheets] Failed to save lead:', err.message);
    }
  }

  if (isEmailConfigured()) {
    try {
      await sendNewLeadNotification(lead);
      sentEmail = true;
    } catch (err) {
      console.error('[email] Failed to send lead notification:', err.message);
    }
  }

  if (!savedToSheets && !sentEmail) {
    const err = new Error(
      'Lead capture is not configured. Set GOOGLE_SHEETS_WEBHOOK_URL and/or email settings in .env.'
    );
    err.status = 503;
    return next(err);
  }

  res.status(201).json({
    success: true,
    data: lead,
    savedToSheets,
    sentEmail,
  });
}

module.exports = { createInquiry };
