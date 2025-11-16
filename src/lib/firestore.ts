
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';

// Database Types (These can be moved to a separate types file if needed)
export interface Project {
  id: string; // Firestore uses string IDs
  title: string; // Generated from width x extension
  width: number;
  extension: number;
  description: string[] | string;
  category: string;
  location: string;
  year: string;
  type: 'ระบบมือหมุน' | 'มอเตอร์ไฟฟ้า' | 'สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)';
  arms_count: '2' | '3' | '4' | '5'; // จำนวนแขนพับ
  canvas_material: 'ผ้าอะคริลิคสเปน' | 'ผ้าอะคริลิค'; // วัสดุผ้าใบ
  fabric_edge: 'ตัดเรียบ' | 'โค้งลอน' | 'ตัดเรียบ + พิมพ์ Logo' | 'โค้งลอน + พิมพ์ Logo'; // ชายผ้า
  featured_image?: string;
  images: ProjectImage[];
  videos?: ProjectVideo[]; // Array of project videos (NEW)
  featured_video?: string; // Featured video URL (optional, NEW)
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
  updated_at?: string | any; // ISO string when serialized, Firestore timestamp on server
  slug: string;
  timeline?: ProjectTimeline[];
  testimonial?: ProjectTestimonial;
  technicalSpecs?: ProjectTechnicalSpecs;
  relatedProjects?: string[]; // Array of project IDs
  client?: string;
  completionDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  viewCount?: number; // Track number of views
  lastViewedAt?: string; // Last view timestamp
}

export interface ProjectTimeline {
  id: string;
  phase: string;
  description: string;
  images: string[];
  date?: string;
  order_index: number;
}

export interface ProjectTestimonial {
  quote: string;
  clientName: string;
  position?: string;
  company?: string;
  rating?: number;
  date?: string;
}

export interface ProjectTechnicalSpecs {
  materials: string[];
  dimensions: string;
  installation: string;
  warranty: string;
  features?: string[];
  certifications?: string[];
}

export interface ProjectImage {
  id: string; // Firestore uses string IDs
  project_id: string;
  title: string;
  description?: string;
  small_size: string;
  medium_size?: string;
  original_size: string;
  alt_text?: string;
  order_index: number;
  type?: 'before' | 'during' | 'after' | 'detail';
  caption?: string;
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
}

export interface ProjectVideo {
  id: string; // Unique video ID
  project_id: string;
  title: string;
  description?: string;
  video_url: string; // Main video URL (Cloudflare Stream or Firebase Storage)
  thumbnail_url?: string; // Video thumbnail/poster image
  duration?: number; // Video duration in seconds
  file_size?: number; // File size in bytes
  mime_type?: string; // video/mp4, video/webm, etc.
  type?: 'before' | 'during' | 'after' | 'detail'; // Same as ProjectImage for consistency
  order_index: number;
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
}

export interface ArticleBlock {
  id: string; // Unique block ID
  image?: string; // Image URL (after upload)
  content: string; // Block content text
  order_index: number; // Order in the article
  created_at?: string | any; // ISO string when serialized
}

export interface Article {
  id: string; // Firestore uses string IDs
  title: string;
  excerpt: string;
  content: string; // Full article content (backward compatible)
  featured_image?: string;
  category: string;
  author: string;
  published_at: string | any; // ISO string when serialized, Firestore timestamp on server
  read_time: string;
  tags: string[];
  slug: string;
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
  updated_at?: string | any; // ISO string when serialized, Firestore timestamp on server
  // SEO fields
  seoTitle?: string; // Custom SEO title (max 60 chars)
  seoDescription?: string; // Custom meta description (max 160 chars)
  seoKeywords?: string[]; // SEO keywords array ["กันสาดพับได้", "เทคนิค", ...]
  isPublished: boolean; // Draft vs Published status
  viewCount?: number; // Track article popularity
  lastModified?: string | any; // Track last update timestamp
  // Block-based content (NEW - Mobile-first authoring)
  blocks?: ArticleBlock[]; // Array of content blocks (image + text)
  authoringMode?: 'simple' | 'blocks'; // Track which mode was used
}

export interface Category {
  id: string; // Firestore uses string IDs
  name: string;
  slug: string;
  description?: string;
  type: 'project' | 'article';
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
}

export interface ContactSubmission {
  id: string; // Firestore uses string IDs
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'new' | 'contacted' | 'completed';
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
}

