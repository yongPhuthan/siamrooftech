import { Project, ProjectImage } from './firestore';

/**
 * Utility functions for Before/After image handling
 *
 * Business Logic:
 * - All existing images without type are treated as "after" images
 * - If no "before" image exists, use the first image as fallback
 * - Maintains backward compatibility with existing projects
 */

/**
 * Get the "before" image for a project
 * Fallback: If no before image, use first image
 */
export function getBeforeImage(project: Project): string {
  if (!project.images || project.images.length === 0) {
    return project.featured_image || '';
  }

  // Look for explicit "before" type image
  const beforeImg = project.images.find((img) => img.type === 'before');
  if (beforeImg) {
    return beforeImg.original_size;
  }

  // Fallback: Use first image (usually the featured image)
  return project.images[0].original_size || project.featured_image || '';
}

/**
 * Get all "after" images for a project
 * Images without type are treated as "after" for backward compatibility
 */
export function getAfterImages(project: Project): ProjectImage[] {
  if (!project.images || project.images.length === 0) {
    return [];
  }

  // Filter for "after" images or images without type (backward compatibility)
  const afterImages = project.images.filter(
    (img) => img.type === 'after' || img.type === undefined || img.type === null
  );

  // If no after images found, return all images as fallback
  if (afterImages.length === 0) {
    return project.images;
  }

  return afterImages;
}

/**
 * Get "during" installation images
 */
export function getDuringImages(project: Project): ProjectImage[] {
  if (!project.images || project.images.length === 0) {
    return [];
  }

  return project.images.filter((img) => img.type === 'during');
}

/**
 * Get "detail" images (close-up shots)
 */
export function getDetailImages(project: Project): ProjectImage[] {
  if (!project.images || project.images.length === 0) {
    return [];
  }

  return project.images.filter((img) => img.type === 'detail');
}

/**
 * Check if project has a dedicated "before" image
 */
export function hasBeforeImage(project: Project): boolean {
  if (!project.images || project.images.length === 0) {
    return false;
  }

  return project.images.some((img) => img.type === 'before');
}

/**
 * Check if project should show Before/After slider
 * Returns true if:
 * - Has explicit before image, OR
 * - Has at least 2 images (can use first as before, rest as after)
 */
export function shouldShowBeforeAfter(project: Project): boolean {
  if (!project.images || project.images.length === 0) {
    return false;
  }

  // Has explicit before image
  if (hasBeforeImage(project)) {
    return true;
  }

  // Has multiple images to compare
  return project.images.length >= 2;
}

/**
 * Get image type badge color
 */
export function getImageTypeBadge(type?: ProjectImage['type']): {
  color: string;
  label: string;
  emoji: string;
} {
  switch (type) {
    case 'before':
      return {
        color: 'bg-red-500 text-white',
        label: 'ก่อนติดตั้ง',
        emoji: '🔴',
      };
    case 'after':
      return {
        color: 'bg-green-500 text-white',
        label: 'หลังติดตั้ง',
        emoji: '🟢',
      };
    case 'during':
      return {
        color: 'bg-yellow-500 text-white',
        label: 'ระหว่างติดตั้ง',
        emoji: '🟡',
      };
    case 'detail':
      return {
        color: 'bg-blue-500 text-white',
        label: 'รายละเอียด',
        emoji: '🔵',
      };
    default:
      return {
        color: 'bg-green-500 text-white',
        label: 'หลังติดตั้ง',
        emoji: '🟢',
      };
  }
}

/**
 * Sort images by type and order_index
 * Order: before → during → after → detail
 */
export function sortImagesByType(images: ProjectImage[]): ProjectImage[] {
  const typeOrder: { [key: string]: number } = {
    before: 0,
    during: 1,
    after: 2,
    detail: 3,
  };

  return [...images].sort((a, b) => {
    const typeA = a.type || 'after';
    const typeB = b.type || 'after';

    // Sort by type first
    const typeOrderA = typeOrder[typeA] ?? 2; // default to "after"
    const typeOrderB = typeOrder[typeB] ?? 2;

    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }

    // Then by order_index
    return a.order_index - b.order_index;
  });
}

/**
 * Get image count by type
 */
export function getImageCountByType(project: Project): {
  before: number;
  after: number;
  during: number;
  detail: number;
  total: number;
} {
  if (!project.images || project.images.length === 0) {
    return { before: 0, after: 0, during: 0, detail: 0, total: 0 };
  }

  const counts = {
    before: 0,
    after: 0,
    during: 0,
    detail: 0,
    total: project.images.length,
  };

  project.images.forEach((img) => {
    const type = img.type || 'after'; // default to after
    if (type in counts) {
      counts[type as keyof typeof counts]++;
    }
  });

  return counts;
}

/**
 * Validate image type
 */
export function isValidImageType(type: any): type is ProjectImage['type'] {
  return ['before', 'after', 'during', 'detail', undefined].includes(type);
}

/**
 * Format image for Before/After comparison
 */
export function formatImageForComparison(image: ProjectImage): {
  src: string;
  alt: string;
  caption?: string;
} {
  return {
    src: image.original_size,
    alt: image.alt_text || image.title,
    caption: image.caption,
  };
}
