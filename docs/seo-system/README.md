# SEO System Build

## Status

The SEO system foundation is ready when the five deliverables below exist and pass verification.

## Deliverables

| Round | Deliverable | Status | Primary files |
|---|---|---|---|
| 1 | Portfolio-to-Service Proof + Internal Links | Implemented | `src/lib/service-project-matching.ts`, `src/lib/service-linking.ts`, service pages, portfolio detail |
| 1.1 | Portfolio Proof Data Upgrade | Implemented | `src/lib/project-proof.ts`, `src/components/admin/ProjectForm.tsx`, `docs/seo-system/portfolio-proof-data.md` |
| 2 | Content Cluster / Article System Plan | Implemented | `docs/seo-system/content-cluster-plan.md` |
| 3 | Measurement + Conversion Tracking Spec | Implemented | `docs/seo-system/measurement-conversion-spec.md` |
| 4 | SEO Agent Operating Manual | Implemented | `docs/seo-system/seo-agent-operating-manual.md` |
| 5 | Automated SEO QA Script + Quality Gates | Implemented | `scripts/seo-qa.mjs`, `package.json`, `docs/seo-system/quality-gates.md` |

## Adjacent Growth Specs

These are outside the SEO foundation stop condition but connect to the same pages, proof data, and measurement system.

| Area | Status | Document |
|---|---|---|
| Google Ads URL and landing page concept | Drafted | `docs/google-ads/url-landing-page-concept-2026-07.md` |
| Google Ads dynamic keyword insertion contract | Drafted | `docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md` |
| Google Ads launch URL matrix and GTM/GA4 mapping | Drafted | `docs/google-ads/launch-url-matrix-conversion-mapping-2026-07.md`, `docs/google-ads/launch-url-matrix-2026-07.csv`, `docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv`, `docs/google-ads/ga4-custom-dimensions-2026-07.csv` |
| Google Ads GTM/GA4 implementation and QA runbook | Drafted | `docs/google-ads/gtm-ga4-implementation-checklist-2026-07.md`, `docs/google-ads/production-qa-runbook-2026-07.md`, `docs/google-ads/production-qa-test-cases-2026-07.csv` |
| Google Ads GTM/GA4 build sheets | Drafted | `docs/google-ads/gtm-container-build-sheet-2026-07.csv`, `docs/google-ads/google-ads-conversion-actions-2026-07.csv` |
| Google Ads controlled pilot and operating loop | Drafted | `docs/google-ads/pilot-launch-plan-2026-07.md`, `docs/google-ads/post-launch-operating-loop-2026-07.md`, `docs/google-ads/readiness-tracker-2026-07.csv`, `docs/google-ads/readiness-status-2026-07.md` |
| Google Ads local landing-page polish | In progress | `docs/google-ads/local-ads-landing-page-polish-2026-07.md`, `src/app/components/services/ServiceLandingPage.tsx`, `src/lib/google-ads-dynamic-content.ts` |
| Google Ads production QA evidence | Blocked | `docs/google-ads/production-qa-evidence-2026-07-25.md`, `docs/google-ads/readiness-status-2026-07.md` |

## Verification

Run these before treating SEO-system changes as ready:

```bash
yarn build
yarn type-check
yarn start -p 3000
yarn seo:qa
```

`yarn seo:qa` expects an app server at `http://localhost:3000` unless overridden:

```bash
yarn seo:qa --base=https://www.siamrooftech.com
```

## Stop Condition

After these deliverables are implemented, the project should stop adding SEO architecture by default. Future work should be operation work driven by evidence from GSC, GA4, GBP, crawl results, and portfolio data.

New architecture is allowed only when one of these is true:

- A new verified service or service area needs a canonical page.
- Search data shows a distinct intent that cannot be served by existing pages.
- The current system cannot measure or QA a required SEO workflow.
- Technical constraints changed because of deployment, CMS, analytics, or framework changes.
