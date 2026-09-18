/* ===================================================================
   Shop Manager Online — एक ही जगह सारी सेटिंग्स
   डिलीवरी के समय सिर्फ TIER बदलना है।
   =================================================================== */

export const TIER = 'free';          // 'free' | 'paid'   ← डिलीवरी पर बदलें

const TIERS = {
  free: {
    label: 'Free',
    // Neon free: 0.5 GB storage, auto-suspend 5 min बाद (cold start ~1s)
    dbQuotaMB: 512,
    // R2 free: 10 GB storage, 1M writes/महीना — फोटो के लिए बहुत है
    storageQuotaMB: 10240,
    photoMaxPx: 240,
    photoQuality: 0.70,
    maxCustomers: 2000,              // 0.5 GB में आराम से
    maxPhotos: 5000,
    backupReminderDays: 7,           // Neon free में PITR नहीं — manual ज़रूरी
    pitrDays: 0,                     // point-in-time restore नहीं
    pollSeconds: 0                   // manual refresh (आपने यही चुना)
  },
  paid: {
    label: 'Paid',
    // Neon Launch ($19≈₹1,600) — पर हमारे size पर usage-based ₹0–800 पड़ेगा
    dbQuotaMB: 10240,
    storageQuotaMB: 102400,
    photoMaxPx: 480,
    photoQuality: 0.82,
    maxCustomers: 100000,
    maxPhotos: 100000,
    backupReminderDays: 30,          // PITR चालू हो जाएगा
    pitrDays: 7,                     // 7 दिन पीछे तक restore
    pollSeconds: 0
  }
};

export const LIMITS = TIERS[TIER];

/* ---------- connection (सब .env.local से) ---------- */
export const DB_URL      = process.env.DATABASE_URL;           // Neon
export const R2 = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKey: process.env.R2_ACCESS_KEY_ID,
  secretKey: process.env.R2_SECRET_ACCESS_KEY,
  bucket:    process.env.R2_BUCKET || 'shop-photos',
  publicUrl: process.env.R2_PUBLIC_URL || ''                    // r2.dev या custom domain
};
export const AUTH = {
  pinHash:   process.env.SHOP_PIN_HASH,                         // bcrypt hash
  jwtSecret: process.env.JWT_SECRET,
  sessionDays: 30
};

export const FEATURES = {
  customerPhoto:  true,
  cameraCapture:  true,
  whatsappRemind: true,
  offlineCache:   true,
  smsRemind:      false,
  multiUser:      false,
  gstBilling:     false
};

export function checkLimit(kind, current) {
  const max = { customers: LIMITS.maxCustomers, photos: LIMITS.maxPhotos }[kind];
  if (!max) return { ok: true, pct: 0 };
  const pct = Math.round((current / max) * 100);
  return { ok: current < max, pct, warn: pct >= 80, max, current };
}
