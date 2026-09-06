# Google Ads Controlled Pilot Launch Plan

Date: 2026-07-25

> **Conversion-flow notice (2026-09-07):** Replace every survey-based bidding
> rule below with the current rule: keep Maximize Clicks until at least 30
> actual matched LINE messages occur in 30 days. Survey/click events are
> Secondary diagnostics only.

## Purpose

Launch only enough Google Search traffic to verify lead quality without damaging SEO, attribution, or budget control.

This plan is the bridge between the URL/GTM specs and the first paid pilot. It assumes the production tracking QA runbook has passed.

Official references:

- Create a Search campaign: https://support.google.com/google-ads/answer/9510373
- About Maximize clicks bidding: https://support.google.com/google-ads/answer/6268626
- About Maximize conversions bidding: https://support.google.com/google-ads/answer/7381968
- Add negative keywords: https://support.google.com/google-ads/answer/7102995

Local evidence:

- `docs/google-ads/local-analysis-2026-06-12/keyword-launch-map.md`
- `docs/google-ads/local-analysis-2026-06-12/negative-keyword-candidates.md`
- `docs/google-ads/launch-url-matrix-2026-07.csv`
- `docs/google-ads/production-qa-runbook-2026-07.md`

## Launch Decision

Start with a controlled Search-only pilot.

Do:

- Launch only P0 campaigns.
- Use the approved Final URLs from `docs/google-ads/launch-url-matrix-2026-07.csv`.
- Use exact and phrase match only.
- Apply shared negative keywords before launch.
- Bid on Maximize Clicks only until `line_survey_complete` reaches 30 conversions/month sustained; `line_click` and `phone_click` are diagnostic during this phase, not bidding conversions (see "Bid Strategy" below).
- Review search terms and lead quality (by `lead_persona`, via GA4) every 2-3 days for the first 14 days.

Do not:

- Launch P1/P2 audience or future-area campaigns yet.
- Use broad match at launch.
- Use Performance Max, Display, Demand Gen, or Search Partners at launch.
- Optimize for `contact_click`, page views, scroll, or generic clicks.
- Switch bidding away from Maximize Clicks before `line_survey_complete` sustains 30 conversions/month, and never switch to a count-based strategy (Maximize Conversions) afterward -- only value-based (Maximize Conversion Value / tROAS), since `line_survey_complete` carries a 0/1 value and a count-based strategy would treat contractor leads (value 0) the same as real leads.

## Pre-Launch Gate

The pilot can start only when all P0 gates are true.

| Gate | Evidence | Required decision |
| --- | --- | --- |
| URL matrix approved | `docs/google-ads/launch-url-matrix-2026-07.csv` | Approved by owner |
| Landing QA passed (sitemap safety; DKI checks are Future, not part of this pilot) | `yarn ads:qa --base=<production>` | PASS |
| SEO QA passed | `yarn seo:qa --base=<production>` | PASS |
| GTM Preview passed | `docs/google-ads/production-qa-runbook-2026-07.md` | PASS |
| GA4 DebugView shows primary events | `line_survey_complete`, `phone_click` with attribution params, plus `lead_persona`/`lead_quality_score`/`value` on `line_survey_complete` | PASS |
| Google Ads can import/see conversions | `phone_click` (Yes); `line_survey_complete` visible but not yet in bidding until Phase 2 threshold | PASS |
| Mandatory LINE survey gate verified | See `docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md` Survey gate section | PASS |
| Shared negatives applied | Negative list below | Applied |

## Campaign Scope

Launch only these P0 campaigns first:

| Campaign | Ad group | Final URL source | Launch status |
| --- | --- | --- | --- |
| `TH_Search_NonBrand_Core` | กันสาดพับเก็บได้ | `launch-url-matrix-2026-07.csv` | P0 |
| `TH_Search_Electric` | กันสาดพับไฟฟ้า | `launch-url-matrix-2026-07.csv` | P0 |
| `TH_Search_Local_Bangkok` | กันสาดพับเก็บได้ กรุงเทพ | `launch-url-matrix-2026-07.csv` | P0 |
| `TH_Search_Local_Nonthaburi` | กันสาดพับเก็บได้ นนทบุรี | `launch-url-matrix-2026-07.csv` | P0 |
| `TH_Search_Local_PathumThani` | กันสาดพับเก็บได้ ปทุมธานี | `launch-url-matrix-2026-07.csv` | P0 |

All five Final URLs are the same bare homepage (`https://www.siamrooftech.com/`) -- campaign/ad-group differentiation for reporting comes from the tracking template (`utm_campaign`/`srt_campaignid`), not the Final URL. See `launch-url-matrix-2026-07.csv`.

Hold:

- P1 audience campaigns: home, restaurant, cafe, office.
- P2 future areas: Nakhon Pathom, Samut Prakan, Ayutthaya, Samut Sakhon.

## Budget

Recommended controlled pilot budget:

| Option | Daily budget | Use when |
| --- | ---: | --- |
| Conservative | THB300/day | Budget is tight or owner availability for leads is limited |
| Standard pilot | THB500/day | Owner can respond to LINE/phone quickly and wants faster learning |

Budget rules:

- Do not increase budget during the first 3 days unless tracking is clean and search terms are obviously relevant.
- Do not scale budget based on CTR alone.
- Increase only after reviewing lead quality, not just click volume.
- Pause or reduce spend if primary conversion events disappear or fire multiple times per click.

## Bid Strategy

Starting bid strategy:

