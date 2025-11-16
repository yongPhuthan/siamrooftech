/**
 * Cloudflare Video Upload Utility
 *
 * Handles video uploads to Cloudflare with progress tracking,
 * thumbnail generation, and validation.
 */

export interface VideoUploadResult {
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize: number;
  mimeType: string;
  success: boolean;
  error?: string;
}

export interface VideoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Supported video formats
const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // MOV
  'video/x-msvideo', // AVI
];

// Max file size: 100MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

/**
 * Validate video file before upload
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `ไฟล์วีดีโอไม่ถูกต้อง รองรับเฉพาะ: MP4, WebM, MOV`,
    };
  }

  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_VIDEO_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `ไฟล์วีดีโอใหญ่เกินไป (${sizeMB}MB) ขนาดสูงสุด: ${maxMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Extract video duration using HTML5 Video API
 */
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error('ไม่สามารถอ่านข้อมูลวีดีโอได้'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Generate video thumbnail using canvas
 */
export async function generateVideoThumbnail(file: File, seekTime = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      reject(new Error('ไม่สามารถสร้าง canvas context ได้'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(seekTime, video.duration);
    };

    video.onseeked = () => {
      // Set canvas size to video dimensions (max 1280px width)
      const maxWidth = 1280;
      const ratio = video.videoWidth / video.videoHeight;
      canvas.width = Math.min(maxWidth, video.videoWidth);
      canvas.height = canvas.width / ratio;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          } else {
            reject(new Error('ไม่สามารถสร้าง thumbnail ได้'));
          }
        },
        'image/jpeg',
        0.85
      );

      window.URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('ไม่สามารถโหลดวีดีโอได้'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Upload video to Cloudflare with progress tracking
 *
 * Note: This is a placeholder implementation. You need to configure
 * Cloudflare Stream API credentials in your environment variables.
 */
export async function uploadVideoToCloudflare(
  file: File,
  onProgress?: (progress: VideoUploadProgress) => void
): Promise<VideoUploadResult> {
  // Validate file first
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    return {
      videoUrl: '',
      fileSize: file.size,
      mimeType: file.type,
      success: false,
      error: validation.error,
    };
  }

  try {
    // Extract video metadata
    const duration = await getVideoDuration(file);
    const thumbnailDataUrl = await generateVideoThumbnail(file);

    // Convert thumbnail data URL to blob for upload
    const thumbnailBlob = await fetch(thumbnailDataUrl).then(res => res.blob());

    // Create FormData for video upload
    const formData = new FormData();
    formData.append('video', file);
    formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');

    // Upload to Cloudflare (or your backend API)
    // TODO: Replace with actual Cloudflare Stream API endpoint
    const response = await fetch('/api/upload/video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      videoUrl: result.videoUrl || URL.createObjectURL(file), // Fallback to local URL for demo
      thumbnailUrl: result.thumbnailUrl || thumbnailDataUrl,
      duration,
      fileSize: file.size,
      mimeType: file.type,
      success: true,
    };
  } catch (error) {
    console.error('Video upload error:', error);
    return {
      videoUrl: '',
      fileSize: file.size,
      mimeType: file.type,
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดวีดีโอ',
    };
  }
}

/**
 * Format video duration (seconds) to human-readable string
 * Example: 125 seconds → "2:05"
 */
export function formatVideoDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size to human-readable string
 * Example: 52428800 bytes → "50 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
