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
  { path: '/projects', canonical: `${canonicalOrigin}/projects`, schema: ['CollectionPage'] },
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


const retiredProjectPaths = [
  '/portfolio',
  '/portfolio/LQfEBn95phGTTk9y7dsx',
  `/portfolio/category/${encodeURIComponent('ร้านอาหาร')}`,
  '/works',
  '/works/LQfEBn95phGTTk9y7dsx',
  '/works/not-a-real-project',
  '/allawning',
];

const retiredShortPortfolioSlugs = [
  '5x2-520680',
  '4-5x2-860430',
  '3-5x1.5-744861',
  '5x2-5-351507',
  '4-5x2-542650',
  '5x2-767881',
  '2x1-5-326707',
  '4-7x2.5-886205',
  '2x1-5-368997',
  '2-6x2-881761',
  '3x2-204672',
  '5-7x2.5-290684',
  '5x2-5-472465',
  '5-6x2-728032',
  '4-5x2.5-854715',
  '5-3x2.5-192907',
];

const previousProjectSlugs = [
  'retractable-awning-5x2-520680',
  'retractable-awning-4-5x2-860430',
  'retractable-awning-3-5x1-5-744861',
  'retractable-awning-5x2-5-351507',
  'retractable-awning-4-5x2-542650',
  'retractable-awning-5x2-767881',
  'retractable-awning-2x1-5-326707',
  'retractable-awning-4-7x2-5-886205',
  'retractable-awning-2x1-5-368997',
  'electric-awning-2-6x2-881761',
  'retractable-awning-3x2-204672',
  'retractable-awning-5-7x2-5-290684',
  'retractable-awning-5x2-5-472465',
  'retractable-awning-5-6x2-728032',
  'retractable-awning-4-5x2-5-854715',
  'retractable-awning-5-3x2-5-192907',
];

const retiredProjectIds = [
  '0xsjRpgMF3TUL2uBcpum',
  'IailaI60SuYGitQ5LtS9',
  '8GVaR1JAWdEl5ORKaLIb',
  '98u5zas9XNMfBTYdsmUH',
  'LQfEBn95phGTTk9y7dsx',
  'jBHjDK3XxsgETc9nvj3r',
  'dJ1kY665ES3tkn4I4E7f',
  'YsvKbIiaQVDi2SEhoFx3',
  '9cOoM17u6XoB4eJIQi6O',
  'u12Uzh3H1wJeNoLwsMO3',
  'XY5U8EZNDjSabhZN2jBM',
  'GStr1xNPDU91Y5PbZn3S',
  'O4X2bTHjDrQx4cXmU9bT',
  'KyeA2zp2JohVgZMD0WpA',
  'LRE2Xzf2H6faOfoMgC8N',
  'ANocfCe2kmiS4wdtv5Sm',
];

const portfolioUnknownPaths = [
  '/projects/not-a-real-project',
  '/projects/LQfEBn95phGTTk9y7dsx',
];

const sitemapResponse = await fetchPath('/sitemap.xml');
let sitemap = '';
if (sitemapResponse.status !== 200) {
  fail(`/sitemap.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  sitemap = await sitemapResponse.text();
}

const projectUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)]
  .map(([, value]) => new URL(value, canonicalOrigin).pathname)
  .filter((path) => path.startsWith('/projects/'));
if (projectUrls.length !== 16) {
  fail(`/sitemap.xml: expected 16 published project URLs, got ${projectUrls.length}`);
}
if (new Set(projectUrls).size !== projectUrls.length) {
  fail('/sitemap.xml: published project URLs are not unique');
}

for (const url of projectUrls) {
  const response = await fetchPath(url);
  if (response.status !== 200) {
    fail(`${url}: expected 200, got ${response.status}`);
    continue;
  }

  const html = await response.text();
  const canonical = getAttr(html, [
    /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i,
    /<link\s+href=["']([^"']*)["']\s+rel=["']canonical["']/i,
  ]);
  if (canonical !== `${canonicalOrigin}${url}`) {
    fail(`${url}: canonical mismatch. expected ${canonicalOrigin}${url}, got ${canonical || 'NONE'}`);
  }
  if (/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
    fail(`${url}: public project detail unexpectedly has noindex`);
  }
  const schemas = [];
  const jsonLdBlocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, block] of jsonLdBlocks) {
    try {
      schemas.push(JSON.parse(block));
    } catch {
      fail(`${url}: invalid JSON-LD in initial HTML`);
    }
  }
  if (!schemas.some((schema) => schema['@type'] === 'CreativeWork')) {
    fail(`${url}: missing CreativeWork schema in initial HTML`);
  }
  if (html.includes('/portfolio/') || html.includes('/works/')) {
    fail(`${url}: initial HTML contains retired project URLs`);
  }
}

for (const oldSlug of previousProjectSlugs) {
  retiredProjectPaths.push(`/portfolio/${oldSlug}`);
}
for (const oldSlug of retiredShortPortfolioSlugs) {
  retiredProjectPaths.push(`/portfolio/${oldSlug}`);
}
for (const oldId of retiredProjectIds) {
  retiredProjectPaths.push(`/works/${oldId}`);
}

for (const retiredPath of retiredProjectPaths) {
  const response = await fetchPath(retiredPath);
  if (response.status !== 404 || response.headers.has('location')) {
    fail(`${decodeURIComponent(retiredPath)}: expected 404 without Location, got ${response.status} (${response.headers.get('location') || 'no Location'})`);
  }
}

for (const unknownPath of portfolioUnknownPaths) {
  const response = await fetchPath(unknownPath);
  if (response.status !== 404 || response.headers.has('location')) {
    fail(`${unknownPath}: expected 404 without Location, got ${response.status} (${response.headers.get('location') || 'no Location'})`);
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

  if (page.path === '/projects') {
    for (const projectUrl of projectUrls) {
      if (!html.includes(`href="${projectUrl}"`)) {
        fail(`/projects: initial HTML is missing project link ${projectUrl}`);
      }
    }
    if (html.includes('useEffect')) {
      fail('/projects: initial HTML unexpectedly depends on client-side project loading');
    }
  }
}

if (sitemap) {
  for (const page of pages) {
    if (!sitemap.includes(page.path) && page.path !== '/') {
      fail(`/sitemap.xml: missing ${page.path}`);
    }
  }
  for (const projectUrl of projectUrls) {
    if (!sitemap.includes(`${canonicalOrigin}${projectUrl}`)) {
      fail(`/sitemap.xml: missing ${projectUrl}`);
    }
  }
  if (sitemap.includes('/portfolio') || sitemap.includes('/works') || sitemap.includes('/allawning')) {
    fail('/sitemap.xml: contains a retired project URL');
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
