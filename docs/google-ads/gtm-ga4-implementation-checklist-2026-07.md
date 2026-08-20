# GTM/GA4 Implementation Checklist For Google Ads Launch

Date: 2026-07-25

## Purpose

Turn the Google Ads URL matrix and conversion mapping into a concrete GTM/GA4 setup checklist.

This checklist does not launch paid traffic by itself. It prepares measurement so the first paid traffic test can be evaluated by lead actions, not only clicks.

Official references:

- Set up Google Analytics in Tag Manager: https://support.google.com/tagmanager/answer/9442095
- Set up Google Analytics events in Tag Manager: https://support.google.com/tagmanager/answer/13034206
- GA4 DebugView: https://support.google.com/analytics/answer/7201382
- GA4 custom dimensions and metrics: https://support.google.com/analytics/answer/14240153
- Google Ads web conversion setup: https://support.google.com/google-ads/answer/16560108

## Input Artifacts

- `docs/google-ads/launch-url-matrix-2026-07.csv`
- `docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv`
- `docs/google-ads/ga4-custom-dimensions-2026-07.csv`
- `docs/google-ads/gtm-container-build-sheet-2026-07.csv`
- `docs/google-ads/google-ads-conversion-actions-2026-07.csv`
- `docs/google-ads/launch-url-matrix-conversion-mapping-2026-07.md`

## P0 Implementation Checklist

### 1. Account and container prerequisites

| Step | Owner | Expected result | Status |
| --- | --- | --- | --- |
| Confirm production domain is `https://www.siamrooftech.com` | Dev/SEO | Canonical host matches website config | Pending |
| Confirm GTM container ID used by production | Analytics/dev | One approved container ID is documented | Pending |
| Confirm GA4 measurement ID | Analytics | One approved GA4 web stream ID is documented | Pending |
| Confirm Google Ads account is the clean new account | Ads owner | Old billing-risk account is not linked | Pending |
| Enable Google Ads auto-tagging | Ads owner | `gclid` can be appended by Google Ads | Pending |
| Link GA4 property to Google Ads | Ads/analytics | GA4 events can later be imported | Pending |

### 2. GTM base tags

| Step | Tag | Trigger | Expected result | Status |
| --- | --- | --- | --- | --- |
| Create or confirm Google tag / GA4 base tag | Google tag or GA4 configuration equivalent | All pages | GA4 receives page views | Pending |
| Confirm no duplicate GA4 base tags fire | Existing tags audit | All pages | One page view per page load | Pending |
| Confirm GTM Preview connects to production | Tag Assistant preview | Test URL | Preview panel sees page and events | Pending |

### 3. GTM custom events

Create GA4 event tags for these website/data-layer events.

| Data layer event | GA4 event tag name | Trigger | Include parameters | Bidding role |
| --- | --- | --- | --- | --- |
| `line_click` | `GA4 Event - line_click` | Custom Event equals `line_click` | Yes | Secondary (denominator for survey completion rate) |
| `line_survey_start` | `GA4 Event - line_survey_start` | Custom Event equals `line_survey_start` | Yes | Analytics only |
| `line_survey_complete` | `GA4 Event - line_survey_complete` | Custom Event equals `line_survey_complete` | Yes | Primary, value-based (Phase 2 bidding only, see pilot-launch-plan) |
| `phone_click` | `GA4 Event - phone_click` | Custom Event equals `phone_click` | Yes | Primary |
| `contact_click` | `GA4 Event - contact_click` | Custom Event equals `contact_click` | Yes | Analytics only |

Use the event parameter names from `docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv`.

For copy-to-build detail, use:

```text
docs/google-ads/gtm-container-build-sheet-2026-07.csv
```

Future tags reserved but not required for launch:

- `calculator_start`
- `calculator_step_complete`
- `calculator_submit`
- `calculator_line_click`
- `portfolio_view_click`
- `service_internal_link_click`

### 4. GTM event parameter variables

Create data layer variables or equivalent parameter mappings for these P0 parameters:

