import { describe, expect, it } from 'vitest';
import imageLoader from './image-loader';

const photo = (variant: string) => `https://assets.siamrooftech.com/${variant}/0123456789abcdef-89abcdef.webp`;

describe('imageLoader', () => {
  it('picks the smallest WebP variant at least as wide as requested', () => {
    expect(imageLoader({ src: photo('original'), width: 384 })).toBe(photo('thumbnail'));
    expect(imageLoader({ src: photo('original'), width: 640 })).toBe(photo('thumbnail'));
    expect(imageLoader({ src: photo('thumbnail'), width: 1080 })).toBe(photo('medium'));
    expect(imageLoader({ src: photo('thumbnail'), width: 1920 })).toBe(photo('original'));
    expect(imageLoader({ src: photo('medium'), width: 3840 })).toBe(photo('original'));
  });

  it('serves every other image as it is', () => {
    const jpeg = 'https://assets.siamrooftech.com/medium/0123456789abcdef-1760377505552-l038sb-jpg.jpg';
    expect(imageLoader({ src: jpeg, width: 640 })).toBe(jpeg);
    expect(imageLoader({ src: '/images/hero.webp', width: 640 })).toBe('/images/hero.webp');
  });
});
