import { revalidatePath, revalidateTag } from 'next/cache';

type PublicContentKind = 'project' | 'article';

const KIND_ROUTES: Record<PublicContentKind, { tag: string; listing: string; detailRoute: string }> = {
  project: { tag: 'projects', listing: '/projects', detailRoute: '/projects/[slug]' },
  article: { tag: 'articles', listing: '/articles', detailRoute: '/articles/[slug]' },
};

/**
 * Invalidate every cached public page that can show this kind of content after a
 * publish, unpublish, or delete. Detail pages are ISR-cached and embed related
 * items, so the whole detail route is invalidated, not only the changed path.
 * Middleware still gates unpublished paths with a 404 before any cache is read.
 */
export function revalidatePublicContent(kind: PublicContentKind, changedPaths: Array<string | false | null | undefined> = []) {
  const { tag, listing, detailRoute } = KIND_ROUTES[kind];
  revalidateTag(tag);
  revalidatePath(detailRoute, 'page');
  revalidatePath(listing);
  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  for (const path of new Set(changedPaths)) {
    if (path) revalidatePath(path);
  }
}
