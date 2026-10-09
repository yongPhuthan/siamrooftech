import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { DEPLOYMENT_ENV, SITE_URL } from './lib/seo-config';
import { isValidArticleSlug } from './features/articles/article-path';

const CANONICAL_HOST = new URL(SITE_URL).host;
const LEGACY_SERVICE_PATHS: Record<string, string> = {
  '/กันสาดพับเก็บได้': '/services/retractable-awning',
  '/กันสาดพับไฟฟ้า': '/services/electric-retractable-awning',
  '/กันสาดพับเก็บได้/กรุงเทพ': '/services/retractable-awning/bangkok',
  '/กันสาดพับเก็บได้/นนทบุรี': '/services/retractable-awning/nonthaburi',
  '/กันสาดพับเก็บได้/ปทุมธานี': '/services/retractable-awning/pathum-thani',
};
const GOOGLE_ADS_DYNAMIC_QUERY_KEYS = ['ad_kw', 'ad_audience', 'ad_area', 'ad_intent'];
const GOOGLE_ADS_SERVICE_PATHS = new Set([
  '/services/retractable-awning',
  '/services/electric-retractable-awning',
  '/services/retractable-awning/bangkok',
  '/services/retractable-awning/nonthaburi',
  '/services/retractable-awning/pathum-thani',
]);
const RETIRED_PROJECT_PATH_PREFIXES = ['/portfolio', '/works', '/allawning'];

function isRetiredProjectPath(pathname: string): boolean {
  return RETIRED_PROJECT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const ARTICLE_NOT_FOUND_HTML = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ไม่พบบทความ | Siamrooftech</title></head><body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif"><main style="max-width:42rem;margin:15vh auto;padding:2rem"><p style="color:#2563eb;font-weight:700">SIAMROOFTECH</p><h1>ไม่พบบทความ</h1><p style="color:#64748b">บทความนี้อาจถูกยกเลิกหรือยังไม่ได้เผยแพร่</p><a href="/articles" style="color:#2563eb">ดูบทความทั้งหมด</a></main></body></html>`;

function normalizeHost(host: string): string {
  if (host.startsWith('[')) {
    return host.slice(1, host.indexOf(']'));
  }

  return host.replace(/:\d+$/, '');
}

function shouldRewriteGoogleAdsLandingPage(request: NextRequest): boolean {
  return (
    GOOGLE_ADS_SERVICE_PATHS.has(request.nextUrl.pathname) &&
    GOOGLE_ADS_DYNAMIC_QUERY_KEYS.some((key) => request.nextUrl.searchParams.has(key))
  );
}

function rewriteGoogleAdsLandingPage(request: NextRequest) {
  const url = request.nextUrl.clone();
  const serviceSlug = request.nextUrl.pathname.replace(/^\/services\//, '');
  url.pathname = `/lp/google-ads/${serviceSlug}`;

  return NextResponse.rewrite(url);
}

function articleNotFound() {
  return new NextResponse(ARTICLE_NOT_FOUND_HTML, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

async function isPublishedContent(kind: 'article' | 'project', pathname: string): Promise<boolean> {
  const { env } = getCloudflareContext();
  if (!env.APP_DB) throw new Error('APP_DB binding is not configured for this deployment.');
  const row = await env.APP_DB
    .prepare('SELECT 1 AS published FROM published_content WHERE kind = ? AND path = ? LIMIT 1')
    .bind(kind, pathname)
    .first<{ published: number }>();

  return row?.published === 1;
}

export async function middleware(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') || request.nextUrl.host;
  const hostname = normalizeHost(host);
  const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '');
  const isLocalHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const decodedPathname = decodeURIComponent(request.nextUrl.pathname);

  // Retired project URLs must be genuine 404s on every host, before canonical-host redirects.
  if (isRetiredProjectPath(decodedPathname)) {
    const response = new NextResponse('Not Found', { status: 404 });
    if (DEPLOYMENT_ENV === 'staging') {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
    return response;
  }

  const serviceRedirectPath = LEGACY_SERVICE_PATHS[decodedPathname];

  if (serviceRedirectPath) {
    const url = request.nextUrl.clone();
    url.pathname = serviceRedirectPath;

    if (!isLocalHost) {
      url.protocol = 'https';
      url.host = CANONICAL_HOST;
      url.port = '';
    }

    return NextResponse.redirect(url, 308);
  }

  const expectedHost = new URL(SITE_URL).host;
  if (!isLocalHost && (hostname !== expectedHost || protocol !== 'https')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = CANONICAL_HOST;
    url.port = '';

    return NextResponse.redirect(url, 308);
  }

  if (DEPLOYMENT_ENV === 'staging') {
    const response = await continueRequest(request, decodedPathname);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  return continueRequest(request, decodedPathname);
}

async function continueRequest(request: NextRequest, decodedPathname: string): Promise<NextResponse> {
  if (decodedPathname.startsWith('/articles/')) {
    const slug = decodedPathname.slice('/articles/'.length);
    if (!isValidArticleSlug(slug)) return articleNotFound();
    if (!(await isPublishedContent('article', `/articles/${slug}`))) {
      return articleNotFound();
    }
  }

  if (decodedPathname.startsWith('/projects/')) {
    const slug = decodedPathname.slice('/projects/'.length);
    if (!slug || slug.includes('/')) return new NextResponse('Not Found', { status: 404 });
    if (!(await isPublishedContent('project', `/projects/${slug}`))) return new NextResponse('Not Found', { status: 404 });
  }

  if (shouldRewriteGoogleAdsLandingPage(request)) {
    return rewriteGoogleAdsLandingPage(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'experimental-edge',
};
