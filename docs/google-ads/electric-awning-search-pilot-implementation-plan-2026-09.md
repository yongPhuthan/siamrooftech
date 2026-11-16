# Electric Awning Search Pilot — Approved Implementation Plan

Status: **APPROVED FOR PREPARATION; NOT APPROVED FOR LIVE SPEND**  
Approved by owner: 2026-09-03  
Test window: 14 days after launch

This campaign-specific plan supersedes the five-campaign scope in
`pilot-launch-plan-2026-07.md` for the next paid test. Existing tracking and QA
contracts remain applicable unless this document explicitly changes them.

## Objective

Determine which searches around `กันสาดไฟฟ้า` produce matched LINE conversations
that progress into qualified homeowner, building-owner, or procurement leads in
Bangkok, Nonthaburi, and Pathum Thani. Contractor-originated inquiries receive the
existing low initial token value (`1`) rather than being treated as a qualified
business outcome. The pilot is not judged by impressions, clicks, CTR, platform
optimization score, or survey completion alone.

## Approved scope

| Setting | Approved value |
| --- | --- |
| Campaign | `TH_Search_ElectricAwning_Leads_2026Q3` |
| Channel | Google Search only |
| Search Partners | Off |
| Display Network | Off |
| Daily budget | THB500 |
| Test duration | 14 days |
| Bid strategy | Maximize Clicks with THB22 maximum CPC bid limit |
| Locations | Bangkok, Nonthaburi, Pathum Thani |
| Location option | Presence: people in or regularly in targeted locations |
| Languages | Thai and English |
| Schedule | Daily, 06:00–23:00 Asia/Bangkok |
| Match types | Exact and Phrase only |
| Auto-tagging | On |
| Initial status | Paused |

The THB22 cap is an opening risk control based on the old account CPC evidence, not
a profitability threshold. Unit economics are still unknown.

## Existing-account isolation gate

Before importing or posting, inspect the existing account for campaigns, ad groups,
keywords, Dynamic Search Ads, AI Max settings, and broad-match terms that could
match the same electric-awning queries.

Resolve every overlap by documenting one of: pause the old target; add a
campaign-level negative to the old campaign; remove the duplicate from this pilot;
or accept the overlap with an explicit reason. Do not post until this audit passes.

## Ad group 1 — Electric_Core

| Match | Keyword |
| --- | --- |
| Exact | `[กันสาดไฟฟ้า]` |
| Phrase | `"กันสาดไฟฟ้า"` |
| Exact | `[กันสาดอัตโนมัติ]` |
| Phrase | `"กันสาดอัตโนมัติ"` |
| Exact | `[กันสาดพับไฟฟ้า]` |
| Phrase | `"กันสาดพับไฟฟ้า"` |
| Exact | `[ติดตั้งกันสาดไฟฟ้า]` |
| Phrase | `"ติดตั้งกันสาดไฟฟ้า"` |
| Exact | `[รับติดตั้งกันสาดไฟฟ้า]` |
| Phrase | `"รับติดตั้งกันสาดไฟฟ้า"` |

Cross-negative at ad-group level: phrase negative `ราคา`.

## Ad group 2 — Electric_Price

| Match | Keyword |
| --- | --- |
| Exact | `[กันสาดไฟฟ้า ราคา]` |
| Phrase | `"กันสาดไฟฟ้า ราคา"` |
| Exact | `[ราคากันสาดไฟฟ้า]` |
| Phrase | `"ราคากันสาดไฟฟ้า"` |
| Exact | `[กันสาดอัตโนมัติ ราคา]` |
| Phrase | `"กันสาดอัตโนมัติ ราคา"` |
| Exact | `[ราคากันสาดอัตโนมัติ]` |
| Phrase | `"ราคากันสาดอัตโนมัติ"` |

Exact negatives for clean routing: `[กันสาดไฟฟ้า]`, `[กันสาดอัตโนมัติ]`, and
`[กันสาดพับไฟฟ้า]`.

## Campaign negative seed

Use phrase negatives unless stated otherwise:

