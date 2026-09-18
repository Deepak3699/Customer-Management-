/* API helpers — har route me auth check + error handling */
import { NextResponse } from 'next/server';
import { getSession } from './auth';

export async function guard(fn) {
  try {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    const data = await fn(s);
    return NextResponse.json(data ?? { ok: true });
  } catch (e) {
    const code = e.message || 'ERROR';
    const status = ['DUP_CODE', 'DUP_BARCODE', 'NO_ITEMS', 'BAD_DATAURL', 'TOO_BIG'].includes(code) ? 400 : 500;
    if (status === 500) console.error('[api]', e);
    return NextResponse.json({ error: code }, { status });
  }
}
export const json = (d, s = 200) => NextResponse.json(d, { status: s });
