/**
 * Slug Generator for Thai and English titles
 * Auto-generates SEO-friendly slugs
 */

import { SEO_LIMITS } from '../../types/article';

/**
 * Generate URL-friendly slug from Thai/English text
 * Handles Thai characters, removes special chars, converts to lowercase
 */
export function generateSlug(text: string): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  let slug = text
    .toLowerCase()
    .trim()
    // Keep Thai characters (ก-๙), English (a-z0-9), spaces, and hyphens
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
    // Replace multiple spaces/hyphens with single hyphen
    .replace(/[\s-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Limit length
  if (slug.length > SEO_LIMITS.SLUG_MAX) {
    // Try to cut at word boundary
    const truncated = slug.substring(0, SEO_LIMITS.SLUG_MAX);
    const lastHyphen = truncated.lastIndexOf('-');
    slug = lastHyphen > 20 ? truncated.substring(0, lastHyphen) : truncated;
  }

  return slug;
}

/**
 * Check if slug is optimal for SEO
 */
export function isSlugOptimal(slug: string): boolean {
  if (!slug || slug.length === 0) return false;
  if (slug.length > SEO_LIMITS.SLUG_MAX) return false;

  // No special characters except hyphen
  if (!/^[\u0E00-\u0E7Fa-z0-9-]+$/.test(slug)) return false;

  // No consecutive hyphens
  if (/--+/.test(slug)) return false;

  // No leading/trailing hyphens
  if (/^-|-$/.test(slug)) return false;

  return true;
}

/**
 * Suggest improvements for slug
 */
export function suggestSlugImprovements(slug: string, keyword?: string): string[] {
  const suggestions: string[] = [];

  if (!slug || slug.length === 0) {
    suggestions.push('กรุณาระบุ URL slug');
    return suggestions;
  }

  if (slug.length > SEO_LIMITS.SLUG_MAX) {
    suggestions.push(`URL slug ยาวเกินไป (${slug.length} ตัวอักษร) ควรน้อยกว่า ${SEO_LIMITS.SLUG_MAX} ตัวอักษร`);
  }

  if (/--+/.test(slug)) {
    suggestions.push('พบเครื่องหมาย - ติดกันมากกว่า 1 ตัว ควรใช้เพียง 1 ตัว');
  }

  if (/^-|-$/.test(slug)) {
    suggestions.push('URL slug ไม่ควรเริ่มหรือลงท้ายด้วยเครื่องหมาย -');
  }

  if (/_/.test(slug)) {
    suggestions.push('ควรใช้ - แทน _ ใน URL slug');
  }

  if (/[A-Z]/.test(slug)) {
    suggestions.push('URL slug ควรเป็นตัวพิมพ์เล็กทั้งหมด');
  }

  // Check for keyword
  if (keyword && !slug.includes(keyword.toLowerCase().replace(/\s+/g, '-'))) {
    suggestions.push(`ลองเพิ่ม "${keyword}" ใน URL slug เพื่อ SEO ที่ดีขึ้น`);
  }

  return suggestions;
}

/**
 * Generate variations of slug (if original is taken)
 */
export function generateSlugVariations(baseSlug: string, count: number = 3): string[] {
  const variations: string[] = [];

  for (let i = 1; i <= count; i++) {
    variations.push(`${baseSlug}-${i}`);
  }

  return variations;
}

/**
 * Check if slug is unique (requires existing slugs array)
 */
export function isSlugUnique(slug: string, existingSlugs: string[]): boolean {
  return !existingSlugs.includes(slug);
}

/**
 * Get available slug from title (handles duplicates)
 */
export function getAvailableSlug(
  title: string,
  existingSlugs: string[],
  currentSlug?: string
): string {
  const baseSlug = generateSlug(title);

  // If editing and slug hasn't changed, keep it
  if (currentSlug && currentSlug === baseSlug) {
    return currentSlug;
  }

  // Check if base slug is available
  if (isSlugUnique(baseSlug, existingSlugs)) {
    return baseSlug;
  }

  // Generate variations until we find unique one
  const variations = generateSlugVariations(baseSlug, 10);
  for (const variation of variations) {
    if (isSlugUnique(variation, existingSlugs)) {
      return variation;
    }
  }

  // Fallback: add timestamp
  return `${baseSlug}-${Date.now()}`;
}