| Phase | Bid strategy | Reason |
| --- | --- | --- |
| Phase 1: < 30 `line_survey_complete`/month | Maximize Clicks with CPC cap | Does not require conversion data; avoids the cold-start problem of bidding on a low-volume, quality-filtered conversion. Meanwhile use manual levers (negative keywords from `lead_persona=contractor` search terms, ad copy filtering) to steer away from contractor traffic. |
| Phase 2: >= 30 `line_survey_complete`/month sustained | Maximize Conversion Value / tROAS on `line_survey_complete` | Value-based only, never Maximize Conversions (count-based) -- `line_survey_complete` carries value 0 (contractor) or 1 (homeowner/procurement), and a count-based strategy cannot distinguish them |

`line_click` and `phone_click` stay diagnostic/secondary in both phases -- `line_click` fires on every LINE button press regardless of persona, so bidding on it directly would optimize for contractor volume too.

Starting CPC cap:

```text
THB18-22
```

Reason: old account average CPC was around THB15.89, but old tracking was broken. Use the old CPC only as a rough reference, not a success benchmark.

## Network And Location Settings

| Setting | Launch value |
| --- | --- |
| Campaign type | Search |
| Search Partners | Off |
| Display Network | Off |
| Performance Max | Off |
| Broad match | Off |
| Match types | Exact and Phrase |
| Location option | Presence: people in or regularly in target locations |
| Ad schedule | 06:00-23:00 for first 7-14 days |

## Shared Negative Keyword Seed

Apply these before launch.

| Negative keyword | Match type | Reason |
| --- | --- | --- |
| โฮมโปร | Phrase | Retailer/DIY comparison intent |
| ไทวัสดุ | Phrase | Retailer/DIY comparison intent |
| ดูโฮม | Phrase | Retailer comparison intent |
| เมกาโฮม | Phrase | Retailer comparison intent |
| วิธี | Phrase | How-to intent |
| ประกอบ | Phrase | Assembly/self-install intent |
| DIY | Phrase | Self-install intent |
| สำเร็จรูป | Phrase | Ready-made kit intent |
| สําเร็จรูป | Phrase | Alternate Thai spelling |
| ฟรี | Broad | Low commercial intent |
| มือสอง | Phrase | Low commercial fit |
| ซ่อม | Phrase | Exclude unless repair service is deliberately offered |
| อะไหล่ | Phrase | Parts intent |
| ล้าง | Phrase | Cleaning intent |

Review before applying if the business later decides to intentionally target repair, parts, ready-made kits, or DIY audiences.

## Keyword Launch Guardrails

Use `docs/google-ads/local-analysis-2026-06-12/keyword-launch-map.md` as the source for first keywords.

Rules:

- Launch exact and phrase versions of the strongest core/electric/local terms.
- Keep price terms under close watch because they can convert or waste spend depending on lead quality.
- Do not use broad match in the first 14 days.
- Do not expand to fabric/general awning queries until P0 campaigns produce clean lead data.

## Conversion Rules

Primary:

- `line_survey_complete` (value-based; enters bidding only in Phase 2, see "Bid Strategy")
- `phone_click`

Secondary or analytics-only:

- `line_click` (denominator for survey completion rate)
- `line_survey_start`
- `contact_click`
- `portfolio_view_click`
- `service_internal_link_click`

Future:

- `calculator_submit`
- `calculator_line_click`

Do not include future calculator events in bidding until the calculator exists, passes QA, and captures meaningful job details.

## 7-Day Review Criteria

At day 7, answer:

| Question | Required evidence |
| --- | --- |
| Are primary events firing correctly? | GA4 + Google Ads conversion diagnostics |
| Which ad groups produced LINE/phone actions? | GA4/Google Ads by campaign/ad group |
| Which search terms wasted spend? | Search terms report |
| Did any retailer/DIY terms slip through? | Search terms report |
| Which search terms/keywords produced contractor-persona leads? | GA4: `line_survey_complete` by `attribution_latest_srt_keyword` and `lead_persona` |
| Does mobile produce useful lead actions? | Device segment |
| Are Bangkok/Nonthaburi/Pathum Thani leads serviceable? | Lead quality notes |

Day-7 allowed actions:

- Add negatives, including keywords whose `line_survey_complete` leads are predominantly `lead_persona=contractor`.
- Pause clearly wasteful keywords.
- Adjust CPC cap modestly if high-intent terms cannot serve.
- Keep budget steady unless tracking and lead quality are both clean.

## 14-Day Review Criteria

At day 14, decide:

| Decision | Trigger |
| --- | --- |
| Continue P0 only | Lead volume is thin but search terms are clean |
| Add P1 audience test | P0 tracking is clean and owner wants more learning |
| Add local canonical pages | Query/location demand appears repeatedly and service area is real |
| Build calculator next | Price/estimate queries generate lead interest but need qualification |
| Build dedicated Ads LP | A segment has good search quality but weak landing conversion |
| Pause or rebuild | Tracking is unreliable or search terms are mostly unqualified |

## Stop/Pause Triggers

Pause campaigns if:

- `line_click`, `line_survey_complete`, or `phone_click` stops firing.
- Events fire more than once per click.
- Google Ads optimizes for `contact_click` or any non-lead event.
- `line_click` minus `line_survey_complete` (survey drop-off) exceeds roughly 15% -- the mandatory survey is creating too much friction and needs review.
- Search terms are dominated by retailer/DIY/how-to intent.
- Leads are outside real service areas.
- Siamrooftech cannot respond to LINE/phone inquiries quickly enough.

## Pilot Output

The pilot is successful when it produces a trustworthy answer to:

```text
Which campaign/ad group/search-term/service-area combinations produce real LINE or phone lead intent for Siamrooftech?
```

The pilot is not judged by impressions, CTR, or clicks alone.
