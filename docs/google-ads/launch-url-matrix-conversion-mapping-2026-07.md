# Google Ads Launch URL Matrix And GTM/GA4 Conversion Mapping Spec

Date: 2026-07-25

> **Conversion-flow notice (2026-09-07):** The survey conversion mapping in
> this historical document is retired. LINE CTAs now use direct ref-coded
> handoff; actual matched inbound messages are the Primary conversion.

> **Status (2026-08-21): partially superseded.** This document's Launch URL
> Matrix section, and every `/services/*?ad_kw=...` URL example below, describe
> the earlier service-page + DKI strategy. That was replaced with a simpler
> decision: all P0 campaigns land on the homepage with no DKI query params.
> For the current, authoritative reference, use these instead:
>
> - URLs: `docs/google-ads/launch-url-matrix-2026-07.csv`
> - Conversion mapping (event roles, bidding): `docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv`
> - GTM build (variables/triggers/tags): `docs/google-ads/gtm-container-build-sheet-2026-07.csv`
> - GA4 custom dimensions: `docs/google-ads/ga4-custom-dimensions-2026-07.csv`
> - Ads conversion actions: `docs/google-ads/google-ads-conversion-actions-2026-07.csv`
> - QA: `docs/google-ads/production-qa-runbook-2026-07.md` and `production-qa-test-cases-2026-07.csv`
>
> The GTM/GA4 event-mapping and attribution-parameter sections below (survey
> gate aside, which postdates this doc entirely -- see
> `dynamic-keyword-insertion-contract-2026-07.md` Survey gate section) are
> still broadly accurate for how attribution flows; only the URL strategy
> changed. The `/services/*` DKI capability itself is unused but intact in
> code, kept for possible future dedicated landing-page campaigns.

## Decision

Create the launch matrix before building the conversion calculator.

Reason: the URL, token, attribution, and conversion-event contract must be stable before paid traffic starts. The future calculator should plug into this contract instead of creating a second tracking model later.

Official references:

- Google Ads ValueTrack setup: https://support.google.com/google-ads/answer/6305348
- Google Ads ValueTrack use cases: https://support.google.com/google-ads/answer/6305529
- Google Analytics and Google Ads conversions/key events: https://support.google.com/analytics/answer/13965727
- Import Google Analytics events into Google Ads: https://support.google.com/google-ads/answer/2375435

Related Siamrooftech specs:

- `docs/google-ads/url-landing-page-concept-2026-07.md`
- `docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md`
- `docs/google-ads/conversion-funnel-implementation-2026-06-13.md`

Companion working files:

- `docs/google-ads/launch-url-matrix-2026-07.csv`
- `docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv`
- `docs/google-ads/ga4-custom-dimensions-2026-07.csv`
- `docs/google-ads/gtm-ga4-implementation-checklist-2026-07.md`
- `docs/google-ads/production-qa-runbook-2026-07.md`
- `docs/google-ads/production-qa-test-cases-2026-07.csv`

## Expected Outputs

This work package is complete when these artifacts exist:

| Output | File | Use |
| --- | --- | --- |
| Launch URL matrix | `docs/google-ads/launch-url-matrix-2026-07.csv` | Source of truth for campaign/ad group Final URLs |
| Conversion mapping | `docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv` | Source of truth for GTM/GA4 event setup |
| GA4 custom dimensions | `docs/google-ads/ga4-custom-dimensions-2026-07.csv` | Source of truth for GA4 event-scoped dimensions |
| GTM/GA4 implementation checklist | `docs/google-ads/gtm-ga4-implementation-checklist-2026-07.md` | Step-by-step setup checklist for tags, events, dimensions, and conversions |
| Production QA runbook | `docs/google-ads/production-qa-runbook-2026-07.md` | Manual and automated QA flow before launch |
| Production QA test cases | `docs/google-ads/production-qa-test-cases-2026-07.csv` | Checklist-style QA cases for the launch gate |
| Narrative spec | `docs/google-ads/launch-url-matrix-conversion-mapping-2026-07.md` | Business and technical handoff document |

