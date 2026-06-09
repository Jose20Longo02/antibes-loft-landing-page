const { isProduction } = require('../config/env');

const ONE_YEAR = 31536000;
const ONE_DAY = 86400;

function staticCache(req, res, next) {
  if (!isProduction()) return next();

  const isAsset =
    /\.(css|js|jpg|jpeg|png|webp|gif|svg|ico|woff2?|mp4|webm)$/i.test(req.path) ||
    req.path.startsWith('/images/') ||
    req.path.startsWith('/videos/');

  if (isAsset) {
    res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
  } else {
    res.setHeader('Cache-Control', `public, max-age=${ONE_DAY}`);
  }

  next();
}

module.exports = { staticCache };
