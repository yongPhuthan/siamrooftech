import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './lib/csv.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '..', '..', 'docs', 'google-ads');

const rows = parseCsv(
  readFileSync(join(DOCS_DIR, 'ga4-custom-dimensions-2026-07.csv'), 'utf8'),
);

// GA4's customDimensions.displayName only accepts alphanumeric, underscore,
// or space -- the docs/google-ads CSV is prose-first and uses things like
// "Lead persona (user)" for human readers, so sanitize at this boundary
// rather than constraining how the doc is written.
const sanitizeDisplayName = (name) => name.replace(/[^A-Za-z0-9_ ]/g, '').replace(/\s+/g, ' ').trim();

export const customDimensions = rows
  .filter((r) => r.priority === 'P0')
  .map((r) => ({
    displayName: sanitizeDisplayName(r.ga4_dimension_name),
    parameterName: r.event_parameter,
    scope: r.scope.toUpperCase(),
    description: r.purpose.slice(0, 150),
  }));

// Key events (formerly "conversion events"). Not CSV-driven: this list is a
// direct transcription of the "GA4 key events" table in
// docs/google-ads/gtm-ga4-implementation-checklist-2026-07.md, which is
// prose, not structured data. Keep the two in sync by hand if that table
// changes.
export const keyEvents = [
  { eventName: 'line_survey_complete', countingMethod: 'ONCE_PER_EVENT' },
  { eventName: 'phone_click', countingMethod: 'ONCE_PER_EVENT' },
];