The expected business result is not paid traffic yet. It is operational readiness: Ads, GTM, GA4, and future calculator work can use the same URL and conversion contract.

## Current Technical Contract

Public Final URL pattern:

```text
https://www.siamrooftech.com/services/[service-or-local-path]?ad_kw=...&ad_audience=...&ad_area=...&ad_intent=...
```

Internal rendering behavior:

- Public `/services/...` pages stay SEO-first and static/ISR.
- Middleware rewrites approved Ads query variants to the internal `/lp/google-ads/...` renderer.
- Canonical URLs stay clean `/services/...` URLs.
- `srt_keyword` and `utm_term` are attribution fields only. They must not render as page copy.
- DKI copy may use only approved `ad_*` tokens from `src/lib/google-ads-dynamic-content.ts`.

## Google Ads Account Prerequisites

Do not launch until these are true:

| Requirement | Status | Owner | Notes |
| --- | --- | --- | --- |
| New clean Google Ads account exists | Pending | Ads owner | Do not reuse old billing-risk account |
| GA4 property exists | Pending | Analytics owner | Required before importing events |
| GTM container installed on production | Pending | Analytics/dev | Existing website has GTM helper code, production config must be confirmed |
| Auto-tagging enabled in Google Ads | Pending | Ads owner | Required for `gclid`/Google attribution |
| GA4 linked to Google Ads | Pending | Ads/analytics owner | Required before importing GA4 conversions |
| `line_survey_complete` and `phone_click` visible in GA4 DebugView | Pending | Analytics/dev | Must pass before import; `line_click` kept as secondary/diagnostic only |
| Key events/conversions imported into Google Ads | Pending | Ads owner | `phone_click` at launch; `line_survey_complete` value-based, bidding only after Phase 2 threshold (30 conv/month) |

## Parameter Standard

### Dynamic copy tokens

| Parameter | Allowed values | Purpose | Rendering allowed |
| --- | --- | --- | --- |
| `ad_kw` | `retractable_awning`, `electric_awning`, `manual_awning` | Service bucket | Yes, whitelist only |
| `ad_audience` | `home`, `restaurant`, `cafe`, `office` | Customer segment | Yes, whitelist only |
| `ad_area` | `bangkok`, `nonthaburi`, `pathum_thani`, `nakhon_pathom`, `samut_prakan`, `ayutthaya`, `samut_sakhon` | Area bucket | Yes, whitelist only |
| `ad_intent` | `quote`, `consult`, `compare` | CTA intent | Yes, whitelist only |

### Attribution parameters

| Parameter | Source | Purpose | Rendering allowed |
| --- | --- | --- | --- |
| `utm_source` | Final URL suffix | Channel reporting | No |
| `utm_medium` | Final URL suffix | Medium reporting | No |
| `utm_campaign` | Final URL suffix or fixed campaign URL | Campaign naming | No |
| `utm_term` | ValueTrack `{keyword}` or fixed term | Keyword reporting | No |
| `utm_content` | ValueTrack `{creative}` or ad variant name | Creative/ad reporting | No |
| `srt_platform` | Tracking template | Internal platform label | No |
| `srt_campaignid` | ValueTrack `{campaignid}` | Campaign ID | No |
| `srt_adgroupid` | ValueTrack `{adgroupid}` | Ad group ID | No |
| `srt_adid` | ValueTrack `{creative}` | Ad/creative ID | No |
| `srt_keyword` | ValueTrack `{keyword}` | Matched keyword | No |
| `srt_matchtype` | ValueTrack `{matchtype}` | Match type | No |
| `srt_device` | ValueTrack `{device}` | Device | No |
| `srt_network` | ValueTrack `{network}` | Network | No |
| `srt_location` | ValueTrack `{loc_physical_ms}` | User physical location ID | No |
| `gclid`, `gbraid`, `wbraid` | Google auto-tagging | Google click attribution | No |
| `gad_source`, `gad_campaignid` | Google | Google diagnostics | No |

## Recommended Tracking Template

Campaign or account-level tracking template:

