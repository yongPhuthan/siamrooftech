# New Google Ads Campaign Brief

## Launch Principle

Create a clean Google Ads account and use the old account only as archived insight. Do not link the new account to the old billing-problem account. Use GA4/GTM key events as the conversion source: `line_click`, `phone_click`, and `quote_request`.

## Recommended Starting Structure

| Campaign | Ad group | Keyword intent | Starting match types | Notes |
| --- | --- | --- | --- | --- |
| Search - กันสาดพับเก็บได้ | Core retractable awning | กันสาดพับได้, กันสาดพับเก็บได้, กันสาดพับเก็บ, กันสาดแบบพับได้ | Exact + Phrase | Highest-confidence core demand. |
| Search - กันสาดพับเก็บได้ | Electric / automatic | กันสาดไฟฟ้า, กันสาดอัตโนมัติ, กันสาดไฟฟ้าราคา, กันสาดมอเตอร์ | Exact + Phrase | Separate copy for motorized/electric benefit and quote qualification. |
| Search - กันสาดพับเก็บได้ | Price / quote | กันสาดพับได้ราคา, กันสาดพับเก็บได้ราคา, ราคากันสาดไฟฟ้า | Exact + Phrase | Use quote-focused landing copy; avoid cheap-only positioning. |
| Search - กันสาดพับเก็บได้ | Fabric / canvas | ผ้าใบกันสาดพับเก็บได้, กันสาดผ้าใบพับได้ | Exact + Phrase | Test after core/electric if budget allows. |
| Search - กันสาดพับเก็บได้ | Installation service | ติดตั้งกันสาดพับได้, รับติดตั้งกันสาดพับได้ | Exact + Phrase | Old search-term export did not show much explicit installation volume, but this is high-commercial-intent. |


## Starting Negative Keyword Seed

| Match type | Keyword | Reason |
| --- | --- | --- |
| Phrase | โฮมโปร | Retail/DIY comparison; old data spent on HomePro intent without conversion signal. |
| Phrase | ไทวัสดุ | Retail/DIY comparison; old data spent on Thai Watsadu intent without conversion signal. |
| Phrase | ดูโฮม | Retail/DIY comparison. |
| Phrase | เมกาโฮม | Retail/DIY comparison. |
| Broad/Phrase | DIY | Likely self-install intent, not contractor install. |
| Phrase | วิธี | How-to intent; old account already had related negatives. |
| Phrase | ประกอบ | Assembly intent; old account already had related negatives. |
| Phrase | สำเร็จรูป | Ready-made kit intent; low fit for custom installed retractable awnings. |
| Broad | ฟรี | Old account already excluded. |
| Phrase | มือสอง | Likely low commercial fit. |


## Budget And Bidding

- Old benchmark CPC: THB15.89 average across all device traffic.
- Old budget observed during browser export: about `THB400/day`.
- Recommended clean launch: start around `THB300-500/day` if cash flow allows, but optimize by lead quality after GA4 key events appear in Google Ads.
- Start with a conservative bidding strategy until conversion volume is real. Do not use old conversion history.

## Landing Page Direction

Use either the homepage after Ads-specific cleanup or a dedicated Ads landing page. The first screen should make the product and conversion action unmistakable:

- Clear headline around `กันสาดพับเก็บได้ / กันสาดไฟฟ้า พร้อมติดตั้ง`.
- Above-fold LINE and phone CTAs.
- Proof blocks: installed projects, material/operation options, service area, and onsite quote promise.
- Dedicated sections for electric/automatic and price/quote intent.
- Keep form submit secondary for now; LINE and phone are primary conversions.

## Assets To Reuse Or Rebuild

- Keep a call asset, but avoid duplicate account + campaign call assets unless there is a deliberate reason.
- Keep sitelinks to portfolio/proof pages, but do not rely on portfolio as the main landing destination.
- Keep callout ideas like `ประเมินราคาฟรี`, but remove unrelated callouts if the service is not part of the new campaign focus.

## First 14-Day Monitoring Checklist

1. Confirm GA4 key events are imported into Google Ads and recording: `line_click`, `phone_click`, `quote_request`.
2. Review search terms every 2-3 days and add negatives for retailer/DIY/how-to intent.
3. Split high-spend terms into exact match when they show lead intent.
4. Compare mobile vs desktop by lead event, not by click count.
5. Review locations by lead event and service feasibility.
6. Watch landing page behavior in GA4: page engagement, CTA clicks, and scroll depth.

## Data Gaps To Fix Later

- Redownload full Ads table if exact old headlines/descriptions are needed; current ad CSV is only a time-series export.
- Redownload full Campaigns table if bid strategy/status/settings history are needed; current campaigns CSV is only a time-series export.
- Add verified offline lead quality notes once LINE/phone inquiries start, because old data cannot tell us which search terms produced real customers.
