# แผนหน้าเว็บไซต์และสถานะก่อนสร้าง XML Sitemap

อัปเดต: **2026-10-05** (Asia/Bangkok)
เว็บไซต์เป้าหมาย: `https://www.siamrooftech.com`
ขอบเขตการตรวจครั้งนี้: routes และ source code ใน repo พร้อม local production build/SEO QA; ยังไม่ตรวจเว็บไซต์ production, GSC หรือการจัดทำดัชนีของ Google

เอกสารนี้เป็นทะเบียนหน้าที่มีอยู่และหน้าที่วางแผนจะสร้าง ใช้ติดตามงานก่อนปรับ XML sitemap โดยหน้าในแผนไม่ได้มีสิทธิ์เข้า sitemap อัตโนมัติ สถานะ “สร้างแล้วใน repo” ยังไม่ยืนยันว่า deploy แล้ว มีเนื้อหาครบ หรือ Google index แล้ว

## กติกาที่ตกลงไว้

- Home ใช้ `/`; หน้าผลงานทั้งหมดใช้ `/projects` และหน้ารายละเอียดใช้ `/projects/{slug}` โดยกรองหมวดในหน้ารวม ไม่สร้าง URL หมวดแยก
- Contact ใช้ `/contact`; About วางแผนที่ `/about`; บทความทั้งหมดใช้ `/articles` และ slug ภาษาอังกฤษตาม URL map ด้านล่าง
- แยกบทความ “กันสาดอัตโนมัติ” จาก “กันสาดไฟฟ้า” ตามการตัดสินใจของผู้ใช้ แม้เป็นชื่อเรียกสินค้าเดียวกัน ขอบเขตคอนเทนต์แต่ละหน้าจะกำหนดภายหลัง ไม่ถือว่าเป็นบริการใหม่โดยอัตโนมัติ
- Final URL ของบทความใหม่ไม่มีคำว่า `guide`; อย่าย้ายหรือลบ URL ที่เผยแพร่แล้วโดยอัตโนมัติ หากยกเลิกหน้าให้ตอบ 404 และเพิ่ม redirect เฉพาะเมื่อผู้ใช้อนุมัติในงานนั้น
- **หน้าใดที่ยังไม่ได้สร้างจริงหรือยังไม่มีเนื้อหาเผยแพร่ ห้ามเพิ่มลง sitemap** รวมถึง draft, placeholder และ URL ที่คาดเดาจากชื่อหัวข้อ
- งานรอบนี้จัดทำเอกสารสถานะ ไม่ถือเป็นการรับรอง sitemap ปัจจุบันหรือความพร้อมเผยแพร่ทั้งเว็บไซต์

## สถานะที่ใช้

| สถานะการสร้าง | ความหมาย |
| --- | --- |
| วางแผน | ตกลง URL/บทบาทแล้ว แต่ยังไม่มีหลักฐานยืนยันหน้าหรือเนื้อหาจริง |
| กำลังสร้าง | มีงานพัฒนาหรือร่างเนื้อหาอยู่ ต้องระบุหลักฐานล่าสุด |
| สร้างแล้วใน repo | มี page implementation; ยังต้องตรวจ deploy และเนื้อหาจริง |
| มี template / รอยืนยันรายการจริง | มี dynamic route แต่ยังไม่ได้ตรวจ record และ URL รายหน้า |
| เผยแพร่แล้ว | ตรวจเว็บไซต์จริงแล้ว มีเนื้อหาตรงกับหน้าที่ต้องการและเข้าถึงได้ |
| ยกเลิก / รวมหน้า | มีการตัดสินใจยกเลิกหรือรวมแล้ว พร้อมบันทึก URL ปลายทางเมื่อเกี่ยวข้อง |

