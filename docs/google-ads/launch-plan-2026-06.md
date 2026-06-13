# Siamrooftech Google Ads Launch Plan - 2026-06

## Decision Summary

This is the launch blueprint for the new clean Google Ads account. The old Google Ads account is used only as an archived insight source because it has billing risk, weak setup quality, and unusable conversion tracking. Old performance numbers are not benchmarks to copy; they are evidence for query intent, waste patterns, negative keywords, and mistakes to avoid.

Core decisions:

- Campaign type: Search only.
- Do not use Performance Max, Display, Demand Gen, or broad-match expansion at launch.
- Network: Google Search only. Turn Search Partners and Display Network off for the first learning period.
- Bid strategy: Maximize Clicks with a CPC cap.
- Match types: Exact and Phrase only.
- Primary conversions: `line_click`, `phone_click`, `quote_request`.
- Do not use `contact_form_submit_success` as a primary conversion in this phase.
- Landing page: use the current homepage for launch only if the Ads readiness checklist passes; build a dedicated landing page in Phase 2 if data or UX review shows leakage.

## Evidence Base

Primary local references:

- [Old account archive](archive-2026-06-12/README.md)
- [Old account analysis](archive-2026-06-12/analysis.md)
- [Raw data digest](archive-2026-06-12/raw-data-digest.md)
- [New campaign brief](archive-2026-06-12/new-campaign-brief.md)
- [Local analysis summary](local-analysis-2026-06-12/README.md)
- [Keyword launch map](local-analysis-2026-06-12/keyword-launch-map.md)
- [Negative keyword candidates](local-analysis-2026-06-12/negative-keyword-candidates.md)

Old account facts used for planning:

| Metric | Old account value | Planning implication |
| --- | ---: | --- |
| Spend | THB34,570.13 | Enough data for keyword and CPC planning, not enough for CPA planning. |
| Clicks | 2,176 | Search demand exists. |
| Impressions | 25,155 | Focused Search can get volume. |
| CTR | 8.7% | Search demand exists, but old traffic quality is not proven. |
| Avg. CPC | THB15.89 | Use only as a rough ceiling reference. Do not treat it as a healthy CPC benchmark. |
| Recorded conversions | 0.00 | Old conversion data is unusable. |
| Mobile spend share | 75.2% | Mobile landing page and LINE/phone CTAs are critical. |

## Practitioner Strategy Position

The launch approach follows a conservative agency/practitioner pattern for a new lead-generation account with no clean conversion history and an old account that should not be trusted as a model:

- Start with Search only.
- Use exact/phrase keywords and strong negatives.
- Use Maximize Clicks with a CPC cap to collect controlled traffic and conversion signals.
- Move to Maximize Conversions only after the new account records enough clean lead events.
- Do not use Performance Max or broad match before conversion quality is proven.

Useful practitioner references reviewed earlier:

