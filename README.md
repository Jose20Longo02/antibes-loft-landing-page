# The Villa Above Antibes

An editorial luxury microsite for a rare residence in **Antibes, French Riviera**, presented by **Finlay Brewer International**.

## Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Server       | Node.js 20+, Express                |
| Views        | EJS                                 |
| Client       | HTML, CSS, JavaScript               |
| Lead storage | Google Sheets + Gmail notifications |

## Languages

| Code | URL   |
| ---- | ----- |
| `en` | `/en` |
| `fr` | `/fr` |
| `de` | `/de` |

Copy: `locales/en.js`, `locales/fr.js`, `locales/de.js`

## Getting started (local)

1. `cp .env.example .env` and configure (see below)
2. `npm install`
3. `npm run dev`
4. Open http://localhost:3000

## Production

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for hosting, env vars, and checklist.

**Deploy on Render:** **[docs/RENDER.md](docs/RENDER.md)** (uses `render.yaml` in the repo).

```bash
npm run check:env   # validate configuration
npm start           # NODE_ENV=production recommended
```

Required in production:

- `NODE_ENV=production`
- `SITE_URL=https://your-live-domain.com`
- At least one of: `GOOGLE_SHEETS_WEBHOOK_URL` or Gmail SMTP settings

## Lead capture

Each form submission:

1. **Appends a row** to your Google Sheet (if `GOOGLE_SHEETS_WEBHOOK_URL` is set)
2. **Emails** `NOTIFICATION_EMAIL` via Gmail (if SMTP is set)

At least one must be configured. See **[docs/GOOGLE-SHEETS.md](docs/GOOGLE-SHEETS.md)** for sheet setup.

### Gmail

Use a [Google App Password](https://myaccount.google.com/apppasswords) as `SMTP_PASS`.

## Project structure

```
├── config/           # App config, env helpers, i18n, media paths
├── locales/          # en, fr, de copy
├── docs/             # Deployment + Google Sheets guides
├── public/           # CSS, JS, images
├── scripts/          # check-env, Google Apps Script template
├── services/         # Email + Sheets
├── views/            # EJS templates
└── server.js
```
