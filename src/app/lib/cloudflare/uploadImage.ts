import { adminFetch } from '@/lib/admin-fetch';
import imageCompression from 'browser-image-compression';
import { getShortFileHash } from '../utils/fileHash';
import { DEFAULT_WATERMARK_TEXT, drawWatermark } from '@/features/projects/watermark';
import {
  IMAGE_VARIANT_QUALITY,
  IMAGE_VARIANTS,
  SOURCE_PREFIX,
  sourceFileName,
  variantFileName,
  type ImageVariant,
} from '@/features/projects/image-variants';

export type UploadResult = {
  thumbnailUrl?: string;
  mediumUrl?: string;
  originalUrl?: string;
};

export type UploadOptions = {
  watermarkText?: string | null;
};

async function uploadFailure(response: Response, sizeLabel: string): Promise<Error> {
  const payload = await response.json().catch(() => null) as { referenceId?: unknown; error?: unknown } | null;
  if (response.status === 403 && typeof payload?.error === 'string') return new Error(payload.error);
  const referenceId = typeof payload?.referenceId === 'string' ? ` · รหัส ${payload.referenceId}` : '';
  return new Error(`อัปโหลดภาพ${sizeLabel}ไม่สำเร็จ (HTTP ${response.status}${referenceId})`);
}

const IMAGE_SIZE_LABELS: Record<ImageVariant | typeof SOURCE_PREFIX, string> = {
  thumbnail: 'ขนาดย่อ',
  medium: 'ขนาดกลาง',
  original: 'ขนาดใหญ่',
  source: 'ต้นฉบับ',
};

async function putMedia(prefix: ImageVariant | typeof SOURCE_PREFIX, fileName: string, body: Blob): Promise<string> {
  const sizeLabel = `${IMAGE_SIZE_LABELS[prefix]} `;
  const presignRes = await adminFetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageSize: prefix, fileName }),
  });
  if (!presignRes.ok) throw await uploadFailure(presignRes, sizeLabel);
  const { uploadUrl, publicUrl } = await presignRes.json() as { uploadUrl: string; publicUrl: string };

  const uploadRes = await adminFetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': body.type }, body });
  if (!uploadRes.ok) throw await uploadFailure(uploadRes, sizeLabel);
  return publicUrl;
}

/** WebP at about 80% quality; JPEG when the browser cannot encode WebP (older Safari returns PNG instead). */
async function buildVariant(source: File, longSide: number): Promise<Blob> {
  const options = { maxWidthOrHeight: longSide, useWebWorker: true, initialQuality: IMAGE_VARIANT_QUALITY };
  const webp = await imageCompression(source, { ...options, fileType: 'image/webp' });
  if (webp.type === 'image/webp') return webp;
  return imageCompression(source, { ...options, fileType: 'image/jpeg' });
}

/**
 * Stores the raw photo privately under source/, then three watermarked variants (640/1280/1920 px).
 * Pages only ever get the variant URLs.
 */
export async function uploadImageToCloudflare(file: File, options?: UploadOptions): Promise<UploadResult> {
  const watermarkText = options?.watermarkText === undefined ? DEFAULT_WATERMARK_TEXT : options.watermarkText;
  const sourceHash = await getShortFileHash(file);

  const rawName = sourceFileName(sourceHash, file.type);
  if (rawName) await putMedia(SOURCE_PREFIX, rawName, file);

  const marked = watermarkText === null ? file : await drawWatermark(file, watermarkText);
  const result: UploadResult = {};
  for (const variant of Object.keys(IMAGE_VARIANTS) as ImageVariant[]) {
    const bytes = await buildVariant(marked, IMAGE_VARIANTS[variant]);
    result[`${variant}Url`] = await putMedia(variant, variantFileName(sourceHash, bytes.type), bytes);
  }
  return result;
}