`โฮมโปร`, `ไทวัสดุ`, `ดูโฮม`, `เมกาโฮม`, `วิธี`, `ประกอบ`, `DIY`,
`สำเร็จรูป`, `สําเร็จรูป`, `มือสอง`, `สมัครงาน`.

Use broad negative `ฟรี`. Hold `ซ่อม`, `อะไหล่`, `ล้าง`, `มอเตอร์อย่างเดียว`, and
`ผ้าใบอย่างเดียว` outside the import until service scope is confirmed. Do not use
the broad negative `งาน`; the phrase negative `สมัครงาน` is sufficient and safer.

Do not add `ผู้รับเหมา` solely from customer persona. A building owner or
procurement lead can use contractor-related language; use matched LINE leads and
actual search terms before excluding it.

## Responsive Search Ads

Create two RSAs per ad group from the relevant pool below with materially different
opening messages. Do not pin assets unless a legal or factual dependency requires
it.

### Electric_Core headlines

- กันสาดไฟฟ้าพร้อมติดตั้ง
- กันสาดอัตโนมัติสั่งทำ
- เปิดปิดสะดวกด้วยมอเตอร์
- นัดประเมินหน้างานฟรี
- ทีมงานประสบการณ์กว่า 10 ปี
- รับติดตั้งกรุงเทพและปริมณฑล
- กันแดดกันฝน ใช้งานง่าย
- เลือกขนาดและสีให้เหมาะบ้าน
- ผลงานติดตั้งจริงดูได้
- รับประกันมอเตอร์ 2 ปี
- ปรึกษางานกันสาดไฟฟ้า
- สยามรูฟเทคดูแลครบงาน

### Electric_Core descriptions

- ออกแบบและติดตั้งกันสาดไฟฟ้าสำหรับบ้านและอาคาร นัดประเมินหน้างานฟรี
- ทีมงานประสบการณ์กว่า 10 ปี พร้อมรับประกันมอเตอร์ 2 ปีตามเงื่อนไข
- ดูผลงานติดตั้งจริง เลือกขนาด สี และระบบให้เหมาะกับพื้นที่ใช้งาน
- ให้บริการกรุงเทพฯ นนทบุรี และปทุมธานี ติดต่อสอบถามผ่าน LINE หรือโทร

### Electric_Price headlines

- เช็กราคากันสาดไฟฟ้า
- ขอประเมินราคาหน้างานฟรี
- กันสาดไฟฟ้าสั่งทำตามขนาด
- ราคาตามขนาดและพื้นที่จริง
- วางแผนงบก่อนติดตั้ง
- นัดสำรวจพื้นที่โดยทีมงาน
- เทียบรูปแบบให้เหมาะกับงบ
- รับติดตั้งพร้อมมอเตอร์
- รับประกันมอเตอร์ 2 ปี
- ทีมงานประสบการณ์กว่า 10 ปี
- ดูผลงานก่อนตัดสินใจ
- กรุงเทพ นนทบุรี ปทุมธานี

### Electric_Price descriptions

- ส่งขนาดพื้นที่คร่าว ๆ เพื่อประเมินเบื้องต้น หรือนัดสำรวจหน้างานฟรี
- ราคาขึ้นกับขนาด ผ้า โครงสร้าง และระบบมอเตอร์ ประเมินตามพื้นที่จริง
- ทีมงานประสบการณ์กว่า 10 ปี รับประกันมอเตอร์ 2 ปีตามเงื่อนไข
- บริการติดตั้งในกรุงเทพฯ นนทบุรี และปทุมธานี ติดต่อผ่าน LINE หรือโทร

Claims are limited to the owner-approved statements: free estimate, more than ten
years of experience, and a two-year motor warranty subject to conditions. Recheck
current Google Ads text limits before generating the import pack.

## Landing page and tracking

Intended Final URL:

```text
https://www.siamrooftech.com/lp/google-ads/electric-awning
```

Required tracking template:

