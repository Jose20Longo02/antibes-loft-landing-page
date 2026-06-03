const express = require('express');
const { createInquiry } = require('../controllers/inquiryController');
const { honeypot } = require('../middleware/honeypot');
const { inquiryRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', inquiryRateLimit, honeypot(), createInquiry);

module.exports = router;