- [r/PPC: Best bid strategy for lead gen](https://www.reddit.com/r/PPC/comments/1jdbdsm/best_bid_strategy_for_lead_gen_in_google_ads/)
- [r/PPC: Brand new Google Ads account best starting bid](https://www.reddit.com/r/PPC/comments/147vnmk/brand_new_google_ads_account_best_starting_bid/)
- [Ten Thousand Foot View: bidding strategy for new lead-gen campaigns](https://www.tenthousandfootview.com/google-ads-bidding-strategy-start-lead-gen/)
- [Define Digital Academy: bidding strategy mistakes](https://www.definedigitalacademy.com/blog/google-ads-bidding-strategies-in-2025-how-to-avoid-costly-mistakes-and-maximize-results)
- [TLC Ads: Google Ads for B2B lead generation](https://tlcads.co.uk/google-ads-strategy/the-beginners-guide-to-google-ads-for-b2b-lead-generation-campaign/)

## Launch Phases

### Phase 0 - Build And QA Before Launch

Goal: make the account measurable before spending.

Tasks:

- Create the new Google Ads account under the clean central identity.
- Link the new Google Ads account to GA4 only after the account is created cleanly.
- Import GA4 key events into Google Ads:
  - `line_click`
  - `phone_click`
  - `quote_request`
- Confirm GTM and GA4 fire correctly from the final landing page.
- Add GCLID/GBRAID/WBRAID capture before launch.
- Build campaign, ad groups, keywords, negatives, ads, and assets from this plan.
- Disable auto-apply recommendations.
- Confirm location targeting uses presence-based targeting.
- Confirm Search Partners and Display Network are off.
- Confirm there is no link to the old billing-risk Google Ads account.

Exit criteria:

- Test click events fire into GA4 DebugView or Realtime.
- Google Ads conversion imports are present and marked primary/secondary correctly.
- Ads preview shows correct copy and landing page.
- Negative keyword list is applied.

### Phase 1 - Controlled Search Launch

Goal: buy clean search traffic and collect first-party lead signals.

Settings:

| Setting | Launch choice |
| --- | --- |
| Campaign type | Search |
| Bidding | Maximize Clicks |
| CPC cap | Start THB18-22; use THB15.89 old CPC only as a rough reference, not a target |
| Daily budget | THB300-500/day |
| Match types | Exact + Phrase |
| Broad match | Off |
| Search Partners | Off |
| Display Network | Off |
| Performance Max | Off |
| Location option | Presence: people in or regularly in target locations |
| Ad schedule | Start broad enough to learn; tighten after lead data |

Do not optimize based on click volume alone. During this phase, search-term quality, negative keyword discovery, and lead-event quality matter more than raw traffic. The old account already proved that clicks can be bought without trustworthy conversion learning.

### Phase 2 - Conversion Validation

Goal: prove which query groups produce real lead actions.

Watch for:

- `line_click` by campaign/ad group/search term.
- `phone_click` by campaign/ad group/search term.
- `quote_request` by campaign/ad group/search term.
- Mobile vs desktop lead-event split.
- Locations with clicks but no lead-event signal.
- Retailer/DIY/how-to queries slipping through.

Decision point:

- Stay on Maximize Clicks with CPC cap if conversion volume is thin or query quality is unstable.
- Move to Maximize Conversions only when the account has stable clean lead events, preferably at least 15-30 meaningful conversion events in a 30-day period.
- Do not use target CPA until the account has enough real lead volume and a realistic CPL benchmark.

### Phase 3 - Optimize And Expand

Goal: improve quality and scale only after measurement is stable.

Possible actions:

- Move winning exact-match terms into tighter ad groups.
- Add negatives from search terms every 2-3 days in the first two weeks.
- Adjust locations based on lead-event rate and actual service feasibility.
- Test dedicated landing page against homepage.
- Test Maximize Conversions once clean conversion volume is credible.
- Build offline lead-quality tracking from LINE/phone inquiries.

## Campaign Structure

Use one campaign at launch unless budget becomes large enough to justify splitting by budget or geography.

Campaign name:

`TH | Search | กันสาดพับเก็บได้ | Leads | 2026-06`

Ad groups:

| Ad group | Role | Keyword examples | Notes |
| --- | --- | --- | --- |
| Core - กันสาดพับได้ | Main commercial demand | `กันสาดพับได้`, `กันสาดพับเก็บได้`, `กันสาดพับเก็บ`, `กันสาดแบบพับได้` | Highest confidence from old account. |
| Electric - กันสาดไฟฟ้า | Motorized/automatic demand | `กันสาดไฟฟ้า`, `กันสาดอัตโนมัติ`, `กันสาดไฟฟ้าราคา`, `กันสาดมอเตอร์` | Old data shows volume; new campaign must prove lead quality. |
| Price - ประเมินราคา | Price/quote intent | `กันสาดพับได้ราคา`, `กันสาดพับเก็บได้ราคา`, `ราคากันสาดไฟฟ้า` | Copy should push onsite estimate, not cheap commodity price. |
| Fabric - ผ้าใบกันสาด | Canvas/fabric intent | `ผ้าใบกันสาดพับเก็บได้`, `กันสาดผ้าใบพับได้` | Lower priority than core/electric. |
| Install - ติดตั้งกันสาด | Service intent | `ติดตั้งกันสาดพับได้`, `รับติดตั้งกันสาดพับได้` | High intent despite lower old explicit volume. |

## Keyword Rules

Launch rules:

- Use exact and phrase only.
- No broad match in Phase 1.
- Do not use Dynamic Search Ads at launch.
- Do not use AI Max expansion at launch.
- Keep ad groups intent-clean. Do not mix retailer/DIY intent into lead-gen ad groups.
- If budget is tight, launch only the first three ad groups: Core, Electric, Price.
- Use the detailed [keyword launch map](local-analysis-2026-06-12/keyword-launch-map.md) as the build source.

Example match setup:

```text
[กันสาดพับได้]
"กันสาดพับได้"
[กันสาดพับเก็บได้]
"กันสาดพับเก็บได้"
[กันสาดไฟฟ้า]
"กันสาดไฟฟ้า"
[กันสาดอัตโนมัติ]
"กันสาดอัตโนมัติ"
```

## Negative Keywords

Apply a shared negative list at launch.

Starting seed:

| Match type | Negative keyword | Reason |
| --- | --- | --- |
| Phrase | โฮมโปร | Retail/DIY comparison leakage in old data. |
| Phrase | ไทวัสดุ | Retail/DIY comparison leakage in old data. |
| Phrase | ดูโฮม | Retail/DIY comparison. |
| Phrase | เมกาโฮม | Retail/DIY comparison. |
| Phrase | วิธี | How-to intent, usually not lead-gen. |
| Phrase | ประกอบ | Assembly intent. |
| Phrase | สำเร็จรูป | Ready-made kit intent. |
| Phrase | สําเร็จรูป | Alternate Thai spelling. |
| Broad/Phrase | DIY | Self-install intent. |
| Broad | ฟรี | Old account already excluded. |
| Phrase | มือสอง | Low commercial fit. |
| Phrase | ซ่อม | Exclude unless repair service becomes a deliberate offer. |

Review search terms every 2-3 days during the first 14 days.

Use the detailed [negative keyword candidate table](local-analysis-2026-06-12/negative-keyword-candidates.md) as the pre-launch negative source.

## Location Strategy

Start with the proven service-area cluster:

- Bangkok
- Pathum Thani
- Nonthaburi
- Samut Prakan
- Nakhon Pathom
- Samut Sakhon

Use presence-based targeting:

`People in or regularly in your targeted locations`

Do not use:

`People in, regularly in, or who have shown interest in your targeted locations`

Reason: service businesses can waste budget on people outside the actual service area.

Old data caveat:

Pathum Thani and Bangkok dominated spend, but old conversions were broken and the old setup quality was weak. Do not over-optimize geo until new lead events confirm quality.

## Device Strategy

Launch with all devices enabled, but monitor aggressively.

Old data:

- Mobile phones: 75.2% of spend.
- Computers: 21.4% of spend.
- Tablets: 3.4% of spend.

Implications:

- Mobile landing page quality is non-negotiable.
- LINE and phone CTAs must be visible without scrolling.
- Do not reduce desktop just because mobile has more volume; compare by lead-event rate after launch. The old device split is a traffic distribution clue, not a quality benchmark.

## Ad Schedule

Launch with broad coverage unless budget is extremely constrained.

Old data had meaningful activity across all days. Sunday and Saturday had the highest cost, but conversion tracking was broken and old campaign quality was uncertain, so we cannot infer lead quality.

Suggested launch schedule:

- First 7-14 days: 06:00-23:00.
- Exclude 00:00-05:59 unless the owner can handle late-night LINE leads and the budget is loose.
- Reassess once lead events exist.

## Conversion Tracking Plan

Primary conversions for Google Ads optimization:

| Event | Role | Notes |
| --- | --- | --- |
| `line_click` | Primary | Main lead path. |
| `phone_click` | Primary | Main lead path, especially on mobile. |
| `quote_request` | Primary or secondary depending on actual UX | Keep if the button/form is real and visible. |

Secondary/non-primary:

| Event | Role | Notes |
| --- | --- | --- |
| `contact_click` | Secondary | Useful engagement signal, not a lead-quality event. |
| `portfolio_view_click` | Secondary | Useful micro-conversion, not a lead. |
| `scroll` | Analytics only | Never use as Ads conversion. |
| `click` | Analytics only | Too broad; never import as Ads conversion. |
| `contact_form_submit_success` | Hold | Do not use in Phase 1. |

Quality rule:

Do not let Google Ads optimize for generic engagement. Only optimize for actions that can plausibly become LINE/phone/quote leads.

## GCLID And Lead Attribution Plan

Goal: preserve ad-click identifiers before the user leaves to LINE or phone.

Capture on landing:

- `gclid`
- `gbraid`
- `wbraid`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- first landing page
- latest landing page
- first timestamp
- latest timestamp

Storage:

- Store in first-party cookies or local storage with a sensible expiry, such as 90 days.
- Include values in dataLayer events where appropriate.
- If a form is used later, submit these fields as hidden fields.
- For LINE and phone, keep the identifiers in browser-side storage for later offline matching if a lightweight lead intake workflow is created.

Future offline conversion path:

1. Visitor clicks Google Ad.
2. Website stores click IDs and UTM values.
3. Visitor clicks LINE or phone.
4. Business records lead quality manually or in a CRM/sheet.
5. Qualified leads are uploaded back to Google Ads as offline conversions when process quality is high enough.

## Landing Page Readiness

The current homepage can be used for Phase 1 only if it passes this checklist.

Above the fold on mobile:

- Clear product promise: retractable awning / electric awning / installed service.
- Visible LINE CTA.
- Visible phone CTA.
- Trust signal or proof near the first screen.
- No confusing general navigation competing with lead action.

Content blocks:

- Product options: manual, electric, fabric/material.
- Installed portfolio proof.
- Service area.
- Estimate or onsite inspection promise.
- Objection handling: durability, weather, installation, warranty/service.

Tracking:

- LINE click fires `line_click`.
- Phone click fires `phone_click`.
- Quote CTA fires `quote_request`.
- Events carry enough context to distinguish header CTA, hero CTA, sticky mobile CTA, and body CTA where possible.

If the homepage fails this checklist, build a dedicated Ads landing page before launch or accept a smaller test budget.

## Ads And Assets Direction

Responsive search ads:

- At least 2 RSA variants per ad group if time allows.
- Pinning should be minimal. Pin only if legal/brand/offer clarity requires it.
- Headlines should include product, installation, and quote intent.
- Descriptions should push LINE/phone action and proof, not vague branding.

Headline angle examples:

- กันสาดพับเก็บได้พร้อมติดตั้ง
- กันสาดไฟฟ้า ประเมินหน้างาน
- ติดตั้งกันสาดพับได้โดยช่าง
- ขอราคากันสาดพับเก็บได้
- งานติดตั้งจริง ดูผลงานก่อนตัดสินใจ

Callouts:

- ประเมินราคาฟรี
- ติดตั้งโดยช่างมืออาชีพ
- มีระบบมือหมุนและไฟฟ้า
- ดูผลงานติดตั้งจริง

Sitelinks:

- ผลงานติดตั้ง
- กันสาดไฟฟ้า
- ขอประเมินราคา
- ติดต่อ / LINE

Call asset:

- Use the current verified business phone number only.
- Avoid duplicate account-level and campaign-level call assets unless deliberate.

## First 14-Day Operating Cadence

Daily checks:

- Spend pace vs daily budget.
- CPC vs cap.
- Search terms with spend/clicks.
- Conversion events by ad group.
- Disapproved ads or policy issues.

Every 2-3 days:

- Add negatives from search terms.
- Promote high-intent search terms to exact match.
- Pause obviously irrelevant keywords.
- Check landing-page event firing.

End of week 1:

- Review query quality, not just CTR.
- Check whether LINE/phone events are recording.
- Compare device and location by conversion event.

End of week 2:

- Decide whether to keep Maximize Clicks with cap.
- Consider Maximize Conversions only if conversion volume and quality are credible.
- Identify whether a dedicated landing page is required.

## Switch Criteria For Maximize Conversions

Do not switch just because Google recommends it.

Switch only when most of these are true:

- Google Ads has imported clean conversion events.
- Events are firing from real traffic, not only tests.
- Search terms are mostly relevant.
- The campaign has at least 15-30 meaningful conversions in a recent 30-day window.
- Lead quality from LINE/phone is not obviously poor.
- Budget can tolerate a learning period.

Do not use target CPA until:

- There is a realistic CPL benchmark.
- Lead quality has been reviewed.
- Conversion volume is stable enough that target CPA will not choke traffic.

## Hard No List

Do not enable these during Phase 1:

- Performance Max.
- Broad match.
- AI Max expansion.
- Search Partners.
- Display Network.
- Auto-apply recommendations.
- Optimizing for `click`, `scroll`, or generic engagement.
- Linking the new account to the old billing-risk account.
- Importing old conversion history.

## Open Decisions Before Account Creation

- Confirm launch daily budget: THB300, THB400, or THB500/day.
- Confirm phone number for call asset.
- Confirm final target provinces/service area.
- Confirm whether `quote_request` is visible enough to be a primary conversion.
- Confirm whether homepage passes mobile Ads readiness.
- Confirm whether GCLID/GBRAID/WBRAID capture is implemented before launch or queued immediately after launch.

## Data Science Workbench Plan

The old exports are small enough that BigQuery is not needed for the current planning pass. The current job is not statistical modeling; it is controlled launch design from imperfect historical evidence.

Use local analysis first:

- Parse the archived CSV files with repeatable local scripts.
- Build n-gram and intent clusters from search terms.
- Create a negative-keyword candidate table with evidence: query, clicks, cost, impressions, reason, suggested match type.
- Build a launch keyword map from high-intent queries, not from old campaign settings.
- Use simple charts only when they clarify concentration, such as cost by intent cluster, cost by location, and clicks by device.

Do not use yet:

- BigQuery, unless we later connect live GA4 export, Google Ads API data, Search Console bulk data, or CRM/offline lead-quality data.
- Heavy modeling, because there is no reliable conversion target in the old data.
- Automated keyword generation without manual review, because Thai query intent and service-fit nuance matter.

When to add BigQuery:

- GA4, Google Ads, Search Console, and lead-quality records need to be joined repeatedly.
- Offline conversion upload becomes operational.
- Weekly reporting needs stable historical tables instead of manual CSV exports.
- We need repeatable segmentation by campaign, query, landing page, lead channel, and lead quality.

When to add charts:

- Use Matplotlib or another local charting tool for internal analysis when a visual changes the decision.
- Useful charts: spend by intent cluster, search-term Pareto, location spend share, device click/cost share, and hour/day heatmap.
- Do not let charts hide the main issue: the old account has no trustworthy conversion target.

## Build Checklist

Before launch:

- [ ] New Google Ads account created cleanly.
- [ ] Billing set up in the new account only.
- [ ] GA4 linked to the new Google Ads account.
- [ ] `line_click`, `phone_click`, `quote_request` imported.
- [ ] Search campaign created.
- [ ] Search Partners off.
- [ ] Display Network off.
- [ ] Location targeting set to presence only.
- [ ] Maximize Clicks selected.
- [ ] CPC cap set.
- [ ] Daily budget set.
- [ ] Ad groups created.
- [ ] Exact and phrase keywords added.
- [ ] Shared negative list applied.
- [ ] RSA ads created.
- [ ] Sitelinks/callouts/call asset added.
- [ ] Homepage or landing page tested on mobile.
- [ ] Tag Assistant / GA4 Realtime confirms key events.
- [ ] No auto-apply recommendations enabled.

After launch:

- [ ] Check search terms within 48 hours.
- [ ] Add first negative keyword batch.
- [ ] Confirm conversion events from real traffic.
- [ ] Review location/device split.
- [ ] Decide whether landing page work is urgent.
