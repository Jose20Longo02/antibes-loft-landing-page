#!/usr/bin/env node
require('dotenv').config();

const { validateConfig, getSiteUrl, isProduction } = require('../config/env');

try {
  validateConfig();
  console.log('Environment OK');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  SITE_URL: ${getSiteUrl() || '(not set — relative URLs only)'}`);
  console.log(`  Sheets: ${process.env.GOOGLE_SHEETS_WEBHOOK_URL ? 'yes' : 'no'}`);
  console.log(
    `  Email: ${
      process.env.SMTP_HOST && process.env.NOTIFICATION_EMAIL ? 'yes' : 'no'
    }`
  );
  if (!isProduction()) {
    console.log('\nTip: set NODE_ENV=production and SITE_URL before deploying.');
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
