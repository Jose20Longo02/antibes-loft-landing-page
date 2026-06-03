# Deploy on Render

Guide for publishing **The Villa Above Antibes** on [Render](https://render.com) from GitHub.

**Repo:** https://github.com/Jose20Longo02/antibes-loft-landing-page

---

## Before you start

1. Code is pushed to GitHub (`main` branch).
2. You have a [Render](https://dashboard.render.com) account (sign in with GitHub).
3. You have ready:
   - `GOOGLE_SHEETS_WEBHOOK_URL` (see [GOOGLE-SHEETS.md](./GOOGLE-SHEETS.md))
   - Gmail App Password + `NOTIFICATION_EMAIL` (same as local `.env`)

---

## Option A — Blueprint (recommended)

1. Open **Render Dashboard** → **Blueprints** → **New Blueprint Instance**.
2. Connect GitHub and select repo **`antibes-loft-landing-page`**.
3. Render reads `render.yaml` from the repo.
4. When prompted, enter **secret** environment variables:
   - `GOOGLE_SHEETS_WEBHOOK_URL`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `EMAIL_FROM` (e.g. `"Finlay Brewer International" <you@gmail.com>`)
   - `NOTIFICATION_EMAIL`
5. Click **Apply** and wait for the first deploy (~3–8 minutes; images make the first build slower).

Your site will be at:

`https://antibes-loft-landing.onrender.com`

(Exact name matches `name` in `render.yaml`; change it there if you prefer another slug.)

---

## Option B — Manual Web Service

1. **Dashboard** → **New +** → **Web Service**.
2. Connect **`Jose20Longo02/antibes-loft-landing-page`**.
3. Settings:

   | Field | Value |
   |-------|--------|
   | **Region** | Frankfurt (EU) or closest to your audience |
   | **Branch** | `main` |
   | **Runtime** | Node |
   | **Build Command** | `npm ci` |
   | **Start Command** | `npm start` |
   | **Health Check Path** | `/en` |

4. **Environment** → add variables:

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `TRUST_PROXY` | `1` |
   | `PRIVACY_POLICY_URL` | `https://www.finlaybrewer.com/privacy-policy` |
   | `GOOGLE_SHEETS_WEBHOOK_URL` | *(your Apps Script URL)* |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_SECURE` | `false` |
   | `SMTP_USER` | *(Gmail address)* |
   | `SMTP_PASS` | *(Google App Password)* |
   | `EMAIL_FROM` | `"Finlay Brewer International" <your@gmail.com>` |
   | `NOTIFICATION_EMAIL` | *(inbox for leads)* |

5. **Create Web Service** → wait for deploy.

`SITE_URL` is **not required** on Render: the app uses `RENDER_EXTERNAL_URL` automatically. When you add a custom domain, set `SITE_URL` to that domain (see below).

---

## After the first deploy

1. Open `https://<your-service>.onrender.com/en`
2. Submit a **test lead** on the form.
3. Confirm **Google Sheet** row + **email**.
4. Check logs: **Service** → **Logs** (no `[config]` errors).

---

## Custom domain (optional)

1. Render → your service → **Settings** → **Custom Domains** → add domain.
2. Add the DNS records Render shows (usually CNAME).
3. In **Environment**, set:

   ```
   SITE_URL=https://your-domain.com
   ```

   (no trailing slash)

4. **Manual Deploy** or wait for auto-deploy.

---

## Free tier notes

- Service **spins down after ~15 min** of no traffic; first visit may take 30–60s (cold start).
- Upgrade to a paid plan for always-on and faster builds.
- Gallery images are in the repo, so builds are larger than a minimal API.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Deploy fails immediately | Open **Logs** — usually missing `GOOGLE_SHEETS_WEBHOOK_URL` or SMTP vars |
| “Application failed to respond” | Wait for cold start; check health path `/en` |
| Form 503 | Lead capture not configured — add Sheets and/or SMTP env vars |
| Wrong OG / canonical URLs | Set `SITE_URL` to your public URL (or custom domain) |
| Emails not sending | Use Gmail **App Password**, not normal password |

---

## Redeploy

Push to `main` on GitHub → Render auto-deploys if enabled.

**Manual deploy:** Service → **Manual Deploy** → **Deploy latest commit**.
