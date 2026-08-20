# Google Ads Post-Launch Operating Loop

Date: 2026-07-25

## Purpose

Define how Siamrooftech should operate the first 14 days after the controlled Google Ads pilot launches.

The goal is to protect budget, preserve clean measurement, and learn which search terms produce real LINE/phone leads.

## Daily Operating Rule

For the first 14 days, do not let automation outrun evidence.

The account should be reviewed by:

- search term quality
- primary lead events
- lead quality from LINE/phone conversations
- service-area fit
- device and location patterns

Do not judge by CTR alone.

## Cadence

| Timing | Work | Owner | Output |
| --- | --- | --- | --- |
| Daily for first 3 days | Tracking health check | Ads/analytics | Confirm primary events fire |
| Every 2-3 days | Search terms review | Ads owner | Negatives and keyword cleanup |
| Every 2-3 days | Lead quality review | Business owner | Qualified/unqualified lead notes |
| Day 7 | First decision review | Ads + business | Keep, pause, adjust, or hold |
| Day 14 | Pilot review | Ads + business + dev/SEO | Decide calculator/LP/expansion next |

## Daily Tracking Health Check

Check:

| Item | Expected result | Action if failed |
| --- | --- | --- |
| `line_click` fires | Event appears in GA4 | Pause launch if missing |
| `phone_click` fires | Event appears in GA4 | Pause launch if missing |
| Event count is plausible | One event per click | Fix duplicate tags/triggers |
| `ad_kw`, `ad_area`, `ad_intent` captured | Parameters appear on lead events | Fix GTM/GA4 parameter mapping |
| Google Ads conversions record | Primary conversions visible | Do not optimize until fixed |

## Search Term Review

Review every 2-3 days.

Classify each meaningful term:

| Classification | Meaning | Action |
| --- | --- | --- |
| `qualified_service_intent` | Looks like install/service lead | Keep or move to exact |
| `price_quote_watch` | Price query with possible lead intent | Keep but evaluate lead quality |
| `local_service_intent` | Service + location intent | Keep if service area is real |
| `retailer_diy` | HomePro/ThaiWatsadu/DIY/ready-made | Add negative |
| `how_to_repair_parts` | How-to, repair, parts, cleaning | Add negative unless business wants it |
| `out_of_area` | Outside service area | Add negative/location exclusion |
| `unclear` | Not enough evidence | Watch, do not overreact |

Negative keyword rule:

- Prefer phrase negatives for Thai terms.
- Use broad negatives only for clearly low-value standalone terms such as `ฟรี`.
- Do not add broad negatives for words that can appear in good commercial queries.

## Lead Quality Review

Track each LINE/phone inquiry manually during the pilot.

Minimum fields:

| Field | Example |
| --- | --- |
| Date | 2026-07-25 |
| Channel | LINE or phone |
| Service | กันสาดพับเก็บได้ |
| Area | กรุงเทพ |
| Customer type | บ้านพักอาศัย |
| Approx size | 4m x 2.5m |
| System interest | manual/electric/unknown |
| Lead quality | high/medium/low |
| Disqualification reason | DIY, price-only, outside area, contractor handoff |
| Follow-up result | quoted, survey booked, no response, not fit |

This manual quality record is required before making major bidding or budget decisions.

## 7-Day Review

Ask:

1. Are `line_click` and `phone_click` reliable?
2. Which P0 campaign has the best lead quality?
3. Which ad groups have spend but no lead actions?
4. Which search terms need negatives?
5. Are price queries generating qualified conversations?
6. Are local pages producing serviceable leads?

Allowed actions:

- Add negatives.
- Pause clearly bad keywords.
- Tighten ad copy if search terms drift.
- Keep budget stable if learning is still early.
- Do not launch P1/P2 unless P0 measurement is clean.

## 14-Day Review

At day 14, choose the next move:

| Signal | Next move |
| --- | --- |
| Price queries get good leads but need qualification | Build conversion calculator |
| One audience segment has strong lead quality | Launch one P1 audience test |
| One location repeats and has qualified leads | Build/expand local SEO + Ads page |
| Search terms are clean but conversion rate is weak | Improve landing proof/CTA or dedicated LP |
| Clicks are high but leads poor | Tighten keywords/negatives, reduce budget |
| Tracking is unreliable | Pause Ads and fix measurement |

## Calculator Decision Rule

Build the calculator only when one of these is true:

- Price/estimate search terms drive meaningful LINE/phone conversations.
- Leads repeatedly ask the same sizing/pricing questions.
- The business can define safe estimate bands without promising exact price.
- The calculator can improve lead qualification before LINE/phone handoff.

Do not build calculator merely because the website can technically support it.

## Dedicated Landing Page Decision Rule

Build a dedicated Ads LP only when:

- A campaign/ad group has clean search terms.
- Lead quality is promising.
- The current service page has weak conversion behavior.
- The LP can materially change first-screen message, proof, or CTA path.

Do not build separate LPs for every keyword.

## Weekly Reporting Template

Use this structure:

| Section | Content |
| --- | --- |
| Summary | Spend, clicks, primary leads, lead-event rate |
| Best segment | Campaign/ad group/search term with best lead quality |
| Waste segment | Spend without qualified lead signal |
| Negative additions | Terms added and reason |
| Tracking health | Any missing/duplicate event issues |
| Lead quality notes | Qualified/unqualified patterns |
| Next actions | Keep, pause, adjust, build calculator, build LP |

## Operating Principle

Spend buys evidence first. Scale comes only after measurement and lead quality are trustworthy.
