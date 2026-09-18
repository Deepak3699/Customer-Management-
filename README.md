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

---

## 📱 Mobile App (PWA) Installation

- **Android (Chrome):** Open your live website URL → tap the **⋮ (menu)** button in the top right → select **"Install App"** or **"Add to Home screen"**.
- **iOS (Safari):** Open the website → tap the **Share** icon at the bottom → select **"Add to Home Screen"**.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
