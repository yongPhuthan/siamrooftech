#!/usr/bin/env node

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value || true];
  })
);

const baseUrl = String(args.get('base') || process.env.SEO_QA_BASE_URL || 'http://localhost:3000');
const canonicalHost = String(args.get('host') || process.env.SEO_QA_HOST || 'www.siamrooftech.com');
const canonicalOrigin = `https://${canonicalHost}`;
const headers = {
  host: canonicalHost,
  'x-forwarded-proto': 'https',
};

const pages = [
  { path: '/', canonical: canonicalOrigin, schema: ['LocalBusiness', 'FAQPage'] },
  { path: '/contact', canonical: `${canonicalOrigin}/contact` },
  { path: '/portfolio', canonical: `${canonicalOrigin}/portfolio`, schema: ['CollectionPage'] },
  { path: '/articles', canonical: `${canonicalOrigin}/articles` },
  { path: '/services/retractable-awning', canonical: `${canonicalOrigin}/services/retractable-awning`, schema: ['Service', 'FAQPage'] },
  { path: '/services/electric-retractable-awning', canonical: `${canonicalOrigin}/services/electric-retractable-awning`, schema: ['Service', 'FAQPage'] },
  { path: '/services/retractable-awning/bangkok', canonical: `${canonicalOrigin}/services/retractable-awning/bangkok`, schema: ['Service', 'FAQPage'] },
  { path: '/services/retractable-awning/nonthaburi', canonical: `${canonicalOrigin}/services/retractable-awning/nonthaburi`, schema: ['Service', 'FAQPage'] },
  { path: '/services/retractable-awning/pathum-thani', canonical: `${canonicalOrigin}/services/retractable-awning/pathum-thani`, schema: ['Service', 'FAQPage'] },
];

const legacyRedirects = [
  ['/%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%AA%E0%B8%B2%E0%B8%94%E0%B8%9E%E0%B8%B1%E0%B8%9A%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B9%84%E0%B8%94%E0%B9%89', '/services/retractable-awning'],
  ['/%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%AA%E0%B8%B2%E0%B8%94%E0%B8%9E%E0%B8%B1%E0%B8%9A%E0%B9%84%E0%B8%9F%E0%B8%9F%E0%B9%89%E0%B8%B2', '/services/electric-retractable-awning'],
  ['/%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%AA%E0%B8%B2%E0%B8%94%E0%B8%9E%E0%B8%B1%E0%B8%9A%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B9%84%E0%B8%94%E0%B9%89/%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E', '/services/retractable-awning/bangkok'],
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function getAttr(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }

  return '';
}

async function fetchPath(path, options = {}) {
  try {
    return await fetch(new URL(path, baseUrl), {
      headers,
      redirect: 'manual',
      ...options,
    });
  } catch (error) {
    throw new Error(`Cannot fetch ${baseUrl}${path}. Start the app first, e.g. "yarn start -p 3000". ${error.message}`);
  }
}

for (const page of pages) {
  const response = await fetchPath(page.path);
  if (response.status !== 200) {
    fail(`${page.path}: expected 200, got ${response.status}`);
    continue;
  }

  const html = await response.text();
  const canonical = getAttr(html, [
    /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i,
    /<link\s+href=["']([^"']*)["']\s+rel=["']canonical["']/i,
  ]);
  const title = getAttr(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]).replace(/\s+/g, ' ').trim();
  const h1Count = [...html.matchAll(/<h1[^>]*>/gi)].length;

  if (canonical !== page.canonical) {
    fail(`${page.path}: canonical mismatch. expected ${page.canonical}, got ${canonical || 'NONE'}`);
  }

  if (h1Count !== 1) {
    fail(`${page.path}: expected exactly one H1, got ${h1Count}`);
  }

  if ([...title].length > 75) {
    fail(`${page.path}: title too long (${[...title].length} chars)`);
  }

  for (const schemaType of page.schema || []) {
    if (!html.includes(`"@type":"${schemaType}"`) && !html.includes(`"@type":["${schemaType}"`)) {
      fail(`${page.path}: missing ${schemaType} schema`);
    }
  }
}

const sitemapResponse = await fetchPath('/sitemap.xml');
if (sitemapResponse.status !== 200) {
  fail(`/sitemap.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  const sitemap = await sitemapResponse.text();
  for (const page of pages) {
    if (!sitemap.includes(page.path) && page.path !== '/') {
      fail(`/sitemap.xml: missing ${page.path}`);
    }
  }
}

const robotsResponse = await fetchPath('/robots.txt');
if (robotsResponse.status !== 200) {
  fail(`/robots.txt: expected 200, got ${robotsResponse.status}`);
} else {
  const robots = await robotsResponse.text();
  if (robots.includes('GPTBot') || robots.includes('ChatGPT-User')) {
    fail('/robots.txt: AI crawlers should not be explicitly blocked');
  }
  if (!robots.includes('/sitemap.xml')) {
    fail('/robots.txt: missing sitemap reference');
  }
}

for (const [legacyPath, expectedTarget] of legacyRedirects) {
  const response = await fetchPath(legacyPath);
  const location = response.headers.get('location') || '';
  if (response.status !== 308) {
    fail(`${decodeURIComponent(legacyPath)}: expected 308 redirect, got ${response.status}`);
  }

  if (!location.endsWith(expectedTarget) && location !== expectedTarget) {
    fail(`${decodeURIComponent(legacyPath)}: expected redirect to ${expectedTarget}, got ${location || 'NONE'}`);
  }
}

if (failures.length > 0) {
  console.error('SEO QA failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`SEO QA passed for ${pages.length} pages at ${baseUrl}`);
