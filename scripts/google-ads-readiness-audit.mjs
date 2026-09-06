#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value || true];
  }),
);

const writeReport = Boolean(args.get('write-report'));
const strict = Boolean(args.get('strict'));
const reportPath = String(
  args.get('report') || 'docs/google-ads/readiness-status-2026-07.md',
);

const requiredFiles = [
  'docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md',
  'docs/google-ads/url-landing-page-concept-2026-07.md',
  'docs/google-ads/launch-url-matrix-conversion-mapping-2026-07.md',
  'docs/google-ads/launch-url-matrix-2026-07.csv',
  'docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv',
  'docs/google-ads/ga4-custom-dimensions-2026-07.csv',
  'docs/google-ads/gtm-container-build-sheet-2026-07.csv',
  'docs/google-ads/google-ads-conversion-actions-2026-07.csv',
  'docs/google-ads/gtm-ga4-implementation-checklist-2026-07.md',
  'docs/google-ads/production-qa-runbook-2026-07.md',
  'docs/google-ads/production-qa-test-cases-2026-07.csv',
  'docs/google-ads/production-qa-evidence-2026-07-25.md',
  'docs/google-ads/pilot-launch-plan-2026-07.md',
  'docs/google-ads/post-launch-operating-loop-2026-07.md',
  'docs/google-ads/readiness-tracker-2026-07.csv',
  'scripts/google-ads-qa.mjs',
  'scripts/seo-qa.mjs',
  'scripts/google-ads-browser-qa.mjs',
  'src/lib/gtm.ts',
  'src/lib/google-ads-dynamic-content.ts',
  'src/middleware.ts',
];

const csvFiles = [
  'docs/google-ads/launch-url-matrix-2026-07.csv',
  'docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv',
  'docs/google-ads/ga4-custom-dimensions-2026-07.csv',
  'docs/google-ads/gtm-container-build-sheet-2026-07.csv',
  'docs/google-ads/google-ads-conversion-actions-2026-07.csv',
  'docs/google-ads/production-qa-test-cases-2026-07.csv',
  'docs/google-ads/readiness-tracker-2026-07.csv',
];

const requiredTrackedKeys = [
  'gclid',
  'gbraid',
  'wbraid',
  'gad_source',
  'gad_campaignid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
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

const requiredEvents = [
  'line_click',
  'phone_click',
  'contact_click',
  'portfolio_view_click',
];

const requiredP0Campaigns = [
  'TH_Search_NonBrand_Core',
  'TH_Search_Electric',
  'TH_Search_Local_Bangkok',
  'TH_Search_Local_Nonthaburi',
  'TH_Search_Local_PathumThani',
];

const findings = [];
const passes = [];
const externalBlocks = [];

function pass(message) {
  passes.push(message);
}

function fail(message) {
  findings.push(message);
}

function external(message) {
  externalBlocks.push(message);
}

function parseCsvLine(line) {
  const out = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      out.push(cell);
      cell = '';
    } else {
      cell += ch;
    }
  }

  out.push(cell);
  return out;
}

async function readText(path) {
  return readFile(resolve(process.cwd(), path), 'utf8');
}

function validateRequiredFiles() {
  for (const file of requiredFiles) {
    if (!existsSync(resolve(process.cwd(), file))) {
      fail(`Missing required file: ${file}`);
    }
  }

  if (findings.length === 0) {
    pass(`All ${requiredFiles.length} required Google Ads readiness files exist`);
  }
}

async function validateCsvFiles() {
  for (const file of csvFiles) {
    const text = await readText(file);
    const lines = text.trim().split(/\r?\n/);
    const expected = parseCsvLine(lines[0]).length;
    const bad = lines
      .map((line, idx) => [idx + 1, parseCsvLine(line).length])
      .filter(([, count]) => count !== expected);

    if (bad.length > 0) {
      fail(`${file}: invalid CSV column counts ${JSON.stringify(bad)}`);
    } else {
      pass(`${file}: ${lines.length - 1} data rows, ${expected} columns OK`);
    }
  }
}

async function validatePackageScripts() {
  const packageJson = JSON.parse(await readText('package.json'));
  const scripts = packageJson.scripts || {};

  for (const scriptName of ['seo:qa', 'ads:qa', 'ads:readiness', 'ads:browser-qa']) {
    if (!scripts[scriptName]) {
      fail(`package.json missing script: ${scriptName}`);
    }
  }

  if (scripts['seo:qa'] && scripts['ads:qa'] && scripts['ads:readiness'] && scripts['ads:browser-qa']) {
    pass('package.json exposes seo:qa, ads:qa, ads:readiness, and ads:browser-qa');
  }
}