| สถานะ Sitemap | ความหมาย |
| --- | --- |
| ห้ามเพิ่ม | ยังเป็นแผน/draft, หน้าไม่ครบ, redirect, noncanonical หรือหน้าที่ไม่ควร index |
| รอตรวจ | มี implementation/ข้อมูลบางส่วน แต่หลักฐานเผยแพร่และ indexability ยังไม่ครบ |
| พร้อมเพิ่ม | ผ่านเงื่อนไขด้านล่างทั้งหมด พร้อมระบุ URL จริงและวันที่ตรวจ |
| เพิ่มแล้ว / ตรวจแล้ว | ยืนยัน URL ใน sitemap ที่เผยแพร่จริง และตรวจปลายทางแล้ว |

การปรากฏใน generator ปัจจุบันเป็นอีกข้อมูลหนึ่ง ไม่ใช่หลักฐานว่าหน้าผ่านเกณฑ์ “พร้อมเพิ่ม”

## ภาพรวมโครงสร้างเป้าหมาย

```text
/
├── projects/                            ผลงานทั้งหมดและตัวกรองหมวด
│   └── {slug}                          ผลงานแต่ละรายการจริง
├── services/
│   ├── retractable-awning
│   │   ├── bangkok
│   │   ├── nonthaburi
│   │   └── pathum-thani
│   └── electric-retractable-awning
├── articles/
│   ├── retractable-awning              วางแผน
│   ├── electric-retractable-awning      วางแผน
│   ├── automatic-awning                วางแผน
│   ├── retractable-awning-price         วางแผน
│   └── electric-retractable-awning-price วางแผน
├── contact/
└── about/                              วางแผน
```

Tree แสดงบทบาทและรูปแบบ URL; `{slug}` และ `{category}` เป็น pattern เท่านั้น ห้ามใส่ literal pattern ลง XML sitemap บทความเดิมที่ยังมีคุณค่าอยู่ใน `/articles/{slug}` ต่อไป รายการใหม่ทั้งห้าไม่ได้แทนบทความเดิมทั้งหมด

## หน้าหลัก

| ID | หน้า | URL เป้าหมาย | สถานะการสร้าง | Sitemap | หลักฐาน / งานถัดไป |
| --- | --- | --- | --- | --- | --- |
| CORE-01 | Home | `/` | สร้างแล้วใน repo | รอตรวจ | [page.tsx](../../src/app/page.tsx); generator มี URL นี้แล้ว รอตรวจ production |
| CORE-02 | Projects / ผลงาน | `/projects` | สร้างแล้วใน repo; local QA ผ่าน 2026-10-05 | รอตรวจ production | [Projects page](../../src/app/projects/page.tsx); ส่งลิงก์ผลงาน 16 รายการใน initial HTML และกรองหมวดในหน้าเดียว |
| CORE-03 | Contact | `/contact` | สร้างแล้วใน repo | รอตรวจ | [Contact page](../../src/app/contact/page.tsx); generator มีแล้ว รอตรวจ production |
| CORE-04 | About | `/about` | วางแผน | ห้ามเพิ่ม | ไม่พบ `src/app/about/page.tsx`; ต้องสร้างหน้าและข้อมูลธุรกิจจริงก่อน |
| CORE-05 | Articles index | `/articles` | สร้างแล้วใน repo | รอตรวจ | [Articles index](../../src/app/articles/page.tsx); generator มีแล้ว รอตรวจเนื้อหาและลิงก์บทความจริง |

## หน้าบริการและพื้นที่บริการ

| ID | หน้า | URL | สถานะการสร้าง | Sitemap | หลักฐาน / งานถัดไป |
| --- | --- | --- | --- | --- | --- |
| SVC-01 | บริการกันสาดพับได้ | `/services/retractable-awning` | สร้างแล้วใน repo | รอตรวจ | [Service page](../../src/app/services/retractable-awning/page.tsx) |
| SVC-02 | บริการกันสาดไฟฟ้า | `/services/electric-retractable-awning` | สร้างแล้วใน repo | รอตรวจ | [Electric service page](../../src/app/services/electric-retractable-awning/page.tsx) |
| LOCAL-01 | กรุงเทพ | `/services/retractable-awning/bangkok` | สร้างแล้วใน repo | รอตรวจ | [Bangkok page](../../src/app/services/retractable-awning/bangkok/page.tsx) |
| LOCAL-02 | นนทบุรี | `/services/retractable-awning/nonthaburi` | สร้างแล้วใน repo | รอตรวจ | [Nonthaburi page](../../src/app/services/retractable-awning/nonthaburi/page.tsx) |
| LOCAL-03 | ปทุมธานี | `/services/retractable-awning/pathum-thani` | สร้างแล้วใน repo | รอตรวจ | [Pathum Thani page](../../src/app/services/retractable-awning/pathum-thani/page.tsx) |

