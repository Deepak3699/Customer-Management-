export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
import { addPhotoUrls } from '@/lib/r2';
export async function GET() {
  return guard(async () => {
    const d = await db.dashboard();
    const [l6, ag] = await Promise.all([db.last6Months(), db.ageingSummary()]);
    d.topDebtors = await addPhotoUrls(d.topDebtors);
    d.oldest = await addPhotoUrls(d.oldest);
    return { ...d, last6: l6, ageing: ag, pl: await db.monthlyPL(new Date().toISOString().slice(0, 7)) };
  });
}
