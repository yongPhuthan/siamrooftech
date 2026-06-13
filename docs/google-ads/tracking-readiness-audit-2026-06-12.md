# Siamrooftech Google Ads Tracking Readiness Audit

วันที่: 2026-06-12

สถานะล่าสุด: ผ่าน local browser QA, Worker preview QA, production deploy, production browser QA, GTM Preview, GA4 DebugView และ GA4 Key Events แล้ว ยังไม่ควรเปิดแคมเปญจริงจนกว่าจะตรวจ GTM Preview + GA4 DebugView บน production หลัง deploy และเชื่อม Google Ads account ใหม่กับ GA4/GTM ให้เรียบร้อย

## สิ่งที่แก้ในรอบนี้

- เปลี่ยน fallback GTM container ในเว็บเป็น `GTM-TDXKN9MG`
- เพิ่มตัวเก็บ attribution ฝั่งเว็บ:
  - `gclid`
  - `gbraid`
  - `wbraid`
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_term`
  - `utm_content`
- เก็บ first/latest landing page และ timestamp ไว้ใน `localStorage` key: `siamrooftech_attribution_v1`
- แนบ attribution และ page context ไปกับทุก event ที่ยิงผ่าน helper ใน `src/lib/gtm.ts`
- เพิ่ม tracking ให้ CTA สำคัญ:
  - Final CTA: LINE และโทรศัพท์
  - WhyUs section: LINE CTA ทั้ง desktop/mobile
  - Portfolio detail CTA: LINE และโทรศัพท์
  - Contact page contact info / quick actions: LINE และโทรศัพท์
  - Works detail CTA: โทรศัพท์
- แก้ข้อมูลติดต่อหน้า `/contact` จาก placeholder เป็น:
  - โทร: `098-454-2455`
  - LINE: `@siamrooftech`

## Conversion Event Map

Primary conversion candidates:

| Event | ความหมาย | สถานะ |
| --- | --- | --- |
| `line_click` | คลิกไป LINE | พร้อมทดสอบ |
| `phone_click` | คลิกโทรศัพท์ | พร้อมทดสอบ |

Secondary / diagnostic events:

| Event | ความหมาย | สถานะ |
| --- | --- | --- |
| `contact_form_submit_success` | ส่งฟอร์มสำเร็จ | มีอยู่เดิม แต่ฟอร์มยังไม่ใช่ conversion หลัก |
| `portfolio_view_click` | คลิกดูผลงาน | มีอยู่เดิม ใช้เป็น micro engagement ได้ |
| `contact_click` | คลิกปุ่มติดต่อทั่วไป | มี helper แต่ยังไม่ใช่ event หลัก |

## Attribution Parameters ที่ส่งเข้า Data Layer

ตัวอย่าง parameter ที่ event จะพ่วงไปด้วย:

- `page_location`
- `page_path`
- `page_title`
- `attribution_first_landing_page`
- `attribution_latest_landing_page`
- `attribution_first_gclid`
- `attribution_latest_gclid`
- `attribution_first_utm_campaign`
- `attribution_latest_utm_campaign`

หมายเหตุ: การส่งเข้า `dataLayer` ไม่ได้แปลว่า GA4 จะรับ parameter ทุกตัวอัตโนมัติ ต้องตั้งค่า GA4 Event Tag ใน GTM ให้ map parameter ที่ต้องการส่งต่อด้วย

## GTM / GA4 Checklist ที่ทำแล้ว

1. เปิด GTM Preview แล้วทดสอบ URL ที่มี query เช่น:
   `/?gclid=test123&utm_source=google&utm_medium=cpc&utm_campaign=test_campaign`
2. คลิก LINE / โทร จากหน้าแรก, หน้า portfolio detail, หน้า contact
3. ตรวจว่า event ต่อไปนี้ขึ้นใน GTM Preview:
   - `line_click`
   - `phone_click`
4. ตรวจว่า event เข้า GA4 DebugView
5. ตั้งหรือยืนยัน GA4 key events:
   - `line_click`
   - `phone_click`

ยังเหลือ:

- เชื่อม GA4 conversion กลับเข้า Google Ads account ใหม่ หรือสร้าง Google Ads conversion tag ผ่าน GTM โดยตรง
- ปรับ GTM parameter mapping สำหรับ custom parameters ที่ต้องใช้ทำ report

## Local QA Result

ทดสอบวันที่: 2026-06-12

เครื่องมือ:

- Dev server: `http://localhost:3001`
- Playwright runner ผ่าน `npx @playwright/test@1.60.0`
- Browser channel: Google Chrome

