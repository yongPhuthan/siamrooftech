# Google Ads URL And Landing Page Concept

Date: 2026-07-24

> **Superseded (2026-08-21).** The hybrid service-page strategy below was
> replaced with a simpler decision: all P0 campaigns land on the homepage,
> with no DKI query params at all (`ad_kw`/`ad_audience`/`ad_area`/`ad_intent`
> do nothing there). See `launch-url-matrix-2026-07.csv` for the current
> URLs and `dynamic-keyword-insertion-contract-2026-07.md` for why the DKI
> capability described here is kept but currently unused. This document is
> preserved as the record of the original reasoning, not as current
> instructions.

## Decision

Use a hybrid Google Ads landing strategy:

1. Send most Search traffic to the existing service/local pages.
2. Add Cursor-style tracking parameters to the final URL or final URL suffix.
3. Use middleware to render approved Ads variants through an internal `/lp/google-ads/...` route while keeping the visible URL on `/services/...`.
4. Create separately promoted `/lp/google-ads/...` pages only when the existing service page cannot match the ad group conversion intent.

This avoids creating thin duplicate landing pages while still giving Ads enough attribution detail for campaign, ad group, keyword, device, network, and location analysis.

Current implementation note:

- Organic service pages remain static/SEO-first.
- Google Ads query variants such as `/services/retractable-awning?ad_kw=retractable_awning&ad_audience=home` are rewritten internally to `/lp/google-ads/retractable-awning`.
- The browser-visible URL and canonical URL stay on the clean service path.
- `/lp/google-ads/...` is not listed in sitemap and is not used as the default public Final URL.

## Why This Is The Right Default

Google Ads landing page quality depends on relevance, usefulness, navigation, and matching the user's ad expectation. Google also requires the landing page and display URL to share the same domain. Existing Siamrooftech service pages already have SEO content, proof blocks, schema, canonical URLs, portfolio evidence, and CTAs, so they are better starting destinations than new empty Ads pages.

References:

- Google Ads landing page experience: https://support.google.com/google-ads/answer/14086
- Google Ads ValueTrack setup: https://support.google.com/google-ads/answer/6305348
- Google Ads auto-tagging / GCLID: https://support.google.com/google-ads/answer/3095550
- Google Ads GBRAID parameter: https://support.google.com/google-ads/answer/16297842

## Cursor Pattern Observed

Example:

```text
https://cursor.com/sdk?utm_source=google_paid&utm_medium=paid&utm_campaign=[Search] [Brand] [EN] [APAC T2] [Broad] [VBB] Brand&utm_term=cursor sdk&utm_content=810459542795&cc_platform=google&cc_campaignid=23633783202&cc_adgroupid=199383403360&cc_adid=810459542795&cc_keyword=cursor sdk&cc_matchtype=b&cc_device=c&cc_network=g&cc_location=9074473&gclid=...&gbraid=...
```

Technique:

- Keep the path as the real product page: `/sdk`.
- Use query parameters for attribution, not a separate path per ad group.
- Use standard `utm_*` parameters for analytics reporting.
- Use custom parameters, such as `cc_*`, for internal campaign diagnostics.
- Keep Google auto-tagging parameters, such as `gclid` and `gbraid`, intact.

For Siamrooftech, do not copy Cursor's `cc_` prefix. Use a Siamrooftech-owned prefix.

## Siamrooftech Parameter Standard

Use:

```text
srt_platform=google
srt_campaignid={campaignid}
srt_adgroupid={adgroupid}
srt_adid={creative}
srt_keyword={keyword}
srt_matchtype={matchtype}
srt_device={device}
srt_network={network}
srt_location={loc_physical_ms}
```

Keep standard UTMs:

```text
utm_source=google_paid
utm_medium=paid
utm_campaign={campaign_name}
utm_term={keyword}
utm_content={creative}
```

Keep Google auto-tagging:

```text
gclid
gbraid
wbraid
gad_source
gad_campaignid
```

Do not alter case for `gclid`, `gbraid`, or `wbraid`.

## Recommended Tracking Template

Campaign/ad group tracking template:

```text
{lpurl}?srt_platform=google&srt_campaignid={campaignid}&srt_adgroupid={adgroupid}&srt_adid={creative}&srt_keyword={keyword}&srt_matchtype={matchtype}&srt_device={device}&srt_network={network}&srt_location={loc_physical_ms}
```

Final URL suffix:

```text
utm_source=google_paid&utm_medium=paid&utm_campaign={campaign_name}&utm_term={keyword}&utm_content={creative}
```

If Google Ads rejects `{campaign_name}` in the final URL suffix or reporting needs stable naming, use fixed campaign names in the final URL per campaign instead of dynamic insertion.

## Landing Page Map

Use existing pages first:

| Ad Group | Intent | Final URL | Page Type |
| --- | --- | --- | --- |
| Core - กันสาดพับเก็บได้ | Main service demand | `/services/retractable-awning` | Existing service page |
| Electric - กันสาดไฟฟ้า | Motorized/electric demand | `/services/electric-retractable-awning` | Existing service page |
| Local - กรุงเทพ | Local high-intent demand | `/services/retractable-awning/bangkok` | Existing local page |
| Local - นนทบุรี | Local high-intent demand | `/services/retractable-awning/nonthaburi` | Existing local page |
| Local - ปทุมธานี | Local high-intent demand | `/services/retractable-awning/pathum-thani` | Existing local page |
| Price - ประเมินราคา | Quote/price demand | `/services/retractable-awning` initially | Existing service page, price block may be added later |
| Restaurant/Cafe | Business-use demand | `/services/retractable-awning` initially | Dedicated LP only if data proves leakage |
| Home | Residential demand | `/services/retractable-awning` initially | Dedicated LP only if data proves leakage |

