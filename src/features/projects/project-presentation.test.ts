import { describe, expect, it } from 'vitest';
import { ProjectPayloadSchema } from './project-schema';
import { orderedProjectImages, projectHeading, projectMetaDescription, projectName, projectSlugBase } from './project-presentation';

const image = (id: string, type: 'after' | 'before' | 'detail', order: number) => ({
  id, project_id: 'p1', title: '', order_index: order, type,
  small_size: `https://assets.siamrooftech.com/thumbnail/${id}.jpg`,
  original_size: `https://assets.siamrooftech.com/original/${id}.jpg`,
});

describe('photo-first projects', () => {
  it('accepts a project with only a category and photos', () => {
    const parsed = ProjectPayloadSchema.safeParse({ id: 'p1', title: 'กันสาดพับเก็บได้ คาเฟ่', category: 'คาเฟ่', slug: 'retractable-awning-cafe-1', images: [image('a', 'after', 0)] });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.category).toBe('ร้านอาหารและคาเฟ่');
  });

  it('keeps size slugs for projects with a size and uses the category otherwise', () => {
    expect(projectSlugBase({ category: 'คาเฟ่', type: 'มอเตอร์ไฟฟ้า', width: 4.5, extension: 2 })).toBe('electric-awning-4-5x2');
    expect(projectSlugBase({ category: 'คาเฟ่' })).toBe('retractable-awning-restaurant-cafe');
    expect(projectSlugBase({ category: 'วัดและศาสนสถาน' })).toBe('retractable-awning-temple');
  });

  it('names a project by the type of place only', () => {
    expect(projectHeading({ category: 'คาเฟ่' })).toBe('กันสาดพับเก็บได้ ร้านอาหารและคาเฟ่');
    expect(projectHeading({ category: 'วัดและศาสนสถาน' })).toBe('กันสาดพับเก็บได้ วัดและศาสนสถาน');
    expect(projectName({ category: 'บ้านพักอาศัย' })).toBe('บ้านพักอาศัย');
    expect(projectHeading({ category: 'อื่นๆ' })).toBe('กันสาดพับเก็บได้');
    expect(projectName({ category: 'อื่นๆ' })).toBe('กันสาดพับเก็บได้');
  });

  it('leaves missing facts out of the meta description', () => {
    expect(projectMetaDescription({ category: 'ร้านค้า' })).toBe('ผลงานติดตั้งกันสาด ที่ร้านค้า');
    expect(projectMetaDescription({ category: 'คาเฟ่', type: 'มอเตอร์ไฟฟ้า' })).toBe('ผลงานติดตั้งกันสาดระบบมอเตอร์ไฟฟ้า ที่ร้านอาหารและคาเฟ่');
    expect(projectMetaDescription({ category: 'คาเฟ่', type: 'ระบบมือหมุน', width: 5, extension: 2 })).toBe('ผลงานติดตั้งกันสาดระบบมือหมุน ขนาด 5 × 2 เมตร ที่ร้านอาหารและคาเฟ่');
    expect(projectMetaDescription({ category: 'อื่นๆ' })).toBe('ผลงานติดตั้งกันสาด');
    expect(projectMetaDescription({ category: 'คาเฟ่', type: 'สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)' })).toBe('ผลงานติดตั้งกันสาดสองระบบ (มือหมุน + มอเตอร์ไฟฟ้า) ที่ร้านอาหารและคาเฟ่');
  });

  it('shows after-photos first', () => {
    const images = orderedProjectImages({ images: [image('b', 'before', 0), image('a', 'after', 1)] });
    expect(images.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
