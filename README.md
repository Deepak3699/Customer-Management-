# Shop Manager Online

ग्राहक उधार खाता — Next.js PWA + Neon Postgres + Cloudflare R2

**शुरू करने के लिए:** [SETUP.md](./SETUP.md) पढ़ें

```bash
npm install
cp .env.example .env.local   # भरें
npm run pin                  # PIN बनाएँ
npm run db:push              # tables बनाएँ
npm run dev
```

## Features
- PIN login (bcrypt + JWT, brute-force guard)
- ग्राहक + फोटो (गैलरी/कैमरा, R2 पर)
- उधार खाता — FIFO, ageing, WhatsApp रिमाइंडर
- बिलिंग (नकद/UPI/उधार/आंशिक)
- रेट लिस्ट (कोई stock tracking नहीं)
- P&L, item-wise profit, 6-महीने trend
- PDF: बिल, उधार सूची, statement, P&L
- हिंदी ⇄ English
- मोबाइल responsive + PWA