Dedicated landing pages should be created only when one of these is true:

- The ad group needs a materially different first screen.
- The conversion path must remove SEO navigation or add a shorter lead flow.
- The ad group has enough spend/clicks to justify separate measurement.
- Existing service page engagement is weak but query quality is commercially strong.

Potential future dedicated pages:

```text
/lp/google-ads/retractable-awning-home
/lp/google-ads/retractable-awning-restaurant
/lp/google-ads/electric-retractable-awning-home
/lp/google-ads/retractable-awning-bangkok
```

## Indexing And Canonical Policy

Existing service/local pages:

- Keep indexable.
- Keep canonical to their own clean URL.
- Do not include tracking query parameters in canonical.
- Keep these pages in sitemap.

Dedicated `/lp/google-ads/...` pages:

- Do not include in SEO sitemap unless deliberately promoted as organic pages later.
- Use canonical to the clean LP URL if the page is materially unique.
- Use canonical to the matching service page if the LP is mostly a conversion variant of an existing service page.
- Do not block with `robots.txt`; Google Ads needs to crawl landing pages.

## Current Website State

`src/lib/gtm.ts` captures:

- `gclid`
- `gbraid`
- `wbraid`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `gad_source`
- `gad_campaignid`
- `srt_platform`
- `srt_campaignid`
- `srt_adgroupid`
- `srt_adid`
- `srt_keyword`
- `srt_matchtype`
- `srt_device`
- `srt_network`
- `srt_location`
- `ad_kw`
- `ad_audience`
- `ad_area`
- `ad_intent`

`src/lib/google-ads-dynamic-content.ts` renders only approved `ad_*` tokens. Raw `srt_keyword` is attribution-only and must not be rendered as page copy.

## Conversion Event Concept

Primary conversions:

| Event | Role | Ads optimization |
| --- | --- | --- |
| `line_click` | High-intent lead action | Primary |
| `phone_click` | High-intent lead action | Primary |

Secondary diagnostics:

| Event | Role | Ads optimization |
| --- | --- | --- |
| `portfolio_view_click` | Proof interest | Secondary only |
| `service_internal_link_click` | Navigation diagnosis | Secondary only |
| `contact_click` | Generic contact intent | Analytics only |
| `contact_form_submit_success` | Future form lead | Primary only when form returns and is reliable |

Do not optimize Google Ads for generic clicks, scroll, or page views.

## Reporting Segments

Minimum reporting dimensions:

- Campaign
- Ad group
- Keyword
- Match type
- Device
- Network
- Location
- Landing page path
- CTA position
- Lead channel: LINE or phone

Minimum metrics:

- Cost
- Clicks
- CPC
- `line_click`
- `phone_click`
- Primary lead events
- Lead event rate
- Cost per lead event
- Search terms requiring negatives

## Implementation Change Requests

P0:

- Keep `src/lib/gtm.ts` capturing `srt_*`, `gad_source`, `gad_campaignid`, and `ad_*`.
- Keep the middleware rewrite from `/services/...?...ad_*...` to the internal `/lp/google-ads/...` renderer.
- Run `yarn ads:qa --base=<local-or-preview-url>` before launching paid traffic.
- Confirm GTM maps the new data layer parameters into GA4 event parameters.

P1:

- Add `service_internal_link_click` event for service/portfolio navigation diagnosis.
- Add campaign/ad group URL examples to the launch plan.
- Add a production GTM Preview checklist for one service page and one local page.

P2:

- Build dedicated `/lp/google-ads/...` pages only after the existing service pages collect enough paid traffic evidence.
- Add offline lead-quality feedback from LINE/phone into a future CRM or sheet.

## Initial QA URLs

Service page:

```text
https://www.siamrooftech.com/services/retractable-awning?utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_NonBrand_Core&utm_term=กันสาดพับเก็บได้&utm_content=test-ad&srt_platform=google&srt_campaignid=111&srt_adgroupid=222&srt_adid=333&srt_keyword=กันสาดพับเก็บได้&srt_matchtype=e&srt_device=m&srt_network=g&srt_location=1012728&gclid=test-gclid
```

Local page:

```text
https://www.siamrooftech.com/services/retractable-awning/bangkok?utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_Local_Bangkok&utm_term=กันสาดพับเก็บได้ กรุงเทพ&utm_content=test-ad&srt_platform=google&srt_campaignid=444&srt_adgroupid=555&srt_adid=666&srt_keyword=กันสาดพับเก็บได้ กรุงเทพ&srt_matchtype=p&srt_device=m&srt_network=g&srt_location=1012728&gbraid=test-gbraid
```

Expected behavior:

- Page returns `200`.
- Canonical remains the clean URL without query parameters.
- `localStorage.siamrooftech_attribution_v1` stores first/latest values.
- LINE click sends `line_click` with `attribution_latest_*`.
- Phone click sends `phone_click` with `attribution_latest_*`.
- GTM Preview and GA4 DebugView show the expected parameters.

## Final Position

Do not build many ad group landing pages first.

Start with:

```text
Existing service/local pages + Cursor-style tracking parameters + clean conversion events
```

Then build dedicated Ads landing pages only where data proves that the existing page is not converting a commercially useful ad group.

Related spec:

- `docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md`
