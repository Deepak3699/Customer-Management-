export const dynamic = 'force-dynamic';
import { verifyPin, createSession } from '@/lib/auth';
import { json } from '@/lib/api';

export async function POST(req) {
  const { pin } = await req.json();
  const ip = req.headers.get('x-forwarded-for') || 'local';
  const r = await verifyPin(pin, ip);
  if (!r.ok) return json(r, r.locked ? 429 : 401);
  await createSession();
  return json({ ok: true });
}
