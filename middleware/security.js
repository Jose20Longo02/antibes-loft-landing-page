const helmet = require('helmet');
const { isProduction, getSiteUrl } = require('../config/env');

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", 'https://connect.facebook.net', "'unsafe-inline'"],
  styleSrc: ["'self'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: [
    "'self'",
    'https://www.facebook.com',
    'https://facebook.com',
    'https://connect.facebook.net',
  ],
  formAction: ["'self'", 'https://www.facebook.com', 'https://facebook.com'],
  frameSrc: ['https://www.facebook.com', 'https://facebook.com'],
  objectSrc: ["'none'"],
};

if (isProduction() && getSiteUrl().startsWith('https://')) {
  cspDirectives.upgradeInsecureRequests = [];
}

const helmetMiddleware = helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  crossOriginEmbedderPolicy: false,
});

function forceHttps(req, res, next) {
  if (!isProduction()) return next();
  const proto = req.headers['x-forwarded-proto'];
  if (req.secure || proto === 'https') return next();
  return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
}

module.exports = { helmetMiddleware, forceHttps };
