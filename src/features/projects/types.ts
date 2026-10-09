export interface Project {
  id: string;
  title: string;
  width: number;
  extension: number;
  description: string[] | string;
  category: string;
  location: string;
  year: string;
  type: 'ระบบมือหมุน' | 'มอเตอร์ไฟฟ้า' | 'สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)';
  arms_count: '2' | '3' | '4' | '5';
  canvas_material: 'ผ้าอะคริลิคสเปน' | 'ผ้าอะคริลิค';
  fabric_edge: 'ตัดเรียบ' | 'โค้งลอน' | 'ตัดเรียบ + พิมพ์ Logo' | 'โค้งลอน + พิมพ์ Logo';
  featured_image?: string;
  images: ProjectImage[];
  videos?: ProjectVideo[];
  featured_video?: string;
  created_at?: string;
  updated_at?: string;
  slug: string;
  timeline?: ProjectTimeline[];
  testimonial?: ProjectTestimonial;
  technicalSpecs?: ProjectTechnicalSpecs;
  proof?: ProjectProof;
  relatedProjects?: string[];
  client?: string;
  completionDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  viewCount?: number;
  lastViewedAt?: string;
  revision?: number;
  isPublished?: boolean;
}

export interface ProjectProof {
  serviceType?: 'กันสาดพับเก็บได้' | 'กันสาดพับไฟฟ้า' | 'กันสาดพับเก็บได้สองระบบ';
  customerType?: string;
  serviceArea?: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  proofNotes?: string[];
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
  id: string;
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
  created_at?: string;
}

export interface ProjectVideo {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  file_size?: number;
  mime_type?: string;
  type?: 'before' | 'during' | 'after' | 'detail';
  order_index: number;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'project' | 'article';
  created_at?: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'new' | 'contacted' | 'completed';
  created_at?: string;
}
