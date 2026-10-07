import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return unauthorizedResponse();
  const { imageSize, fileName } = await req.json().catch(() => ({})) as { imageSize?: unknown; fileName?: unknown };

  if (!['thumbnail', 'medium', 'original'].includes(String(imageSize)) || typeof fileName !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(fileName) || fileName.includes('..')) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const { MEDIA_BUCKET } = await getCmsRuntimeEnv();
    if (!MEDIA_BUCKET) return NextResponse.json({ error: 'Media storage is unavailable' }, { status: 503 });
    const objectPath = `${imageSize}/${fileName}`;
    return NextResponse.json({ uploadUrl: `/api/upload/objects/${objectPath}`, publicUrl: `/media/${objectPath}`, objectPath }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Media upload setup failed', error);
    return NextResponse.json({ error: 'Media storage is unavailable' }, { status: 503 });
  }
}
