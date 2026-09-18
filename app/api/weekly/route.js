export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
export async function GET() { return guard(() => db.weeklyReport()); }
