import imageCompression from 'browser-image-compression';
import { getShortFileHash } from '../utils/fileHash';

export type UploadResult = {
  thumbnailUrl?: string;
  mediumUrl?: string;
  originalUrl?: string;
};

export async function uploadImageToCloudflare(
  file: File
): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
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
    const resized = await imageCompression(file, {
      maxWidthOrHeight: maxSize,
      useWebWorker: true,
    });

    // Each size gets uploaded to its own size folder with same ID
    const fileName = `${imageId}.${ext}`;

    console.log(`📤 Uploading ${label} size (${maxSize}px) for file: ${fileName}`);

    const presignRes = await fetch(`/api/upload/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageSize: label,
        fileName: fileName,
      }),
    });

    if (!presignRes.ok) throw new Error('Failed to get presigned URL');

    const { presignedUrl, objectPath } = await presignRes.json();

    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': `image/${ext}` },
      body: resized,
    });

    if (!uploadRes.ok) throw new Error('Upload to Cloudflare failed');

    const publicUrl = `${process.env.NEXT_PUBLIC_CF_PUBLIC_URL}/${objectPath}`;
    
    console.log(`✅ Successfully uploaded ${label}: ${publicUrl}`);

    // บันทึก URL สำหรับขนาดต่างๆ
    (result as any)[`${label}Url`] = publicUrl;
  }

  console.log(`🎉 All sizes uploaded for imageId: ${imageId}`, result);
  return result;
}
