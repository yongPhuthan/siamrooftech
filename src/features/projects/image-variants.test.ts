import { describe, expect, it } from 'vitest';
import { IMAGE_VARIANTS, mediaPublicUrl, sourceFileName, UPLOAD_PREFIXES, variantFileName } from './image-variants';

describe('image variants', () => {
  it('uses the 640/1280/1920 standard in the schema folders', () => {
    expect(IMAGE_VARIANTS).toEqual({ thumbnail: 640, medium: 1280, original: 1920 });
    expect(UPLOAD_PREFIXES).toEqual(['thumbnail', 'medium', 'original', 'source']);
  });

  it('names variants by source hash, then the largest variant hash, keeping the source hash first', () => {
    expect(variantFileName('0123456789abcdef', 'fedcba9876543210', 'image/webp')).toBe('0123456789abcdef-fedcba98.webp');
    expect(variantFileName('0123456789abcdef', 'fedcba9876543210', 'image/jpeg')).toBe('0123456789abcdef-fedcba98.jpg');
  });

  it('serves public media from the assets host', () => {
    expect(mediaPublicUrl('medium/a.webp')).toBe('https://assets.siamrooftech.com/medium/a.webp');
  });

  it('keeps raw originals only for types the upload route stores', () => {
    expect(sourceFileName('0123456789abcdef', 'image/jpeg')).toBe('0123456789abcdef.jpg');
    expect(sourceFileName('0123456789abcdef', 'image/heic')).toBeNull();
  });
});
