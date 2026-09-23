# Shop Manager Online — Setup Guide

**Stack:** Next.js (PWA) + Neon Postgres + Cloudflare R2 + Vercel
**Hosting Cost:** $0/month (all on free tiers)

---

## 1. Neon Database (5 mins)

1. [neon.tech](https://neon.tech) → Sign up with GitHub → **New Project**
2. Name: `shop-manager`, Region: **Singapore** (or closest to your location)
3. Copy the **"Pooled connection"** string:
   ```
   postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   > ⚠ Use the pooled connection URL to prevent serverless connection exhaustion.

**Free Tier Includes:** 0.5 GB storage, 190 compute-hours/month — plenty for regular usage.

---

## 2. Cloudflare R2 (For Customer Photos — 5 mins)

> If photos are not needed, skip this step. The app will show initials as avatars.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → Create bucket
2. Name: `shop-photos`, Location: **APAC**
3. **Manage R2 API Tokens** → Create → *Object Read & Write* → Note these 3 values:
   - Account ID
   - Access Key ID
   - Secret Access Key

**Free Tier Includes:** 10 GB storage, 1M writes/month, free downloads.

---

## 3. Run Locally

```bash
cd shop-online
npm install

cp .env.example .env.local     # Fill in .env.local

npm run pin                    # Generate PIN → paste output in .env.local
npm run db:push                # Create tables on Neon
npm run dev                    # http://localhost:3000
```

### `.env.local` Example
```env
DATABASE_URL=postgresql://...-pooler...neon.tech/neondb?sslmode=require
SHOP_PIN_HASH=JDJhJDEwJDlCYVUyWUhNLkZwTEJhelh...
JWT_SECRET=your-random-32-char-secret-key-here
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=xyz
R2_SECRET_ACCESS_KEY=secret
R2_BUCKET=shop-photos
```

> **Why base64 for PIN hash?** The bcrypt hash `$2a$10$...` contains `$` characters which shells and env parsers often interpolate as variables. Encoding in base64 prevents parsing bugs.

---

## 4. Deploy Live on Vercel (5 mins)

```bash
git init && git add . && git commit -m "shop manager"
# Push to GitHub repository
```

1. [vercel.com](https://vercel.com) → **Import Git Repository**
2. In **Environment Variables**, add all keys from `.env.local`
3. Click **Deploy** → Live in 2 minutes: `https://your-app.vercel.app`

---

## 5. Install as Mobile Web App (PWA)

**Android (Chrome):** Open website → ⋮ Menu → **Add to Home screen**
**iPhone (Safari):** Open website → Share → **Add to Home Screen**

---

## 6. Keep Neon Compute Warm

Neon free compute suspends after 5 minutes of inactivity (causing ~1s cold start on first request).
Optionally use a free service like [cron-job.org](https://cron-job.org) to ping `https://your-app.vercel.app/api/weekly` every 10 minutes.

---

## Upgrading Tier — Free to Paid

Change one line in `config.js`:

```js
export const TIER = 'free';   →   export const TIER = 'paid';
```

| Setting | Free | Paid |
|---|---|---|
| Photo Quality | 240px | **480px** |
| Customer Limit | 2,000 | 100,000 |
| DB Quota | 0.5 GB | 10 GB |
| Backup Reminder | 7 days | 30 days |
| Point-in-time Restore | ❌ | ✅ 7 days |

---

## Project Files

```
config.js              ← Tier & limits configuration
db/schema.sql          ← 7 tables, 4 views, FIFO functions
lib/db.js              ← Database queries
lib/auth.js            ← PIN + JWT + rate limit protection
lib/r2.js              ← Photo upload/delete/signed URL
lib/i18n.js            ← English translation mapping
app/Shell.js           ← Main UI & screens
app/login/page.js      ← PIN keypad login
app/api/*              ← Backend API routes
scripts/make-pin.mjs   ← PIN hash generator
scripts/seed.mjs       ← Sample data seed script
```
