import { ProjectImage } from './firestore';

export type ImageSize = 'thumbnail' | 'medium' | 'original';

/**
 * Helper function to get image URL with backward compatibility
 */
export function getImageUrl(image: ProjectImage, size: ImageSize = 'original'): string {
  // Use the actual ProjectImage structure
  if (size === 'thumbnail' && image.small_size) {
    return image.small_size;
  }
  if (size === 'medium' && image.medium_size) {
    return image.medium_size;
  }
  if (size === 'original' && image.original_size) {
    return image.original_size;
  }

  // Final fallback - try to find any available image
  return image.original_size || 
         image.medium_size || 
         image.small_size || 
         '/images/default-project.jpg';
}

/**
 * Get featured image URL for a project
 */
export function getFeaturedImageUrl(project: { featured_image?: string; images?: ProjectImage[] }, size: ImageSize = 'medium'): string {
  // Use featured_image if available
  if (project.featured_image) {
    return project.featured_image;
  }

  // Use first image in appropriate size
  if (project.images && project.images.length > 0) {
    return getImageUrl(project.images[0], size);
  }

  return '/images/default-project.jpg';
}