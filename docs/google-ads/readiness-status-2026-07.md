# Google Ads Readiness Status

Generated: 2026-07-25T03:58:23.185Z

## Decision

| Area | Status |
| --- | --- |
| Repository artifacts | PASS |
| Pilot launch readiness | BLOCK_EXTERNAL_WIRING |

## Passing Evidence

- All 21 required Google Ads readiness files exist
- docs/google-ads/launch-url-matrix-2026-07.csv: 13 data rows, 11 columns OK
- docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv: 10 data rows, 9 columns OK
- docs/google-ads/ga4-custom-dimensions-2026-07.csv: 19 data rows, 5 columns OK
- docs/google-ads/gtm-container-build-sheet-2026-07.csv: 31 data rows, 7 columns OK
- docs/google-ads/google-ads-conversion-actions-2026-07.csv: 9 data rows, 7 columns OK
- docs/google-ads/production-qa-test-cases-2026-07.csv: 16 data rows, 7 columns OK
- docs/google-ads/readiness-tracker-2026-07.csv: 23 data rows, 6 columns OK
- package.json exposes seo:qa, ads:qa, ads:readiness, and ads:browser-qa
- src/lib/gtm.ts has required attribution keys and primary lead events
- Server-rendered data-analytics CTA links are wired to primary tracking events
- DKI whitelist and internal middleware rewrite are present
- P0 launch matrix and pilot guardrails are present
- Readiness tracker covers repo-complete work and external production gates

## Repository Findings

- None

## External Production Gates Still Required

- GA4 base tag installed on production
- line_click GA4 event tag configured
- phone_click GA4 event tag configured
- Google Ads imports/creates primary conversions
- Automated SEO QA passes
- Automated Ads QA passes
- Browser dataLayer smoke QA passes
- GTM Preview validates line_click and phone_click
- GA4 DebugView receives primary events with params

## Latest Production QA Evidence

- Current production QA evidence exists: docs/google-ads/production-qa-evidence-2026-07-25.md
- Latest recorded production decision: BLOCK
- Required service/Ads landing URLs returned 404 on production during the recorded run.

## Required Commands Before Launch

```bash
yarn type-check
yarn build
yarn seo:qa --base=https://www.siamrooftech.com
yarn ads:qa --base=https://www.siamrooftech.com
yarn ads:browser-qa --base=https://www.siamrooftech.com
yarn ads:readiness
```

## Final Rule

Do not launch the Google Ads pilot until repository artifacts pass and every external production gate has current evidence from GTM Preview, GA4 DebugView, Google Ads conversions, and production URL QA.
