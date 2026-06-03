const rateLimit = require('express-rate-limit');

const inquiryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
  skipSuccessfulRequests: false,
});

module.exports = { inquiryRateLimit };
