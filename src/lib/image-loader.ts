import { IMAGE_VARIANTS, type ImageVariant } from '../features/projects/image-variants';

/**
 * next/image loader. A WebP photo on the assets host is stored as three variants that share one file name
 * (thumbnail/medium/original = 640/1280/1920 px), so the loader picks the smallest variant at least as wide
 * as the width Next.js asks for. Every other image is served as it is.
 */
const VARIANT_URL = /^https:\/\/assets\.siamrooftech\.com\/(?:thumbnail|medium|original)\/([^/?#]+\.webp)$/;
const BY_WIDTH = (Object.entries(IMAGE_VARIANTS) as [ImageVariant, number][]).sort((a, b) => a[1] - b[1]);

export default function imageLoader({ src, width }: { src: string; width: number }): string {
  const match = VARIANT_URL.exec(src);
  if (!match) return src;
  const [variant] = BY_WIDTH.find(([, longSide]) => width <= longSide) ?? BY_WIDTH[BY_WIDTH.length - 1];
  return `https://assets.siamrooftech.com/${variant}/${match[1]}`;
}
