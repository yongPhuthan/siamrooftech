import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from './lib/seo-config';

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

export function middleware(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') || request.nextUrl.host;
  const hostname = normalizeHost(host);
  const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '');
  const isLocalHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const decodedPathname = decodeURIComponent(request.nextUrl.pathname);
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

  if (!isLocalHost && (hostname !== CANONICAL_HOST || protocol !== 'https')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = CANONICAL_HOST;
    url.port = '';

    return NextResponse.redirect(url, 308);
  }

  if (shouldRewriteGoogleAdsLandingPage(request)) {
    return rewriteGoogleAdsLandingPage(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
