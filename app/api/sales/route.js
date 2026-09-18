export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
export async function GET(req) {
  const u = new URL(req.url).searchParams;
  const to = u.get('to') || new Date().toISOString().slice(0, 10);
  const from = u.get('from') || to;
  return guard(() => db.listSales(from, to, u.get('q') || ''));
}
export async function POST(req) {
  const b = await req.json();
  return guard(() => db.createSale(b));
}