```text
{lpurl}?srt_platform=google&srt_campaignid={campaignid}&srt_adgroupid={adgroupid}&srt_adid={creative}&srt_keyword={keyword}&srt_matchtype={matchtype}&srt_device={device}&srt_network={network}&srt_location={loc_physical_ms}
```

Final URL suffix:

```text
utm_source=google_paid&utm_medium=paid&utm_campaign=CAMPAIGN_NAME&utm_term={keyword}&utm_content={creative}
```

Rule: use fixed campaign names in `utm_campaign` if Google Ads UI rejects dynamic campaign-name insertion or if reporting needs cleaner naming.

## Launch URL Matrix

### P0 campaign/ad group URLs

| Priority | Campaign | Ad group | Primary intent | Final URL | DKI tokens |
| --- | --- | --- | --- | --- | --- |
| P0 | TH_Search_NonBrand_Core | กันสาดพับเก็บได้ | Main money keyword | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_intent=quote` | `ad_kw=retractable_awning`, `ad_intent=quote` |
| P0 | TH_Search_Electric | กันสาดพับไฟฟ้า | Electric/motorized demand | `https://www.siamrooftech.com/services/electric-retractable-awning?ad_kw=electric_awning&ad_intent=consult` | `ad_kw=electric_awning`, `ad_intent=consult` |
| P0 | TH_Search_Local_Bangkok | กันสาดพับเก็บได้ กรุงเทพ | Local high intent | `https://www.siamrooftech.com/services/retractable-awning/bangkok?ad_kw=retractable_awning&ad_area=bangkok&ad_intent=quote` | `ad_kw=retractable_awning`, `ad_area=bangkok`, `ad_intent=quote` |
| P0 | TH_Search_Local_Nonthaburi | กันสาดพับเก็บได้ นนทบุรี | Local high intent | `https://www.siamrooftech.com/services/retractable-awning/nonthaburi?ad_kw=retractable_awning&ad_area=nonthaburi&ad_intent=quote` | `ad_kw=retractable_awning`, `ad_area=nonthaburi`, `ad_intent=quote` |
| P0 | TH_Search_Local_PathumThani | กันสาดพับเก็บได้ ปทุมธานี | Local high intent | `https://www.siamrooftech.com/services/retractable-awning/pathum-thani?ad_kw=retractable_awning&ad_area=pathum_thani&ad_intent=quote` | `ad_kw=retractable_awning`, `ad_area=pathum_thani`, `ad_intent=quote` |

### P1 audience test URLs

| Priority | Campaign | Ad group | Primary intent | Final URL | DKI tokens |
| --- | --- | --- | --- | --- | --- |
| P1 | TH_Search_Audience_Home | กันสาดพับเก็บได้ บ้าน | Residential lead | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_audience=home&ad_intent=quote` | `ad_kw=retractable_awning`, `ad_audience=home`, `ad_intent=quote` |
| P1 | TH_Search_Audience_Restaurant | กันสาดพับเก็บได้ ร้านอาหาร | Restaurant outdoor seating | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_audience=restaurant&ad_intent=consult` | `ad_kw=retractable_awning`, `ad_audience=restaurant`, `ad_intent=consult` |
| P1 | TH_Search_Audience_Cafe | กันสาดพับเก็บได้ คาเฟ่ | Cafe storefront/seating | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_audience=cafe&ad_intent=consult` | `ad_kw=retractable_awning`, `ad_audience=cafe`, `ad_intent=consult` |
| P1 | TH_Search_Audience_Office | กันสาดพับเก็บได้ สำนักงาน | Office/commercial lead | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_audience=office&ad_intent=consult` | `ad_kw=retractable_awning`, `ad_audience=office`, `ad_intent=consult` |

### P2 future-area URLs

Do not launch these as full local campaigns until page/content proof is stronger or the Ads account has enough budget.

