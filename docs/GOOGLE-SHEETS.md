# Google Sheets lead capture

Leads from the presentation form are appended to a Google Sheet (no database required).

## 1. Create the sheet

Create a new Google Sheet. In **row 1**, add these headers:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Submitted | Property | Name | Email | Phone | Country | Timeline | Language | Message |

## 2. Install the script

1. In the sheet: **Extensions → Apps Script**
2. Delete any sample code and paste the contents of `scripts/google-apps-script.js` from this project
3. **Save** the project

## 2b. Enable email notifications (required on Render free tier)

Render **blocks SMTP ports** on the free plan, so lead emails are sent from Apps Script instead (using your Google account’s Gmail).

1. In Apps Script: **Project Settings** (gear icon) → **Script properties** → **Add property**
   - Name: `NOTIFICATION_EMAIL`
   - Value: inbox that should receive leads (e.g. `JoseLongo@Medialy.Agency`)
2. After any script change, create a **new deployment** (Deploy → Manage deployments → Edit → New version → Deploy)

Emails are sent from the Google account that owns the script, with **Reply-To** set to the lead’s email.

### Test email from Apps Script (before using the live form)

**Do not click Run on `doPost`** — it only works when the website POSTs data.

1. In Apps Script, open the function dropdown (top toolbar) and select **`checkSetup`**
2. Click **Run** — in **Execution log** you should see `OK: NOTIFICATION_EMAIL = your@email.com`
   - If you see `MISSING`, add the Script property (step 2b above)
3. Select **`testLeadEmail`** → **Run**
4. The first time, click **Review permissions** → choose your Google account → **Allow** (Gmail access)
5. Check inbox and **spam** for subject `New lead — The Villa Above Antibes (TEST)`
6. Open **Executions** (left sidebar) → click the run → full log should show `SUCCESS: Check inbox...`

After the script works, **Deploy → Manage deployments → Edit → New version → Deploy** so the live webhook uses the new code.

## 3. Deploy as web app

1. **Deploy → New deployment**
2. Type: **Web app**
3. **Execute as:** Me
4. **Who has access:** Anyone
5. Deploy and **authorize** when prompted
6. Copy the **Web app URL** (ends with `/exec`)

## 4. Configure the site

Add to your `.env`:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/XXXXX/exec
```

Restart the server: `npm run dev`

## 5. Test

Submit the form on the site, or run:

```bash
curl -X POST "$GOOGLE_SHEETS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"submittedAt":"2026-01-01T12:00:00Z","property":"Test","name":"Test","email":"test@example.com","phone":"","country":"","purchaseTimeline":"","language":"English (en)","message":"Test row"}'
```

A new row should appear in the sheet.

## Notes

- **Render free tier:** outbound SMTP (Gmail port 587/465) is blocked — use Apps Script email (section 2b), not Node SMTP
- Local development can still use Gmail SMTP in `.env` if you prefer
- The webhook URL is secret; do not commit it to git (keep it in `.env` only)
- You can share the sheet with your team for viewing and filtering leads
