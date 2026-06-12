const { getContent, isSupported, DEFAULT_LOCALE, LOCALE_META } = require('../config/i18n');

const SHEETS_TIMEOUT_MS = 12_000;

function isSheetsConfigured() {
  return Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL);
}

function buildRow(lead) {
  const lang = isSupported(lead.language) ? lead.language : DEFAULT_LOCALE;
  const content = getContent(lang);
  const meta = LOCALE_META[lang];

  return {
    submittedAt: lead.created_at || new Date().toISOString(),
    property: content.app.propertyConcept,
    name: lead.name,
    email: lead.email,
    phone: lead.phone || '',
    country: lead.country || '',
    purchaseTimeline: lead.purchase_timeline || '',
    language: `${meta?.name || lang} (${lang})`,
    message: lead.message || '',
  };
}

async function appendLead(lead) {
  if (!isSheetsConfigured()) {
    console.warn('[sheets] Skipped — set GOOGLE_SHEETS_WEBHOOK_URL in .env');
    return { saved: false, reason: 'not_configured' };
  }

  const row = buildRow(lead);
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SHEETS_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      redirect: 'follow',
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Google Sheets webhook timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Google Sheets webhook failed (${res.status})`);
  }

  return { saved: true, data, emailSent: Boolean(data.emailSent) };
}

module.exports = { appendLead, isSheetsConfigured };
