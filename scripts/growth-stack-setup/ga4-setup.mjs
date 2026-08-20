#!/usr/bin/env node
// Creates P0 custom dimensions and key events on a GA4 property from
// docs/google-ads/ga4-custom-dimensions-2026-07.csv and the key-events table
// in docs/google-ads/gtm-ga4-implementation-checklist-2026-07.md.
//
// See scripts/growth-stack-setup/README.md for required env vars.

import {
  listCustomDimensions,
  createCustomDimension,
  archiveCustomDimension,
  listKeyEvents,
  createKeyEvent,
  deleteKeyEvent,
} from './lib/ga4.mjs';
import { customDimensions, keyEvents } from './ga4-manifest.mjs';

const args = new Set(process.argv.slice(2));
const WIPE = args.has('--wipe');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

async function wipeExisting(property) {
  console.log('--wipe: archiving existing custom dimensions and deleting key events...');
  for (const dim of await listCustomDimensions(property)) {
    console.log(`  archive dimension: ${dim.displayName} (${dim.parameterName}, ${dim.scope})`);
    await archiveCustomDimension(dim.name);
  }
  for (const ke of await listKeyEvents(property)) {
    console.log(`  delete key event:  ${ke.eventName}`);
    await deleteKeyEvent(ke.name);
  }
  console.log(
    '  note: GA4 can take up to ~24h before an archived parameterName is reusable. ' +
      'On a brand-new property there is nothing to archive, so this only matters on re-runs.',
  );
}

async function ensureCustomDimensions(property) {
  const existing = new Set(
    (await listCustomDimensions(property)).map((d) => `${d.parameterName}:${d.scope}`),
  );
  for (const dim of customDimensions) {
    const key = `${dim.parameterName}:${dim.scope}`;
    if (existing.has(key)) {
      console.log(`  already exists: ${dim.displayName} (${key})`);
      continue;
    }
    console.log(`  create dimension: ${dim.displayName} (${key})`);
    await createCustomDimension(property, dim);
  }
}

async function ensureKeyEvents(property) {
  const existing = new Set((await listKeyEvents(property)).map((k) => k.eventName));
  for (const ke of keyEvents) {
    if (existing.has(ke.eventName)) {
      console.log(`  already exists: ${ke.eventName}`);
      continue;
    }
    console.log(`  create key event: ${ke.eventName} (${ke.countingMethod})`);
    await createKeyEvent(property, ke);
  }
}

async function main() {
  const propertyId = requireEnv('GA4_PROPERTY_ID'); // numeric id, e.g. "123456789"
  const property = `properties/${propertyId}`;

  if (WIPE) {
    await wipeExisting(property);
  }

  console.log('\nCustom dimensions:');
  await ensureCustomDimensions(property);

  console.log('\nKey events:');
  console.log(
    '  Only line_survey_complete and phone_click -- line_click stays a non-key event ' +
      '(analytics only, denominator for survey completion rate). See pilot-launch-plan-2026-07.md.',
  );
  await ensureKeyEvents(property);

  console.log('\nDone. New key events can take up to 24-48h to propagate to Google Ads.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
