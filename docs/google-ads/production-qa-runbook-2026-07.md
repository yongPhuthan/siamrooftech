# Google Ads Production QA Runbook

Date: 2026-07-25

## Purpose

Verify that Google Ads landing URLs, DKI, GTM, GA4, and Google Ads conversion readiness work together before paid traffic launches.

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

Use these P0 URLs:

```text
https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_intent=quote&utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_NonBrand_Core&utm_term=test_keyword&utm_content=test_ad&srt_platform=google&srt_campaignid=111&srt_adgroupid=222&srt_adid=333&srt_keyword=test_keyword&srt_matchtype=e&srt_device=c&srt_network=g&srt_location=1012728
```

```text
https://www.siamrooftech.com/services/electric-retractable-awning?ad_kw=electric_awning&ad_intent=consult&utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_Electric&utm_term=test_keyword&utm_content=test_ad&srt_platform=google&srt_campaignid=111&srt_adgroupid=223&srt_adid=334&srt_keyword=test_keyword&srt_matchtype=e&srt_device=c&srt_network=g&srt_location=1012728
```

```text
https://www.siamrooftech.com/services/retractable-awning/bangkok?ad_kw=retractable_awning&ad_area=bangkok&ad_intent=quote&utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_Local_Bangkok&utm_term=test_keyword&utm_content=test_ad&srt_platform=google&srt_campaignid=111&srt_adgroupid=224&srt_adid=335&srt_keyword=test_keyword&srt_matchtype=e&srt_device=c&srt_network=g&srt_location=1012728
```

For each URL:

1. Open the URL in GTM Preview.
2. Confirm the page loads normally.
3. Confirm approved DKI copy appears in the hero.
4. Confirm raw `srt_keyword` does not appear as visible page copy.
5. Confirm canonical points to the clean `/services/...` URL.
6. Click the hero LINE CTA once.
7. Return to the page and click the phone CTA once.
8. Confirm GTM Preview records one `line_click` and one `phone_click`.
9. Confirm GA4 DebugView shows the events.
10. Confirm required parameters are present.

Local browser smoke check:

```bash
yarn ads:browser-qa --base=https://www.siamrooftech.com
```

This confirms the website can capture attribution in browser storage and emit `line_click` / `phone_click` into `window.dataLayer`. It does not replace GTM Preview or GA4 DebugView because those external tools still need to map and receive the events.

## Required Event Parameters To Spot Check

For `line_click` and `phone_click`, verify:

| Parameter | Expected example |
| --- | --- |
| `page_location` | Full URL with query |
| `page_path` | Path plus query |
| `position` | CTA position such as `กันสาดพับเก็บได้_hero` |
| `attribution_latest_utm_campaign` | `TH_Search_NonBrand_Core` or matching campaign |
| `attribution_latest_srt_campaignid` | `111` |
| `attribution_latest_srt_adgroupid` | `222`, `223`, or `224` |
| `attribution_latest_srt_keyword` | `test_keyword` |
| `attribution_latest_srt_matchtype` | `e` |
| `attribution_latest_srt_device` | `c` |
| `attribution_latest_srt_network` | `g` |
| `attribution_latest_ad_kw` | `retractable_awning` or `electric_awning` |
| `attribution_latest_ad_area` | `bangkok` for Bangkok test |
| `attribution_latest_ad_intent` | `quote` or `consult` |

## Negative QA Tests

| Test URL pattern | Expected result |
| --- | --- |
| `/services/retractable-awning?ad_kw=cheap_unknown_keyword&srt_keyword=กันสาดพับเก็บได้ราคาถูกที่สุด` | Raw/invalid keyword does not render as visible copy |
| `/services/retractable-awning/bangkok?ad_kw=retractable_awning&ad_area=nonthaburi` | Bangkok path wins; Nonthaburi does not render as hero area |
| `/services/electric-retractable-awning?ad_kw=retractable_awning` | Electric page controls service identity; conflicting keyword is ignored |
| `/sitemap.xml` | No `ad_kw=`, `srt_keyword=`, or `/lp/google-ads/` |

## GA4 Key Event QA

1. Open GA4 DebugView.
2. Confirm test device appears.
3. Trigger `line_click`.
4. Trigger `phone_click`.
5. Confirm both events show required parameters.
6. Mark `line_click` and `phone_click` as key events only after parameters are confirmed.
7. Wait for GA4/Google Ads propagation if the events do not immediately appear for import.

## Google Ads Conversion QA

1. Confirm GA4 and Google Ads are linked.
2. Confirm auto-tagging is enabled.
3. Import or create conversion actions:
   - `line_click`
   - `phone_click`
4. Set both as primary only after successful QA.
5. Confirm `contact_click` is not included in bidding.
6. Do not import calculator events until the calculator exists and passes its own QA.

## Publish Decision

| Decision | Condition |
| --- | --- |
| `PASS` | All automated QA passes, GTM Preview passes, GA4 DebugView receives primary events with parameters, Google Ads conversions are ready |
| `PASS_WITH_FIXES` | Non-blocking documentation or naming cleanup remains, but primary events and attribution are reliable |
| `BLOCK` | Primary event missing, attribution missing, canonical/sitemap broken, raw keyword renders, or Google Ads cannot see conversions |

## Rollback Triggers

Stop or pause launch if:

- `line_click` or `phone_click` disappears from GA4.
- Events fire multiple times per click.
- Ads URL renders unsafe keyword text.
- Canonical points to a query URL or `/lp/google-ads/...`.
- Google Ads starts optimizing for a non-lead event.
