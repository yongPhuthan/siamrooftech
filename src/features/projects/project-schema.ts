import { z } from 'zod';

export const ProjectPayloadSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(160),
  width: z.number().positive(),
  extension: z.number().positive(),
  description: z.union([z.string(), z.array(z.string())]),
  category: z.string().min(1).max(80),
  location: z.string().min(1).max(180),
  year: z.string().regex(/^\d{4}$/),
  type: z.enum(['ระบบมือหมุน', 'มอเตอร์ไฟฟ้า', 'สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)']),
  arms_count: z.enum(['2', '3', '4', '5']),
  canvas_material: z.enum(['ผ้าอะคริลิคสเปน', 'ผ้าอะคริลิค']),
  fabric_edge: z.enum(['ตัดเรียบ', 'โค้งลอน', 'ตัดเรียบ + พิมพ์ Logo', 'โค้งลอน + พิมพ์ Logo']),
  images: z.array(z.object({
    id: z.string().min(1), project_id: z.string().min(1), title: z.string(),
    small_size: z.string().url(), medium_size: z.string().url().optional(), original_size: z.string().url(),
    alt_text: z.string().optional(), description: z.string().optional(), order_index: z.number().int(),
    type: z.enum(['before', 'during', 'after', 'detail']).optional(), caption: z.string().optional(), created_at: z.string().optional(),
  }).passthrough()),
  slug: z.string().regex(/^(retractable|electric)-awning-[a-z0-9-]+-[1-9]\d{0,3}$/),
  featured_image: z.string().url().optional(),
  videos: z.array(z.object({
    id: z.string(), project_id: z.string(), title: z.string(), video_url: z.string().url(),
    thumbnail_url: z.string().url().optional(), duration: z.number().optional(), file_size: z.number().optional(),
    mime_type: z.string().optional(), type: z.enum(['before', 'during', 'after', 'detail']).optional(), order_index: z.number().int(),
  }).passthrough()).optional(),
  featured_video: z.string().url().optional(),
  created_at: z.string().optional(), updated_at: z.string().optional(),
  proof: z.object({}).passthrough().optional(),
  timeline: z.array(z.object({}).passthrough()).optional(),
  testimonial: z.object({}).passthrough().optional(),
  technicalSpecs: z.object({}).passthrough().optional(),
  relatedProjects: z.array(z.string()).optional(),
  client: z.string().optional(), completionDate: z.string().optional(),
  seoTitle: z.string().optional(), seoDescription: z.string().optional(), seoKeywords: z.array(z.string()).optional(),
  viewCount: z.number().optional(), lastViewedAt: z.string().optional(),
}).passthrough();

export const NewProjectPayloadSchema = ProjectPayloadSchema.omit({ id: true, slug: true }).passthrough();