ทั้งห้า URL อยู่ใน [servicePages](../../src/lib/service-pages.ts) ที่ sitemap generator อ่านอยู่ ต้องตรวจการเผยแพร่จริงก่อนรับรอง ไม่มีการอนุมัติสร้างหน้าบริการ/พื้นที่ใหม่เพิ่มเติมจากการเพิ่มบทความ

## Final URL map ของบทความใหม่

| ID | Primary keyword / คำรอง | Final URL | สถานะการสร้าง | Sitemap | หน้าบริการที่สนับสนุน |
| --- | --- | --- | --- | --- | --- |
| ART-01 | กันสาดพับได้ | `/articles/retractable-awning` | วางแผน | ห้ามเพิ่ม | `/services/retractable-awning` |
| ART-02 | กันสาดไฟฟ้า; คำรอง: กันสาดไฟฟ้าพับได้, กันสาดไฟฟ้าพับเก็บได้ | `/articles/electric-retractable-awning` | วางแผน | ห้ามเพิ่ม | `/services/electric-retractable-awning` |
| ART-03 | กันสาดอัตโนมัติ | `/articles/automatic-awning` | วางแผน | ห้ามเพิ่ม | `/services/electric-retractable-awning` |
| ART-04 | กันสาดพับได้ ราคา | `/articles/retractable-awning-price` | วางแผน | ห้ามเพิ่ม | `/services/retractable-awning` |
| ART-05 | กันสาดไฟฟ้า ราคา | `/articles/electric-retractable-awning-price` | วางแผน | ห้ามเพิ่ม | `/services/electric-retractable-awning` |

มี [article detail template](../../src/app/articles/[slug]/page.tsx) และ editor ใหม่แล้ว แต่ยังไม่ได้ตรวจ CMS ว่ามี record สำหรับห้า URL นี้หรือไม่ จึงยังไม่ระบุว่าเนื้อหาสร้างหรือเผยแพร่แล้ว ให้ตรวจบทความเดิมก่อนสร้าง record ใหม่หรือย้ายเนื้อหา

ระบบบทความที่นำมาใช้แล้วบันทึก English slug ที่ผู้เขียนกำหนดและอ่าน URL จาก published snapshot เท่านั้น ไม่มีการเติม primary keyword อัตโนมัติ ไม่มี fallback จาก ID/title และไม่สร้าง redirect เมื่อ slug เปลี่ยนหรือบทความถูก unpublish; การเผยแพร่ยังต้องทำผ่าน admin และตรวจ content policy ก่อน

ART-02 และ ART-03 จะมี brief และเนื้อหาแยกตามที่ผู้ใช้ต้องการ; รายละเอียดคอนเทนต์ยังไม่ล็อก ห้ามสร้างข้ออ้างเรื่องรุ่นสินค้า เซนเซอร์หรือ Smart Home ที่ยังไม่ยืนยันกับธุรกิจ และห้ามรับรองว่าการแยกหน้าจะทำให้ Google index ทั้งคู่แน่นอน

## Dynamic pages และ URL เดิมที่ต้องตรวจ

