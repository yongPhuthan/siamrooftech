import { describe, expect, it } from 'vitest';
import { watermarkLayout, watermarkOutputType } from './watermark';

describe('watermark', () => {
  it('anchors the mark 24px from the bottom-right and scales it with the short side', () => {
    expect(watermarkLayout(4000, 3000)).toEqual({ fontSize: 167, x: 3976, y: 2976 });
    expect(watermarkLayout(3000, 4000)).toEqual({ fontSize: 167, x: 2976, y: 3976 });
  });

  it('never draws text smaller than 20px', () => {
    expect(watermarkLayout(300, 200).fontSize).toBe(20);
  });

  it('keeps PNG and WebP and writes everything else as JPEG', () => {
    expect(watermarkOutputType('image/png')).toBe('image/png');
    expect(watermarkOutputType('image/webp')).toBe('image/webp');
    expect(watermarkOutputType('image/jpeg')).toBe('image/jpeg');
    expect(watermarkOutputType('image/heic')).toBe('image/jpeg');
  });
});
