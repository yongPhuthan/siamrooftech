import { NextResponse } from 'next/server';

/**
 * Production is the only home for media: project photos, article covers and videos are uploaded on production only.
 * Local and staging read production's image URLs and never write to their own bucket, so nothing piles up there.
 */
export const MEDIA_UPLOADS_PRODUCTION_ONLY_MESSAGE = 'อัปโหลดรูปและวิดีโอได้ที่ production เท่านั้น (https://www.siamrooftech.com/admin)';

export function mediaUploadsAllowed(): boolean {
  return process.env.DEPLOY_ENV === 'production';
}

export function mediaUploadsBlockedResponse() {
  return NextResponse.json({ error: MEDIA_UPLOADS_PRODUCTION_ONLY_MESSAGE }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
}
