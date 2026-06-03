require('dotenv').config();

const { sendNewLeadNotification, isEmailConfigured } = require('../services/emailService');

const sampleLead = {
  id: 0,
  name: 'Test Lead',
  email: 'visitor@example.com',
  phone: '+33 6 00 00 00 00',
  country: 'France',
  purchase_timeline: 'Considering — no immediate timeline',
  message: 'This is a test submission from scripts/test-email.js',
  language: 'fr',
  created_at: new Date().toISOString(),
};

async function main() {
  if (!isEmailConfigured()) {
    console.error('Email not configured. Check SMTP_* and NOTIFICATION_EMAIL in .env');
    process.exit(1);
  }

  console.log(`Sending test lead email to ${process.env.NOTIFICATION_EMAIL}...`);

  const result = await sendNewLeadNotification(sampleLead);
  console.log('Sent successfully:', result.messageId);
}

main().catch((err) => {
  console.error('Test email failed:', err.message);
  process.exit(1);
});
