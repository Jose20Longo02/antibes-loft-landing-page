const express = require('express');
const { getHome, getThankYou, redirectRoot } = require('../controllers/pageController');
const { localeMiddleware } = require('../middleware/locale');

const router = express.Router();

router.get('/', redirectRoot);
router.get('/:lang/thank-you', localeMiddleware, getThankYou);
router.get('/:lang', localeMiddleware, getHome);

router.get('/index.html', (req, res) => res.redirect(301, '/en'));

module.exports = router;
