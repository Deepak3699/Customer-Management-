export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
export async function GET(req) {
  const u = new URL(req.url).searchParams;
  const ym = u.get('ym') || new Date().toISOString().slice(0, 7);
  return guard(async () => ({
    pl: await db.monthlyPL(ym),
    last6: await db.last6Months(),
    items: await db.itemProfitMonth(ym),
    ageing: await db.ageingSummary(),
    debtors: await db.listCustomers()
  }));
}
