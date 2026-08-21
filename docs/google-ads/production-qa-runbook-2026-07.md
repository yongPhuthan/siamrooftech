# Google Ads Production QA Runbook

Date: 2026-07-25

## Purpose

Verify that the Google Ads landing URL, the mandatory LINE survey gate, GTM, GA4, and Google Ads conversion readiness work together before paid traffic launches. (DKI dynamic content is not part of the current pilot -- see `dynamic-keyword-insertion-contract-2026-07.md` status note.)

The expected decision at the end is one of:

- `PASS`: ready for a small controlled Google Ads pilot.
- `PASS_WITH_FIXES`: safe issues remain, but no measurement-blocking issue.
- `BLOCK`: do not launch paid traffic.

## Required Access

| Tool | Access needed | Required for |
| --- | --- | --- |
| Website production or preview URL | Browser access | Landing-page QA |
| GTM container | Publish or preview access | Tag firing QA |
| GA4 property | Viewer or editor | DebugView and event QA |
| Google Ads account | Admin or standard | Auto-tagging and conversion import QA |

## Preflight

1. Confirm production/preview base URL.
2. Confirm GTM container is installed on the same environment.
3. Confirm GA4 web stream is the intended property.
4. Confirm Google Ads auto-tagging is enabled.
5. Confirm no real paid traffic is running during QA.
6. Confirm browser extensions/ad blockers are disabled for the QA session.

## Automated Technical QA

Run against the deployed environment:

```bash
yarn seo:qa --base=https://www.siamrooftech.com
yarn ads:qa --base=https://www.siamrooftech.com
yarn ads:browser-qa --base=https://www.siamrooftech.com
```

If testing a preview URL:

```bash
yarn seo:qa --base=<preview-url>
yarn ads:qa --base=<preview-url>
yarn ads:browser-qa --base=<preview-url>
```

Blocking failures:

- Canonical mismatch on service or Ads query URL.
- Sitemap contains query variants.
- Sitemap contains `/lp/google-ads/...`.
- Invalid token renders unsafe/raw copy.
- Priority URL returns non-200 status.
- Browser dataLayer smoke test cannot emit `line_click` and `phone_click` with attribution params.

## Browser QA Flow

All P0 campaigns land on the homepage with no DKI query params (see
`launch-url-matrix-2026-07.csv`); campaign/ad-group attribution comes from
the Google Ads tracking template, not the Final URL. Use this P0 URL:

```text
https://www.siamrooftech.com/?gclid=qa-live-gclid-<date>
```

For this URL:

1. Open the URL in a real browser (GTM Preview does not show cookies -- check DevTools > Application > Cookies directly).
2. Confirm the page loads normally, with no visible content differences from a plain organic visit (homepage does not use DKI).
3. Confirm cookie `srt_paid=1` is set with `Max-Age=1800`.
4. Click any LINE CTA. Confirm navigation is blocked and the LeadSurveyModal opens instead of LINE.
5. Confirm GTM Preview / GA4 DebugView records `line_survey_start`.
6. Answer any persona option. Confirm LINE opens in a new tab.
7. Confirm GTM Preview / GA4 DebugView records `line_survey_complete` with `lead_persona`, `lead_quality_score`, `value`, `attribution_latest_gclid`.
8. Click a LINE CTA again without reloading. Confirm LINE opens immediately (persona already stored this session, no second modal).
9. Click the phone CTA. Confirm `phone_click` fires with `attribution_lead_persona` present (attribution auto-attaches to every event once the survey is answered).

Then confirm the gate stays closed for non-paid traffic:

10. Open `https://www.siamrooftech.com/` with no query params in a fresh/incognito session. Click any LINE CTA. Confirm LINE opens immediately, no modal, no `srt_paid` cookie.
11. Open `https://www.siamrooftech.com/?utm_source=google_paid&utm_medium=paid` (UTM only, no `gclid`) in a fresh session. Click any LINE CTA. Confirm LINE opens immediately, no modal, no `srt_paid` cookie -- the gate must key on `gclid`/`gbraid`/`wbraid` only, never `utm_*`.

Local browser smoke check:

```bash
yarn ads:browser-qa --base=https://www.siamrooftech.com
```

This confirms the website can capture attribution in browser storage and emit events into `window.dataLayer`. It does not replace GTM Preview or GA4 DebugView because those external tools still need to map and receive the events.