| Priority | Campaign | Ad group | Final URL | Notes |
| --- | --- | --- | --- | --- |
| P2 | TH_Search_Local_NakhonPathom | กันสาดพับเก็บได้ นครปฐม | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_area=nakhon_pathom&ad_intent=quote` | Query variant only until a canonical local page is built |
| P2 | TH_Search_Local_SamutPrakan | กันสาดพับเก็บได้ สมุทรปราการ | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_area=samut_prakan&ad_intent=quote` | Query variant only until a canonical local page is built |
| P2 | TH_Search_Local_Ayutthaya | กันสาดพับเก็บได้ อยุธยา | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_area=ayutthaya&ad_intent=quote` | Query variant only until a canonical local page is built |
| P2 | TH_Search_Local_SamutSakhon | กันสาดพับเก็บได้ สมุทรสาคร | `https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_area=samut_sakhon&ad_intent=quote` | Query variant only until a canonical local page is built |

## GTM Event Mapping

### Data source

The website stores first-touch and latest-touch attribution in `localStorage` through `src/lib/gtm.ts`.

All contact events should include:

- current page context
- first-touch attribution
- latest-touch attribution
- clicked CTA position
- lead channel

### Event map

| Website action | Data layer event | GA4 event name | Ads optimization role | Trigger source |
| --- | --- | --- | --- | --- |
| Click LINE CTA | `line_click` | `line_click` | Secondary (denominator for survey drop-off) | Existing tracked LINE buttons |
| LINE survey shown (paid session) | `line_survey_start` | `line_survey_start` | Analytics only | Mandatory persona survey gate, `src/app/components/AttributionCapture.tsx` |
| LINE survey answered | `line_survey_complete` | `line_survey_complete` | Primary conversion, value-based (Phase 2 bidding only, see pilot-launch-plan) | 1-question mandatory persona survey before LINE opens |
| Click phone CTA | `phone_click` | `phone_click` | Primary conversion | Existing tracked phone links |
| Generic contact click | `contact_click` | `contact_click` | Analytics only | Generic contact CTA |
| Successful contact form submit | `contact_form_submit_success` | `contact_form_submit_success` | Primary only when form is reliable | Future form |
| Portfolio proof click from service page | `portfolio_view_click` | `portfolio_view_click` | Secondary diagnostic | Future enhancement |
| Internal service link click | `service_internal_link_click` | `service_internal_link_click` | Secondary diagnostic | Future enhancement |
| Calculator starts | `calculator_start` | `calculator_start` | Secondary diagnostic | Future calculator |
| Calculator submitted | `calculator_submit` | `calculator_submit` | Primary candidate | Future calculator |
| Calculator result to LINE | `calculator_line_click` | `calculator_line_click` | Primary candidate | Future calculator |

## Required GA4 Event Parameters

Send these parameters with every lead-relevant event:

| Parameter | Example | Required for | Notes |
| --- | --- | --- | --- |
| `page_location` | `https://www.siamrooftech.com/services/retractable-awning?...` | All events | Full URL with query |
| `page_path` | `/services/retractable-awning?...` | All events | Useful for landing-page analysis |
| `page_title` | Page title | All events | Diagnostic |
| `position` | `กันสาดพับเก็บได้_hero` | CTA events | Existing code uses CTA position |
| `event_category` | `conversion` | CTA events | Keep stable |
| `event_label` | `line_button` | CTA events | Keep stable |
| `attribution_first_landing_path` | `/services/retractable-awning?...` | All lead events | First touch |
| `attribution_latest_landing_path` | `/services/retractable-awning?...` | All lead events | Latest touch |
| `attribution_first_gclid` | Google click ID | Ads traffic | When present |
| `attribution_latest_gclid` | Google click ID | Ads traffic | When present |
| `attribution_latest_utm_campaign` | `TH_Search_NonBrand_Core` | Ads traffic | Campaign naming |
| `attribution_latest_utm_term` | Matched keyword | Ads traffic | Raw reporting only |
| `attribution_latest_srt_campaignid` | `123456789` | Ads traffic | Google campaign ID |
| `attribution_latest_srt_adgroupid` | `987654321` | Ads traffic | Google ad group ID |
| `attribution_latest_srt_adid` | Creative ID | Ads traffic | Ad diagnostics |
| `attribution_latest_srt_keyword` | Matched keyword | Ads traffic | Do not render on page |
| `attribution_latest_srt_matchtype` | `e`, `p`, `b` | Ads traffic | Exact/phrase/broad diagnostic |
| `attribution_latest_srt_device` | `m`, `c`, `t` | Ads traffic | Mobile/computer/tablet |
| `attribution_latest_srt_network` | `g` | Ads traffic | Google/search partner/display |
| `attribution_latest_srt_location` | Location ID | Ads traffic | Physical location |
| `attribution_latest_ad_kw` | `retractable_awning` | Ads traffic | DKI segment |
| `attribution_latest_ad_audience` | `home` | Ads traffic | DKI segment |
| `attribution_latest_ad_area` | `bangkok` | Ads traffic | DKI segment |
| `attribution_latest_ad_intent` | `quote` | Ads traffic | DKI segment |
| `lead_persona` | `homeowner`, `procurement`, `contractor` | `line_survey_complete`, and every subsequent event same session | Declared persona from the mandatory survey; also mapped to a GA4 User Property |
| `lead_quality_score` | `0` or `1` | `line_survey_complete` | 0 for contractor, 1 for homeowner/procurement |
| `value` | `0` or `1` | `line_survey_complete` | Same as `lead_quality_score`; drives conversion value in Google Ads |

