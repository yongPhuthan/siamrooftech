import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const VIDEO_EXTENSIONS: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };

export async function POST(request: Request) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  try {
    const formData = await request.formData();
    const video = formData.get('video');
    const thumbnail = formData.get('thumbnail');
    if (!(video instanceof File) || !video.size) return NextResponse.json({ error: 'Invalid video file' }, { status: 400 });
    const extension = VIDEO_EXTENSIONS[video.type];
    if (!extension || video.size > MAX_VIDEO_BYTES) return NextResponse.json({ error: 'Unsupported video format or file too large' }, { status: 400 });
    if (thumbnail !== null && (!(thumbnail instanceof File) || thumbnail.type !== 'image/jpeg' || thumbnail.size > MAX_THUMBNAIL_BYTES)) return NextResponse.json({ error: 'Invalid thumbnail' }, { status: 400 });

    const { MEDIA_BUCKET } = await getCmsRuntimeEnv();
    const id = randomUUID();
    const videoKey = `videos/${id}.${extension}`;
    await MEDIA_BUCKET.put(videoKey, video.stream(), { httpMetadata: { contentType: video.type }, customMetadata: { originalName: video.name.slice(0, 180) } });
    let thumbnailUrl: string | undefined;
    if (thumbnail instanceof File) {
      const thumbnailKey = `videos/thumbnails/${id}.jpg`;
      await MEDIA_BUCKET.put(thumbnailKey, thumbnail.stream(), { httpMetadata: { contentType: thumbnail.type } });
      thumbnailUrl = `/media/${thumbnailKey}`;
    }
    return NextResponse.json({ success: true, videoUrl: `/media/${videoKey}`, thumbnailUrl, fileSize: video.size, mimeType: video.type }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Video upload failed', error);
    return NextResponse.json({ error: 'Video upload failed' }, { status: 503 });
  }
}
