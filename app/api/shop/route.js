export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
export async function GET() {
  return guard(async () => ({ shop: await db.getShop(), stats: await db.stats() }));
}
export async function PUT(req) { const b = await req.json(); return guard(() => db.updateShop(b)); }