```text
{lpurl}?srt_platform=google&srt_campaignid={campaignid}&srt_adgroupid={adgroupid}&srt_adid={creative}&srt_keyword={keyword}&srt_matchtype={matchtype}&srt_device={device}&srt_network={network}&srt_location={loc_physical_ms}
```

Required final URL suffix:

```text
utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_ElectricAwning_Leads_2026Q3&utm_term={keyword}&utm_content={creative}&ad_kw=electric_awning&ad_intent=quote
```

Do not render raw `{keyword}`, `utm_term`, or `srt_keyword` as visible page copy.
The paid LINE survey gate must continue to depend only on `gclid`, `gbraid`, or
`wbraid`.

## Conversion configuration

Phase 1 uses Maximize Clicks because conversion wiring has not yet been proven.

| Event | Role during phase 1 | Bidding |
| --- | --- | --- |
| Matched LINE conversation (`conversation_id`) | First measurable lead milestone; initial persona value homeowner/procurement/contractor = 100/100/1 | Primary only after matching and upload diagnostics pass |
| `line_survey_complete` | Persona and LINE-open proxy; not a qualified lead by itself | Secondary diagnostic |
| `phone_click` | Strong intent proxy; not proof of a completed conversation | Primary only after diagnostics pass |
| `line_click` | Survey denominator | Secondary |
| `line_survey_start` | Funnel diagnostic | Secondary |
| Generic contact/page events | Diagnostic | Secondary or excluded |

Keep the two value layers distinct: the browser-side survey event currently uses
the diagnostic persona score/value homeowner/procurement/contractor = `1/1/0`,
while a successfully matched LINE lead receives the backend initial persona value
`100/100/1`. Neither layer proves that a lead is qualified, quoted, or won.

The intended future strategy is Maximize Conversion Value and later tROAS using
matched LINE lead values, later lifecycle qualification, quote/win status, and
`actual_value` restatements. The switch requires reliable, sufficient recent value
data and a new owner decision; it is not automatic at day 14.

## Launch gates

All must pass before enabling spend:

- dedicated Final URL returns HTTP 200 in production and displays the approved LP;
- mobile and desktop CTA paths work;
- existing-account overlap audit is complete;
- campaign remains Search-only with Search Partners and Display off;
- location presence mode and three target provinces are verified;
- schedule and THB500/day budget are verified;
- all keywords, negatives, ads, and assets pass preview without unresolved errors;
- auto-tagging is on and tracking parameters persist;
- GTM Preview and GA4 DebugView show one event per intended action;
- Google Ads conversion diagnostics show the selected actions correctly;
- a test paid-session LINE flow preserves the reference code, matches the LINE
  conversation, and records the expected initial persona value;
- the owner reviews the final diff and explicitly authorizes enabling spend.

Known blockers at approval time:

- the dedicated production LP was previously observed returning 404;
- live Google Ads conversion-action wiring has not been verified;
- the existing account overlap audit has not yet been run.

## Operating rules

### Days 1–3

- Check tracking and conversion counts daily.
- Review search terms daily while volume is small.
- Pause immediately for broken/duplicate tracking, wrong geography, policy issues,
  or clearly irrelevant traffic dominating spend.
- Keep budget and structure stable unless spend protection requires intervention.

### Day 7

- Add evidence-backed negatives.
- Pause terms with meaningful spend and clearly unqualified intent.
- Review the CPC cap only if qualified queries cannot serve or it exposes the
  account to poor auctions.
- Compare areas, devices, ad groups, and lead personas.

### Day 14

Decide to continue, narrow, improve the LP, expand keywords, repair measurement, or
stop. Do not claim profitability until gross profit per sale, lead-to-sale rate,
and click-to-lead rate are known.

## Deployment decision

Prepare the first version as a Google Ads Editor import pack with the campaign
paused. Use browser automation only for settings not represented safely in the
import and for final visual verification.

The official Google Ads MCP release is read-only as of this plan date. It may be
added later for account audit and reporting. A write-capable Google Ads API
integration is deferred until repeated operations justify OAuth, developer-token,
idempotency, and approval infrastructure.
