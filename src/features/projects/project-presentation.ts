import type { Project } from './types';

/** Place types a project can be filed under, with the URL word each one uses when a project has no size. */
export const PROJECT_CATEGORIES = [
  { label: 'ร้านอาหาร', slug: 'restaurant' },
  { label: 'โรงแรม', slug: 'hotel' },
  { label: 'คาเฟ่', slug: 'cafe' },
  { label: 'บ้านพักอาศัย', slug: 'home' },
  { label: 'สำนักงาน', slug: 'office' },
  { label: 'ร้านค้า', slug: 'shop' },
  { label: 'โรงงาน', slug: 'factory' },
  { label: 'สถานศึกษา', slug: 'school' },
  { label: 'โรงพยาบาล', slug: 'hospital' },
  { label: 'อื่นๆ', slug: 'other' },
] as const;

export const PROJECT_CATEGORY_LABELS: readonly string[] = PROJECT_CATEGORIES.map((category) => category.label);

type SlugInput = Pick<Project, 'type' | 'width' | 'extension' | 'category'>;

/**
 * The slug before its sequence number. A project with a size keeps the size-based form every existing URL uses;
 * a photo-only project uses its category instead. Both match the slug pattern in project-schema.
 */
export function projectSlugBase(project: SlugInput): string {
  const prefix = project.type === 'มอเตอร์ไฟฟ้า' ? 'electric-awning' : 'retractable-awning';
  if (project.width && project.extension) return `${prefix}-${`${project.width}x${project.extension}`.replaceAll('.', '-')}`;
  const category = PROJECT_CATEGORIES.find((item) => item.label === project.category)?.slug ?? 'other';
  return `${prefix}-${category}`;
}

/**
 * Projects are named by the type of place only, because that is all the photos reliably show; names may repeat.
 * Location and size never go into a name. "อื่นๆ" names no place, so it gives none.
 */
function projectPlace(project: Pick<Project, 'category'>): string {
  return project.category === 'อื่นๆ' ? '' : project.category;
}

/** The page's H1 and title. */
export function projectHeading(project: Pick<Project, 'category'>): string {
  const place = projectPlace(project);
  return place ? `กันสาดพับเก็บได้ ${place}` : 'กันสาดพับเก็บได้';
}

/** The short name on cards, where the section already says what the work is. */
export function projectName(project: Pick<Project, 'category'>): string {
  return projectPlace(project) || projectHeading(project);
}

export function projectSize(project: Pick<Project, 'width' | 'extension'>): string | null {
  return project.width && project.extension ? `${project.width} × ${project.extension} ม.` : null;
}

export function projectDescriptionText(project: Pick<Project, 'description'>): string {
  const text = Array.isArray(project.description) ? project.description.join(' ') : project.description ?? '';
  return text.trim();
}

/** Meta description built only from facts the project has; empty parts are left out instead of printed as blanks. */
export function projectMetaDescription(project: Pick<Project, 'type' | 'width' | 'extension' | 'category'>): string {
  const system = project.type ? (/^(ระบบ|สองระบบ)/.test(project.type) ? project.type : `ระบบ${project.type}`) : '';
  const size = project.width && project.extension ? `ขนาด ${project.width} × ${project.extension} เมตร` : '';
  const place = projectPlace(project) && `ที่${projectPlace(project)}`;
  return [`ผลงานติดตั้งกันสาด${system}`, size, place].filter(Boolean).join(' ');
}

/** Display order: after-photos first, then details, then before-photos, each by its saved order. */
export function orderedProjectImages(project: Pick<Project, 'images'>): Project['images'] {
  const rank = (type?: string) => (type === 'before' ? 2 : type === 'detail' ? 1 : 0);
  return [...(project.images ?? [])].sort((a, b) => rank(a.type) - rank(b.type) || a.order_index - b.order_index);
}

/** Newest first: the installation year when known, otherwise when the project was created. */
export function projectSortTime(project: Pick<Project, 'year' | 'created_at'>): number {
  if (project.year) return new Date(Number(project.year), 0).getTime();
  return project.created_at ? new Date(project.created_at).getTime() : 0;
}


/** The cover photo to show in cards: the saved featured image, else the first photo in display order. */
export function projectCover(project: Pick<Project, 'images' | 'featured_image'>): string | undefined {
  const [first] = orderedProjectImages(project);
  const cover = project.featured_image || first?.medium_size || first?.original_size;
  return cover || undefined;
}
