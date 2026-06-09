const media = require('./media');

const catalogs = {
  en: require('../locales/en'),
  fr: require('../locales/fr'),
  de: require('../locales/de'),
};

const SUPPORTED_LOCALES = ['en', 'fr', 'de'];
const DEFAULT_LOCALE = 'en';

const LOCALE_META = {
  en: { label: 'EN', name: 'English', dir: 'ltr' },
  fr: { label: 'FR', name: 'Français', dir: 'ltr' },
  de: { label: 'DE', name: 'Deutsch', dir: 'ltr' },
};

function isSupported(locale) {
  return SUPPORTED_LOCALES.includes(locale);
}

function mergeWithMedia(strings) {
  const content = JSON.parse(JSON.stringify(strings));

  Object.assign(content.hero, media.hero);
  Object.assign(content.film, media.film);
  Object.assign(content.idea, media.idea);
  Object.assign(content.features, media.features);
  Object.assign(content.lifestyle, media.lifestyle);
  content.presentation.image = media.presentation.image;

  content.experience.moments = content.experience.moments.map((moment, i) => ({
    ...moment,
    ...media.experienceMoments[i],
  }));

  content.gallery.images = media.galleryFiles.map((file, i) => ({
    ...file,
    alt: content.gallery.alts[i],
  }));
  delete content.gallery.alts;

  return content;
}

function getContent(locale) {
  const key = isSupported(locale) ? locale : DEFAULT_LOCALE;
  return mergeWithMedia(catalogs[key]);
}

function parseCookies(req) {
  const raw = req.headers.cookie;
  if (!raw) return {};
  return Object.fromEntries(
    raw.split(';').map((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return [pair.trim(), ''];
      return [pair.slice(0, idx).trim(), decodeURIComponent(pair.slice(idx + 1).trim())];
    })
  );
}

function negotiateLocale(req) {
  const cookies = parseCookies(req);
  if (cookies.locale && isSupported(cookies.locale)) return cookies.locale;

  const accept = req.headers['accept-language'] || '';
  const preferred = accept
    .split(',')
    .map((part) => {
      const [code, q] = part.trim().split(';q=');
      return { code: code.split('-')[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { code } of preferred) {
    if (isSupported(code)) return code;
  }
  return DEFAULT_LOCALE;
}

function localeUrl(locale, hash = '') {
  const base = `/${locale}`;
  return hash ? `${base}${hash.startsWith('#') ? hash : `#${hash}`}` : base;
}

function getLocaleSwitcher(req, currentLocale, siteBase = '') {
  const segments = (req?.path || '/').split('/').filter(Boolean);
  const onThankYou = segments[1] === 'thank-you';
  const suffix = onThankYou ? '/thank-you' : '';

  return SUPPORTED_LOCALES.map((code) => {
    const path = `/${code}${suffix}`;
    const href = siteBase ? `${siteBase}${path}` : path;
    return {
      code,
      label: LOCALE_META[code].label,
      name: LOCALE_META[code].name,
      href,
      active: code === currentLocale,
    };
  });
}

module.exports = {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_META,
  isSupported,
  getContent,
  negotiateLocale,
  localeUrl,
  getLocaleSwitcher,
};
