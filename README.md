# Salhotra Multi Store — Customer Management System

> **A modern, offline-friendly Progressive Web App (PWA) for customer accounts, credit ledger tracking, fast POS billing, and real-time store analytics.**

---

## 🌟 Key Features

- 🔐 **Secure PIN Authentication**: Fast login with bcrypt password hashing, encrypted JWT session cookies, and automated brute-force protection (lockout after 5 failed attempts).
- 👥 **Customer & Khata Ledger**:
  - Full customer directory with optional photo upload via Cloudflare R2 / local fallback.
  - Automated **FIFO (First-In, First-Out)** credit accounting.
  - Ageing summary buckets (`0-15`, `16-30`, `31-60`, `60+` days overdue).
  - One-click **WhatsApp payment reminder** integration.
- 🧾 **Point of Sale (POS) & Billing**:
  - Instant item lookup via code, name, or USB barcode scanner.
  - Flexible payment modes: Cash, UPI, Partial, or 100% Credit (Khata).
  - Real-time discount and balance calculations.
- 🏷️ **Price List & Item Catalog**:
  - Maintain selling prices, cost rates, MRP, and units (kg, litre, pcs, etc.).
- 📊 **Financial Reporting & P&L Insights**:
  - Daily & monthly Profit & Loss summaries.
  - Accurate Cost of Goods Sold (COGS) tracking with gross & net profit margins.
  - 6-month historical sales trends.
  - Top 50 most profitable items.
- 🖨️ **Print & PDF Generation**:
  - High-fidelity, print-ready format with store logo and clean layout for:
    - Customer Invoices / Bills
    - Customer Account Statements (Ledger)
    - Defaulter / Overdue Debtors List
    - Monthly P&L and Item Profit Breakdown
- 🌐 **Bilingual Support (Hindi ⇄ English)**: Instant one-click toggle for the entire UI.
- 📱 **Responsive PWA**: Install directly to the Home Screen on Android, iPhone, and Desktop without an app store.
- 🎨 **Premium UI/UX (v2)**: Light-first design with forest-green accents, icon KPI cards, a welcome dashboard,
  a redesigned sidebar, mobile bottom navigation, skeleton loaders, friendly empty states, and a full dark theme.

---

## 🛠️ Technology Stack

- **Frontend & Backend**: [Next.js 15 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech)
- **Object Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (Optional for customer avatar storage)
- **Security & Auth**: `bcryptjs` + `jose` (JWT)
- **Styling**: Native CSS Design Tokens (Dark / Light Theme support)
- **Deployment**: [Vercel](https://vercel.com) / [Netlify](https://netlify.com)

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **PostgreSQL Database**: Free serverless instance from [Neon](https://neon.tech) (copy the **Pooled Connection** string)

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/Deepak3699/Customer-Management-.git
cd Customer-Management-
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file from `.env.example`:
```bash
# Windows
copy .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

### 4. Configure `.env.local`
1. Generate your base64-encoded login PIN hash:
   ```bash
   npm run pin
   ```
   *(Enter your desired 4–6 digit PIN and copy the generated `SHOP_PIN_HASH` value).*

2. Edit your `.env.local`:
   ```env
   # Neon Postgres (use Pooled Connection string)
   DATABASE_URL=postgresql://neondb_owner:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require

   # Login Security
   SHOP_PIN_HASH=your_base64_pin_hash_here
   JWT_SECRET=your_super_secret_jwt_random_string_at_least_32_chars

   # Cloudflare R2 (Optional for customer photos - leave empty if not needed)
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET=shop-photos
   R2_PUBLIC_URL=
   ```

### 5. Initialize the Database
Create all tables, views, and indexes on Neon:
```bash
npm run db:push
```

*(Optional) Seed sample grocery items and demo customer accounts:*
```bash
npm run db:seed
```

### 6. Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser and log in with your PIN.

---

## 🎨 UI/UX (v2)

The interface was rebuilt around a small set of design tokens in `public/app.css`:

| Area | What changed |
| :--- | :--- |
| **Theme** | Light-first soft background with forest-green accents (`--acc: #12714a`). Dark mode is opt-in via the `🌓 Theme` button and is remembered in `localStorage`. |
| **Dashboard** | Welcome panel with greeting + today's date, icon KPI cards, cleaner 6-month bars with value labels, polished credit sections. |
| **Navigation** | Redesigned sidebar (brand card, grouped items, active pill, high-risk badge, store status footer, theme + logout). Sticky header with page title, subtitle, live date, alert bell and refresh. On phones: slide-in drawer **plus** a thumb-reach bottom nav. |
| **PIN login** | Split-screen sign-in — forest-green brand panel with product highlights on the left, PIN dots + keypad + security messaging on the right. Shake + haptic feedback on a wrong PIN. |
| **Components** | Restyled cards, tables (sticky headers), buttons, forms, segmented controls, modals (sticky header/footer, pop-in animation), toasts, skeletons and empty states. |
| **Responsive** | Tuned for phones, tablets and laptops — `dvh` heights, safe-area padding for iPhone, 16px inputs so iOS never zooms, tables scroll horizontally inside rounded shells. |

No data or API flows were changed — this is a presentation-layer update only.

---

## 🚀 Demo mode (no database required)

Want to click around without setting up Neon? The app ships an embedded PostgreSQL
([PGlite](https://pglite.dev)) that boots with six months of realistic sample data.

```bash
npm install
echo "DEMO_DB=1" >> .env.local
echo "JWT_SECRET=demo-secret" >> .env.local
npm run demo          # http://localhost:3000
```

Log in with any PIN whose hash you put in `SHOP_PIN_HASH` (generate one with `npm run pin`).
Data lives in memory and resets on every restart, so nothing you do here touches production.

---

## 📦 Production Deployment

### Option A: Deploy on Vercel
1. Push your code to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"** → **"Import Repository"**.
3. Add the Environment Variables from your `.env.local` (`DATABASE_URL`, `SHOP_PIN_HASH`, `JWT_SECRET`, etc.).
4. Click **Deploy**.

### Option B: Deploy on Netlify
1. Log in to [Netlify](https://app.netlify.com).
2. Click **"Add new site"** → **"Import an existing project"** → select your GitHub repository.
3. In **Site Configuration → Environment Variables**, add your `.env.local` variables.
4. Click **Deploy Site**.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Next.js local development server on port `3000` |
| `npm run build` | Builds the optimized production application |
| `npm run start` | Runs the production build server |
| `npm run pin` | Helper CLI to generate secure bcrypt base64 PIN hash |
| `npm run db:push` | Executes `schema.sql` on Neon database |
| `npm run db:seed` | Populates database with starter catalog items & demo customers |
| `npm run demo` | Runs the dev server against the embedded demo database (`DEMO_DB=1`) |

---

## 📱 Mobile App (PWA) Installation

- **Android (Chrome):** Open your live website URL → tap the **⋮ (menu)** button in the top right → select **"Install App"** or **"Add to Home screen"**.
- **iOS (Safari):** Open the website → tap the **Share** icon at the bottom → select **"Add to Home Screen"**.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