## GA4 Custom Dimensions

Register these event-scoped custom dimensions in GA4 before launch:

| GA4 dimension name | Event parameter |
| --- | --- |
| Landing page path | `page_path` |
| CTA position | `position` |
| Latest UTM campaign | `attribution_latest_utm_campaign` |
| Latest UTM term | `attribution_latest_utm_term` |
| Latest SRT campaign ID | `attribution_latest_srt_campaignid` |
| Latest SRT ad group ID | `attribution_latest_srt_adgroupid` |
| Latest SRT keyword | `attribution_latest_srt_keyword` |
| Latest SRT match type | `attribution_latest_srt_matchtype` |
| Latest SRT device | `attribution_latest_srt_device` |
| Latest SRT location | `attribution_latest_srt_location` |
| DKI keyword bucket | `attribution_latest_ad_kw` |
| DKI audience | `attribution_latest_ad_audience` |
| DKI area | `attribution_latest_ad_area` |
| DKI intent | `attribution_latest_ad_intent` |
| Lead persona (event) | `lead_persona` |
| Lead quality score | `lead_quality_score` |
| Lead persona (user) | `lead_persona`, mapped as a GA4 User Property so a contractor-persona exclusion audience can be built |

## Google Ads Conversion Mapping

### Initial conversion actions

| Conversion action | Source | Primary/Secondary | Include in bidding | Reason |
| --- | --- | --- | --- | --- |
| `line_click` | GA4 import or Google Ads tag | Secondary | No | Superseded by `line_survey_complete`; kept as the denominator for survey completion rate |
| `line_survey_complete` | GA4 import (value-based) | Primary | Phase 2 only (>=30 conv/month sustained); Phase 1 bid strategy is Maximize Clicks | Value-based lead-quality signal: 0 for contractor persona, 1 for homeowner/procurement. Must use Conversion Value bidding, never Maximize Conversions (count-based) |
| `phone_click` | GA4 import or Google Ads tag | Primary | Yes | Strong current lead intent |
| `contact_click` | GA4 | Secondary or analytics only | No | Too generic for bidding |
| `portfolio_view_click` | GA4 | Secondary | No | Diagnostic, not a lead |
| `service_internal_link_click` | GA4 | Secondary | No | Diagnostic, not a lead |

### Future calculator conversion actions

| Conversion action | Source | Primary/Secondary | Include in bidding | Launch condition |
| --- | --- | --- | --- | --- |
| `calculator_start` | GA4 | Secondary | No | When calculator exists |
| `calculator_step_complete` | GA4 | Secondary | No | When step flow exists |
| `calculator_submit` | GA4 or Google Ads tag | Primary candidate | Yes only after lead quality check | When calculator produces meaningful lead details |
| `calculator_line_click` | GA4 or Google Ads tag | Primary candidate | Yes | When result screen hands off to LINE |

Rule: do not optimize Google Ads for low-intent micro-events. Start with LINE and phone. Add calculator submit only when it captures useful job information.

