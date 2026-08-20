import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './lib/csv.mjs';

// Single source of truth: the same CSVs that drive the GTM/GA4/Ads QA docs.
// This file parses them at run time instead of re-transcribing the values,
// so the two can never silently drift apart.

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '..', '..', 'docs', 'google-ads');

const readCsv = (filename) => parseCsv(readFileSync(join(DOCS_DIR, filename), 'utf8'));

// P0 events this rollout owns. calculator_* / portfolio_view_click /
// service_internal_link_click / contact_form_submit_success are explicitly
// Future in gtm-ga4-conversion-mapping-2026-07.csv and are intentionally
// excluded here -- build them when that work actually starts.
const P0_EVENTS = new Set([
  'line_click',
  'line_survey_start',
  'line_survey_complete',
  'phone_click',
  'contact_click',
]);

function loadVariables() {
  const rows = readCsv('gtm-container-build-sheet-2026-07.csv');
  return rows
    .filter((r) => r.build_type === 'Variable')
    .map((r) => ({ name: r.name, dataLayerKey: r.configuration }));
}

function loadTriggers() {
  const rows = readCsv('gtm-container-build-sheet-2026-07.csv');
  return rows
    .filter((r) => r.build_type === 'Trigger')
    .filter((r) => P0_EVENTS.has(r.configuration))
    .map((r) => ({ name: r.name, eventName: r.configuration }));
}

function loadTagSpecs() {
  const rows = readCsv('gtm-ga4-conversion-mapping-2026-07.csv');
  return rows
    .filter((r) => P0_EVENTS.has(r.data_layer_event))
    .map((r) => ({
      name: `GA4 Event - ${r.data_layer_event}`,
      eventName: r.ga4_event_name,
      triggerName: `CE - ${r.data_layer_event}`,
      parameterKeys: r.minimum_required_parameters.split(',').map((k) => k.trim()).filter(Boolean),
    }));
}

export const variables = loadVariables();
export const triggers = loadTriggers();
export const tagSpecs = loadTagSpecs();

// The first tag spec is the one you create by hand in the GTM UI once, as a
// schema template for the rest -- see gtm-setup.mjs and README.md for why.
export const templateTagSpec = tagSpecs.find((t) => t.name === 'GA4 Event - line_click');
