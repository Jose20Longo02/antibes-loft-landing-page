const nodemailer = require('nodemailer');
const appConfig = require('../config/app');
const { getContent, isSupported, DEFAULT_LOCALE, LOCALE_META } = require('../config/i18n');

const EMAIL_SUBJECTS = {
  en: (property) => `New lead — ${property}`,
  fr: (property) => `Nouveau prospect — ${property}`,
  de: (property) => `Neue Anfrage — ${property}`,
};

let transporter;

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.NOTIFICATION_EMAIL
  );
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

function getLeadContext(lead) {
  const code = lead.language || lead.locale;
  const locale = isSupported(code) ? code : DEFAULT_LOCALE;
  const content = getContent(locale);
  return { locale, content };
}

function formatLeadPlain(lead) {
  const { locale, content } = getLeadContext(lead);
  const lines = [
    'New private presentation request',
    '',
    `Property: ${content.app.propertyConcept}`,
    `Location: ${content.app.propertyLocation}`,
    `Presented by: ${appConfig.siteName}`,
    `Language: ${LOCALE_META[locale].name} (${locale})`,
    '',
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || '—'}`,
    `Country: ${lead.country || '—'}`,
    `Purchase timeline: ${lead.purchase_timeline || '—'}`,
    `Message: ${lead.message || '—'}`,
    '',
    `Submitted: ${new Date(lead.created_at).toLocaleString('en-GB', { timeZone: 'Europe/Paris' })} (Europe/Paris)`,
    lead.id ? `Reference: #${lead.id}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function formatLeadHtml(lead) {
  const { locale, content } = getLeadContext(lead);
  const submitted = new Date(lead.created_at).toLocaleString('en-GB', {
    timeZone: 'Europe/Paris',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background:#f7f5f1;color:#1c1b19;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e8e4df;">
    <tr>
      <td style="padding:32px 28px 20px;border-bottom:1px solid #e8e4df;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a847a;">New lead</p>
        <h1 style="margin:0;font-size:22px;font-weight:400;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(content.app.propertyConcept)}</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#3d3a36;">${escapeHtml(content.app.propertyLocation)} · ${appConfig.siteName}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#8a847a;">Language: ${escapeHtml(LOCALE_META[locale].name)} (${locale})</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;">
          <tr><td style="padding:8px 0;color:#8a847a;width:140px;vertical-align:top;">Language</td><td style="padding:8px 0;">${escapeHtml(LOCALE_META[locale].name)} (${locale})</td></tr>
          <tr><td style="padding:8px 0;color:#8a847a;vertical-align:top;">Name</td><td style="padding:8px 0;">${escapeHtml(lead.name)}</td></tr>
          <tr><td style="padding:8px 0;color:#8a847a;vertical-align:top;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(lead.email)}" style="color:#1c1b19;">${escapeHtml(lead.email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#8a847a;vertical-align:top;">Phone</td><td style="padding:8px 0;">${escapeHtml(lead.phone || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#8a847a;vertical-align:top;">Country</td><td style="padding:8px 0;">${escapeHtml(lead.country || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#8a847a;vertical-align:top;">Timeline</td><td style="padding:8px 0;">${escapeHtml(lead.purchase_timeline || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#8a847a;vertical-align:top;">Message</td><td style="padding:8px 0;">${escapeHtml(lead.message || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#8a847a;vertical-align:top;">Submitted</td><td style="padding:8px 0;">${submitted}</td></tr>
          ${lead.id ? `<tr><td style="padding:8px 0;color:#8a847a;vertical-align:top;">Reference</td><td style="padding:8px 0;">#${lead.id}</td></tr>` : ''}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendNewLeadNotification(lead) {
  if (!isEmailConfigured()) {
    console.warn(
      '[email] Skipped — set SMTP_HOST, SMTP_USER, SMTP_PASS, and NOTIFICATION_EMAIL in .env'
    );
    return { sent: false, reason: 'not_configured' };
  }

  const transport = getTransporter();
  const { locale, content } = getLeadContext(lead);
  const property = content.app.propertyConcept;
  const subjectFn = EMAIL_SUBJECTS[locale] || EMAIL_SUBJECTS.en;
  const subject = subjectFn(property);

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || `"${appConfig.siteName}" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFICATION_EMAIL,
    replyTo: lead.email,
    subject,
    text: formatLeadPlain(lead),
    html: formatLeadHtml(lead),
  });

  return { sent: true, messageId: info.messageId };
}

module.exports = { sendNewLeadNotification, isEmailConfigured };
