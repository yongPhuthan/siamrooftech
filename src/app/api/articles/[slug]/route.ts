import { NextRequest, NextResponse } from 'next/server';
import { getPublishedArticleBySlug } from '@/features/articles/server/repository';

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug);
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json(article, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  } catch (error) {
    console.error('Public article fetch failed', error);
    return NextResponse.json({ error: 'Article is unavailable' }, { status: 503 });
  }
}
