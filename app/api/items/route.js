export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
export async function GET(req) {
  const u = new URL(req.url);
  if (u.searchParams.get('nextCode')) return guard(async () => ({ code: await db.nextItemCode() }));
  return guard(() => db.listItems(u.searchParams.get('q') || ''));
}
export async function POST(req) {
  const b = await req.json();
  return guard(() => db.addItem(b));
}
