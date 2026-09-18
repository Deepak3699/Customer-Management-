export const dynamic = 'force-dynamic';
import { guard } from '@/lib/api';
import * as db from '@/lib/db';
import { addPhotoUrls, uploadPhoto } from '@/lib/r2';
import { SHOP_ID } from '@/lib/db';

export async function GET(req) {
  const q = new URL(req.url).searchParams.get('q') || '';
  return guard(async () => addPhotoUrls(await db.listCustomers(q)));
}
export async function POST(req) {
  const body = await req.json();
  return guard(async () => {
    const { photo, ...rest } = body;
    const c = await db.addCustomer(rest);
    if (photo) {
      const key = await uploadPhoto(SHOP_ID, c.id, photo);
      return db.updateCustomer(c.id, { photo_key: key });
    }
    return c;
  });
}