async function validateGtmSource() {
  const source = await readText('src/lib/gtm.ts');
  const attributionCaptureSource = await readText('src/app/components/AttributionCapture.tsx');

  for (const key of requiredTrackedKeys) {
    if (!source.includes(`'${key}'`)) {
      fail(`src/lib/gtm.ts missing tracked query key: ${key}`);
    }
  }

  for (const eventName of requiredEvents) {
    if (!source.includes(`event: '${eventName}'`)) {
      fail(`src/lib/gtm.ts missing event payload: ${eventName}`);
    }
  }

  if (!source.includes("conversion_priority: 'secondary'")) {
    fail('src/lib/gtm.ts missing secondary conversion_priority marker for CTA diagnostics');
  }

  if (!source.includes('page_location') || !source.includes('page_path')) {
    fail('src/lib/gtm.ts missing page context parameters');
  }

  if (!source.includes('localStorage') || !source.includes('first_landing_path')) {
    fail('src/lib/gtm.ts missing first/latest attribution storage');
  }

  if (
    !attributionCaptureSource.includes("document.addEventListener('click'") ||
    !attributionCaptureSource.includes('a[data-analytics-type]') ||
    !attributionCaptureSource.includes('trackLineClick') ||
    !attributionCaptureSource.includes('trackPhoneClick')
  ) {
    fail('AttributionCapture missing global data-analytics click tracking for server-rendered CTAs');
  }

  const gtmFailures = findings.filter((item) => item.includes('src/lib/gtm.ts'));
  const trackingFailures = findings.filter(
    (item) => item.includes('src/lib/gtm.ts') || item.includes('AttributionCapture'),
  );
  if (gtmFailures.length === 0) {
    pass('src/lib/gtm.ts has required attribution keys and diagnostic CTA events');
  }

  if (trackingFailures.length === 0) {
    pass('Server-rendered data-analytics CTA links are wired to diagnostic tracking events');
  }
}

async function validateDkiAndMiddleware() {
  const dkiSource = await readText('src/lib/google-ads-dynamic-content.ts');
  const middlewareSource = await readText('src/middleware.ts');

  for (const token of [
    'retractable_awning',
    'electric_awning',
    'manual_awning',
    'home',
    'restaurant',
    'cafe',
    'office',
    'bangkok',
    'nonthaburi',
    'pathum_thani',
    'quote',
    'consult',
    'compare',
  ]) {
    if (!dkiSource.includes(token)) {
      fail(`src/lib/google-ads-dynamic-content.ts missing approved token: ${token}`);
    }
  }

  if (dkiSource.includes('srt_keyword')) {
    fail('DKI source references srt_keyword; raw keyword must not render');
  }

  if (!middlewareSource.includes('/lp/google-ads/') || !middlewareSource.includes('NextResponse.rewrite')) {
    fail('src/middleware.ts missing Google Ads internal rewrite');
  }

  const relatedFailures = findings.filter(
    (item) =>
      item.includes('google-ads-dynamic-content') ||
      item.includes('middleware') ||
      item.includes('DKI source'),
  );

  if (relatedFailures.length === 0) {
    pass('DKI whitelist and internal middleware rewrite are present');
  }
}

async function validateLaunchMatrix() {
  const launchMatrix = await readText('docs/google-ads/launch-url-matrix-2026-07.csv');
  const pilotPlan = await readText('docs/google-ads/pilot-launch-plan-2026-07.md');

  for (const campaign of requiredP0Campaigns) {
    if (!launchMatrix.includes(campaign)) {
      fail(`Launch URL matrix missing P0 campaign: ${campaign}`);
    }
  }

  for (const forbidden of ['Performance Max | On', 'Broad match | On', 'Search Partners | On']) {
    if (pilotPlan.includes(forbidden)) {
      fail(`Pilot plan has unsafe launch setting: ${forbidden}`);
    }
  }

  for (const required of [
    'Search Partners | Off',
    'Display Network | Off',
    'Broad match | Off',
    'Exact and Phrase',
    'line_click',
    'phone_click',
    'contact_click',
  ]) {
    if (!pilotPlan.includes(required)) {
      fail(`Pilot plan missing required guardrail: ${required}`);
    }
  }

  const matrixFailures = findings.filter(
    (item) => item.includes('Launch URL matrix') || item.includes('Pilot plan'),
  );
  if (matrixFailures.length === 0) {
    pass('P0 launch matrix and pilot guardrails are present');
  }
}