ผลลัพธ์:

| Check | Result |
| --- | --- |
| หน้าแรกโหลดด้วย `gclid=test123` และ UTM test | Pass |
| `localStorage.siamrooftech_attribution_v1` ถูกสร้าง | Pass |
| เก็บ `first_gclid/latest_gclid` ถูกต้อง | Pass |
| เก็บ `utm_source/utm_campaign` ถูกต้อง | Pass |
| คลิก LINE desktop nav แล้วยิง `line_click` | Pass |
| `line_click` มี `position=navigation_desktop` | Pass |
| `line_click` แนบ `attribution_latest_gclid=test123` | Pass |
| หน้า `/contact` แสดงเบอร์ `098-454-2455` | Pass |
| คลิกโทร แล้วยิง `phone_click` | Pass |
| `phone_click` มี `phone_number=0984542455` | Pass |
| `phone_click` แนบ `attribution_latest_gclid=test456` | Pass |

คำสั่งที่ใช้:

```bash
yarn type-check
npx -y @playwright/test@1.60.0 test --config=/tmp/siamrooftech-playwright.config.js --browser=chromium --reporter=line
npx -y playwright@1.60.0 screenshot --browser=chromium --channel=chrome http://localhost:3001/contact /tmp/siamrooftech-contact-qa.png
```

## GTM / GA4 Verification Result

ทดสอบวันที่: 2026-06-12

GTM:

- Account: `SiamRoofTech`
- Container: `SiamRoofTech - Web`
- Container ID: `GTM-TDXKN9MG`
- Workspace: Default Workspace
- Live version: Version 3
- User/account observed: `admin.siamrooftech@gmail.com`
- Measurement ID: `G-3E2ZVTYNTS`

GTM tag setup observed:

| Item | Status |
| --- | --- |
| `GA4 - Google Tag - All Pages` | Present |
| `Ads - Conversion Linker - All Pages` | Present |
| `GA4 - Event - Lead and Engagement Events` | Present |
| Trigger `CE - Lead and Engagement Events` | Present |
| Trigger regex covers `line_click` | Pass |
| Trigger regex covers `phone_click` | Pass |
| Event name sent as `{{Event}}` | Pass |

Trigger regex observed:

```text
^(line_click|phone_click|contact_click|quote_request|contact_form_submit_success|portfolio_view_click|button_click)$
```

Tag Assistant / GTM Preview test:

- Tested on production local build: `http://localhost:3002`
- Debug URL included `gtm_debug`
- `line_click` appeared in Tag Assistant
- `phone_click` appeared in Tag Assistant
- `GA4 - Google Tag - All Pages` fired
- `Ads - Conversion Linker - All Pages` fired
- `GA4 - Event - Lead and Engagement Events` fired
- Tag Assistant showed no non-firing tags for the tested events

GA4 DebugView test:

- Property path observed: `a396985069p540466015`
- Property name observed: `SiamRoofTech`
- DebugView showed `line_click`
- DebugView showed `phone_click`
- Top events showed both events in the last 30 minutes

GA4 Key Events observed:

| Event | Key event status |
| --- | --- |
| `line_click` | Enabled |
| `phone_click` | Enabled |
| `quote_request` | Enabled |
| `contact_form_submit_success` | Enabled |
| `close_convert_lead` | Enabled |
| `qualify_lead` | Enabled |
| `purchase` | Enabled by GA default |

Important limitation:

- The GA4 Event tag currently sends event name via `{{Event}}`, but custom event parameters such as `position`, `phone_number`, and `attribution_latest_gclid` were not visibly mapped in the tag configuration. Conversion counting works, but richer GA4 reporting by CTA position / stored attribution needs a separate GTM parameter-mapping pass.

## ความเสี่ยงที่เหลือ

- หน้า `/contact` เอาฟอร์มออกแล้ว และปรับเป็น CTA โทร/LINE สำหรับ conversion รอบแรก
- Event parameters จะพร้อมใน `dataLayer` แล้ว แต่ต้องยืนยัน mapping ใน GTM ก่อนนับเป็น tracking ที่สมบูรณ์
- โค้ด attribution ล่าสุดทดสอบบน local production แล้ว แต่ยังต้อง deploy ขึ้น production ก่อนใช้กับ traffic จริง
- Dev server ยังมี warning เรื่อง Firebase env, legacy `next/image` prop และ image sizing ซึ่งควรแยกแก้ก่อนทำ performance QA
- Dev server พบ `TypeError: Cannot convert argument to a ByteString...` ระหว่าง request หน้าแรก แม้ HTTP ยังตอบ `200`; ควรแยกวิเคราะห์ก่อน deploy production ถ้ายังเกิดใน build/production log

