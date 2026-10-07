import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { getAdminArticle } from '@/features/articles/server/repository';
import { renderArticleDocument } from '@/features/articles/public/ArticleDocumentView';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  try {
    const { id } = await params;
    const article = await getAdminArticle(id);
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json({
      title: article.draft.metadata.title,
      excerpt: article.draft.metadata.excerpt,
      html: renderArticleDocument(article.draft.document),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Article preview failed', error);
    return NextResponse.json({ error: 'Could not render preview' }, { status: 503 });
  }
}
