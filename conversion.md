## คู่มือ Conversion Tracking (GTM-only)

คู่มือนี้อธิบายการติดตั้งและใช้งานระบบ Conversion Tracking สำหรับ Google Ads โดย “คุมผ่าน Google Tag Manager (GTM) อย่างเดียว” (ไม่โหลด/ไม่ยิง `gtag.js` จากแอปโดยตรง)

## ลิงก์สำหรับตั้งค่า/ทดสอบ (ไปที่เว็บไหนบ้าง)

- Google Tag Manager (GTM): `https://tagmanager.google.com/`
- Google Ads: `https://ads.google.com/`
- Tag Assistant (ใช้ตอน Preview/Debug GTM): `https://tagassistant.google.com/`

## ภาพรวมสถาปัตยกรรม

1. เว็บไซต์โหลด **GTM Container** (Production เท่านั้น) ผ่าน `@next/third-parties/google`
2. โค้ดในแอป “push” event เข้า `dataLayer` ด้วย `sendGTMEvent(...)`
3. ใน GTM สร้าง **Trigger (Custom Event)** แล้วผูกกับ **Google Ads Conversion Tag**

จุดที่ใช้ในโค้ด:
- โหลด GTM: `src/app/layout.tsx`
- ยิง event เข้า GTM: `src/lib/gtm.ts` (export ผ่าน `src/lib/gtag.ts` เพื่อ backward-compat)

## รายการ Event ที่แอปยิงเข้า GTM

> ทุก event จะถูกส่งเป็น object ไปที่ `window.dataLayer`.

### 1) `line_click`
ใช้สำหรับวัดการคลิกปุ่ม/ลิงก์ไป LINE (Lead intent)

Payload หลัก:
- `event`: `line_click`
- `event_category`: `engagement`
- `event_label`: `line_button`
- `position`: ตำแหน่งปุ่ม เช่น `hero`, `bottom`, `mobile`, `navigation_desktop`, `portfolio_cta`
- `value`: `1`

### 2) `phone_click`
ใช้สำหรับวัดการคลิกโทร (Call intent)

Payload หลัก:
- `event`: `phone_click`
- `event_category`: `engagement`
- `event_label`: `phone_call`
- `phone_number`: เบอร์โทรที่ผู้ใช้กด
- `position`: ตำแหน่งปุ่ม
- `value`: `1`

### 3) `contact_form_submit_success`
ใช้สำหรับวัด “ส่งฟอร์มติดต่อสำเร็จ” (แนะนำให้ใช้เป็น Conversion หลัก)

Payload หลัก:
- `event`: `contact_form_submit_success`
- `event_category`: `conversion`
- `event_label`: ค่า `subject` ของฟอร์ม (เช่น `quotation`, `consultation`)
- `subject`: ค่า `subject` ของฟอร์ม
- `value`: `1`

### 4) `portfolio_view_click`
ใช้สำหรับวัดการคลิกไปหน้า/ปุ่ม “ดูผลงานทั้งหมด” (micro conversion)

Payload หลัก:
- `event`: `portfolio_view_click`
- `event_category`: `navigation`
- `event_label`: `portfolio_button`
- `position`: ตำแหน่งปุ่ม (ถ้าถูกส่ง)
- `value`: `2`

### 5) `button_click` (Legacy บางจุด)
ยังมีบางส่วนของหน้า/ปุ่มที่ยิง event ชื่อ `button_click` แบบ `dataLayer.push(...)` โดยตรง (เช่นใน `WhyUs2`)

Payload หลักที่พบ:
- `event`: `button_click`
- `event_category`: `Button`
- `event_action`: `Click`
- `event_label`: เช่น `สอบถามราคา`

> ถ้าต้องการให้ Google Ads นับ conversion จาก event นี้ด้วย ให้สร้าง Trigger เพิ่มใน GTM หรือปรับโค้ดให้ใช้ `line_click` แทน

## ตั้งค่า Environment Variables

### จำเป็น (Required)
- `NEXT_PUBLIC_GTM_ID`
  - ค่าเป็น GTM Container ID เช่น `GTM-XXXXXXX`
  - ใช้ใน `src/app/layout.tsx` เพื่อโหลด GTM ใน production

