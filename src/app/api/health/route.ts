import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

export async function GET() {
  const releaseSha = process.env.RELEASE_SHA || 'unknown';
  try {
    const { env } = getCloudflareContext();
    if (!env.APP_DB) throw new Error('APP_DB binding is not configured.');
    if (
      env.DEPLOY_ENV !== process.env.DEPLOY_ENV ||
      env.SITE_ORIGIN !== process.env.SITE_ORIGIN ||
      env.INDEX_POLICY !== (process.env.DEPLOY_ENV === 'production' ? 'index' : 'noindex')
    ) {
      throw new Error('Build and runtime deployment identities do not match.');
    }
    await env.APP_DB.prepare('SELECT 1').first();
    const publishedView = await env.APP_DB
      .prepare("SELECT 1 AS ready FROM sqlite_master WHERE type = 'view' AND name = 'published_content'")
      .first();
    if (!publishedView) throw new Error('Required CMS schema is not available.');
    if (!env.NEXT_TAG_CACHE_D1) throw new Error('Cache D1 binding is not configured.');
    await env.NEXT_TAG_CACHE_D1.prepare('SELECT 1').first();
    return NextResponse.json(
      { status: 'ok', releaseSha },
      { status: 200, headers: { 'cache-control': 'no-store, max-age=0' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'unavailable', releaseSha },
      { status: 503, headers: { 'cache-control': 'no-store, max-age=0' } },
    );
  }
}
