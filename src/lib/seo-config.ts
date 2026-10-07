export const SITE_URL = 'https://www.siamrooftech.com';

export const SERVICE_AREAS_TH = [
  'กรุงเทพ',
  'นครปฐม',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'อยุธยา',
  'สมุทรสาคร',
] as const;

export function canonicalUrl(path = ''): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath === '/' ? SITE_URL : `${SITE_URL}${normalizedPath}`;
}

export function toDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
