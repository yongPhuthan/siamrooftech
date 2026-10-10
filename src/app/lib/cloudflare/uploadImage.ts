import { adminFetch } from '@/lib/admin-fetch';
import imageCompression from 'browser-image-compression';
import { getShortFileHash } from '../utils/fileHash';

export type UploadResult = {
  thumbnailUrl?: string;
  mediumUrl?: string;
  originalUrl?: string;
};

export type UploadOptions = {
  watermarkText?: string | null;
};

async function uploadFailure(response: Response, sizeLabel: string): Promise<Error> {
  const payload = await response.json().catch(() => null) as { referenceId?: unknown } | null;
  const referenceId = typeof payload?.referenceId === 'string' ? ` · รหัส ${payload.referenceId}` : '';
  return new Error(`อัปโหลดภาพ${sizeLabel}ไม่สำเร็จ (HTTP ${response.status}${referenceId})`);
}

const DEFAULT_WATERMARK_TEXT = 'LINE:@ROOFTECH';
const IMAGE_SIZE_LABELS = {
  thumbnail: 'ขนาดย่อ',
  medium: 'ขนาดกลาง',
  original: 'ต้นฉบับ',
} as const;

async function applyWatermark(file: File, watermarkText: string): Promise<File> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('text', watermarkText);

  const response = await adminFetch('/api/upload/watermark', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถใส่ลายน้ำได้');
  }

  const blob = await response.blob();
  return new File([blob], file.name, { type: blob.type || file.type });
}

export async function uploadImageToCloudflare(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const watermarkText =
    options?.watermarkText === undefined
      ? DEFAULT_WATERMARK_TEXT
      : options.watermarkText;
  const sourceFile =
    watermarkText === null ? file : await applyWatermark(file, watermarkText);

  // Generate unique ID based on file content hash + timestamp + extension
  const fileHash = await getShortFileHash(file);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const imageId = `${fileHash}-${timestamp}-${randomSuffix}-${ext}`;

  const sizes = {
    thumbnail: 300,
    medium: 800,
    original: 1800,
  };

  const result: UploadResult = {};

  for (const [label, maxSize] of Object.entries(sizes)) {
    const resized = await imageCompression(sourceFile, {
      maxWidthOrHeight: maxSize,
      useWebWorker: true,
    });

    const fileName = `${imageId}.${ext}`;

    console.log(`📤 Uploading ${label} size (${maxSize}px) for file: ${fileName}`);

    const presignRes = await adminFetch(`/api/upload/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageSize: label,
        fileName: fileName,
      }),
    });

    const sizeLabel = IMAGE_SIZE_LABELS[label as keyof typeof IMAGE_SIZE_LABELS];
    if (!presignRes.ok) throw await uploadFailure(presignRes, `${sizeLabel} `);

    const { uploadUrl, publicUrl } = await presignRes.json() as { uploadUrl: string; publicUrl: string };

    const uploadRes = await adminFetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': resized.type || sourceFile.type || file.type },
      body: resized,
    });

    if (!uploadRes.ok) throw await uploadFailure(uploadRes, `${sizeLabel} `);

    console.log(`✅ Successfully uploaded ${label}: ${publicUrl}`);

    (result as any)[`${label}Url`] = publicUrl;
  }

  console.log(`🎉 All sizes uploaded for imageId: ${imageId}`, result);
  return result;
}