// Database Functions
export const projectsService = {
  // Get all projects
  async getAll() {
    try {
      const projectsCol = collection(db, 'projects');
      const q = query(projectsCol, orderBy('created_at', 'desc'));
      const projectSnapshot = await getDocs(q);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      return projectList;
    } catch (error) {
      console.error('Firestore getAll error:', error);
      throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get project by ID
  async getById(id: string) {
    try {
      const projectDoc = doc(db, 'projects', id);
      const projectSnapshot = await getDoc(projectDoc);
      if (!projectSnapshot.exists()) {
        return null;
      }
      return { id: projectSnapshot.id, ...projectSnapshot.data() } as Project;
    } catch (error) {
      console.error('Firestore getById error:', error);
      throw new Error(`Failed to fetch project ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get projects by category
  async getByCategory(category: string) {
    try {
      const projectsCol = collection(db, 'projects');
      const q = query(projectsCol, where('category', '==', category), orderBy('created_at', 'desc'));
      const projectSnapshot = await getDocs(q);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      return projectList;
    } catch (error) {
      console.error('Firestore getByCategory error:', error);
      throw new Error(`Failed to fetch projects by category ${category}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get project by slug
  async getBySlug(slug: string) {
    try {
      const projectsCol = collection(db, 'projects');
      const q = query(projectsCol, where('slug', '==', slug));
      const projectSnapshot = await getDocs(q);
      if (projectSnapshot.empty) {
        return null;
      }
      const doc = projectSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Project;
    } catch (error) {
      console.error('Firestore getBySlug error:', error);
      throw new Error(`Failed to fetch project by slug ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get related projects by IDs
  async getRelatedProjects(projectIds: string[]) {
    try {
      if (projectIds.length === 0) return [];
      
      const projectsCol = collection(db, 'projects');
      const projectPromises = projectIds.map(id => 
        getDoc(doc(db, 'projects', id))
      );
      
      const projectSnapshots = await Promise.all(projectPromises);
      const projects = projectSnapshots
        .filter(snapshot => snapshot.exists())
        .map(snapshot => ({ id: snapshot.id, ...snapshot.data() } as Project));
      
      return projects;
    } catch (error) {
      console.error('Firestore getRelatedProjects error:', error);
      return [];
    }
  }
}

export const articlesService = {
  // Get all articles
  async getAll() {
    const articlesCol = collection(db, 'articles');
    const q = query(articlesCol, where('published_at', '!=', null), orderBy('published_at', 'desc'));
    const articleSnapshot = await getDocs(q);
    const articleList = articleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    return articleList;
  },

  // Get article by slug
  async getBySlug(slug: string) {
    const articlesCol = collection(db, 'articles');
    const q = query(articlesCol, where('slug', '==', slug));
    const articleSnapshot = await getDocs(q);
    if (articleSnapshot.empty) {
      return null;
    }
    const doc = articleSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Article;
  },

  // Get articles by category
  async getByCategory(category: string) {
    const articlesCol = collection(db, 'articles');
    const q = query(articlesCol, where('category', '==', category), where('published_at', '!=', null), orderBy('published_at', 'desc'));
    const articleSnapshot = await getDocs(q);
    const articleList = articleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    return articleList;
  }
}

export const contactService = {
  // Submit contact form
  async submit(submission: Omit<ContactSubmission, 'id' | 'status' | 'created_at'>) {
    const contactSubmissionsCol = collection(db, 'contact_submissions');
    const docRef = await addDoc(contactSubmissionsCol, {
      ...submission,
      status: 'new',
      created_at: new Date(),
    });
    return { id: docRef.id, ...submission, status: 'new' } as ContactSubmission;
  }
}

// ===== Validation Functions =====

/**
 * Validate project images to ensure data integrity
 * - Must have at least 1 after image
 * - Before images should not exceed 10
 * - All images must have valid URLs
 */
export function validateProjectImages(images: ProjectImage[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!images || images.length === 0) {
    errors.push('ต้องมีรูปภาพอย่างน้อย 1 รูป');
    return { valid: false, errors };
  }

  // ต้องมี after image อย่างน้อย 1 รูป (backward compatible: no type = after)
  const afterImages = images.filter(img => img.type === 'after' || !img.type);
  if (afterImages.length === 0) {
    errors.push('ต้องมีรูปหลังติดตั้งอย่างน้อย 1 รูป');
  }

  // ไม่ควรมี before มากเกิน 10 รูป
  const beforeImages = images.filter(img => img.type === 'before');
  if (beforeImages.length > 10) {
    errors.push('รูปก่อนติดตั้งไม่ควรเกิน 10 รูป');
  }

  // เช็คว่าทุกรูปมี URLs ที่จำเป็น
  const invalidImages = images.filter(img => !img.original_size || !img.small_size);
  if (invalidImages.length > 0) {
    errors.push(`พบรูปภาพที่ไม่สมบูรณ์ ${invalidImages.length} รูป (ไม่มี URL)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that image type is valid
 */
export function isValidImageType(type: any): type is ProjectImage['type'] {
  return ['before', 'after', 'during', 'detail', undefined].includes(type);
}

/**
 * Validate project videos to ensure data integrity
 * - Must have valid video URLs
 * - File size should not exceed 100MB
 * - Duration should be reasonable (< 10 minutes)
 */
export function validateProjectVideos(videos: ProjectVideo[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!videos || videos.length === 0) {
    return { valid: true, errors: [] }; // Videos are optional
  }

  // ไม่ควรมีวีดีโอมากเกิน 10 วีดีโอ
  if (videos.length > 10) {
    errors.push('วีดีโอไม่ควรเกิน 10 วีดีโอ');
  }

  // เช็คว่าทุกวีดีโอมี URLs ที่จำเป็น
  const invalidVideos = videos.filter(video => !video.video_url);
  if (invalidVideos.length > 0) {
    errors.push(`พบวีดีโอที่ไม่สมบูรณ์ ${invalidVideos.length} วีดีโอ (ไม่มี URL)`);
  }

  // เช็คขนาดไฟล์ (ถ้ามี)
  const oversizedVideos = videos.filter(video => video.file_size && video.file_size > 100 * 1024 * 1024);
  if (oversizedVideos.length > 0) {
    errors.push(`พบวีดีโอที่มีขนาดใหญ่เกิน 100MB จำนวน ${oversizedVideos.length} วีดีโอ`);
  }

  // เช็คความยาว (ถ้ามี)
  const tooLongVideos = videos.filter(video => video.duration && video.duration > 600);
  if (tooLongVideos.length > 0) {
    errors.push(`พบวีดีโอที่ยาวเกิน 10 นาที จำนวน ${tooLongVideos.length} วีดีโอ`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that video type is valid
 */
export function isValidVideoType(type: any): type is ProjectVideo['type'] {
  return ['before', 'after', 'during', 'detail', undefined].includes(type);
}

/**
 * Get validation summary for a project
 */
export function getProjectValidationSummary(project: Partial<Project>): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic field validation
  if (!project.title?.trim()) errors.push('กรุณากรอกชื่อโปรเจค');
  if (!project.category?.trim()) errors.push('กรุณาเลือกหมวดหมู่');
  if (!project.location?.trim()) errors.push('กรุณากรอกสถานที่');
  if (!project.width || project.width <= 0) errors.push('กรุณากรอกความกว้าง');
  if (!project.extension || project.extension <= 0) errors.push('กรุณากรอกระยะยื่นออก');

  // Image validation
  if (project.images) {
    const imageValidation = validateProjectImages(project.images);
    errors.push(...imageValidation.errors);

    // Warnings (not blocking)
    const beforeImages = project.images.filter(img => img.type === 'before');
    if (beforeImages.length === 0) {
      warnings.push('ไม่มีรูปก่อนติดตั้ง - ระบบจะใช้รูปแรกเป็นรูปก่อนในการแสดง Before/After');
    }

    const afterImages = project.images.filter(img => img.type === 'after' || !img.type);
    if (afterImages.length < 3) {
      warnings.push(`มีรูปหลังติดตั้งเพียง ${afterImages.length} รูป - แนะนำให้มีอย่างน้อย 3 รูป`);
    }
  }

  // Video validation (NEW)
  if (project.videos) {
    const videoValidation = validateProjectVideos(project.videos);
    errors.push(...videoValidation.errors);

    // Warnings for videos
    if (project.videos.length > 5) {
      warnings.push(`มีวีดีโอ ${project.videos.length} วีดีโอ - แนะนำไม่เกิน 5 วีดีโอเพื่อประสิทธิภาพ`);
    }

    const videosWithoutThumbnail = project.videos.filter(video => !video.thumbnail_url);
    if (videosWithoutThumbnail.length > 0) {
      warnings.push(`มีวีดีโอ ${videosWithoutThumbnail.length} วีดีโอที่ไม่มีภาพปก (thumbnail)`);
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
