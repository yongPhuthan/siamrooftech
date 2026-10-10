import { NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';

const MAX_IMAGE_BYTES = 35 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

async function readFixedSizeBody(body: ReadableStream<Uint8Array>, expectedSize: number): Promise<Uint8Array | null> {
  const reader = body.getReader();
  const bytes = new Uint8Array(expectedSize);
  let offset = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (offset + value.byteLength > expectedSize) {
        await reader.cancel('Image body exceeds Content-Length');
        return null;
      }
      bytes.set(value, offset);
      offset += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  return offset === expectedSize ? bytes : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const { key: parts } = await params;
  const key = parts.join('/');
  const [variant, filename] = parts;
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
  const contentLength = request.headers.get('content-length');
  const size = contentLength === null ? Number.NaN : Number(contentLength);
  if (!['thumbnail', 'medium', 'original'].includes(variant) || !filename || filename.includes('..') || !ALLOWED_IMAGE_TYPES.has(contentType) || !request.body || !Number.isSafeInteger(size) || size < 1 || size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Invalid image upload' }, { status: 400 });
  }

  // OpenNext can expose a chunked request stream to the R2 binding. Buffer
  // the validated, bounded payload so R2 receives a fixed-length value.
  const image = await readFixedSizeBody(request.body, size).catch(() => null);
  if (!image) return NextResponse.json({ error: 'Invalid image upload' }, { status: 400 });

  try {
    const { MEDIA_BUCKET } = await getCmsRuntimeEnv();
    await MEDIA_BUCKET.put(key, image, { httpMetadata: { contentType }, customMetadata: { uploadedAt: new Date().toISOString() } });
    return NextResponse.json({ success: true, objectPath: key, publicUrl: `/media/${key}` }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const referenceId = crypto.randomUUID();
    const reason = error instanceof Error ? { name: error.name, message: error.message } : { name: 'UnknownError' };
    console.error(JSON.stringify({ event: 'image_upload_failed', referenceId, variant, ...reason }));
    return NextResponse.json({ error: 'Image upload failed', referenceId }, { status: 503 });
  }
}
