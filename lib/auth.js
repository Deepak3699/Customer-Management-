/* PIN login — bcrypt hash + JWT cookie.
   PIN kabhi plain store nahi hota; sirf hash .env me rehta hai. */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-secret-change-me-in-production'
);
const COOKIE = 'shop_session';
const DAYS = 30;

/* brute-force guard — ek IP se 5 galat try ke baad 15 min lock */
const attempts = new Map();
const MAX_TRIES = 5;
const LOCK_MS = 15 * 60 * 1000;

export function checkLocked(ip) {
  const a = attempts.get(ip);
  if (!a) return { locked: false };
  if (Date.now() - a.first > LOCK_MS) { attempts.delete(ip); return { locked: false }; }
  if (a.count >= MAX_TRIES) {
    return { locked: true, waitMin: Math.ceil((LOCK_MS - (Date.now() - a.first)) / 60000) };
  }
  return { locked: false, left: MAX_TRIES - a.count };
}
function noteFail(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > LOCK_MS) attempts.set(ip, { count: 1, first: Date.now() });
  else a.count++;
}
function clearFails(ip) { attempts.delete(ip); }

/* Hash ko base64 me rakhte hain.
   Kyun: bcrypt hash `$2a$10$...` se shuru hota hai, aur .env / shell / Vercel
   sab `$` ko variable samajh kar hash tod dete hain. base64 me sirf A-Za-z0-9+/=
   hota hai, isliye kahin nahi tootta. Purana plain hash bhi chalta rahega. */
function readHash() {
  const raw = (process.env.SHOP_PIN_HASH || '').trim().replace(/^['"]|['"]$/g, '');
  if (!raw) return null;
  if (raw.startsWith('$2')) return raw;                 // plain bcrypt (agar theek aa gaya)
  try {                                                  // base64
    const d = Buffer.from(raw, 'base64').toString('utf8');
    if (d.startsWith('$2')) return d;
  } catch {}
  return null;
}

export async function verifyPin(pin, ip = 'local') {
  const lock = checkLocked(ip);
  if (lock.locked) return { ok: false, locked: true, waitMin: lock.waitMin };

  const hash = readHash();
  if (!hash) return { ok: false, error: 'PIN_NOT_SET' };

  const ok = await bcrypt.compare(String(pin), hash);
  if (!ok) { noteFail(ip); const l = checkLocked(ip); return { ok: false, left: l.left ?? 0 }; }
  clearFails(ip);
  return { ok: true };
}

export async function createSession() {
  const token = await new SignJWT({ shop: 1 })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(SECRET);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: DAYS * 86400, path: '/'
  });
  return token;
}

export async function getSession() {
  const c = (await cookies()).get(COOKIE);
  if (!c) return null;
  try { const { payload } = await jwtVerify(c.value, SECRET); return payload; }
  catch { return null; }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function requireAuth() {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHORIZED');
  return s;
}

export function hashPin(pin) { return bcrypt.hashSync(String(pin), 10); }
export function hashPinB64(pin) {
  return Buffer.from(bcrypt.hashSync(String(pin), 10), 'utf8').toString('base64');
}
export { readHash };
