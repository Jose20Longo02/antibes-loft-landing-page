const { sendNewLeadNotification, isEmailConfigured } = require('../services/emailService');
const { appendLead, isSheetsConfigured } = require('../services/sheetsService');
const { sendLeadEvent, isMetaConversionsConfigured } = require('../services/metaConversionsService');
const { absoluteUrl, isProduction } = require('../config/env');
const { isSupported, DEFAULT_LOCALE } = require('../config/i18n');
const crypto = require('crypto');

const EMAIL_TIMEOUT_MS = 15_000;
const SHEETS_TIMEOUT_MS = 12_000;
const META_TIMEOUT_MS = 8_000;

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

function shouldUseSmtpFallback(sentEmail) {
  if (sentEmail || !isEmailConfigured()) return false;
  if (process.env.SKIP_SMTP === 'true') return false;
  // Render free tier blocks outbound SMTP — rely on Apps Script email instead.
  if (isProduction() && isSheetsConfigured()) return false;
  return true;
}

async function createInquiry(req, res, next) {
  try {
    const lead = leadFromBody(req.body);
    let savedToSheets = false;
    let sentEmail = false;

    if (isSheetsConfigured()) {
      try {
        const result = await withTimeout(appendLead(lead), SHEETS_TIMEOUT_MS, 'Google Sheets');
        savedToSheets = Boolean(result.saved);
        if (result.emailSent) sentEmail = true;
      } catch (err) {
        console.error('[sheets] Failed to save lead:', err.message);
      }
    }

    if (shouldUseSmtpFallback(sentEmail)) {
      try {
        await withTimeout(sendNewLeadNotification(lead), EMAIL_TIMEOUT_MS, 'Email delivery');
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

    const eventId =
      typeof req.body.meta_event_id === 'string' && req.body.meta_event_id.trim()
        ? req.body.meta_event_id.trim()
        : crypto.randomUUID();

    if (isMetaConversionsConfigured()) {
      const locale = lead.language || DEFAULT_LOCALE;
      const fbp =
        typeof req.body.meta_fbp === 'string' && req.body.meta_fbp.trim()
          ? req.body.meta_fbp.trim()
          : undefined;
      const fbc =
        typeof req.body.meta_fbc === 'string' && req.body.meta_fbc.trim()
          ? req.body.meta_fbc.trim()
          : undefined;

      withTimeout(
        sendLeadEvent({
          eventId,
          email: lead.email,
          phone: lead.phone,
          name: lead.name,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          sourceUrl: absoluteUrl(`/${locale}#presentation`),
          fbp,
          fbc,
        }),
        META_TIMEOUT_MS,
        'Meta Conversions API'
      ).catch((err) => {
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