| ID | URL / pattern | สถานะการสร้าง | Sitemap | หลักฐาน / งานถัดไป |
| --- | --- | --- | --- | --- |
| DYN-01 | `/projects/{system}-{size}-{sequence}` | 16 หน้าใน repo; local QA ผ่าน 2026-10-05 | Generator ใช้ slug ปัจจุบันของ record; production inventory pending | [Project detail](../../src/app/projects/[slug]/page.tsx); รายละเอียด 16 หน้าในตาราง mapping ด้านล่าง; URL เดิมถูกยกเลิกและตอบ 404 โดยไม่มี redirect |
| DYN-02 | ตัวกรองหมวดใน `/projects` | สร้างแล้วใน repo | ไม่สร้าง URL หมวด | ใช้ radio controls และ CSS; ไม่มี route หรือ canonical แยกตามหมวด |
| DYN-03 | `/articles/{slug}` ของบทความเดิม | มี template / รอยืนยันรายการจริง | รอตรวจราย URL | ตรวจ CMS record, `isPublished`, URL ที่ slug helper สร้าง และผลเว็บไซต์จริง; ไม่ยกเลิกบทความเดิมเพราะไม่อยู่ในชุด ART-01–05 |
| LEGACY-01 | `/portfolio`, `/portfolio/{slug}`, `/portfolio/category/{category}` | ลบ route แล้ว | ไม่อยู่ใน sitemap | ทุก path ตอบ 404 ไม่มี `Location` |
| LEGACY-02 | `/works`, `/works/{id}` | ลบ route แล้ว | ไม่อยู่ใน sitemap | ทั้ง ID ที่เคยมีและ ID ที่ไม่รู้จักตอบ 404 ไม่มี `Location` |
| LEGACY-03 | `/allawning` | ลบ route แล้ว | ไม่อยู่ใน sitemap | ตอบ 404 ไม่มี `Location` |

รายการ URL เดิมถูกยกเลิกตามการตัดสินใจของผู้ใช้ ไม่มี redirect สำหรับ URL ผลงานที่ถูกยกเลิก

### Project URL migration (2026-10-05)

- URL รูปแบบใหม่ใช้ `/projects/{system}-{size}-{sequence}` เลขเริ่มที่ 1 แยกตามชื่อฐาน เรียงครั้งแรกตาม `created_at` แล้วใช้ ID เป็นตัวตัดสินเมื่อวันที่เสมอหรือไม่มีข้อมูล
- บันทึก slug ที่จัดสรรแล้วไว้ใน `src/data/projects.ts` และคงแถวของ slug ที่เลิกใช้ไว้ในทะเบียนนี้; ห้ามคำนวณใหม่จากลำดับแสดงผล แก้ข้อมูล หรือนำเลขที่เลิกใช้กลับมาใช้
- คง ID ของ record เดิมตามตาราง mapping และใช้ slug ที่บันทึกไว้ในการสร้าง canonical, internal links และ sitemap
- QA local ผ่านหน้า `/projects` และรายละเอียดทั้ง 16 หน้า; ยังไม่ได้ตรวจ production หรือ GSC

### Project ID to public URL map

เก็บ URL เดิมไว้เป็นประวัติและใช้ยืนยันว่า route ที่เลิกใช้ตอบ 404; ตารางนี้ไม่ใช่ redirect map.

