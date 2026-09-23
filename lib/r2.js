/* Cloudflare R2 — customer photos.
   Free tier: 10 GB storage, 1M writes/month. Free egress.

   Flow: resize in browser -> send to server -> upload to R2 -> store key in DB.
   Private bucket access via short-lived signed URLs (1 hour). */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.R2_BUCKET || 'shop-photos';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';   // if bucket has public URL

let _client = null;
export function r2() {
  if (_client) return _client;
  if (!process.env.R2_ACCOUNT_ID) return null;        // R2 not configured — photos disabled
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
  return _client;
}

export const r2Ready = () => !!process.env.R2_ACCOUNT_ID;

/* dataURL (resized from browser) -> R2 */
export async function uploadPhoto(shopId, customerId, dataUrl) {
  const c = r2();
  if (!c) throw new Error('R2_NOT_CONFIGURED');
  const m = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('BAD_DATAURL');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 500 * 1024) throw new Error('TOO_BIG');   // should not exceed limit after resize

  const key = `${shopId}/${customerId}-${Date.now()}.jpg`;
  await c.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buf,
    ContentType: m[1], CacheControl: 'public, max-age=31536000'
  }));
  return key;
}

export async function deletePhoto(key) {
  const c = r2();
  if (!c || !key) return;
  try { await c.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })); } catch {}
}

/* Get photo URL */
export async function photoUrl(key) {
  if (!key) return null;
  if (PUBLIC_URL) return `${PUBLIC_URL}/${key}`;            // public bucket / custom domain
  const c = r2();
  if (!c) return null;
  return getSignedUrl(c, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
}

/* Add photo URLs for a list of rows */
export async function addPhotoUrls(rows) {
  if (!r2Ready()) return rows.map(r => ({ ...r, photo_url: null }));
  return Promise.all(rows.map(async r => ({
    ...r, photo_url: r.photo_key ? await photoUrl(r.photo_key) : null
  })));
}
