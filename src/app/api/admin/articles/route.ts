import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { ArticleDraftInputSchema } from '@/features/articles/document-schema';
import { createArticleDraft, listAdminArticleSummaries } from '@/features/articles/server/repository';
import { revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  try {
    return NextResponse.json(await listAdminArticleSummaries(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Admin article list failed', error);
    return NextResponse.json({ error: 'Failed to list articles' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const body = await request.json().catch(() => null) as unknown;
  const parsed = ArticleDraftInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid draft', issues: parsed.error.issues }, { status: 400 });
  try {
    const article = await createArticleDraft(parsed.data.metadata, parsed.data.document, parsed.data.seoSettings);
    revalidateTag('articles');
    return NextResponse.json(article, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Admin article creation failed', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 503 });
  }
}
