# Siamrooftech Cloudflare OpenNext Deploy Runbook

วันที่: 2026-06-13

วัตถุประสงค์ของเอกสารนี้คือเก็บหลักฐาน deployment ปัจจุบัน และกำหนดทางเดินที่ปลอดภัยก่อนปล่อยโค้ด tracking/attribution ขึ้น production

## สถานะที่ตรวจพบ

Production `https://www.siamrooftech.com/`:

- ตอบผ่าน Cloudflare
- มี header `x-opennext: 1`
- ใช้ Next.js บน OpenNext/Cloudflare Worker
- มี GTM `GTM-TDXKN9MG`
- ยังไม่พบโค้ด attribution ล่าสุด เช่น `siamrooftech_attribution_v1`

Cloudflare account ที่เป็น production path:

- Account: `Siamrooftech`
- Account ID: `a61f30bb027ef64c9577c73f5981f073`
- Zone: `siamrooftech.com`
- Zone ID: `cd352a5b3b39fbdb34939be1d9248050`
- Worker: `siamrooftech`
- Worker custom domains:
  - `www.siamrooftech.com`
  - `siamrooftech.com`
- Worker deploy source: `wrangler`
- Latest observed deployment: 2026-06-06
- Latest deployment author: `phuthan.dev@gmail.com`
- Worker compatibility date: `2026-06-06`
- Compatibility flag: `nodejs_compat`
- Bindings:
  - `ASSETS`
  - `NEXT_PUBLIC_GTM_ID=GTM-TDXKN9MG`

Cloudflare account ที่ไม่ใช่ production path:

- Account: `Yongmontha@gmail.com's Account`
- Account ID: `90bc013e4ef5a3f90f972f4b1486c524`
- มี Worker ชื่อ `siamrooftech` เช่นกัน แต่ zone `siamrooftech.com` ใน account นี้เป็น pending และ nameserver mismatch
- ห้ามใช้ account นี้เป็น production target สำหรับเว็บหลักตอนนี้

สิ่งที่เพิ่มเข้า repo แล้ว:

- `wrangler.jsonc`
- `open-next.config.ts`
- dependency `@opennextjs/cloudflare`
- dev dependency `wrangler`
- package scripts:
  - `cf:build`
  - `cf:preview`
  - `cf:deploy`
  - `cf:check`

สิ่งที่ต้องระวัง:

- `firebase.json` มีอยู่ แต่ไม่มี `.firebaserc` และ Firebase CLI ไม่พบ active project ที่ตรงกับ Siamrooftech
- ไม่ควรใช้ `firebase deploy` สำหรับ production รอบนี้ เพราะ production ที่เห็นจริงเป็น Cloudflare/OpenNext
- ยังมี Worker ชื่อ `siamrooftech` ซ้ำในอีก account หนึ่ง ต้องใช้ `account_id` ใน `wrangler.jsonc` เพื่อกัน deploy ผิด account
- production deploy จะทับ Worker `siamrooftech` ใน account `Siamrooftech` โดยตรง เพราะ domain bind กับ Worker นี้อยู่แล้ว

## Validation ล่าสุด

ทำวันที่: 2026-06-13

ผ่าน:

- `npm run type-check`
- `npm run cf:build`
- `npx wrangler deploy --dry-run`
- `npx wrangler dev --port 8787 --local`
- Worker preview `/` ตอบ `200` พร้อม `x-opennext: 1`
- Worker preview `/contact?gclid=previewcontact&utm_source=google&utm_medium=cpc` ตอบ `200` พร้อม `x-opennext: 1`
- Worker preview `/contact` มี:
  - GTM `GTM-TDXKN9MG`
  - `googletagmanager.com/gtm.js`
  - โทร `098-454-2455`
  - LINE `@siamrooftech`
  - ไม่มีข้อความฟอร์มเดิม `ส่งข้อความถึงเรา`
- bundle assets มี attribution key `siamrooftech_attribution_v1`
- bundle assets มี event `line_click` และ `phone_click`
- Browser QA ผ่าน Playwright MCP:
  - URL ทดสอบ: `http://localhost:8787/contact?gclid=previewbrowser&utm_source=google&utm_medium=cpc&utm_campaign=worker_preview`
  - `localStorage.siamrooftech_attribution_v1` เก็บ `latest_gclid=previewbrowser`
  - `localStorage.siamrooftech_attribution_v1` เก็บ `latest_utm_campaign=worker_preview`
  - คลิก CTA LINE แล้ว `dataLayer` มี `line_click` พร้อม `position=contact_primary_line`
  - คลิก CTA โทรแล้ว `dataLayer` มี `phone_click` พร้อม `position=contact_primary_phone` และ `phone_number=0984542455`

สิ่งที่แก้ระหว่าง validation:

