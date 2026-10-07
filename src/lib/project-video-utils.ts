/**
 * Project Video Utility Functions
 *
 * Helper functions for working with project videos,
 * similar to project-image-utils.ts
 */

import type { Project, ProjectVideo } from '@/features/projects/types';

/**
 * Get all videos from a project
 */
export function getVideos(project: Project): ProjectVideo[] {
  return project.videos || [];
}

/**
 * Get videos filtered by type
 */
export function getVideosByType(
  project: Project,
  type: 'before' | 'after' | 'during' | 'detail'
): ProjectVideo[] {
  const videos = getVideos(project);
  return videos.filter(video => video.type === type);
}

/**
 * Get "before" videos (ก่อนติดตั้ง)
 */
export function getBeforeVideos(project: Project): ProjectVideo[] {
  return getVideosByType(project, 'before');
}

/**
 * Get "after" videos (หลังติดตั้ง)
 * Falls back to videos without type (backward compatible)
 */
export function getAfterVideos(project: Project): ProjectVideo[] {
  const videos = getVideos(project);
  return videos.filter(video => video.type === 'after' || !video.type);
}

/**
 * Get "during" videos (ระหว่างติดตั้ง)
 */
export function getDuringVideos(project: Project): ProjectVideo[] {
  return getVideosByType(project, 'during');
}

/**
 * Get "detail" videos (รายละเอียด)
 */
export function getDetailVideos(project: Project): ProjectVideo[] {
  return getVideosByType(project, 'detail');
}

/**
 * Check if project has any videos
 */
export function hasVideos(project: Project): boolean {
  return getVideos(project).length > 0;
}

/**
 * Check if should show videos section
 */
export function shouldShowVideos(project: Project): boolean {
  return hasVideos(project);
}

/**
 * Check if project has before/after videos
 */
export function hasBeforeAfterVideos(project: Project): boolean {
  const beforeVideos = getBeforeVideos(project);
  const afterVideos = getAfterVideos(project);
  return beforeVideos.length > 0 && afterVideos.length > 0;
}

/**
 * Get featured video (first video or featured_video field)
 */
export function getFeaturedVideo(project: Project): ProjectVideo | null {
  if (project.featured_video) {
    const videos = getVideos(project);
    const featured = videos.find(v => v.video_url === project.featured_video);
    if (featured) return featured;
  }

  const videos = getVideos(project);
  return videos.length > 0 ? videos[0] : null;
}

/**
 * Get video type badge info for UI display
 */
export function getVideoTypeBadge(type?: 'before' | 'after' | 'during' | 'detail'): {
  color: string;
  label: string;
  emoji: string;
} {
  switch (type) {
    case 'before':
      return {
        color: 'red-500',
        label: 'ก่อนติดตั้ง',
        emoji: '🕐',
      };
    case 'after':
      return {
        color: 'green-500',
        label: 'หลังติดตั้ง',
        emoji: '✅',
      };
    case 'during':
      return {
        color: 'yellow-500',
        label: 'ระหว่างติดตั้ง',
        emoji: '🚧',
      };
    case 'detail':
      return {
        color: 'blue-500',
        label: 'รายละเอียด',
        emoji: '🔍',
      };
    default:
      return {
        color: 'gray-500',
        label: 'วีดีโอ',
        emoji: '🎬',
      };
  }
}

/**
 * Sort videos by order_index
 */
export function sortVideos(videos: ProjectVideo[]): ProjectVideo[] {
  return [...videos].sort((a, b) => a.order_index - b.order_index);
}

/**
 * Get total videos count with type breakdown
 */
export function getVideoStats(project: Project): {
  total: number;
  before: number;
  after: number;
  during: number;
  detail: number;
} {
  const videos = getVideos(project);
  return {
    total: videos.length,
    before: getBeforeVideos(project).length,
    after: getAfterVideos(project).length,
    during: getDuringVideos(project).length,
    detail: getDetailVideos(project).length,
  };
}

/**
 * Check if video is valid (has required fields)
 */
export function isValidVideo(video: ProjectVideo): boolean {
  return !!(video.video_url && video.id);
}

/**
 * Filter out invalid videos
 */
export function getValidVideos(project: Project): ProjectVideo[] {
  return getVideos(project).filter(isValidVideo);
}
