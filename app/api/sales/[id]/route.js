export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
export async function GET(req, { params }) {
  const { id } = await params;
  return guard(() => db.getSale(id));
}
export async function DELETE(req, { params }) {
  const { id } = await params;
  return guard(() => db.voidSale(id));
}