#### ตั้งค่าที่ไหน
- ถ้า deploy บน Vercel: ไปที่ `https://vercel.com/` → Project → **Settings** → **Environment Variables** → เพิ่ม `NEXT_PUBLIC_GTM_ID`
- ถ้ารันในเครื่อง: ใส่ในไฟล์ `.env` (ไฟล์นี้ถูก ignore ใน git อยู่แล้ว)

### ไม่จำเป็นสำหรับ GTM-only (Legacy/Unused ในโค้ดปัจจุบัน)
โปรเจกต์อาจเคยมีตัวแปรประเภท GA/Ads เช่น `NEXT_PUBLIC_GA_TRACKING_ID`, `NEXT_PUBLIC_GA4_TRACKING_ID`, `NEXT_PUBLIC_CONVERSION_LABEL` ฯลฯ แต่ **โค้ดปัจจุบันไม่ได้ใช้งานแล้ว** (แนะนำให้ย้ายการตั้งค่า Conversion ID/Label ไปทำใน GTM UI แทน)

## ขั้นตอนติดตั้ง GTM + Google Ads Conversion Tracking

### 1) สร้าง/ตรวจสอบ Conversion Actions ใน Google Ads
ตัวอย่าง Conversion Actions ที่แนะนำ:
- Lead (Contact Form Success)
- LINE Click (เริ่มแชท/ขอใบเสนอราคา)
- Phone Click (คลิกโทร)

ไปที่ Google Ads: `https://ads.google.com/`
1) ไปที่เมนู **Tools & Settings** (ไอคอนประแจ)
2) กลุ่ม **Measurement** → **Conversions**
3) กด **New conversion action** → เลือก **Website**
4) สร้าง Conversion action ให้สอดคล้องกับ event ที่เว็บส่ง (แนะนำทำ 1 action ต่อ 1 event)
   - `contact_form_submit_success` → Category: **Lead**
   - `line_click` → Category: **Lead** (หรือ Secondary conversion ถ้าอยากให้เป็น micro)
   - `phone_click` → Category: **Phone calls** หรือ **Lead**
5) บันทึก แล้วจดค่า:
   - **Conversion ID** (รูปแบบ `AW-XXXXXXXXXX`)
   - **Conversion Label** (สตริง)

> ถ้ามี Conversion Actions อยู่แล้ว: เปิดเข้าไปที่ action นั้น ๆ เพื่อ copy Conversion ID/Label มาใช้ใน GTM ได้เลย

จดค่า:
- **Conversion ID** (รูปแบบ `AW-XXXXXXXXXX`)
- **Conversion Label** (สตริง)

### 2) ตั้งค่า GTM (Container เดียวกับเว็บไซต์)

ไปที่ GTM: `https://tagmanager.google.com/`

#### 2.0 เลือก Container ให้ถูก (สำคัญมาก)
1) เลือก Account/Container ของเว็บไซต์
2) ตรวจมุมบนซ้าย/บนของหน้า GTM ว่ามี Container ID เป็น `GTM-...` ตรงกับค่า `NEXT_PUBLIC_GTM_ID` ที่ตั้งไว้ในระบบ deploy

ถ้า Container ไม่ตรง:
- หยุดตั้งค่าก่อน แล้วสลับไป Container ที่ถูกต้อง (ไม่งั้น publish ไปแล้วเว็บจะไม่ยิง tag ที่เราตั้ง)

#### 2.0.1 ใช้ Workspace อย่างไร
- ถ้ามีหลายคนทำงานพร้อมกัน แนะนำสร้าง Workspace ใหม่: เมนูซ้าย → **Workspace** → **Add New Workspace**
- ถ้าทำคนเดียว สามารถใช้ Default Workspace ได้

> หมายเหตุ: โหมด Preview จะทดสอบ “การเปลี่ยนแปลงใน Workspace” ได้ก่อน publish เสมอ