| Project ID | Retired `/portfolio` URL | Retired `/works` URL | Canonical URL |
| --- | --- | --- | --- |
| `0xsjRpgMF3TUL2uBcpum` | `/portfolio/retractable-awning-5x2-520680` | `/works/0xsjRpgMF3TUL2uBcpum` | `/projects/retractable-awning-5x2-2` |
| `8GVaR1JAWdEl5ORKaLIb` | `/portfolio/retractable-awning-3-5x1-5-744861` | `/works/8GVaR1JAWdEl5ORKaLIb` | `/projects/retractable-awning-3-5x1-5-1` |
| `98u5zas9XNMfBTYdsmUH` | `/portfolio/retractable-awning-5x2-5-351507` | `/works/98u5zas9XNMfBTYdsmUH` | `/projects/retractable-awning-5x2-5-2` |
| `9cOoM17u6XoB4eJIQi6O` | `/portfolio/retractable-awning-2x1-5-368997` | `/works/9cOoM17u6XoB4eJIQi6O` | `/projects/retractable-awning-2x1-5-1` |
| `ANocfCe2kmiS4wdtv5Sm` | `/portfolio/retractable-awning-5-3x2-5-192907` | `/works/ANocfCe2kmiS4wdtv5Sm` | `/projects/retractable-awning-5-3x2-5-1` |
| `GStr1xNPDU91Y5PbZn3S` | `/portfolio/retractable-awning-5-7x2-5-290684` | `/works/GStr1xNPDU91Y5PbZn3S` | `/projects/retractable-awning-5-7x2-5-1` |
| `IailaI60SuYGitQ5LtS9` | `/portfolio/retractable-awning-4-5x2-860430` | `/works/IailaI60SuYGitQ5LtS9` | `/projects/retractable-awning-4-5x2-2` |
| `KyeA2zp2JohVgZMD0WpA` | `/portfolio/retractable-awning-5-6x2-728032` | `/works/KyeA2zp2JohVgZMD0WpA` | `/projects/retractable-awning-5-6x2-1` |
| `LQfEBn95phGTTk9y7dsx` | `/portfolio/retractable-awning-4-5x2-542650` | `/works/LQfEBn95phGTTk9y7dsx` | `/projects/retractable-awning-4-5x2-1` |
| `LRE2Xzf2H6faOfoMgC8N` | `/portfolio/retractable-awning-4-5x2-5-854715` | `/works/LRE2Xzf2H6faOfoMgC8N` | `/projects/retractable-awning-4-5x2-5-1` |
| `O4X2bTHjDrQx4cXmU9bT` | `/portfolio/retractable-awning-5x2-5-472465` | `/works/O4X2bTHjDrQx4cXmU9bT` | `/projects/retractable-awning-5x2-5-1` |
| `XY5U8EZNDjSabhZN2jBM` | `/portfolio/retractable-awning-3x2-204672` | `/works/XY5U8EZNDjSabhZN2jBM` | `/projects/retractable-awning-3x2-1` |
| `YsvKbIiaQVDi2SEhoFx3` | `/portfolio/retractable-awning-4-7x2-5-886205` | `/works/YsvKbIiaQVDi2SEhoFx3` | `/projects/retractable-awning-4-7x2-5-1` |
| `dJ1kY665ES3tkn4I4E7f` | `/portfolio/retractable-awning-2x1-5-326707` | `/works/dJ1kY665ES3tkn4I4E7f` | `/projects/retractable-awning-2x1-5-2` |
| `jBHjDK3XxsgETc9nvj3r` | `/portfolio/retractable-awning-5x2-767881` | `/works/jBHjDK3XxsgETc9nvj3r` | `/projects/retractable-awning-5x2-1` |
| `u12Uzh3H1wJeNoLwsMO3` | `/portfolio/electric-awning-2-6x2-881761` | `/works/u12Uzh3H1wJeNoLwsMO3` | `/projects/electric-awning-2-6x2-1` |

เส้นทาง shorthand เก่าที่เคยมี redirect และตอนนี้ต้องตอบ 404 ได้แก่ `/portfolio/5x2-520680`, `/portfolio/4-5x2-860430`, `/portfolio/3-5x1.5-744861`, `/portfolio/5x2-5-351507`, `/portfolio/4-5x2-542650`, `/portfolio/5x2-767881`, `/portfolio/2x1-5-326707`, `/portfolio/4-7x2.5-886205`, `/portfolio/2x1-5-368997`, `/portfolio/2-6x2-881761`, `/portfolio/3x2-204672`, `/portfolio/5-7x2.5-290684`, `/portfolio/5x2-5-472465`, `/portfolio/5-6x2-728032`, `/portfolio/4-5x2.5-854715` และ `/portfolio/5-3x2.5-192907`.

## หน้าที่ไม่ใส่ใน SEO sitemap

