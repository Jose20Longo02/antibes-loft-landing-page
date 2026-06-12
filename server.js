require('dotenv').config();

const compression = require('compression');
const express = require('express');
const path = require('path');

const { validateConfig, isProduction, getSiteUrl } = require('./config/env');
const indexRoutes = require('./routes/index');
const inquiryRoutes = require('./routes/inquiry');
const { getRobots, getSitemap } = require('./controllers/seoController');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { helmetMiddleware, forceHttps } = require('./middleware/security');
const { staticCache } = require('./middleware/staticCache');
const { assetUrl } = require('./config/assets');
const { getMetaPixelId } = require('./config/env');
const { isMetaConversionsConfigured } = require('./services/metaConversionsService');
const { isEmailConfigured } = require('./services/emailService');

validateConfig();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.disable('x-powered-by');
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

if (isProduction()) {
  app.use(forceHttps);
}

app.use(helmetMiddleware);
app.use(compression());
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));

app.get('/robots.txt', getRobots);
app.get('/sitemap.xml', getSitemap);

app.use((req, res, next) => {
  res.locals.assetUrl = assetUrl;
  res.locals.metaPixelId = getMetaPixelId();
  next();
});

app.use(staticCache);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRoutes);
app.use('/api/inquiries', inquiryRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  const site = getSiteUrl() || `http://localhost:${PORT}`;
  const pixelId = getMetaPixelId();
  console.log(`Antibes Luxury Loft — ${site} (${process.env.NODE_ENV || 'development'})`);
  if (pixelId) {
    console.log(`[meta] Pixel enabled (${pixelId})`);
    if (!isMetaConversionsConfigured()) {
      console.warn(
        '[meta] META_CONVERSIONS_API_ACCESS_TOKEN is not set — server Lead events disabled'
      );
    } else {
      console.log('[meta] Conversions API enabled (server Lead events)');
    }
  } else {
    console.warn('[meta] META_PIXEL_ID is not set — pixel disabled');
  }

  if (!isEmailConfigured()) {
    console.warn('[email] SMTP not fully configured — lead notification emails disabled');
  } else if (isProduction() && process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    console.log('[email] Production uses Apps Script for notifications (Render blocks SMTP on free tier)');
  }
});

module.exports = app;
