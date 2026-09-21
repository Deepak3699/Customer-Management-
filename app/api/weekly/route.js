export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
import { addPhotoUrls } from '@/lib/r2';

export async function GET() {
  return guard(async () => {
    const rep = await db.weeklyReport();
    return {
      ...rep,
      highRisk: await addPhotoUrls(rep.highRisk || []),
      medRisk: await addPhotoUrls(rep.medRisk || []),
      lowRisk: await addPhotoUrls(rep.lowRisk || []),
      overdue: await addPhotoUrls(rep.overdue || []),
      big: await addPhotoUrls(rep.big || [])
    };
  });
}
