/**
 * The image standard (cloudflare-image-workflow): a private raw original plus three watermarked WebP variants.
 * The variant folders keep the schema's names: small_size = thumbnail (640), medium_size = medium (1280),
 * original_size = original (1920). The three variants share one name: the source photo's hash, then a hash of the
 * largest variant's bytes. A file never changes under its name, and a rebuilt photo gets a new one.
 */
export const IMAGE_VARIANTS = { thumbnail: 640, medium: 1280, original: 1920 } as const;
export type ImageVariant = keyof typeof IMAGE_VARIANTS;

export const IMAGE_VARIANT_QUALITY = 0.8;

/** Folder for raw originals. Never linked from pages; a Cloudflare security rule blocks it on the assets host. */
export const SOURCE_PREFIX = 'source';

export const UPLOAD_PREFIXES = [...(Object.keys(IMAGE_VARIANTS) as ImageVariant[]), SOURCE_PREFIX] as const;

const SOURCE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

/** Public origin of the media bucket (R2 custom domain, cached at the edge). */
export const MEDIA_ORIGIN = 'https://assets.siamrooftech.com';

export function mediaPublicUrl(key: string): string {
  return `${MEDIA_ORIGIN}/${key}`;
}

export function variantFileName(sourceHash: string, largestVariantHash: string, contentType: string): string {
  const ext = contentType === 'image/webp' ? 'webp' : 'jpg';
  return `${sourceHash}-${largestVariantHash.slice(0, 8)}.${ext}`;
}

/** The raw original's name, or null when the route cannot store that type (for example HEIC). */
export function sourceFileName(sourceHash: string, contentType: string): string | null {
  const ext = SOURCE_TYPES[contentType];
  return ext ? `${sourceHash}.${ext}` : null;
}

export function isPrivateMediaKey(key: string): boolean {
  return key === SOURCE_PREFIX || key.startsWith(`${SOURCE_PREFIX}/`);
}
