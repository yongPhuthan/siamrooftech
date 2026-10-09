import { NextResponse } from 'next/server';
import { getPublishedArticles } from '@/features/articles/server/repository';

export async function GET() {
  try {
    const articles = await getPublishedArticles();
    return NextResponse.json(articles, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  } catch (error) {
    console.error('Public article listing failed', error);
    return NextResponse.json({ error: 'Articles are unavailable' }, { status: 503 });
  }
}
