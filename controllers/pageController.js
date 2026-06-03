const { negotiateLocale, DEFAULT_LOCALE, getContent } = require('../config/i18n');
const media = require('../config/media');

function redirectRoot(req, res) {
  const locale = negotiateLocale(req);
  res.redirect(302, `/${locale}`);
}

function getHome(req, res) {
  res.render('pages/index', pageLocals(res));
}

function getThankYou(req, res) {
  const content = res.locals.content;
  res.render('pages/thank-you', {
    ...pageLocals(res),
    title: content.thankYou.meta.title,
    meta: content.thankYou.meta,
    thankYou: {
      ...content.thankYou,
      image: media.thankYou.image,
      imageFull: media.thankYou.imageFull,
    },
  });
}

function pageLocals(res) {
  return {
    title: res.locals.content.meta.title,
    meta: res.locals.content.meta,
    config: res.locals.config,
    content: res.locals.content,
    lang: res.locals.lang,
    langDir: res.locals.langDir,
    localeSwitcher: res.locals.localeSwitcher,
    homeUrl: res.locals.homeUrl,
    siteUrl: res.locals.siteUrl,
    canonicalUrl: res.locals.canonicalUrl,
    ogImage: res.locals.ogImage,
    currentLanguageName: res.locals.currentLanguageName,
  };
}

module.exports = { getHome, getThankYou, redirectRoot };
