const appConfig = require('../config/app');
const { getSiteUrl, absoluteUrl, getDefaultOgImage, isProduction } = require('../config/env');
const {
  isSupported,
  getContent,
  getLocaleSwitcher,
  LOCALE_META,
  DEFAULT_LOCALE,
} = require('../config/i18n');

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

function attachLocale(req, res, locale) {
  const content = getContent(locale);
  const meta = LOCALE_META[locale];

  res.locals.lang = locale;
  res.locals.langDir = meta.dir;
  res.locals.currentLanguageName = meta.name;
  res.locals.content = content;
  const siteUrl = getSiteUrl();
  const pagePath = req.path || `/${locale}`;

  res.locals.siteUrl = siteUrl;
  res.locals.canonicalUrl = absoluteUrl(pagePath);
  res.locals.ogImage = getDefaultOgImage();
  res.locals.localeSwitcher = getLocaleSwitcher(req, locale, siteUrl);
  res.locals.homeUrl = `/${locale}`;
  res.locals.config = {
    ...appConfig,
    propertyConcept: content.app.propertyConcept,
    propertyLocation: content.app.propertyLocation,
    privacyPolicyUrl:
      process.env.PRIVACY_POLICY_URL || `${appConfig.companyUrl}/privacy-policy`,
  };

  res.cookie('locale', locale, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: 'lax',
    secure: isProduction(),
    path: '/',
  });
}

function localeMiddleware(req, res, next) {
  const { lang } = req.params;

  if (!isSupported(lang)) {
    return res.redirect(302, `/${DEFAULT_LOCALE}`);
  }

  attachLocale(req, res, lang);
  next();
}

module.exports = { localeMiddleware, attachLocale };
