## คู่มือ Conversion Tracking (GTM-only)

คู่มือนี้อธิบายการติดตั้งและใช้งานระบบ Conversion Tracking สำหรับ Google Ads โดย “คุมผ่าน Google Tag Manager (GTM) อย่างเดียว” (ไม่โหลด/ไม่ยิง `gtag.js` จากแอปโดยตรง)

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

### ไม่จำเป็นสำหรับ GTM-only (Legacy/Unused ในโค้ดปัจจุบัน)
โปรเจกต์อาจเคยมีตัวแปรประเภท GA/Ads เช่น `NEXT_PUBLIC_GA_TRACKING_ID`, `NEXT_PUBLIC_GA4_TRACKING_ID`, `NEXT_PUBLIC_CONVERSION_LABEL` ฯลฯ แต่ **โค้ดปัจจุบันไม่ได้ใช้งานแล้ว** (แนะนำให้ย้ายการตั้งค่า Conversion ID/Label ไปทำใน GTM UI แทน)

## ขั้นตอนติดตั้ง GTM + Google Ads Conversion Tracking

### 1) สร้าง/ตรวจสอบ Conversion Actions ใน Google Ads
ตัวอย่าง Conversion Actions ที่แนะนำ:
- Lead (Contact Form Success)
- LINE Click (เริ่มแชท/ขอใบเสนอราคา)
- Phone Click (คลิกโทร)

จดค่า:
- **Conversion ID** (รูปแบบ `AW-XXXXXXXXXX`)
- **Conversion Label** (สตริง)

### 2) ตั้งค่า GTM (Container เดียวกับเว็บไซต์)

#### 2.1 สร้าง Tag: Conversion Linker (แนะนำ)
- Tag Type: **Conversion Linker**
- Trigger: **All Pages**

#### 2.2 สร้าง Trigger: Custom Event
สร้าง Trigger (Custom Event) อย่างน้อย 1 ตัวต่อ event ที่ต้องการนับ conversion:
- `Event name` = `contact_form_submit_success`
- `Event name` = `line_click`
- `Event name` = `phone_click`

> ถ้าต้องการนับจาก `button_click` ด้วย ให้สร้าง Trigger เพิ่ม: `Event name` = `button_click`

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

### 3) (Optional) สร้างตัวแปร Data Layer ใน GTM เพื่อใช้งานต่อ
ถ้าต้องการนำค่าไปแยกรีพอร์ต/ทำเงื่อนไข:
- Data Layer Variable: `position`
- Data Layer Variable: `phone_number`
- Data Layer Variable: `subject`

## การทดสอบ (Recommended)

### ทดสอบด้วย GTM Preview
1) เปิด GTM → **Preview**
2) ใส่ URL เว็บไซต์ (Production หรือ `next build && next start` เพื่อให้โหลด GTM)
3) คลิกปุ่มที่ต้องการทดสอบ แล้วตรวจใน Tag Assistant ว่า:
   - Event `line_click` / `phone_click` / `contact_form_submit_success` เกิดขึ้น
   - Google Ads Conversion Tag ยิง (Fired) ตาม Trigger ที่ตั้งไว้

### เช็คในหน้าเว็บ (Debug)
เปิด DevTools Console แล้วลองดู event ล่าสุด:
```js
window.dataLayer?.slice(-5)
```

## คำแนะนำการออกแบบ Conversion

- แนะนำให้ใช้ `contact_form_submit_success` เป็น “Conversion หลัก” เพราะวัดผลหลังส่งข้อมูลสำเร็จจริง
- `line_click` และ `phone_click` เหมาะเป็น micro conversion หรือ secondary conversion
- หลีกเลี่ยงการใช้ Click Trigger แบบ “Just Links” ซ้ำซ้อนกับ Custom Event เดียวกัน เพราะอาจนับซ้ำ

