import { NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';

const MAX_IMAGE_BYTES = 35 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export async function PUT(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const { key: parts } = await params;
  const key = parts.join('/');
  const [variant, filename] = parts;
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
  const size = Number(request.headers.get('content-length') || 0);
  if (!['thumbnail', 'medium', 'original'].includes(variant) || !filename || filename.includes('..') || !ALLOWED_IMAGE_TYPES.has(contentType) || !request.body || size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Invalid image upload' }, { status: 400 });
  }
  try {
    const { MEDIA_BUCKET } = await getCmsRuntimeEnv();
    await MEDIA_BUCKET.put(key, request.body, { httpMetadata: { contentType }, customMetadata: { uploadedAt: new Date().toISOString() } });
    return NextResponse.json({ success: true, objectPath: key, publicUrl: `/media/${key}` }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Image upload failed', error);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 503 });
  }
}
