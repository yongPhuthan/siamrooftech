import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { ArticleDraftInputSchema } from '@/features/articles/document-schema';
import { getAdminArticle, saveArticleDraft } from '@/features/articles/server/repository';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  try {
    const { id } = await params;
    const article = await getAdminArticle(id);
    if (!article) return NextResponse.json({ error: 'Article not found or requires reauthoring' }, { status: 404 });
    return NextResponse.json(article, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Admin article read failed', error);
    return NextResponse.json({ error: 'Article storage is unavailable' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  const parsed = ArticleDraftInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid draft', issues: parsed.error.issues }, { status: 400 });
  try {
    const { id } = await params;
    const article = await saveArticleDraft(id, parsed.data.expectedRevision, parsed.data.metadata, parsed.data.document, parsed.data.seoSettings);
    revalidateTag('articles');
    if (article.published) revalidateTag(`article-${article.published.metadata.slug}`);
    return NextResponse.json(article, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'ARTICLE_NOT_FOUND') return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    if (message === 'REVISION_CONFLICT') return NextResponse.json({ error: 'Draft changed in another session. Reload before saving.' }, { status: 409 });
    if (message === 'LEGACY_ARTICLE_READ_ONLY') return NextResponse.json({ error: 'Legacy articles must be reauthored as a new draft.' }, { status: 409 });
    console.error('Admin article save failed', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 503 });
  }
}
