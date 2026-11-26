import { z } from 'zod';

/** Category names that were merged or renamed; stored projects keep the old value and read as the new one. */
export const LEGACY_PROJECT_CATEGORIES: Readonly<Record<string, string>> = {
  'ร้านอาหาร': 'ร้านอาหารและคาเฟ่',
  'คาเฟ่': 'ร้านอาหารและคาเฟ่',
};

export function currentProjectCategory(category: string): string {
  return LEGACY_PROJECT_CATEGORIES[category] ?? category;
}

export const ProjectPayloadSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(160),
  category: z.string().min(1).max(80).transform(currentProjectCategory),
  // Photo-first: only category and photos are required. The fields below are optional so a project can be
  // published from photos alone; older projects keep the values they already have.
  type: z.enum(['ระบบมือหมุน', 'มอเตอร์ไฟฟ้า', 'สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)']).optional(),
  fabric_edge: z.enum(['ตัดเรียบ', 'โค้งลอน', 'ตัดเรียบ + พิมพ์ Logo', 'โค้งลอน + พิมพ์ Logo']).optional(),
  width: z.number().positive().optional(),
  extension: z.number().positive().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  location: z.string().max(180).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  arms_count: z.enum(['2', '3', '4', '5']).optional(),
  canvas_material: z.enum(['ผ้าอะคริลิคสเปน', 'ผ้าอะคริลิค']).optional(),
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
  viewCount: z.number().optional(),
}).passthrough();

export const NewProjectPayloadSchema = ProjectPayloadSchema.omit({ id: true, slug: true }).passthrough();
