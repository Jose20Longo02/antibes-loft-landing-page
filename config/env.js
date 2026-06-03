const media = require('./media');

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function getSiteUrl() {
  const raw = (
    process.env.SITE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    ''
  ).trim();
  if (!raw) return '';
  return raw.replace(/\/$/, '');
}

function absoluteUrl(path) {
  const base = getSiteUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

function validateConfig() {
  const issues = [];
  const warnings = [];

  if (isProduction()) {
    if (!getSiteUrl()) {
      issues.push('SITE_URL is required in production (e.g. https://villa.finlaybrewer.com)');
    } else if (!getSiteUrl().startsWith('https://')) {
      warnings.push('SITE_URL should use https:// in production');
    }
  }

  const hasSheets = Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL);
  const hasEmail = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.NOTIFICATION_EMAIL
  );

  if (!hasSheets && !hasEmail) {
    issues.push('Configure GOOGLE_SHEETS_WEBHOOK_URL and/or Gmail SMTP settings for lead capture');
  }

  if (issues.length) {
    const message = `[config] ${issues.join('; ')}`;
    if (isProduction()) {
      throw new Error(message);
    }
    console.warn(message);
  }

  warnings.forEach((w) => console.warn(`[config] ${w}`));
}

function getDefaultOgImage() {
  return absoluteUrl(media.hero.image);
}

module.exports = {
  isProduction,
  getSiteUrl,
  absoluteUrl,
  validateConfig,
  getDefaultOgImage,
};
