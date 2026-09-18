export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
export async function GET() { return guard(() => db.listExpenses()); }
export async function POST(req) { const b = await req.json(); return guard(() => db.addExpense(b)); }
