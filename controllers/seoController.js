const { getSiteUrl } = require('../config/env');
const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = require('../config/i18n');

function getRobots(req, res) {
  const base = getSiteUrl();
  const sitemapLine = base ? `Sitemap: ${base}/sitemap.xml` : '';

  res.type('text/plain');
  res.send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /*/thank-you',
      sitemapLine,
    ]
      .filter(Boolean)
      .join('\n')
  );
}

function getSitemap(req, res) {
  const base = getSiteUrl() || `${req.protocol}://${req.get('host')}`;
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = SUPPORTED_LOCALES.flatMap((lang) => [
    { loc: `${base}/${lang}`, priority: lang === DEFAULT_LOCALE ? '1.0' : '0.9' },
  ]);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.type('application/xml');
  res.send(body);
}

module.exports = { getRobots, getSitemap };
