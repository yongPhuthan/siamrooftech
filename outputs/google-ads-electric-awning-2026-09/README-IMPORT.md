# Google Ads Editor import pack — กันสาดไฟฟ้า

Generated: 2026-09-03  
Campaign: `TH_Search_ElectricAwning_Leads_2026Q3`  
Safety state: **Paused — not approved for live spend**

## What is included

| Order | File | Rows created |
| --- | --- | ---: |
| 1 | `01-campaign.csv` | 1 campaign |
| 2 | `02-ad-groups.csv` | 2 ad groups |
| 3 | `03-keywords.csv` | 18 positive keywords |
| 4 | `04-negative-keywords.csv` | 16 campaign/ad-group negatives |
| 5 | `05-responsive-search-ads.csv` | 4 RSAs |
| 6 | `06-locations.csv` | 3 location targets |
| 7 | `07-sitelinks.csv` | 4 sitelinks |
| 8 | `08-callouts.csv` | 5 callouts |
| 9 | `09-call-asset.csv` | 1 call asset |

`Google-Ads-Editor-Import-Review.xlsx` is a human review workbook, not an Editor
import file. Google Ads Editor imports the numbered CSV files.

## Import procedure

1. Open the correct account in the current Google Ads Editor.
2. Resolve or reject any existing proposed changes before beginning.
3. Import the numbered CSV files one at a time via **Account → Import → From file**.
4. For each file, review the header mapping, then import it as proposed changes.
5. Resolve every error or warning. Do not silently accept an Editor default.
6. Check that the campaign remains **Paused** before keeping the proposals.
7. Review the full proposed-change diff. Posting the paused structure is separate
   from enabling spend.

The CSV files use English Google Ads Editor headers and UTF-8 with a BOM so Thai
text is preserved. If a local Editor build mishandles the encoding, open the file
in Excel and save it as UTF-16 Unicode Text before importing.

## Settings that must be verified manually

- Campaign is Search only; Networks shows **Google Search** without Search
  Partners or Display.
- Daily budget is THB500 and Maximize Clicks has a THB22 maximum CPC bid limit.
- Account timezone is Asia/Bangkok before relying on the 06:00–23:00 schedule.
- The three imported locations resolve to the intended administrative areas:
  Bangkok, Nonthaburi province, and Pathum Thani province.
- Location option is **Presence: people in or regularly in targeted locations**.
- Auto-tagging is enabled at account level.
- The phone number `+66 98 454 2455` and all sitelink URLs are correct.
- No policy warning, duplicate, or keyword/negative conflict remains.

## Deliberately not imported

The potential negatives `ซ่อม`, `อะไหล่`, `ล้าง`, `มอเตอร์อย่างเดียว`, and
`ผ้าใบอย่างเดียว` are held for a service-scope decision. In particular, `ล้าง`
conflicts with an older cleaning-service ad asset. The broad negative `งาน` was
rejected because it could block legitimate installation searches.

## Do not enable until these gates pass

- The production landing page returns HTTP 200 and the intended LP is displayed.
- The current account has been audited for overlapping Search campaigns, broad
  keywords, DSA, AI Max, and conflicting negatives.
- Tracking parameters persist and a paid-session LINE test matches the reference
  code to a `conversation_id`.
- Conversion diagnostics are clean. `line_survey_complete` is a persona/LINE-open
  proxy, not a qualified lead by itself.
- The matched LINE conversation receives the intended initial value:
  homeowner/procurement/contractor = 100/100/1, with later qualification and
  `actual_value` restatements handled separately.
- The owner reviews the final diff and explicitly authorizes enabling spend.

## Official references

- CSV preparation and encoding: https://support.google.com/google-ads/editor/answer/56368?hl=en
- Supported CSV columns and network values: https://support.google.com/google-ads/editor/answer/57747?hl=en
- Keyword and negative match types: https://support.google.com/google-ads/editor/answer/47635?hl=en
- Location import: https://support.google.com/google-ads/editor/answer/30573?hl=en
- Ad schedule syntax: https://support.google.com/google-ads/editor/answer/57751?hl=en