## Required Event Parameters To Spot Check

For `line_survey_complete`, verify (in addition to everything `line_click` already carries):

| Parameter | Expected example |
| --- | --- |
| `page_location` | Full URL with query |
| `page_path` | Path plus query |
| `position` | CTA position such as `bottom` or `final_cta` |
| `lead_persona` | `homeowner`, `procurement`, or `contractor` |
| `lead_quality_score` | `0` (contractor) or `1` (homeowner/procurement) |
| `value` | Same as `lead_quality_score` |
| `attribution_latest_gclid` | The click ID from the test URL |
| `attribution_latest_utm_campaign` | Matching campaign, if a tracking template was used |
| `attribution_latest_srt_campaignid` | Matching campaign ID, if a tracking template was used |
| `attribution_latest_srt_keyword` | Matching keyword, if a tracking template was used |

For `phone_click` fired after a survey answer, confirm `attribution_lead_persona` is present -- it should auto-attach from the stored answer without any extra code path.

## Negative QA Tests

| Test | Expected result |
| --- | --- |
| `https://www.siamrooftech.com/?utm_source=google_paid&utm_medium=paid` (no `gclid`) | No `srt_paid` cookie, no survey modal on LINE click |
| `https://www.siamrooftech.com/` with `lead_persona` already answered this session | LINE opens immediately, no second modal |
| `/sitemap.xml` | No `ad_kw=`, `srt_keyword=`, or `/lp/google-ads/` |

The DKI-specific negative tests (invalid `ad_kw` token, conflicting `ad_area`, conflicting service token on `/services/*` pages) are Future -- see `docs/google-ads/production-qa-test-cases-2026-07.csv` ADS-QA-020 through ADS-QA-023 and the status note in `dynamic-keyword-insertion-contract-2026-07.md`. They only matter again if dedicated service-page campaigns are launched.

## GA4 Key Event QA

1. Open GA4 DebugView.
2. Confirm test device appears.
3. Trigger `line_survey_complete` (via the full survey flow, not just `line_click`).
4. Trigger `phone_click`.
5. Confirm both events show required parameters.
6. Mark `line_survey_complete` and `phone_click` as key events only after parameters are confirmed. Do not mark `line_click` as a key event -- it is analytics-only, the denominator for survey completion rate.
7. Wait for GA4/Google Ads propagation if the events do not immediately appear for import.

## Google Ads Conversion QA

1. Confirm GA4 and Google Ads are linked.
2. Confirm auto-tagging is enabled -- this is what appends `gclid` to the Final URL, which is what opens the survey gate. Without it, no paid visitor ever sees the survey and no `line_survey_complete` conversions exist.
3. Import or create conversion actions:
   - `phone_click` (Primary, count-based, include in bidding from launch)
   - `line_survey_complete` (Primary, value-based; only add to bidding once Phase 2 threshold is reached, see `pilot-launch-plan-2026-07.md`)
4. Confirm `line_click` is NOT set as a conversion action for bidding.
5. Confirm `contact_click` is not included in bidding.
6. Do not import calculator events until the calculator exists and passes its own QA.

## Publish Decision

| Decision | Condition |
| --- | --- |
| `PASS` | All automated QA passes, the survey gate behaves correctly (opens for paid sessions, stays closed for organic/UTM-only), GA4 DebugView receives `line_survey_complete` and `phone_click` with parameters, Google Ads conversions are ready |
| `PASS_WITH_FIXES` | Non-blocking documentation or naming cleanup remains, but primary events, the survey gate, and attribution are reliable |
| `BLOCK` | Primary event missing, survey gate opens for organic/UTM-only traffic, survey gate fails to open for paid traffic, attribution missing, canonical/sitemap broken, or Google Ads cannot see conversions |

## Rollback Triggers

Stop or pause launch if:

- `line_survey_complete` or `phone_click` disappears from GA4.
- Events fire multiple times per click.
- The survey gate opens for organic or UTM-only traffic (no `gclid`).
- The survey gate stops opening for paid traffic (`gclid` present).
- `line_click` minus `line_survey_complete` (survey drop-off) exceeds roughly 15%.
- Canonical points to a query URL or `/lp/google-ads/...`.
- Google Ads starts optimizing for a non-lead event.
