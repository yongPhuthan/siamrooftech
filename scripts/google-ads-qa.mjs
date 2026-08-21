#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value || true];
  })
);

const baseUrl = String(args.get('base') || process.env.ADS_QA_BASE_URL || 'http://localhost:3000');
const canonicalHost = String(args.get('host') || process.env.ADS_QA_HOST || 'www.siamrooftech.com');
const canonicalOrigin = `https://${canonicalHost}`;
const headers = {
  host: canonicalHost,
  'x-forwarded-proto': 'https',
};

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

async function fetchPath(path) {
  try {
    return await fetch(new URL(path, baseUrl), {
      headers,
      redirect: 'manual',
    });
  } catch (error) {
    throw new Error(`Cannot fetch ${baseUrl}${path}. Start the app first, e.g. "yarn start -p 3000". ${error.message}`);
  }
}

function getCookie(response, name) {
  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);

  for (const cookie of setCookies) {
    const match = cookie.match(new RegExp(`^${name}=([^;]*)`));
    if (match) return { value: match[1], raw: cookie };
  }

  return null;
}

async function checkPage({
  path,
  canonical,
  shouldInclude = [],
  shouldNotInclude = [],
}) {
  const response = await fetchPath(path);
  if (response.status !== 200) {
    fail(`${path}: expected 200, got ${response.status}`);
    return;
  }

  const html = await response.text();
  const renderedHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const canonicalValue = getAttr(html, [
    /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i,
    /<link\s+href=["']([^"']*)["']\s+rel=["']canonical["']/i,
  ]);
  const h1Count = [...renderedHtml.matchAll(/<h1[^>]*>/gi)].length;

  if (canonicalValue !== canonical) {
    fail(`${path}: canonical mismatch. expected ${canonical}, got ${canonicalValue || 'NONE'}`);
  }

  if (h1Count !== 1) {
    fail(`${path}: expected exactly one H1, got ${h1Count}`);
  }

  for (const text of shouldInclude) {
    if (!renderedHtml.includes(text)) {
      fail(`${path}: expected rendered approved text "${text}"`);
    }
  }

  for (const text of shouldNotInclude) {
    if (renderedHtml.includes(text)) {
      fail(`${path}: raw or invalid text leaked into rendered HTML: "${text}"`);
    }
  }
}

// --- P0: current pilot -- homepage + survey gate cookie ----------------------
// All P0 campaigns land on the homepage with no DKI params (see
// docs/google-ads/launch-url-matrix-2026-07.csv). The thing that actually
// gates the lead-persona survey is the srt_paid cookie set by middleware.ts,
// keyed only on gclid/gbraid/wbraid -- never utm_*, never ad_*.

async function checkGate({ path, shouldSetCookie, label }) {
  const response = await fetchPath(path);
  if (response.status !== 200) {
    fail(`${label} (${path}): expected 200, got ${response.status}`);
    return;
  }

  const cookie = getCookie(response, 'srt_paid');

  if (shouldSetCookie && !cookie) {
    fail(`${label} (${path}): expected srt_paid cookie to be set, none found`);
  }

  if (shouldSetCookie && cookie && cookie.value !== '1') {
    fail(`${label} (${path}): expected srt_paid=1, got srt_paid=${cookie.value}`);
  }

  if (shouldSetCookie && cookie && !/max-age=1800/i.test(cookie.raw)) {
    fail(`${label} (${path}): expected Max-Age=1800 on srt_paid cookie, got: ${cookie.raw}`);
  }

  if (!shouldSetCookie && cookie) {
    fail(`${label} (${path}): srt_paid cookie must NOT be set here, but got: ${cookie.raw}`);
  }
}

await checkGate({
  path: '/?gclid=qa-static-gclid',
  shouldSetCookie: true,
  label: 'paid session (gclid present)',
});

await checkGate({
  path: '/?gbraid=qa-static-gbraid',
  shouldSetCookie: true,
  label: 'paid session (gbraid present)',
});

await checkGate({
  path: '/',
  shouldSetCookie: false,
  label: 'organic session (no params)',
});

await checkGate({
  path: '/?utm_source=google_paid&utm_medium=paid&utm_campaign=qa_static',
  shouldSetCookie: false,
  label: 'UTM-only session (no gclid) -- must not open the gate',
});

await checkGate({
  path: '/services/retractable-awning?gclid=qa-static-gclid',
  shouldSetCookie: true,
  label: 'paid session on a /services/* path (gate applies site-wide, not just homepage)',
});

// --- Future: DKI capability check ---------------------------------------------
// Not part of the current P0 pilot (see dynamic-keyword-insertion-contract-
// 2026-07.md status note) -- these pages and their DKI rendering are still
// live in the code, just not what current ad campaigns link to. Kept so a
// regression here is still caught if the capability is reused later.

await checkPage({
  path: '/services/retractable-awning?ad_kw=retractable_awning&ad_audience=home&ad_area=bangkok&ad_intent=quote&srt_keyword=%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%AA%E0%B8%B2%E0%B8%94%E0%B8%9E%E0%B8%B1%E0%B8%9A%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B9%84%E0%B8%94%E0%B9%89',
  canonical: `${canonicalOrigin}/services/retractable-awning`,
  shouldInclude: [
    'ติดตั้งกันสาดพับเก็บได้ สำหรับบ้านพักอาศัย ในกรุงเทพ',
    'บริการติดตั้ง',
    'เตรียมข้อมูลประเมินราคา',
    'ส่งรูปและขนาดทาง LINE',
    'ส่งรูปให้ประเมินทาง LINE',
  ],
  shouldNotInclude: ['srt_keyword'],
});

await checkPage({
  path: '/services/retractable-awning/bangkok?ad_kw=retractable_awning&ad_audience=home&ad_area=nonthaburi&srt_keyword=%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%AA%E0%B8%B2%E0%B8%94%E0%B8%9E%E0%B8%B1%E0%B8%9A%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B9%84%E0%B8%94%E0%B9%89%20%E0%B8%99%E0%B8%99%E0%B8%97%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5',
  canonical: `${canonicalOrigin}/services/retractable-awning/bangkok`,
  shouldInclude: [
    'ติดตั้งกันสาดพับเก็บได้ สำหรับบ้านพักอาศัย ในกรุงเทพ',
  ],
  shouldNotInclude: [
    'ในนนทบุรี',
    'กันสาดพับเก็บได้ นนทบุรี',
  ],
});

await checkPage({
  path: '/services/retractable-awning?ad_kw=cheap_unknown_keyword&ad_audience=unknown&srt_keyword=%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%AA%E0%B8%B2%E0%B8%94%E0%B8%9E%E0%B8%B1%E0%B8%9A%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B9%84%E0%B8%94%E0%B9%89%E0%B8%A3%E0%B8%B2%E0%B8%84%E0%B8%B2%E0%B8%96%E0%B8%B9%E0%B8%81%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%AA%E0%B8%B8%E0%B8%94',
  canonical: `${canonicalOrigin}/services/retractable-awning`,
  shouldNotInclude: [
    'cheap_unknown_keyword',
    'กันสาดพับเก็บได้ราคาถูกที่สุด',
    'เตรียมข้อมูลประเมินราคา',
  ],
});

// --- P0: sitemap and source safety --------------------------------------------

const sitemapResponse = await fetchPath('/sitemap.xml');
if (sitemapResponse.status !== 200) {
  fail(`/sitemap.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  const sitemap = await sitemapResponse.text();
  for (const forbidden of ['ad_kw=', 'ad_audience=', 'ad_area=', 'srt_keyword=', 'gclid=', '/lp/google-ads']) {
    if (sitemap.includes(forbidden)) {
      fail(`/sitemap.xml: query variant or internal path leaked into sitemap (${forbidden})`);
    }
  }
}

const gtmSource = await readFile(resolve(process.cwd(), 'src/lib/gtm.ts'), 'utf8');
const requiredTrackedKeys = [
  'gclid',
  'gbraid',
  'wbraid',
  'gad_source',
  'gad_campaignid',
  'srt_platform',
  'srt_campaignid',
  'srt_adgroupid',
  'srt_adid',
  'srt_keyword',
  'srt_matchtype',
  'srt_device',
  'srt_network',
  'srt_location',
  'ad_kw',
  'ad_audience',
  'ad_area',
  'ad_intent',
];

for (const key of requiredTrackedKeys) {
  if (!gtmSource.includes(`'${key}'`)) {
    fail(`src/lib/gtm.ts: missing tracked query key ${key}`);
  }
}

const requiredSurveyExports = [
  'LEAD_PERSONAS',
  'isPaidLeadSession',
  'getStoredPersona',
  'setStoredPersona',
  'trackLineSurveyStart',
  'trackLineSurveyComplete',
];

for (const symbol of requiredSurveyExports) {
  if (!gtmSource.includes(symbol)) {
    fail(`src/lib/gtm.ts: missing lead-survey export ${symbol}`);
  }
}

const middlewareSource = await readFile(resolve(process.cwd(), 'src/middleware.ts'), 'utf8');
if (!middlewareSource.includes('srt_paid')) {
  fail('src/middleware.ts: missing srt_paid cookie logic');
}
for (const key of ['gclid', 'gbraid', 'wbraid']) {
  if (!middlewareSource.includes(`'${key}'`)) {
    fail(`src/middleware.ts: missing click-id key ${key} in cookie gate condition`);
  }
}

if (failures.length > 0) {
  console.error('Google Ads QA failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Google Ads QA passed at ${baseUrl}`);
