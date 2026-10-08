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
   | `SITE_URL` | `https://finlay-brewer-international.com` |
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

Set `SITE_URL` to the branded domain (no trailing slash), even though Render also provides `RENDER_EXTERNAL_URL`:

```
SITE_URL=https://finlay-brewer-international.com
```

Language switches stay on whatever host the visitor is using (`/en`, `/fr`, `/de`). Canonical, hreflang, Open Graph and the sitemap use `SITE_URL`. If it is missing, those tags fall back to `*.onrender.com`.

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
   SITE_URL=https://finlay-brewer-international.com
   ```

   (no trailing slash). Language links are relative, so they follow this host. Canonical, hreflang and the sitemap use `SITE_URL` and will keep pointing at `onrender.com` until this is set.

4. **Manual Deploy** or wait for auto-deploy.

---

## Free tier notes

- Service **spins down after ~15 min** of no traffic; first visit may take 30–60s (cold start).
- **Outbound SMTP is blocked** on ports 25, 587, and 465 — Gmail SMTP from the Node app will timeout. Send lead emails via **Google Apps Script** instead (`docs/GOOGLE-SHEETS.md`).
- Upgrade to a paid plan for always-on, faster builds, and direct SMTP access.
- Gallery images are in the repo, so builds are larger than a minimal API.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Deploy fails immediately | Open **Logs** — usually missing `GOOGLE_SHEETS_WEBHOOK_URL` or SMTP vars |
| “Application failed to respond” | Wait for cold start; check health path `/en` |
| Form 503 | Lead capture not configured — add Sheets and/or SMTP env vars |
| `[email] Connection timeout` on Render | **Free tier blocks SMTP** — use Apps Script email (see `docs/GOOGLE-SHEETS.md` §2b) |
| Emails work locally but not on Render | Same as above; upgrade Render to paid **or** use Apps Script `NOTIFICATION_EMAIL` |
| Wrong OG / canonical URLs | Set `SITE_URL` to your public URL (or custom domain) |
| Emails not sending (local) | Use Gmail **App Password**, not normal password |

---

## Redeploy

Push to `main` on GitHub → Render auto-deploys if enabled.

**Manual deploy:** Service → **Manual Deploy** → **Deploy latest commit**.