| URL / pattern | สถานะการสร้าง | Sitemap | เหตุผล / หลักฐาน |
| --- | --- | --- | --- |
| `/lp/google-ads/electric-awning` | สร้างแล้วใน repo | ห้ามเพิ่ม | [Ads page](../../src/app/lp/google-ads/electric-awning/page.tsx) มี `noindex` และ canonical ไปหน้าบริการ |
| `/lp/google-ads/retractable-awning` | สร้างแล้วใน repo | ห้ามเพิ่ม | [Ads page](../../src/app/lp/google-ads/retractable-awning/page.tsx) มี `noindex` และ canonical ไป Home |
| `/lp/google-ads/{...slug}` | มี template / รอยืนยันรายการจริง | ห้ามเพิ่ม | [Ads template](../../src/app/lp/google-ads/[...slug]/page.tsx) ใช้ canonical ไปหน้าบริการ; นโยบาย registry ไม่ใส่ variant สำหรับโฆษณา |
| `/admin` | สร้างแล้วใน repo | ห้ามเพิ่ม | งานหลังบ้าน |
| `/admin/projects` | สร้างแล้วใน repo | ห้ามเพิ่ม | จัดการผลงาน |
| `/admin/articles` | สร้างแล้วใน repo | ห้ามเพิ่ม | จัดการบทความ |
| `/admin/leads` | สร้างแล้วใน repo | ห้ามเพิ่ม | จัดการ leads |
| `/admin/chat` | สร้างแล้วใน repo | ห้ามเพิ่ม | จัดการแชท |
| `/admin/image-upload` | สร้างแล้วใน repo | ห้ามเพิ่ม | อัปโหลดภาพ |
| `/api/*`, private URLs, draft/preview และ query variants | ตามชนิด endpoint/ข้อมูล | ห้ามเพิ่ม | ไม่ใช่ canonical public pages ที่ตั้งใจให้ค้นพบ |

## เกณฑ์เปลี่ยนเป็น “พร้อมเพิ่ม”

ต้องมีหลักฐานครบก่อนเปลี่ยนสถานะ ไม่ใช้การมีไฟล์ page หรือ HTTP 200 เพียงอย่างเดียว:

1. หน้าหรือ CMS record สร้างจริง มีเนื้อหาที่พร้อมเผยแพร่และข้อมูลประกอบครบ บทความต้องอยู่ในสถานะ published; template ที่ไม่มี record ยังไม่ผ่าน
2. URL จริงบน production เข้าถึงได้และตอบ `200` ด้วยเนื้อหาของหน้าจริง ไม่เป็น placeholder, soft 404, error fallback หรือ redirect
3. หน้าตั้งใจให้ index ไม่มี `noindex` ใน HTML/HTTP headers และกฎ robots ที่เกี่ยวข้องเปิดให้ crawl; หน้าส่วนตัวและ ads variants ไม่ผ่าน gate นี้
4. URL เป็น canonical ที่เลือกใช้จริง และ canonical/internal links/schema/URL ใน sitemap สอดคล้องกัน ไม่ใส่ URL alias ที่ชี้ canonical ไปหน้าอื่น
5. มี internal link ที่ crawl ได้จากหน้าที่เกี่ยวข้อง และข้อมูลสำคัญยังแสดงหลัง rendering เมื่อหน้านั้นต้องใช้ JavaScript
6. URL ของ dynamic pages มาจาก record ที่มีจริงและผ่าน gate นี้ ใช้ `lastmod` ตามการเปลี่ยนเนื้อหาสำคัญจริง ไม่ใช้วัน build/deploy เป็นตัวแทนอัตโนมัติ
7. บันทึกผู้ตรวจ วันที่ตรวจ environment และหลักฐานไว้กับรายการ หากข้อมูลยังไม่ครบให้คง “รอตรวจ” และหากยังเป็นแผนให้คง “ห้ามเพิ่ม”

“พร้อมเพิ่ม” หมายถึงผ่านเกณฑ์เพื่อเสนอ URL ใน sitemap ไม่ได้หมายความว่า Google index แล้ว ถ้ารายการที่เคยผ่านกลายเป็น draft, removed, redirect หรือ noncanonical ต้องทบทวนและนำออกจากชุด URL สำหรับ sitemap

