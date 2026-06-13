# Siamrooftech Google Ads Conversion Funnel

วันที่จัดทำ: 2026-06-13

## Objective

วางระบบ conversion tracking สำหรับเริ่ม Google Ads Search campaign โดยให้ conversion หลักสะท้อน lead intent จริงที่สุดเท่าที่เว็บวัดได้ตอนนี้ และไม่ให้ Google Ads optimize จาก micro-conversion ที่คุณภาพต่ำเกินไป

## Current Website Tracking

GTM container ที่ฝังใน production:

- `GTM-TDXKN9MG`

Attribution capture:

- Component: `src/app/components/AttributionCapture.tsx`
- Storage key: `siamrooftech_attribution_v1`
- Captured query params:
  - `gclid`
  - `gbraid`
  - `wbraid`
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_term`
  - `utm_content`
- Captured landing context:
  - `first_landing_page`
  - `first_landing_path`
  - `first_seen_at`
  - `latest_landing_page`
  - `latest_landing_path`
  - `latest_seen_at`

ทุก tracked event ส่ง page context:

- `page_location`
- `page_path`
- `page_title`

ทุก tracked event ส่ง attribution params เป็น prefix `attribution_...` เช่น:

- `attribution_latest_gclid`
- `attribution_latest_gbraid`
- `attribution_latest_wbraid`
- `attribution_latest_utm_campaign`
- `attribution_latest_utm_term`
- `attribution_first_landing_page`
- `attribution_latest_landing_page`

## Event Mapping

| Event | Conversion role | Triggered by | Important params | Recommended GA4 key event |
|---|---|---|---|---|
| `line_click` | Primary lead conversion | LINE CTA clicks | `position`, `lead_type=line`, `conversion_priority=primary` | Yes |
| `phone_click` | Primary lead conversion | Phone CTA clicks | `position`, `phone_number`, `lead_type=phone`, `conversion_priority=primary` | Yes |
| `portfolio_view_click` | Secondary / micro-conversion | Portfolio buttons | `position`, `conversion_priority=secondary` | No at launch |
| `contact_click` | Secondary / engagement | Contact navigation intent | `position` | No at launch |
| `contact_form_submit_success` | Legacy conversion | Contact form submit success | `subject` | No, unless form returns |

## Known Click Positions

### LINE

- `navigation_desktop`
- `navigation_mobile_header`
- `navigation_mobile_menu`
- `mobile`
- `desktop`
- `bottom`
- `final_cta`
- `portfolio_cta`
- `portfolio_detail_cta`
- `why_us_desktop_safety`
- `why_us_desktop_design`
- `why_us_desktop_after_sales`
- `why_us_mobile_safety`
- `why_us_mobile_design`
- `why_us_mobile_after_sales`
- Contact page positions from `TrackedContactLink`, including:
  - `contact_primary_line`
  - `contact_info_line`
  - `contact_quick_action_line`

### Phone

- `navigation_mobile_menu`
- `final_cta`
- `portfolio_cta`
- `portfolio_detail_cta`
- `works_detail_cta`
- Contact page positions from `TrackedContactLink`, including:
  - `contact_primary_phone`
  - `contact_info_phone`
  - `contact_quick_action_phone`

### Portfolio

- `homepage_project_gallery_more`

## GTM Variables

Create these Data Layer Variables in GTM.

| Variable name | Data Layer Variable Name |
|---|---|
| `DLV - position` | `position` |
| `DLV - lead_type` | `lead_type` |
| `DLV - conversion_priority` | `conversion_priority` |
| `DLV - phone_number` | `phone_number` |
| `DLV - page_path` | `page_path` |
| `DLV - page_location` | `page_location` |
| `DLV - page_title` | `page_title` |
| `DLV - attribution_latest_gclid` | `attribution_latest_gclid` |
| `DLV - attribution_latest_gbraid` | `attribution_latest_gbraid` |
| `DLV - attribution_latest_wbraid` | `attribution_latest_wbraid` |
| `DLV - attribution_latest_utm_campaign` | `attribution_latest_utm_campaign` |
| `DLV - attribution_latest_utm_term` | `attribution_latest_utm_term` |
| `DLV - attribution_first_landing_page` | `attribution_first_landing_page` |
| `DLV - attribution_latest_landing_page` | `attribution_latest_landing_page` |

## GTM Triggers

Create Custom Event triggers.

| Trigger name | Trigger type | Event name |
|---|---|---|
| `CE - line_click` | Custom Event | `line_click` |
| `CE - phone_click` | Custom Event | `phone_click` |
| `CE - portfolio_view_click` | Custom Event | `portfolio_view_click` |
| `CE - contact_click` | Custom Event | `contact_click` |
| `CE - contact_form_submit_success` | Custom Event | `contact_form_submit_success` |

## GA4 Event Tags

Create GA4 Event tags in GTM. Use the existing GA4 Configuration / Google Tag if already present in the container.

### Tag: `GA4 - line_click`

- Event name: `line_click`
- Trigger: `CE - line_click`
- Event parameters:
  - `position`
  - `lead_type`
  - `conversion_priority`
  - `page_path`
  - `page_location`
  - `page_title`
  - `attribution_latest_gclid`
  - `attribution_latest_gbraid`
  - `attribution_latest_wbraid`
  - `attribution_latest_utm_campaign`
  - `attribution_latest_utm_term`
  - `attribution_first_landing_page`
  - `attribution_latest_landing_page`

### Tag: `GA4 - phone_click`

- Event name: `phone_click`
- Trigger: `CE - phone_click`
- Event parameters:
  - `position`
  - `phone_number`
  - `lead_type`
  - `conversion_priority`
  - `page_path`
  - `page_location`
  - `page_title`
  - attribution params listed above

### Tag: `GA4 - portfolio_view_click`

- Event name: `portfolio_view_click`
- Trigger: `CE - portfolio_view_click`
- Event parameters:
  - `position`
  - `conversion_priority`
  - `page_path`
  - `page_location`
  - `page_title`
  - attribution params listed above

### Tag: `GA4 - contact_click`

- Event name: `contact_click`
- Trigger: `CE - contact_click`
- Event parameters:
  - `position`
  - `page_path`
  - `page_location`
  - `page_title`
  - attribution params listed above

## GA4 Key Events

Mark as key events:

- `line_click`
- `phone_click`

Do not mark as key events at launch:

- `portfolio_view_click`
- `contact_click`
- `contact_form_submit_success`

Reason: launch optimization should learn from high-intent lead actions only. Portfolio/contact engagement can be reviewed as supporting diagnostics, not bidding goals.

## Google Ads Conversion Actions

Recommended initial setup:

| Conversion action | Source | Goal | Count | Optimization |
|---|---|---|---|---|
| `Line Click Lead` | Import from GA4 `line_click` or direct GTM Ads tag | Submit lead form / Contact | One | Primary |
| `Phone Click Lead` | Import from GA4 `phone_click` or direct GTM Ads tag | Phone call lead | One | Primary |
| `Portfolio View Intent` | Import from GA4 `portfolio_view_click` | Page view / Other | One | Secondary |

Settings:

- Attribution: Data-driven if available
- Click-through conversion window: 30 days
- View-through conversion window: keep short or disabled for Search launch
- Count: One
- Default values:
  - `Line Click Lead`: 100 THB placeholder value
  - `Phone Click Lead`: 150 THB placeholder value
  - `Portfolio View Intent`: 10 THB placeholder value, secondary only

## QA Checklist

Use this test URL:

```text
https://www.siamrooftech.com/?gclid=test-gclid&utm_source=google&utm_medium=cpc&utm_campaign=test-campaign&utm_term=test-keyword&utm_content=test-ad
```

Browser checks:

- Open DevTools Console and confirm localStorage key exists:

```js
JSON.parse(localStorage.getItem('siamrooftech_attribution_v1'))
```

Expected:

- `latest_gclid` is `test-gclid`
- `latest_utm_campaign` is `test-campaign`
- `latest_utm_term` is `test-keyword`

GTM Preview checks:

- Click mobile sticky LINE CTA
  - Expected event: `line_click`
  - Expected `position`: `mobile`
- Click desktop floating LINE CTA
  - Expected event: `line_click`
  - Expected `position`: `desktop`
- Click nav LINE CTA
  - Expected event: `line_click`
  - Expected `position`: `navigation_desktop` or `navigation_mobile_header`
- Click phone CTA
  - Expected event: `phone_click`
  - Expected `phone_number`: `0984542455`
- Click portfolio button if present
  - Expected event: `portfolio_view_click`
  - Expected `position`: `homepage_project_gallery_more`

GA4 DebugView checks:

- `line_click` appears with params
- `phone_click` appears with params
- Attribution params are present
- Events are not duplicated for a single click

Google Ads checks:

- Conversion actions are receiving data
- Conversion diagnostics shows no tag errors
- Primary conversions are only `line_click` and `phone_click`

## Launch Decision

Ready to launch only after:

- GTM Preview shows every primary event correctly
- GA4 DebugView receives `line_click` and `phone_click`
- Google Ads conversion diagnostics is active or recently received
- No duplicated event for one click

Do not switch to Maximize Conversions until enough real conversion volume exists.
