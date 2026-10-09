import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { getAdminArticle, unpublishArticle } from '@/features/articles/server/repository';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const body = await request.json().catch(() => null) as { expectedRevision?: unknown } | null;
  if (!body || !Number.isInteger(body.expectedRevision) || Number(body.expectedRevision) < 0) return NextResponse.json({ error: 'A valid expected revision is required' }, { status: 400 });
  try {
    const { id } = await params;
    const existing = await getAdminArticle(id);
    if (!existing) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    const result = await unpublishArticle(id, Number(body.expectedRevision));
    revalidateTag('articles');
    revalidateTag(`article-${existing.published?.metadata.slug}`);
    revalidatePath('/articles');
    revalidatePath('/sitemap.xml');
    if (existing.published) revalidatePath(`/articles/${existing.published.metadata.slug}`);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'ARTICLE_NOT_FOUND') return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    if (message === 'REVISION_CONFLICT') return NextResponse.json({ error: 'Draft changed in another session. Reload before unpublishing.' }, { status: 409 });
    if (message === 'LEGACY_ARTICLE_READ_ONLY') return NextResponse.json({ error: 'Legacy articles are read-only.' }, { status: 409 });
    console.error('Article unpublish failed', error);
    return NextResponse.json({ error: 'Failed to unpublish article' }, { status: 503 });
  }
}
