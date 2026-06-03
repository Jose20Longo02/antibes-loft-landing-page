const { isSupported, getContent, DEFAULT_LOCALE } = require('../config/i18n');
const appConfig = require('../config/app');

function notFound(req, res) {
  const segment = req.path.split('/').filter(Boolean)[0];
  const lang = isSupported(segment) ? segment : DEFAULT_LOCALE;
  const content = getContent(lang);

  res.status(404).render('pages/404', {
    lang,
    content,
    homeUrl: `/${lang}`,
    config: {
      ...appConfig,
      propertyConcept: content.app.propertyConcept,
    },
  });
}

function safeApiMessage(err) {
  if (process.env.NODE_ENV === 'production') {
    return 'Something went wrong. Please try again later.';
  }
  return err.message;
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = safeApiMessage(err);

  if (req.path.startsWith('/api/')) {
    return res.status(status).json({ success: false, error: message });
  }

  const segment = req.path.split('/').filter(Boolean)[0];
  const lang = isSupported(segment) ? segment : DEFAULT_LOCALE;

  res.status(status).render('pages/error', {
    lang,
    status,
    message,
    homeUrl: `/${lang}`,
  });
}

module.exports = { notFound, errorHandler };