async function validateReadinessTracker() {
  const tracker = await readText('docs/google-ads/readiness-tracker-2026-07.csv');

  for (const required of [
    'Production Tracking Wiring',
    'Production QA',
    'Google Ads Pilot Launch Plan',
    'Post-Launch Operating Loop',
    'SEO Safety',
  ]) {
    if (!tracker.includes(required)) {
      fail(`Readiness tracker missing workstream: ${required}`);
    }
  }

  for (const requiredExternal of [
    'GA4 base tag installed on production',
    'line_click GA4 event tag configured',
    'phone_click GA4 event tag configured',
    'Google Ads imports/creates primary conversions',
    'Automated SEO QA passes',
    'Automated Ads QA passes',
    'Browser dataLayer smoke QA passes',
    'GTM Preview validates line_click and phone_click',
    'GA4 DebugView receives primary events with params',
  ]) {
    if (!tracker.includes(requiredExternal)) {
      fail(`Readiness tracker missing external gate: ${requiredExternal}`);
    } else {
      external(requiredExternal);
    }
  }

  const trackerFailures = findings.filter((item) => item.includes('Readiness tracker'));
  if (trackerFailures.length === 0) {
    pass('Readiness tracker covers repo-complete work and external production gates');
  }
}

function buildReport() {
  const repoDecision = findings.length === 0 ? 'PASS' : 'FAIL';
  const pilotDecision =
    findings.length > 0 ? 'BLOCK_REPO_FIXES' : externalBlocks.length > 0 ? 'BLOCK_EXTERNAL_WIRING' : 'PASS';
  const generatedAt = new Date().toISOString();
  const productionEvidencePath = 'docs/google-ads/production-qa-evidence-2026-07-25.md';
  const hasProductionBlockEvidence = existsSync(resolve(process.cwd(), productionEvidencePath));

  const lines = [
    '# Google Ads Readiness Status',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Decision',
    '',
    `| Area | Status |`,
    `| --- | --- |`,
    `| Repository artifacts | ${repoDecision} |`,
    `| Pilot launch readiness | ${pilotDecision} |`,
    '',
    '## Passing Evidence',
    '',
    ...passes.map((item) => `- ${item}`),
    '',
    '## Repository Findings',
    '',
    ...(findings.length > 0 ? findings.map((item) => `- ${item}`) : ['- None']),
    '',
    '## External Production Gates Still Required',
    '',
    ...externalBlocks.map((item) => `- ${item}`),
    '',
    '## Latest Production QA Evidence',
    '',
    ...(hasProductionBlockEvidence
      ? [
          `- Current production QA evidence exists: ${productionEvidencePath}`,
          '- Latest recorded production decision: BLOCK',
          '- Required service/Ads landing URLs returned 404 on production during the recorded run.',
        ]
      : ['- No production QA evidence artifact found.']),
    '',
    '## Required Commands Before Launch',
    '',
    '```bash',
    'yarn type-check',
    'yarn build',
    'yarn seo:qa --base=https://www.siamrooftech.com',
    'yarn ads:qa --base=https://www.siamrooftech.com',
    'yarn ads:browser-qa --base=https://www.siamrooftech.com',
    'yarn ads:readiness',
    '```',
    '',
    '## Final Rule',
    '',
    'Do not launch the Google Ads pilot until repository artifacts pass and every external production gate has current evidence from GTM Preview, GA4 DebugView, Google Ads conversions, and production URL QA.',
    '',
  ];

  return { pilotDecision, repoDecision, text: lines.join('\n') };
}

validateRequiredFiles();
await validateCsvFiles();
await validatePackageScripts();
await validateGtmSource();
await validateDkiAndMiddleware();
await validateLaunchMatrix();
await validateReadinessTracker();

const report = buildReport();

if (writeReport) {
  await writeFile(resolve(process.cwd(), reportPath), report.text, 'utf8');
}

console.log(report.text);

if (findings.length > 0 || (strict && externalBlocks.length > 0)) {
  process.exit(1);
}
