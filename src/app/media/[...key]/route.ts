import { NextResponse } from 'next/server';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.join('/');
  if (!key || parts.some((part) => part === '.' || part === '..')) return new NextResponse(null, { status: 404 });
  try {
    const { MEDIA_BUCKET } = await getCmsRuntimeEnv();
    const object = await MEDIA_BUCKET.get(key);
    if (!object) return new NextResponse(null, { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('x-content-type-options', 'nosniff');
    return new NextResponse(object.body, { headers });
  } catch (error) {
    console.error('Media read failed', error);
    return new NextResponse(null, { status: 503 });
  }
}