## Production Deployment Status

ตรวจเพิ่มวันที่: 2026-06-13

สถานะ production ปัจจุบัน:

- `https://www.siamrooftech.com/` ตอบผ่าน Cloudflare และมี header `x-opennext: 1`
- production มี GTM `GTM-TDXKN9MG` แล้ว
- production deploy ล่าสุดมีโค้ด attribution `siamrooftech_attribution_v1` แล้ว
- repo ปัจจุบันไม่มี `.firebaserc` และ Firebase CLI ไม่มี active project สำหรับ deploy
- repo มี `wrangler.jsonc`, `open-next.config.ts` และ script deploy สำหรับ Cloudflare แล้ว
- production path ที่ยืนยันแล้วคือ account `Siamrooftech` (`a61f30bb027ef64c9577c73f5981f073`) -> zone `siamrooftech.com` -> Worker `siamrooftech`
- `www.siamrooftech.com` และ `siamrooftech.com` bind เป็น Workers Domains กับ Worker `siamrooftech`
- Cloudflare account ที่เป็น production มี Worker `siamrooftech` ซึ่ง deploy ด้วย `wrangler` ล่าสุดวันที่ 2026-06-06 โดย `phuthan.dev@gmail.com`
- Worker `siamrooftech` มี binding `ASSETS` และ `NEXT_PUBLIC_GTM_ID=GTM-TDXKN9MG`
- มีอีก account ชื่อ `Yongmontha@gmail.com's Account` ที่มี Worker ชื่อ `siamrooftech` เช่นกัน แต่ไม่ใช่ production path ของโดเมนหลักตอนนี้

ข้อสรุป:

โค้ด tracking และ Cloudflare deploy pipeline พร้อมสำหรับ release candidate แล้ว แต่ยังไม่ควรเปิดแคมเปญจริงจนกว่า deploy production และตรวจ GTM/GA4 บน production ซ้ำ

Worker preview QA:

- URL ทดสอบ: `http://localhost:8787/contact?gclid=previewbrowser&utm_source=google&utm_medium=cpc&utm_campaign=worker_preview`
- หน้า `/contact` ตอบ `200` พร้อม header `x-opennext: 1`
- Browser `localStorage.siamrooftech_attribution_v1` เก็บ `gclid` และ UTM ได้ถูกต้อง
- หน้า `/contact` ไม่มีฟอร์มเดิมแล้ว
- คลิก CTA LINE ยิง `line_click` พร้อม `position=contact_primary_line`
- คลิก CTA โทรยิง `phone_click` พร้อม `position=contact_primary_phone` และ `phone_number=0984542455`

Production deploy result:

- Deploy command: `npm run cf:deploy`
- Deployment ID: `36e2b98b-53c0-4c28-af1c-42fc07f860f7`
- Version ID: `032895a5-e433-4d6a-aa95-c3a2b01ccef7`
- Traffic: 100%
- URL ทดสอบ: `https://www.siamrooftech.com/contact?gclid=prodplaywright&utm_source=google&utm_medium=cpc&utm_campaign=production_verify`
- หน้า `/contact` ตอบ `200` พร้อม header `x-opennext: 1`
- Browser `localStorage.siamrooftech_attribution_v1` เก็บ `gclid` และ UTM ได้ถูกต้องบน production
- หน้า `/contact` ไม่มีฟอร์มเดิมแล้วบน production
- คลิก CTA LINE ยิง `line_click` พร้อม `position=contact_primary_line` บน production
- คลิก CTA โทรยิง `phone_click` พร้อม `position=contact_primary_phone` และ `phone_number=0984542455` บน production

## คำแนะนำเฟสถัดไป

ลำดับที่ควรทำต่อ:

1. ทดสอบ production ด้วย URL ที่มี `gclid` และคลิก LINE/โทรผ่าน GTM Preview + GA4 DebugView อีกครั้ง
2. ปรับ GTM event parameter mapping
3. เชื่อม Google Ads conversion
4. ทำ Landing Page QA สำหรับหน้าแรกและหน้า contact ก่อนเปิดแคมเปญ