## Calculator Event Contract Placeholder

Reserve these parameters now so future calculator implementation does not break reporting:

| Parameter | Example | Purpose |
| --- | --- | --- |
| `calculator_service_type` | `retractable_awning` | Service selected |
| `calculator_area` | `bangkok` | Service area |
| `calculator_audience` | `home` | Customer segment |
| `calculator_width_m` | `4` | Approximate width |
| `calculator_projection_m` | `2.5` | Approximate projection |
| `calculator_system_type` | `manual`, `electric`, `unknown` | Manual/electric selection |
| `calculator_install_surface` | `wall`, `steel`, `unknown` | Install condition |
| `calculator_estimate_band` | `low`, `mid`, `high`, `needs_survey` | Price band, not exact price |
| `calculator_lead_quality_hint` | `high`, `medium`, `low` | Internal optimization hint |
| `calculator_result_action` | `line`, `phone`, `form` | Next action |

Do not send exact price promises unless pricing logic and business approval are finalized.

## GTM Build Checklist

1. Create or confirm GA4 Configuration tag.
2. Create GA4 Event tags for:
   - `line_click` (secondary, analytics only)
   - `line_survey_start`
   - `line_survey_complete` (primary, value-based; map `lead_persona` to a GA4 User Property)
   - `phone_click`
   - `contact_click`
   - future `calculator_*`
3. Map all required event parameters from the data layer payload.
4. Confirm cross-domain settings are not needed for LINE/phone clicks.
5. Confirm consent behavior before using Ads remarketing or enhanced conversions.
6. Test in GTM Preview on:
   - `/services/retractable-awning?ad_kw=retractable_awning&ad_audience=home&ad_area=bangkok&ad_intent=quote`
   - `/services/electric-retractable-awning?ad_kw=electric_awning&ad_intent=consult`
   - `/services/retractable-awning/bangkok?ad_kw=retractable_awning&ad_area=bangkok&ad_intent=quote`
7. Confirm GA4 DebugView receives events with attribution params.
8. Mark/import only primary events into Google Ads after QA.

## QA Gate Before Paid Launch

Technical command checks:

```bash
yarn type-check
yarn build
yarn seo:qa --base=<production-or-preview-url>
yarn ads:qa --base=<production-or-preview-url>
```

Manual browser checks:

| Check | Expected result |
| --- | --- |
| Clean service page loads without Ads query | Static content, no DKI attributes |
| Ads query URL loads | Dynamic approved copy appears |
| Invalid `ad_kw` token | Default safe copy appears |
| Local page with conflicting `ad_area` | Path area wins |
| Canonical on query URL | Clean `/services/...` canonical |
| Sitemap | No query URL and no `/lp/google-ads/...` |
| LINE click (organic session) | `line_click` fires, no survey modal appears |
| LINE click (paid session, `gclid` present) | `line_survey_start` fires, mandatory survey modal appears, blocks navigation |
| LINE click (paid session, UTM-only, no `gclid`) | No survey modal appears -- gate must key on `gclid`/`gbraid`/`wbraid` only |
| LINE survey answered | `line_survey_complete` fires with `lead_persona`, `lead_quality_score`, `value` in GTM Preview and GA4 DebugView, then LINE opens |
| Phone click | `phone_click` in GTM Preview and GA4 DebugView |

## Launch Decision

Status: `NOT READY FOR PAID TRAFFIC`

Ready when:

- URL matrix is approved by business owner.
- GTM/GA4 tags are configured on production.
- GA4 DebugView confirms `line_click` and `phone_click` with attribution parameters.
- Google Ads is linked to GA4 with auto-tagging enabled.
- Primary conversion actions are imported or created.
- `yarn seo:qa` and `yarn ads:qa` pass on the deployed environment.

## First 14-Day Reporting View

Segment early performance by:

- campaign
- ad group
- matched keyword
- match type
- device
- location
- landing page path
- `ad_kw`
- `ad_audience`
- `ad_area`
- lead channel: LINE or phone

Do not judge success by CTR alone. The first decision metric is qualified LINE/phone lead quality by search term and ad group.
