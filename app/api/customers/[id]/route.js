export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
import { uploadPhoto, deletePhoto, photoUrl } from '@/lib/r2';
import { SHOP_ID } from '@/lib/db';

export async function GET(req, { params }) {
  const { id } = await params;
  return guard(async () => {
    const c = await db.getCustomer(id);
    if (!c) throw new Error('NOT_FOUND');
    return {
      ...c,
      photo_url: c.photo_key ? await photoUrl(c.photo_key) : null,
      ledger: await db.customerLedger(id),
      bills: await db.billOutstanding(id)
    };
  });
}
export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  return guard(async () => {
    const { photo, removePhoto, ...rest } = body;
    const old = await db.getCustomer(id);
    if (photo) {
      if (old?.photo_key) await deletePhoto(old.photo_key);
      rest.photo_key = await uploadPhoto(SHOP_ID, id, photo);
    } else if (removePhoto) {
      if (old?.photo_key) await deletePhoto(old.photo_key);
      rest.photo_key = null;
    }
    return db.updateCustomer(id, rest);
  });
}
export async function DELETE(req, { params }) {
  const { id } = await params;
  return guard(async () => {
    const c = await db.getCustomer(id);
    if (c?.photo_key) await deletePhoto(c.photo_key);
    await db.deleteCustomer(id);
  });
}
