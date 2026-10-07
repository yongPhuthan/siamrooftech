import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { getAdminArticle, publishArticle } from '@/features/articles/server/repository';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const body = await request.json().catch(() => null) as { expectedRevision?: unknown } | null;
  if (!body || !Number.isInteger(body.expectedRevision) || Number(body.expectedRevision) < 0) {
    return NextResponse.json({ error: 'A valid expected revision is required' }, { status: 400 });
  }
  try {
    const { id } = await params;
    const beforePublish = await getAdminArticle(id);
    const article = await publishArticle(id, Number(body.expectedRevision));
    revalidateTag('articles');
    revalidateTag(`article-${article.published?.metadata.slug}`);
    revalidatePath('/articles');
    revalidatePath('/sitemap.xml');
    if (beforePublish?.published && beforePublish.published.metadata.slug !== article.published?.metadata.slug) {
      revalidatePath(`/articles/${beforePublish.published.metadata.slug}`);
      revalidateTag(`article-${beforePublish.published.metadata.slug}`);
    }
    if (article.published) revalidatePath(`/articles/${article.published.metadata.slug}`);
    return NextResponse.json(article, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'ARTICLE_NOT_FOUND') return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    if (message === 'REVISION_CONFLICT') return NextResponse.json({ error: 'Draft changed in another session. Reload before publishing.' }, { status: 409 });
    if (message === 'LEGACY_ARTICLE_READ_ONLY') return NextResponse.json({ error: 'Legacy articles must be reauthored as a new draft.' }, { status: 409 });
    if (message === 'SLUG_CONFLICT') return NextResponse.json({ error: 'This URL is already used by another published article.' }, { status: 409 });
    if (message === 'PUBLICATION_INVALID') {
      return NextResponse.json({ error: 'Draft needs changes before publication', problems: (error as Error & { problems?: unknown }).problems ?? [] }, { status: 422 });
    }
    console.error('Article publication failed', error);
    return NextResponse.json({ error: 'Failed to publish article' }, { status: 503 });
  }
}
