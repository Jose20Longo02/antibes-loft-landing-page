# Production deployment

## Pre-flight checklist

1. Copy `.env.example` to `.env` on the server (never commit `.env`).
2. Set `NODE_ENV=production` and `SITE_URL` to your live HTTPS URL (no trailing slash).
3. Confirm Google Sheets webhook and/or Gmail SMTP are configured.
4. Run locally:

   ```bash
   npm run check:env
   ```

5. Test the inquiry form end-to-end after deploy.

## Environment variables

| Variable | Required (prod) | Description |
|----------|-----------------|-------------|
| `NODE_ENV` | yes | `production` |
| `SITE_URL` | yes | Canonical public URL, e.g. `https://villa.example.com` |
| `PORT` | no | Default `3000` (platforms often inject this) |
| `TRUST_PROXY` | no | Default `1` — set if behind a reverse proxy |
| `GOOGLE_SHEETS_WEBHOOK_URL` | one of* | Apps Script web app URL |
| `SMTP_*` + `NOTIFICATION_EMAIL` | one of* | Gmail or SMTP for lead alerts |
| `PRIVACY_POLICY_URL` | no | Linked from the inquiry form |

\* At least one lead channel (Sheets or email) must work.

## Run the app

```bash
npm ci --omit=dev
npm run check:env
npm start
```

The server listens on `PORT` and serves static files from `public/`.

## Platform notes

### Render

**Full walkthrough:** [RENDER.md](./RENDER.md) — includes Blueprint (`render.yaml`) and env var checklist.

On Render, `RENDER_EXTERNAL_URL` is used as `SITE_URL` if you do not set one manually.

### Railway / Fly.io

- Build command: `npm ci`
- Start command: `npm start`
- Add all `.env` variables in the dashboard.
- Enable HTTPS on the platform; the app redirects HTTP → HTTPS when `SITE_URL` uses `https://`.

### VPS (Ubuntu + PM2 + Nginx)

1. Install Node.js 20 LTS.
2. Clone the repo and install dependencies.
3. Configure Nginx as a reverse proxy to `127.0.0.1:3000`.
4. Use Certbot for TLS.
5. Process manager example:

   ```bash
   pm2 start server.js --name antibes-loft
   pm2 save
   ```

### Docker (optional)

No Dockerfile is included by default. A minimal image would use `node:20-alpine`, copy the project, run `npm ci --omit=dev`, expose `3000`, and `CMD ["npm","start"]`.

## Production features enabled

- **Helmet** — security headers + CSP (Google Fonts allowed)
- **Compression** — gzip for responses
- **HTTPS redirect** — when `SITE_URL` is `https://`
- **Static caching** — long cache for images/CSS/JS
- **SEO** — `/robots.txt`, `/sitemap.xml`, Open Graph, absolute canonical URLs
- **Secure locale cookie** — `Secure` flag in production
- **Config validation** — server refuses to start in production if misconfigured

## After deploy

- Visit `/en`, `/fr`, `/de`
- Submit a test lead; confirm Sheet row + email
- Share a link in WhatsApp/iMessage and verify the preview image
- Confirm `https://your-domain.com/robots.txt` and `sitemap.xml`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Form works locally, not in prod | Check env vars on host; run `npm run check:env` |
| Wrong links in emails | Set `SITE_URL` |
| Rate limit / IP issues behind proxy | Ensure `TRUST_PROXY=1` |
| CSP blocks fonts | Already allowed; clear CDN cache if customized |