- OpenNext build แรก fail เพราะ `firebase-admin -> jwks-rsa -> jose` ชน condition `workerd`
- แก้ด้วยการตั้ง `config.cloudflare.useWorkerdCondition = false` ใน `open-next.config.ts`
- Worker preview `/contact` เคยตอบ `500` เพราะหน้า contact ดึง `ContactForm` และ Firestore/client form dependency เข้ามา
- แก้โดยเอา form ออกจากหน้า contact และแทนด้วย CTA โทร/LINE ที่ track ได้

Warning ที่ยังเหลือ:

- Wrangler dry-run ยังเตือน direct eval ใน server bundle แต่หน้า `/` และ `/contact` preview ผ่านแล้ว
- Next build ยังมี lint warning เรื่อง `<img>` และ missing hook dependencies ในไฟล์อื่น
- Build ยังเตือน Firebase env ไม่ครบ จึงใช้ fallback/mock data

## Production Deploy Result

Deploy วันที่: 2026-06-13

- Command: `npm run cf:deploy`
- Worker: `siamrooftech`
- Account: `Siamrooftech`
- Deployment ID: `36e2b98b-53c0-4c28-af1c-42fc07f860f7`
- Version ID: `032895a5-e433-4d6a-aa95-c3a2b01ccef7`
- Version number: 6
- Traffic: 100%
- Deploy source: `wrangler`
- Deploy author observed: `yongmontha@gmail.com`
- Workers.dev URL: `https://siamrooftech.phuthan-dev.workers.dev`

Production QA:

- URL ทดสอบ: `https://www.siamrooftech.com/contact?gclid=prodplaywright&utm_source=google&utm_medium=cpc&utm_campaign=production_verify`
- หน้า `/contact` ตอบ `200`
- header มี `x-opennext: 1`
- HTML มี GTM `GTM-TDXKN9MG`
- HTML มี `googletagmanager.com/gtm.js`
- HTML มีโทร `098-454-2455`
- HTML มี LINE `@siamrooftech`
- HTML ไม่มีข้อความฟอร์มเดิม `ส่งข้อความถึงเรา`
- Browser `localStorage.siamrooftech_attribution_v1` เก็บ:
  - `latest_gclid=prodplaywright`
  - `latest_utm_source=google`
  - `latest_utm_medium=cpc`
  - `latest_utm_campaign=production_verify`
- Simulated click บน production:
  - `line_click` พร้อม `position=contact_primary_line`
  - `phone_click` พร้อม `position=contact_primary_phone`
  - `phone_number=0984542455`
  - ทั้งสอง event มี `attribution_latest_gclid=prodplaywright`

## หลักฐานจาก Cloudflare/OpenNext Docs

Cloudflare docs สำหรับ Next.js บน Workers แนะนำ workflow ปัจจุบัน:

- ติดตั้ง `@opennextjs/cloudflare`
- ติดตั้ง `wrangler`
- สร้าง `wrangler.jsonc` หรือ `wrangler.toml`
- ตั้ง `main` เป็น `.open-next/worker.js`
- ตั้ง assets เป็น `.open-next/assets` binding `ASSETS`
- เปิด `nodejs_compat`
- สร้าง `open-next.config.ts` ด้วย `defineCloudflareConfig()`
- ใช้ script ประมาณ:
  - `opennextjs-cloudflare build && opennextjs-cloudflare preview`
  - `opennextjs-cloudflare build && opennextjs-cloudflare deploy`

Reference: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

## Safe Deploy Plan

ลำดับหลัง production deploy:

1. ทดสอบ production ซ้ำผ่าน GTM Preview และ GA4 DebugView
2. ปรับ GTM event parameter mapping สำหรับ `position`, `phone_number`, และ attribution parameters
3. เชื่อม Google Ads conversion
4. ทำ landing page QA รอบสุดท้ายก่อนเปิดแคมเปญ

## ห้ามทำ

- ห้าม deploy ด้วย Firebase จนกว่าจะพิสูจน์ว่า Firebase เป็น production host จริง
- ห้ามสร้าง Worker ใหม่แทน `siamrooftech` แล้วชี้ domain โดยไม่ตรวจ route ปัจจุบัน
- ห้ามลบ `account_id` ออกจาก `wrangler.jsonc` เพราะมี Worker ชื่อซ้ำในอีก account
- ห้ามเปิด Google Ads traffic จริงก่อน production tracking ผ่าน QA แล้ว

## สถานะการตัดสินใจ

โค้ด tracking และ deploy pipeline ถูก deploy ขึ้น production แล้ว

ยังไม่ควรเปิด Google Ads traffic จริงจนกว่าจะตรวจ GTM Preview + GA4 DebugView บน production หลัง deploy
