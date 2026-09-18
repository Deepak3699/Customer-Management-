export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
export async function PUT(req, { params }) {
  const { id } = await params; const b = await req.json();
  return guard(() => db.updateItem(id, b));
}
export async function DELETE(req, { params }) {
  const { id } = await params;
  return guard(() => db.deleteItem(id));
}