#### 2.1 สร้าง Tag: Conversion Linker (แนะนำ)
ทำ 1 ครั้งต่อ 1 container (ไม่ต้องสร้างซ้ำหลายอัน)
1) เมนูซ้าย → **Tags** → **New**
2) คลิก **Tag Configuration** → เลือก **Conversion Linker**
3) คลิก **Triggering** → เลือก **All Pages**
4) ตั้งชื่อแนะนำ: `Base - Conversion Linker`
5) กด **Save**

ทำไมต้องมี: ช่วยให้ Google Ads เก็บ/อ่านค่า click identifiers ได้ถูกต้อง ลดปัญหานับ conversion ไม่เข้า

#### 2.2 สร้าง Trigger: Custom Event
สร้าง Trigger (Custom Event) อย่างน้อย 1 ตัวต่อ event ที่ต้องการนับ conversion

วิธีสร้าง Trigger (ทำซ้ำตามรายการ event):
1) เมนูซ้าย → **Triggers** → **New**
2) คลิก **Trigger Configuration** → เลือก **Custom Event**
3) ใส่ **Event name** ให้ตรง 100% กับ event จากเว็บ
4) เลือก “This trigger fires on”
   - แบบง่าย: **All Custom Events** (ไม่กรองอะไร)
   - แบบแนะนำ: **Some Custom Events** (กรองเพิ่ม เช่นตามตำแหน่งปุ่ม)
5) ตั้งชื่อแนะนำตามรูปแบบ: `CE - <event_name>`
6) กด **Save**

รายการ Trigger ที่แนะนำให้มี:
- `CE - contact_form_submit_success` (Event name: `contact_form_submit_success`)
- `CE - line_click` (Event name: `line_click`)
- `CE - phone_click` (Event name: `phone_click`)
- `CE - portfolio_view_click` (Event name: `portfolio_view_click`) (Optional)
- `CE - button_click` (Event name: `button_click`) (Optional/Legacy)

ตัวอย่างการ “กรองตามตำแหน่งปุ่ม (position)”
- เลือก **Some Custom Events**
- เงื่อนไข: `position` equals `navigation_desktop`
  - กรณีนี้จะนับเฉพาะคลิก LINE ที่มาจากปุ่มในเมนู desktop เท่านั้น

> การกรองด้วย `position/subject/phone_number` แนะนำให้สร้าง Data Layer Variables ก่อน (ดูหัวข้อ 2.2.1)

#### 2.2.1 (Optional) สร้าง Data Layer Variables เพื่อใช้กรอง/ส่งค่า
ถ้าต้องการใช้ค่าใน trigger conditions หรือส่งค่าเข้า Google Ads tag แบบ dynamic
1) เมนูซ้าย → **Variables** → **New**
2) คลิก **Variable Configuration** → เลือก **Data Layer Variable**
3) ใส่ **Data Layer Variable Name** ตาม key ที่เว็บส่ง
4) ตั้งชื่อแนะนำ: `DLV - <key>`
5) กด **Save**

ตัวแปรที่แนะนำ:
- `DLV - position` (Data Layer Variable Name: `position`)
- `DLV - phone_number` (Name: `phone_number`)
- `DLV - subject` (Name: `subject`)
- `DLV - value` (Name: `value`)
- `DLV - currency` (Name: `currency`)

#### 2.3 สร้าง Tag: Google Ads Conversion Tracking
สร้าง Tag แยกตาม Conversion Action (แนะนำ 1 Tag ต่อ 1 Label):
1) Tag: `Ads - Lead - Contact Form Success`
   - Tag Type: **Google Ads Conversion Tracking**
   - Conversion ID: `AW-XXXXXXXXXX`
   - Conversion Label: `<ใส่ label ของ Lead>`
   - Trigger: Custom Event `contact_form_submit_success`

2) Tag: `Ads - Lead - Line Click`
   - Conversion ID: `AW-XXXXXXXXXX`
   - Conversion Label: `<ใส่ label ของ Line>`
   - Trigger: Custom Event `line_click`

3) Tag: `Ads - Lead - Phone Click`
   - Conversion ID: `AW-XXXXXXXXXX`
   - Conversion Label: `<ใส่ label ของ Phone>`
   - Trigger: Custom Event `phone_click`

