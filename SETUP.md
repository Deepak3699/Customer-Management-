# Shop Manager Online — सेटअप गाइड

**Stack:** Next.js (PWA) + Neon Postgres + Cloudflare R2 + Vercel
**खर्च अभी:** ₹0/महीना (सब free tier पर)

---

## 1. Neon Database (5 मिनट)

1. [neon.tech](https://neon.tech) → GitHub से Sign up → **New Project**
2. नाम: `shop-manager`, Region: **Singapore** (भारत के सबसे पास)
3. बनते ही connection string दिखेगी — **"Pooled connection"** वाली copy करें:
   ```
   postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   > ⚠ Pooled वाली ही लें, नहीं तो serverless पर connection खत्म हो जाएँगे।

**Free में मिलता है:** 0.5 GB storage, 190 compute-hours/महीना — एक दुकान के लिए सालों काफ़ी।

---

## 2. Cloudflare R2 (फोटो के लिए — 5 मिनट)

> फोटो नहीं चाहिए तो यह step छोड़ दें। बाकी सब चलेगा, बस avatar में नाम के अक्षर दिखेंगे।

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → Create bucket
2. नाम: `shop-photos`, Location: **APAC**
3. **Manage R2 API Tokens** → Create → *Object Read & Write* → ये 3 चीज़ें नोट करें:
   - Account ID
   - Access Key ID
   - Secret Access Key

**Free में:** 10 GB storage, 1M writes/महीना। Download बिल्कुल free (S3 से बड़ा फ़ायदा)।

---

## 3. Local पर चलाएँ

```bash
cd shop-online
npm install

cp .env.example .env.local     # फिर .env.local भरें

npm run pin                    # PIN बनाएँ → जो line मिले वो .env.local में डालें
npm run db:push                # Neon पर tables बनाएँ
npm run dev                    # http://localhost:3000
```

### `.env.local` कैसा दिखेगा
```env
DATABASE_URL=postgresql://...-pooler...neon.tech/neondb?sslmode=require
SHOP_PIN_HASH=JDJhJDEwJDlCYVUyWUhNLkZwTEJhelh...
JWT_SECRET=koi-bhi-lamba-random-text-32-char-se-zyada
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=xyz
R2_SECRET_ACCESS_KEY=secret
R2_BUCKET=shop-photos
```

> **PIN hash base64 में क्यों?** bcrypt hash `$2a$10$...` से शुरू होता है, और `.env` / shell / Vercel सब `$` को variable समझकर hash तोड़ देते हैं। base64 में सिर्फ़ अक्षर-अंक होते हैं — कहीं नहीं टूटता। (यह bug testing में पकड़ा गया था।)

---

## 4. Vercel पर Live करें (5 मिनट)

```bash
git init && git add . && git commit -m "shop manager"
# GitHub पर repo बनाकर push करें
```

1. [vercel.com](https://vercel.com) → **Import Git Repository**
2. **Environment Variables** में `.env.local` वाली सारी lines डालें
   (वहाँ quotes की ज़रूरत नहीं — सीधा value paste करें)
3. **Deploy** → 2 मिनट में live: `https://aapka-naam.vercel.app`

---

## 5. मोबाइल पर App की तरह लगाएँ

**Android (Chrome):** साइट खोलें → ⋮ मेन्यू → **Add to Home screen**
**iPhone (Safari):** साइट खोलें → Share → **Add to Home Screen**

अब होम स्क्रीन पर icon आ जाएगा — address bar के बिना, पूरी app जैसी।

---

## 6. ज़रूरी: Neon को सोने से बचाएँ

Neon का free compute **5 मिनट बाद suspend** हो जाता है। उसके बाद पहली request में ~1 सेकंड लगता है (cold start)। रोज़ इस्तेमाल पर कोई दिक़्क़त नहीं।

चाहें तो [cron-job.org](https://cron-job.org) (free) से हर 10 मिनट `https://aapki-site.vercel.app/api/weekly` hit करवा दें — तब हमेशा गरम रहेगा।

---

## डिलीवरी के दिन — Free से Paid

`config.js` में **एक line** बदलनी है:

```js
export const TIER = 'free';   →   export const TIER = 'paid';
```

इससे अपने आप बदल जाएगा:

| सेटिंग | Free | Paid |
|---|---|---|
| फोटो क्वालिटी | 240px | **480px** |
| ग्राहक limit | 2,000 | 1,00,000 |
| DB quota | 0.5 GB | 10 GB |
| बैकअप रिमाइंडर | 7 दिन | 30 दिन |
| Point-in-time restore | ❌ | ✅ 7 दिन |

फिर Neon Console → **Launch plan** ($19 ≈ ₹1,600, पर usage-based होने से आपके size पर **₹0–800** ही आएगा)।

R2 और Vercel free ही रहेंगे।

---

## क्या-क्या टेस्ट हो चुका है

असली Postgres (PGlite) पर **40 टेस्ट पास**:

- आपका वाला केस: ₹500 उधार → ₹100 payment → **balance ₹400** ✓ (bill.due 500 ही रहता है)
- कई बिल पर FIFO — पुराने बिल पहले चुकते हैं ✓
- ज़्यादा payment → advance (negative balance) ✓
- Opening balance ✓ · Partial bill ✓ · Bill void ✓
- Duplicate item code **DB level पर** रुकता है ✓
- Ageing buckets (0-15/16-30/31-60/60+) ✓
- P&L, 6-महीने trend, item-wise profit ✓
- Auth: PIN, JWT cookie, 5 गलत कोशिशों पर 15 मिनट lock ✓
- बिना login हर API 401 देती है ✓

**टेस्टिंग में पकड़े गए 4 असली bugs (ठीक कर दिए):**
1. PIN hash `.env` में `$` की वजह से टूट रहा था → base64 में रखा
2. SQL splitter Hindi comments के `;` पर statement तोड़ रहा था
3. `neon()` build time पर connect करने की कोशिश → lazy connection
4. `ym + '-31'` सितंबर/फ़रवरी में crash → महीने की लंबाई SQL से

---

## फ़ाइलें

```
config.js              ← TIER + सारी limits (डिलीवरी पर सिर्फ़ यही बदलेगी)
db/schema.sql          ← 7 tables, 4 views, FIFO function
lib/db.js              ← सारी queries
lib/auth.js            ← PIN + JWT + brute-force guard
lib/r2.js              ← फोटो upload/delete/signed URL
lib/i18n.js            ← हिंदी ⇄ English
app/Shell.js           ← पूरा UI (9 screens)
app/login/page.js      ← PIN keypad
app/api/*              ← 15 API routes
scripts/make-pin.mjs   ← PIN hash generator
scripts/setup-db.mjs   ← schema Neon पर चलाता है
```

---

## एक बात साफ़ कर दूँ — PIN की सुरक्षा

आपने PIN चुना था, वही बनाया है। पर ईमानदारी से:

- PIN **एक ही** है — staff और आप में फ़र्क़ नहीं
- कोई URL जान ले और PIN अंदाज़ लगा ले (जैसे 1234) तो पूरा डेटा खुल जाएगा
- मैंने बचाव डाले हैं: bcrypt hash, httpOnly cookie, **5 गलत कोशिशों पर 15 मिनट lock**

**सलाह:** 6 अंक का PIN रखें, जन्मतिथि/1234 जैसा नहीं। आगे staff जोड़ें तो मोबाइल OTP या Google login लगा देंगे — `config.js` में `multiUser` पहले से रखा है।