Sitemap generator ต้องอ่านหน้าที่เผยแพร่จริงและผ่าน eligibility ไม่อ่านรายการแผนจาก MD แล้วสร้าง URL โดยตรง หาก CMS อ่านไม่ได้ ต้องจัดการข้อจำกัดให้ชัด ไม่เติม URL สมมุติหรือ fallback records ลง sitemap

## วิธีดูแลสถานะ

- เพิ่มหน้าใหม่เป็น “วางแผน / ห้ามเพิ่ม” ก่อน ระบุ ID, URL, intent, หน้าที่สนับสนุน และงานที่ต้องทำ
- เมื่อเริ่มพัฒนา/เขียน ให้เปลี่ยนเป็น “กำลังสร้าง” พร้อม source หรือ CMS record reference ที่ไม่เปิดเผยข้อมูลส่วนตัว
- เมื่อมี implementation ให้ระบุ “สร้างแล้วใน repo” หรือ “มี template / รอยืนยันรายการจริง”; งานเนื้อหาและ deploy ต้องตรวจแยก
- หลังเผยแพร่ ให้ตรวจ gate ข้างต้นและบันทึกหลักฐานก่อนเปลี่ยนเป็น “พร้อมเพิ่ม”; ตรวจ sitemap ที่เผยแพร่จริงอีกครั้งก่อนระบุ “เพิ่มแล้ว / ตรวจแล้ว”
- บันทึกการเปลี่ยน URL/รวมหน้า พร้อม URL ต้นทาง ปลายทาง และ redirect decision ก่อนลงมือ การอัปเดต MD ไม่ได้เปลี่ยน route, CMS หรือ sitemap ให้เอง

รูปแบบบันทึกหลักฐานต่อหน้า:

| Page ID / URL จริง | สถานะการสร้าง | สถานะเนื้อหา | สถานะเผยแพร่ | Sitemap | ผู้ตรวจ / วันที่ | หลักฐาน / งานค้าง |
| --- | --- | --- | --- | --- | --- | --- |
| ระบุ ID หรือ URL จาก record จริง | เลือกสถานะ | ไม่ทราบ / draft / published | ยังไม่ตรวจ / local / production verified | เลือกสถานะ | ระบุเมื่อได้ตรวจจริง | source/CMS reference, HTTP, canonical, robots, rendering และ sitemap ตามที่ตรวจได้ |

สำหรับ DYN-01–03 ให้เพิ่มแถว URL จริงเมื่อมี inventory จาก CMS/crawl; ไม่สมมุติ slug หรือจำนวนรายการจาก route pattern ผู้รับผิดชอบเนื้อหาและผู้ตรวจแต่ละหน้ายังไม่ได้กำหนด

## งานถัดไป

- ตรวจ production และ CMS inventory เพื่ออัปเดตสถานะหน้าที่มี implementation แล้ว
- ทำ brief/คอนเทนต์ห้าบทความใหม่ และสร้าง About ก่อนพิจารณาเพิ่มหน้าเหล่านั้นใน sitemap
- ตรวจ English slug ของบทความก่อนเผยแพร่; คง URL บทความที่เผยแพร่แล้ว และอย่าสร้าง redirect เว้นแต่มีคำสั่งอนุมัติโดยตรง
- หลัง deploy ให้ตรวจว่า URL เก่าของ `/portfolio`, `/works`, `/allawning` ตอบ 404 โดยไม่มี redirect; ตรวจสถานะใน GSC แยกจาก local QA
- ใช้ `$technical-seo-audit` ตรวจ sitemap/robots/canonical/internal links; ใช้ `$media-seo` และ `$core-web-vitals-audit` ตามปัญหาและขอบเขตงานที่เกี่ยวข้อง

เอกสารนี้เก็บ URL map และสถานะรวม; [Content cluster plan](content-cluster-plan.md) ใช้สำหรับ brief และ publishing gate เดิม เมื่อ URL หรือบทบาทในแผนเก่าขัดกับข้อตกลงล่าสุด ให้ปรับเอกสารที่เกี่ยวข้องก่อนเผยแพร่

แหล่งหลักสำหรับเกณฑ์ sitemap: [Google sitemap overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [Canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Accurate lastmod](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping)