> หมายเหตุ: ถ้าต้องการนับเฉพาะบางตำแหน่ง ให้เพิ่มเงื่อนไขใน Trigger เช่น `position equals navigation_desktop`

วิธีสร้าง Tag แบบละเอียด (ทำซ้ำตาม conversion action):
1) เมนูซ้าย → **Tags** → **New**
2) คลิก **Tag Configuration** → เลือก **Google Ads Conversion Tracking**
3) ใส่ข้อมูลจาก Google Ads:
   - **Conversion ID**: ปกติเป็นตัวเลข/หรือรูปแบบ `AW-...` ตามที่ GTM template ยอมรับ
     - ถ้า paste `AW-...` แล้วระบบไม่ยอมรับ ให้ใส่ “เฉพาะตัวเลข” (ตัด `AW-` ออก)
   - **Conversion Label**: วาง label ตามที่ได้จาก Google Ads
4) (Optional) ค่า Value/Currency:
   - แบบง่าย: ใส่ค่า fix (เช่น 1)
   - แบบ dynamic: ใช้ตัวแปร `{{DLV - value}}` และ `{{DLV - currency}}`
5) คลิก **Triggering** → เลือก Trigger ที่สร้างไว้ เช่น `CE - line_click`
6) ตั้งชื่อ Tag ให้สื่อความหมาย (ตามตัวอย่างด้านบน)
7) กด **Save**

คำแนะนำการ “ป้องกัน Conversion Linker ไม่ทัน”
- โดยทั่วไป Conversion Linker ยิง All Pages ก็พอ
- ถ้าอยากชัวร์: ใน Google Ads Conversion Tag → **Advanced Settings** → **Tag Sequencing**
  - เลือก “Fire a tag before” แล้วเลือก `Base - Conversion Linker`

#### 2.3.1 ป้องกันการนับซ้ำ (แนะนำทำก่อน Publish)
ถ้า Container นี้เคยติดตั้ง Google Ads/GA มาก่อน อาจมี tag เดิมที่ “ยิงซ้ำ” ได้

เช็คลิสต์:
1) เมนูซ้าย → **Tags**
   - ค้นหาด้วยคำว่า `Google Ads`, `Conversion`, `AW-`, `Lead`, `LINE`, `Phone`
2) ถ้าพบ Tag ที่ยิง conversion เดียวกันอยู่แล้ว (เช่นยิงตอน Click ลิงก์ LINE) ให้เลือกทำอย่างใดอย่างหนึ่ง:
   - **Pause** tag เดิม (แนะนำระหว่างย้ายระบบ)
   - หรือปรับ Trigger ของ tag เดิมให้ไม่ทับกับ Custom Event
3) เมนูซ้าย → **Triggers**
   - ระวัง Trigger ประเภท **Just Links / Click - All Elements** ที่อาจทำให้ `line_click` ถูกนับซ้ำ
4) ทดสอบด้วย Preview:
   - คลิก LINE 1 ครั้ง → ใน Tag Assistant event `line_click` ควรเห็น “conversion tag ยิงแค่ 1 อัน” ต่อ 1 conversion action

#### 2.4 (Optional) ส่ง value/currency จาก dataLayer เข้า Google Ads Tag
ในโค้ดมีการส่ง `value` และบาง event มี `currency`
ถ้าต้องการให้ Google Ads Tag ใช้ค่าแบบ dynamic:
1) สร้าง Variable ใน GTM แบบ **Data Layer Variable**
   - `value` (Number)
   - `currency` (String)
2) ใน Google Ads Conversion Tag ใส่ Value/Currency เป็นตัวแปร เช่น `{{DLV - value}}`, `{{DLV - currency}}`

#### 2.5 Publish
หลังตั้งค่าเสร็จ กด **Submit** → **Publish** เพื่อให้ tag/trigger ใช้งานจริง

ขั้นตอน Submit/Publish แบบละเอียด:
1) ตรวจว่าทดสอบด้วย Preview แล้ว “Tags Fired” ถูกต้อง (แนะนำทำก่อน publish)
2) มุมขวาบนใน GTM กด **Submit**
3) ใส่:
   - **Version name** (แนะนำ): `Ads conversions via dataLayer events`
   - **Version description**: สรุปว่ามี tag/trigger อะไรเพิ่ม/ปรับ
