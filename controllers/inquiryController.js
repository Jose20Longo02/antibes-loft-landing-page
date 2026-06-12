const { sendNewLeadNotification } = require('../services/emailService');
const { appendLead, isSheetsConfigured } = require('../services/sheetsService');
const { isEmailConfigured } = require('../services/emailService');
const { sendLeadEvent, isMetaConversionsConfigured } = require('../services/metaConversionsService');
const { absoluteUrl } = require('../config/env');
const { isSupported, DEFAULT_LOCALE } = require('../config/i18n');
const crypto = require('crypto');

const EMAIL_TIMEOUT_MS = 15_000;

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

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]);
}

async function createInquiry(req, res, next) {
  try {
    const lead = leadFromBody(req.body);
    let savedToSheets = false;
    let sentEmail = false;

    if (isSheetsConfigured()) {
      try {
        await withTimeout(appendLead(lead), 12_000, 'Google Sheets');
        savedToSheets = true;
      } catch (err) {
        console.error('[sheets] Failed to save lead:', err.message);
      }
    }

    if (isEmailConfigured()) {
      if (savedToSheets) {
        sendNewLeadNotification(lead)
          .then(() => {
            console.log('[email] Lead notification sent');
          })
          .catch((err) => {
            console.error('[email] Failed to send lead notification:', err.message);
          });
        sentEmail = true;
      } else {
        try {
          await withTimeout(sendNewLeadNotification(lead), EMAIL_TIMEOUT_MS, 'Email delivery');
          sentEmail = true;
        } catch (err) {
          console.error('[email] Failed to send lead notification:', err.message);
        }
      }
    }

    if (!savedToSheets && !sentEmail) {
      const err = new Error(
        'Lead capture is not configured. Set GOOGLE_SHEETS_WEBHOOK_URL and/or email settings in .env.'
      );
      err.status = 503;
      return next(err);
    }

    const eventId =
      typeof req.body.meta_event_id === 'string' && req.body.meta_event_id.trim()
        ? req.body.meta_event_id.trim()
        : crypto.randomUUID();

    if (isMetaConversionsConfigured()) {
      const locale = lead.language || DEFAULT_LOCALE;
      sendLeadEvent({
        eventId,
        email: lead.email,
        phone: lead.phone,
        name: lead.name,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        sourceUrl: absoluteUrl(`/${locale}#presentation`),
      }).catch((err) => {
        console.error('[meta] Failed to send Lead event:', err.message);
      });
    }

    return res.status(201).json({
      success: true,
      data: lead,
      savedToSheets,
      sentEmail,
      eventId,
    });
  } catch (err) {
    console.error('[inquiry] Unexpected error:', err);
    return next(err);
  }
}

module.exports = { createInquiry };
