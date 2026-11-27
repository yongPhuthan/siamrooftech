import { describe, expect, it } from 'vitest';
import { IMAGE_VARIANTS, isPrivateMediaKey, sourceFileName, UPLOAD_PREFIXES, variantFileName } from './image-variants';

describe('image variants', () => {
  it('uses the 640/1280/1920 standard in the schema folders', () => {
    expect(IMAGE_VARIANTS).toEqual({ thumbnail: 640, medium: 1280, original: 1920 });
    expect(UPLOAD_PREFIXES).toEqual(['thumbnail', 'medium', 'original', 'source']);
  });

  it('names variants by source hash and settings version, keeping the hash first', () => {
    expect(variantFileName('0123456789abcdef', 'image/webp')).toBe('0123456789abcdef-v2.webp');
    expect(variantFileName('0123456789abcdef', 'image/jpeg')).toBe('0123456789abcdef-v2.jpg');
  });

  it('keeps raw originals only for types the upload route stores', () => {
    expect(sourceFileName('0123456789abcdef', 'image/jpeg')).toBe('0123456789abcdef.jpg');
    expect(sourceFileName('0123456789abcdef', 'image/heic')).toBeNull();
  });

  it('treats source/ as private', () => {
    expect(isPrivateMediaKey('source/0123456789abcdef.jpg')).toBe(true);
    expect(isPrivateMediaKey('medium/0123456789abcdef-v2.webp')).toBe(false);
  });
});