4) ตรวจสรุปสิ่งที่จะ publish (Tags/Triggers/Variables)
5) กด **Publish** (หรือ **Submit** แล้วแต่ UI)

ถ้าต้องการ “หยุด” บาง tag ชั่วคราว:
- เข้า tag นั้น → ใช้ปุ่ม **Pause** (หรือ toggle) แล้วค่อย Submit อีกครั้ง

#### 2.6 เช็คหลัง publish (ยืนยันว่า live)
1) เปิดเว็บแบบปกติ (ไม่ใช้ preview) แล้วทำ action 1 ครั้ง
2) เปิด DevTools Console:
```js
window.dataLayer?.slice(-10)
```
3) ถ้าต้องการยืนยันว่าโหลด GTM จริง: เปิด DevTools → Network แล้วค้นหา `gtm.js?id=GTM-...`

### 3) (Optional) สร้างตัวแปร Data Layer ใน GTM เพื่อใช้งานต่อ
ถ้าต้องการนำค่าไปแยกรีพอร์ต/ทำเงื่อนไข:
- Data Layer Variable: `position`
- Data Layer Variable: `phone_number`
- Data Layer Variable: `subject`

## การทดสอบ (Recommended)

### เงื่อนไขสำคัญก่อนทดสอบ
- โปรเจกต์โหลด GTM เฉพาะตอน `NODE_ENV === "production"`
  - ถ้าทดสอบในเครื่อง: ใช้ `npm run build` แล้วรัน `npm start` (หรือ `next start`)
  - ถ้าใช้ `npm run dev` จะไม่โหลด GTM → Preview/Tag จะไม่ทำงาน

### 1) ทดสอบด้วย GTM Preview (วิธีแนะนำ)
1) ไปที่ GTM: `https://tagmanager.google.com/` → กด **Preview**
2) ระบบจะเปิด Tag Assistant: `https://tagassistant.google.com/` ให้ใส่ URL เว็บไซต์ แล้วกด Connect
3) เปิดเว็บในแท็บที่เชื่อมต่อแล้ว ทำ action ที่ต้องการทดสอบ (เช่น คลิก LINE / ส่งฟอร์ม)
4) กลับไปที่แท็บ Tag Assistant → ดู timeline ทางซ้าย:
   - ต้องเห็น event ชื่อ `line_click` / `phone_click` / `contact_form_submit_success`
5) คลิก event นั้น → ตรวจด้านขวา:
   - **Tags Fired** ต้องมี Google Ads Conversion Tag ที่ตั้งไว้
   - ถ้าไม่ยิง ดู **Tags Not Fired** แล้วตรวจเงื่อนไข Trigger (event name/filters)

### 2) ทดสอบค่า dataLayer (Debug ในเบราว์เซอร์)
ในหน้าเว็บ (แท็บที่เปิดเว็บ) เปิด DevTools Console แล้วรัน:
```js
window.dataLayer?.slice(-10)
```
ตรวจว่ามี object ที่มี `event` ตรงกับสิ่งที่ทดสอบ และมีค่า `position/phone_number/subject` ตามที่คาด

### 3) ทดสอบให้ครบ “ตาม Conversion Action” (แนะนำทำทีละอัน)

#### A) Lead - Contact Form Success (`contact_form_submit_success`)
1) ไปหน้า `/contact`
2) กรอกฟอร์ม แล้วกดส่งจนขึ้นข้อความ “ส่งข้อความเรียบร้อยแล้ว!”
3) ใน Tag Assistant ต้องเห็น:
   - Event: `contact_form_submit_success`
   - Tag: `Ads - Lead - Contact Form Success` fired

> หมายเหตุ: การส่งฟอร์มจะบันทึกข้อมูลจริง ถ้าต้องการทดสอบแบบไม่กระทบข้อมูลจริง แนะนำทดสอบบน staging หรือเพิ่มโหมด test ในระบบบันทึกฟอร์ม

