const STORED_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidArticleSlug(slug: string): boolean {
  return slug.length <= 120 && STORED_SLUG.test(slug);
}

export function articlePath(slug: string): string {
  if (!isValidArticleSlug(slug)) throw new Error('Article URL must use a stored, lowercase English slug');
  return `/articles/${slug}`;
}

export function isSlugReservationAvailable(slug: string, articleId: string, reservedBy?: string): boolean {
  return isValidArticleSlug(slug) && (!reservedBy || reservedBy === articleId);
}