| Parameter | Required for | Notes |
| --- | --- | --- |
| `page_location` | All lead events | Full URL including query |
| `page_path` | All lead events | Path plus query |
| `page_title` | All lead events | Diagnostic |
| `position` | CTA events | CTA location |
| `event_category` | CTA events | Keep existing value |
| `event_label` | CTA events | Keep existing value |
| `attribution_latest_landing_path` | All lead events | Latest landing path |
| `attribution_latest_utm_campaign` | Ads events | Campaign label |
| `attribution_latest_utm_term` | Ads events | Raw keyword reporting only |
| `attribution_latest_srt_campaignid` | Ads events | Google campaign ID |
| `attribution_latest_srt_adgroupid` | Ads events | Google ad group ID |
| `attribution_latest_srt_keyword` | Ads events | Diagnostics only |
| `attribution_latest_srt_matchtype` | Ads events | Match type |
| `attribution_latest_srt_device` | Ads events | Device |
| `attribution_latest_srt_location` | Ads events | Location ID |
| `attribution_latest_ad_kw` | Ads events | DKI service bucket |
| `attribution_latest_ad_audience` | Ads events | DKI audience |
| `attribution_latest_ad_area` | Ads events | DKI area |
| `attribution_latest_ad_intent` | Ads events | DKI intent |
| `lead_persona` | `line_survey_complete`, and every subsequent event same session | homeowner / procurement / contractor; also map to a GA4 User Property |
| `lead_quality_score` | `line_survey_complete` | 0 for contractor, 1 for homeowner/procurement |
| `value` | `line_survey_complete` | 0 or 1, drives conversion value in Google Ads |

### 5. GA4 custom dimensions

Create event-scoped custom dimensions from:

```text
docs/google-ads/ga4-custom-dimensions-2026-07.csv
```

Notes:

- GA4 standard properties have a finite event-scoped custom-dimension quota.
- Avoid duplicate custom dimensions across the same event parameters.
- Avoid high-cardinality dimensions unless they are needed for launch diagnostics.
- Expect 24-48 hours before new custom dimensions are fully available in reports and advertising workflows.

### 6. GA4 key events

Mark these as key events after DebugView confirms they fire correctly:

| GA4 event | Key event? | Reason |
| --- | --- | --- |
| `line_click` | No | Superseded by `line_survey_complete`; kept as analytics denominator |
| `line_survey_complete` | Yes | Value-based primary lead signal; see pilot-launch-plan for Phase 1/2 bidding rule |
| `phone_click` | Yes | Strong current lead intent |
| `contact_click` | No | Too generic |
| `portfolio_view_click` | No | Diagnostic only |
| `service_internal_link_click` | No | Diagnostic only |
| `calculator_submit` | Future | Only after calculator is implemented and lead quality is verified |
| `calculator_line_click` | Future | Only after calculator is implemented and QA passes |

### 7. Google Ads conversions

After GA4 key events are visible and GA4 is linked to Google Ads:

| Google Ads conversion | Source | Include in bidding | Status |
| --- | --- | --- | --- |
| `line_click` | Import from GA4 key event or Google Ads conversion tag | No | Pending |
| `line_survey_complete` | Import from GA4 key event (value-based) | Phase 2 only (>=30 conv/month sustained) | Pending; blocked on code deploy |
| `phone_click` | Import from GA4 key event or Google Ads conversion tag | Yes | Pending |

Use this conversion-action build sheet:

```text
docs/google-ads/google-ads-conversion-actions-2026-07.csv
```

Notes:

- Only GA4 events marked as key events are eligible for import into Google Ads.
- After linking accounts or marking events as key events, Google says propagation may take 24-48 hours.
- If importing from GA4 is delayed, do not launch until conversion visibility is confirmed.

## P0 Done Definition

This implementation is ready for paid launch QA when:

- GTM Preview shows `line_click`, `line_survey_start`, `line_survey_complete`, and `phone_click` each firing once per click/answer.
- GA4 DebugView shows all events with required parameters, including `lead_persona`/`lead_quality_score`/`value` on `line_survey_complete`.
- GA4 key events are configured for `line_survey_complete` and `phone_click` (not `line_click`).
- Google Ads can see/import `line_survey_complete` (value-based) and `phone_click`.
- The mandatory LINE survey gate is verified end-to-end: paid session shows the modal, organic session does not, UTM-only session does not (see `docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md` Survey gate section).
- `yarn seo:qa` and `yarn ads:qa` pass on the deployed environment.

## Explicit Non-Goals

- Do not build the conversion calculator in this round.
- Do not enable Ads bidding against `contact_click`.
- Do not render raw `srt_keyword`, `utm_term`, or `{keyword}` on landing pages.
- Do not create new indexable Google Ads-only landing pages.
- Do not enable Ads bidding on `line_survey_complete` before it sustains 30 conversions/month (Phase 1 uses Maximize Clicks; see `docs/google-ads/pilot-launch-plan-2026-07.md`).
- Do not configure `line_survey_complete` bidding as Maximize Conversions (count-based) at any phase -- it must be value-based, since contractor-persona conversions carry value 0.