#### B) Lead/Micro - LINE Click (`line_click`)
1) คลิกปุ่ม/ลิงก์ LINE ในจุดต่าง ๆ (เมนู, ปุ่มลอย, CTA)
2) ใน Tag Assistant ต้องเห็น:
   - Event: `line_click`
   - Tag: `Ads - Lead - Line Click` fired
3) ถ้าต้องการแยก conversion ตามตำแหน่งปุ่ม ให้ดู field `position` แล้วตั้ง Trigger ให้แคบลง (เช่น `position equals navigation_desktop`)

#### C) Lead/Micro - Phone Click (`phone_click`)
1) คลิกลิงก์ `tel:` (เช่น CTA/เมนูมือถือ)
2) ใน Tag Assistant ต้องเห็น:
   - Event: `phone_click`
   - Tag: `Ads - Lead - Phone Click` fired
3) ตรวจ field:
   - `phone_number` เป็นเบอร์ที่ถูกต้อง
   - `position` เป็นตำแหน่งที่ถูกต้อง

#### D) (Optional) Micro - Portfolio Button Click (`portfolio_view_click`)
1) คลิกปุ่ม “ดูผลงานทั้งหมด” (เช่นปุ่มที่พาไป `/portfolio`)
2) ใน Tag Assistant ต้องเห็น event `portfolio_view_click`
3) ถ้าต้องการนับเป็น conversion ให้สร้าง Google Ads Conversion Tag ที่ผูกกับ trigger นี้โดยเฉพาะ (หรือใช้เป็นแค่ event สำหรับรีมาร์เก็ตติ้ง/วัด engagement)

#### E) (Optional) Legacy - `button_click`
1) ไปส่วน WhyUs2 แล้วกดปุ่ม “ประเมินราคาฟรี”
2) ใน Tag Assistant ต้องเห็น event `button_click`
3) ถ้าจะนับเป็น conversion ให้สร้าง Google Ads Conversion Tag ที่ผูกกับ trigger นี้โดยเฉพาะ

## ตรวจสอบผลใน Google Ads ว่าสำเร็จจริง (หลังทดสอบ)

ไปที่ Google Ads: `https://ads.google.com/` → Tools & Settings → Measurement → Conversions
- เปิด Conversion action ที่เกี่ยวข้อง แล้วดูส่วน **Diagnostics / Tag** (ชื่อหัวข้ออาจต่างกันเล็กน้อยตาม UI)
- ปกติ Tag Diagnostics/Status จะหน่วง (หลักชั่วโมง) กว่าจะอัปเดตว่าได้รับสัญญาณแล้ว
- ตัวเลข Conversion ในรายงานแคมเปญอาจหน่วง 3–24 ชั่วโมง

## ปัญหาที่พบบ่อย (Troubleshooting)

- Preview แล้วไม่เห็น event เลย:
  - ตรวจว่าเว็บที่ทดสอบ “โหลด GTM จริง” (ต้องเป็น production build หรือ deploy จริง)
  - ตรวจ `NEXT_PUBLIC_GTM_ID` ถูกต้อง และ container ถูก Publish แล้ว
- เห็น event แต่ Tag ไม่ยิง:
  - Trigger event name ไม่ตรง (สะกดต่างกัน)
  - มีเงื่อนไข filter เช่น `position`/`subject` ที่ไม่ตรงกับค่าจริง
- นับซ้ำ:
  - อย่าสร้าง tag ยิงซ้ำทั้งจาก **Just Links/Click Trigger** และ **Custom Event** ในเหตุการณ์เดียวกัน
  - เลือกใช้ Custom Event เป็นหลัก แล้วปิด click triggers ที่ซ้ำ

## คำแนะนำการออกแบบ Conversion

- แนะนำให้ใช้ `contact_form_submit_success` เป็น “Conversion หลัก” เพราะวัดผลหลังส่งข้อมูลสำเร็จจริง
- `line_click` และ `phone_click` เหมาะเป็น micro conversion หรือ secondary conversion
- หลีกเลี่ยงการใช้ Click Trigger แบบ “Just Links” ซ้ำซ้อนกับ Custom Event เดียวกัน เพราะอาจนับซ้ำ
