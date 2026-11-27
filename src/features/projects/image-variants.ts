/**
 * The image standard (cloudflare-image-workflow): a private raw original plus three watermarked WebP variants.
 * The variant folders keep the schema's names: small_size = thumbnail (640), medium_size = medium (1280),
 * original_size = original (1920). Names hold the source hash and a settings version, so a file never changes
 * under its name and can be cached for a long time.
 */
export const IMAGE_VARIANTS = { thumbnail: 640, medium: 1280, original: 1920 } as const;
export type ImageVariant = keyof typeof IMAGE_VARIANTS;

export const IMAGE_VARIANT_QUALITY = 0.8;
export const IMAGE_SETTINGS_VERSION = 'v2';

/** Folder for raw originals. Never linked from pages; reads are refused by the media route. */
export const SOURCE_PREFIX = 'source';

export const UPLOAD_PREFIXES = [...(Object.keys(IMAGE_VARIANTS) as ImageVariant[]), SOURCE_PREFIX] as const;

const SOURCE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

export function variantFileName(sourceHash: string, contentType: string): string {
  const ext = contentType === 'image/webp' ? 'webp' : 'jpg';
  return `${sourceHash}-${IMAGE_SETTINGS_VERSION}.${ext}`;
}

/** The raw original's name, or null when the route cannot store that type (for example HEIC). */
export function sourceFileName(sourceHash: string, contentType: string): string | null {
  const ext = SOURCE_TYPES[contentType];
  return ext ? `${sourceHash}.${ext}` : null;
}

export function isPrivateMediaKey(key: string): boolean {
  return key === SOURCE_PREFIX || key.startsWith(`${SOURCE_PREFIX}/`);
}
