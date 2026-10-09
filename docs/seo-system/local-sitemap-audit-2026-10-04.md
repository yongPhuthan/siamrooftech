# Local sitemap audit — 2026-10-04

## ข้อสรุป

sitemap เดิมใช้งานได้บน local: XML อ่านได้ มี **33 URL ไม่ซ้ำ** และตรวจ HTTP/initial HTML ครบทั้ง 33 URL พบ **200 + canonical ตรงกับ sitemap + ไม่พบ noindex/robots block** ทั้งหมด แต่ยังไม่ควรถือว่าผ่านการตรวจความครบถ้วนของเว็บไซต์จริง เพราะ local dataset ตอนนั้นไม่มีบทความที่เผยแพร่ และยังต้องจัดการ lastmod กับบทบาทของหน้าผลงานเก่า

**ไม่มีการแก้โค้ดแอปหรือ sitemap, deploy, ส่ง sitemap, เปลี่ยนข้อมูล CMS หรือบริการภายนอกในรอบนี้** สร้างเฉพาะรายงานและหลักฐานการตรวจ

## Coverage และวิธีตรวจ

- วันตรวจ: 4 ตุลาคม 2026; sitemap สองครั้งที่ 10:34:55 และ 10:36:25 UTC (17:34:55 และ 17:36:25 เวลาไทย)
- Runtime: Next.js **15.5.26** จาก dependency ที่ติดตั้งจริง; `next dev` ที่ `http://127.0.0.1:3000` ไม่ใช่ production build
- อ่าน route patterns ทั้ง 24 รายการ, sitemap/robots generator, metadata, project file data และเส้นทางอ่านบทความ
- ตรวจ sitemap XML จริง: HTTP 200, content-type application/xml, UTF-8, namespace ถูกต้อง, ขนาด 6,322 bytes; URLs เป็น absolute HTTPS ที่ www.siamrooftech.com ไม่มีซ้ำ
- ตรวจ GET โดยไม่ตาม redirect ของ sitemap URLs **33/33**: หลัก/รายการ 6, บริการและพื้นที่ 5, ผลงาน 16, หมวดผลงาน 6, บทความรายหน้า 0
- ตรวจเพิ่ม 10 หน้า: About ที่วางแผน, บทความใหม่ 5 URL, works detail 1, portfolio ID alias 1, Ads LP 2; และ robots.txt อีก 1 endpoint
- รวมชุดหลักฐานหลัก 44 responses; นอกจากนี้ใช้ QA script เดิมและขอ sitemap ครั้งที่สอง
- Sitemap ชี้ production domain ตาม canonical config; ทดสอบ route path เดียวกันบน localhost ไม่ได้ request production URLs เหล่านี้
- เก็บ canonical และ robots จาก HTML response ที่อ่านครบ รวม streamed metadata; ไม่ได้ใช้ browser ตรวจ DOM หลัง hydration, API/resource loading หรือ interactions
- ใช้ HTML anchors จากหน้าที่ตรวจเพื่อดู incoming links เท่านั้น ไม่ใช่ crawl ครบทุกเส้นทางของเว็บไซต์
- รัน `node scripts/seo-qa.mjs --base=http://127.0.0.1:3000`: exit 0, “SEO QA passed for 9 pages”
- ไม่ได้ตรวจ GSC, Google-selected canonical, indexing, production response หรือ production build/ISR cache
- หลักฐานที่เก็บถาวร: [JSON responses และ sitemap inventory](local-sitemap-audit-2026-10-04.evidence.json)

## ผลตรวจตามขอบเขต Technical SEO

| ด้าน | สถานะ | ผลและข้อจำกัด |
|---|---|---|
| XML Sitemap | พบปัญหา | โครงสร้างและ 33 URL ผ่าน; lastmod 17 URL เปลี่ยนตามเวลาสร้าง; บทความจริงต้องยืนยันเพิ่ม |
| Robots.txt | ผ่านในขอบเขตที่ตรวจ | 200 text/plain, sitemap declaration ถูกต้อง; Allow / และ Disallow /private/, /admin/, /api/ ไม่บล็อก 33 URL |
| Canonical | ผ่านในขอบเขตที่ตรวจ / ต้องยืนยันเพิ่ม | 33/33 ตรง sitemap; works detail ตัวอย่างไม่มี canonical และใช้ข้อมูล project เดียวกับ portfolio |
| Internal links | ต้องยืนยันเพิ่ม | พบ incoming HTML links ไป 32/33 sitemap URLs ในชุดตรวจ; /allawning ไม่พบ incoming link ในชุดนี้; ไม่ยืนยัน orphan ทั้งเว็บไซต์ |
| URL Structure | ผ่านในขอบเขตที่ตรวจ | URLs ใน XML เป็น absolute; หมวดภาษาไทยที่ percent-encode ทั้ง 6 เปิดได้และ canonical ตรง; English article URL policy ยังต้องทำก่อนเผยแพร่ |
| JavaScript SEO | ตรวจไม่ได้ | ตรวจ initial response ได้ แต่ไม่ได้ตรวจ rendered DOM/resource failures; ไม่มีข้อสรุปว่า CSR หรือ client component เป็น defect |
| Structured data | ผ่านในขอบเขตที่ตรวจ | QA เดิมผ่าน schema-presence checks เฉพาะ 9 หน้า; ไม่ใช่การตรวจ properties/eligibility หรือ rich results ครบทั้งเว็บไซต์ |

Sitemap index **ไม่เกี่ยวข้องในรอบนี้**: 33 URL และขนาดไฟล์เล็ก ไม่จำเป็นต้องแยก sitemap เพราะข้อจำกัดขนาด ส่วน `priority`/`changefreq` ที่มีอยู่ไม่ใช่ข้อผิดพลาด XML แต่ Google ไม่ใช้เป็นสัญญาณกำหนดความสำคัญหรือความถี่ crawl. [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

## Findings และแผนแก้ไข

### F1 — P2: lastmod ไม่สะท้อนการเปลี่ยนเนื้อหา

- **สถานะ:** พบปัญหา
- **URL/ไฟล์:** static 6 + service 5 + category 6 = 17 URL; [sitemap.ts](../../src/app/sitemap.ts:12), [category timestamps](../../src/app/sitemap.ts:75), [service timestamps](../../src/app/sitemap.ts:89), [toDate fallback](../../src/lib/seo-config.ts:18)
- **Evidence:** ไม่ได้แก้เนื้อหา แต่ root lastmod เปลี่ยนจาก `2026-10-04T10:34:55.634Z` เป็น `2026-10-04T10:36:25.291Z`; เปลี่ยน 17/33 URL ระหว่างสอง requests; generator ใช้ new Date() ตรงกลุ่มเหล่านี้ ส่วน 16 projects ใช้วันที่ใน data file และไม่เปลี่ยนในสอง requests
- **Confidence:** สูงสำหรับ 17 URL; fallback วันที่ผิด/หายเป็นความเสี่ยงจากโค้ด ยังไม่พบใน 16 project records
- **Impact:** Google อาจไม่เชื่อถือ lastmod เมื่อไม่สัมพันธ์กับการเปลี่ยนเนื้อหาที่สำคัญ; ไม่ใช่เหตุรับประกันว่าจะไม่ index
- **Fix:** ใช้เวลาการแก้เนื้อหาจริงที่มีแหล่งข้อมูลตรวจสอบได้; หมวด/รายการใช้เวลาการเปลี่ยนเนื้อหาสำคัญของหน้านั้น; ถ้าไม่มีวันที่เชื่อถือได้ให้ละ lastmod แทนสร้างวันที่ปัจจุบัน รวม fallback ใน toDate
- **Acceptance criteria:** เนื้อหาเดิมให้ lastmod เดิมทั้งก่อน/หลัง request หรือ build/revalidation; การแก้เนื้อหาสำคัญเปลี่ยนเฉพาะหน้าที่ได้รับผล; วันที่ไม่ทราบ/ผิดไม่กลายเป็นเวลาปัจจุบัน
- **Source:** Google ระบุให้ lastmod สะท้อน significant update ที่ตรวจสอบได้. [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

### F2 — P2: นโยบาย URL ผลงานสองชุดยังไม่สอดคล้อง

- **สถานะ:** ต้องยืนยันเพิ่ม (เลือกบทบาทของหน้าก่อนแก้)
- **URL/ไฟล์:** `/works`, `/works/[id]`, `/portfolio/[slug]`; [works links](../../src/app/works/page.tsx:124), [works detail metadata](../../src/app/works/[id]/page.tsx:46)
- **Evidence:** /works อยู่ใน sitemap และมี links ไป /works/[id] ทั้ง 16 project records; detail ตัวอย่าง `/works/0xsjRpgMF3TUL2uBcpum` ตอบ 200, index/follow และไม่มี canonical; project เดียวกันมี `/portfolio/5x2-520680` ใน sitemap พร้อม self-canonical ทั้งสอง template อ่าน project service เดียวกัน แต่ยังไม่ได้พิสูจน์ว่าเนื้อหาทุกหน้าซ้ำกันทั้งหมด
- **Confidence:** สูงสำหรับ response ตัวอย่าง/ต้นทางข้อมูล; กลางสำหรับความซ้ำของเนื้อหาทั้งชุด
- **Impact:** มี URL ผลงานคู่ขนานที่สัญญาณภายในไม่ชี้ URL หลักร่วมกัน; Google อาจเลือก URL ต่างจากที่ต้องการ ไม่ถือว่าการไม่มี canonical เป็นข้อผิดพลาดเสมอ
- **Fix:** หากใช้ portfolio เป็นหน้าหลักและ works เป็น legacy ให้ทำ permanent redirect 301/308 ไปคู่ที่ตรงกันและปรับ internal links; ถ้าต้องเก็บ works ด้วยเหตุผลด้านผู้ใช้และเนื้อหาซ้ำ ให้ canonical ไป portfolio; หากเนื้อหา/หน้าที่ต่างกันจริงให้กำหนดนโยบาย self-canonical และ sitemap eligibility แยกตามบทบาท
- **Acceptance criteria:** มี mapping ผลงานทั้ง 16 record; redirects ไปหน้าที่ตรงกันครั้งเดียว ไม่มี loop/404; หรือ canonical สอดคล้องกับนโยบายที่เลือก; internal links และ sitemap ชี้ URL หลักชุดเดียวกันสำหรับหน้าที่ต้องรวม
- **Source:** Sitemap/canonical/internal links ควรส่งสัญญาณเดียวกันสำหรับหน้าซ้ำ และ canonical เป็นสัญญาณ ไม่ใช่คำสั่งที่รับประกันผล. [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

`/portfolio/0xsjRpgMF3TUL2uBcpum` ตอบ 200 แต่ canonical ไป slug ที่ถูกต้อง และไม่อยู่ใน sitemap: ถือว่าการเลือก URL ใน sitemap ผ่านสำหรับ alias ตัวอย่างนี้ ไม่จำเป็นต้องเพิ่ม ID alias ลง sitemap

### F3 — P2: /allawning ยังไม่มีรายการผลงานตามบทบาทหน้า

- **สถานะ:** พบปัญหาด้านความพร้อมของเนื้อหา / ต้องยืนยันเพิ่มเรื่องบทบาทหน้า
- **URL/ไฟล์:** `/allawning`; [page.tsx](../../src/app/allawning/page.tsx:27), [sitemap membership](../../src/app/sitemap.ts:41)
- **Evidence:** ตอบ 200 self-canonical และอยู่ใน sitemap; source มี heading “ผลงานกันสาดทั้งหมด”, intro และ FinalCTASection แต่ไม่มีรายการผลงาน; ไม่พบ incoming HTML link จากชุดหน้าที่ตรวจ
- **Confidence:** สูงสำหรับโครงสร้างเนื้อหา; กลางสำหรับข้อเสนอการรวมหน้า; ยังไม่ยืนยัน orphan ทั้งเว็บไซต์
- **Impact:** URL ถูกเสนอให้ค้นหาในฐานะหน้ารวมผลงานทั้งที่ยังไม่มีผลงาน และบทบาททับกับ /portfolio หรือ /works; ไม่สรุปว่า Google จัดเป็น soft 404 หรือ thin-content penalty
- **Fix:** เลือกว่าจะรวมเข้าหน้าผลงานหลักด้วย 301/308 หรือพัฒนาเนื้อหาที่มีบทบาทเฉพาะ; หากยังเป็นหน้าที่ยังไม่พร้อม ให้พักจาก sitemap ตามนโยบายเผยแพร่และจัดการ indexing ให้เหมาะสม
- **Acceptance criteria:** ถ้ารวม ต้อง redirect ไปหน้าที่เกี่ยวข้องและหายจาก sitemap; ถ้าเก็บ ต้องมีเนื้อหาตามชื่อ/บทบาท มี link จากหน้าที่เกี่ยวข้อง และผ่าน status/canonical/indexability checks ก่อนอนุมัติ sitemap

### F4 — P2: ข้อมูลบทความ unavailable แยกไม่ออกจาก “ไม่มีบทความ”

- **สถานะ:** พบพฤติกรรม fallback บน local / ตรวจไม่ได้ว่าขาด URL บน production หรือไม่
- **URL/ไฟล์:** `/sitemap.xml`, `/articles`; [article repository](../../src/features/articles/server/repository.ts), [sitemap filter](../../src/app/sitemap.ts:58)
- **Evidence:** ไม่มี published article records ใน local dataset ณ วันที่ตรวจ; sitemap มีบทความ 0; `/articles` ยังตอบ 200 self-canonical
- **Confidence:** สูงสำหรับข้อจำกัด local/พฤติกรรม source; ไม่มีหลักฐานจำนวนบทความจริงหรือเหตุการณ์ production
- **Impact:** sitemap 200 อาจดูเหมือนสมบูรณ์ทั้งที่ขาดข้อมูลบทความเมื่อ source ใช้ไม่ได้; ไม่ยืนยันว่ามีบทความที่เผยแพร่แล้วหายจาก sitemap จริง
- **Fix:** ก่อนตรวจรับความครบถ้วน ให้ตรวจด้วยแหล่งข้อมูล published articles ที่ได้รับอนุญาตและใช้งานได้; เพิ่มการแยก data-unavailable กับ valid-empty ในขั้นตรวจ/ระบบสร้าง sitemap และเลือกรูปแบบเก็บ sitemap ล่าสุดหรือแจ้งความล้มเหลวตามระบบ deploy/cache จริง ไม่ต้องเพิ่ม credentials หรือเปลี่ยนบริการในงาน audit นี้
- **Acceptance criteria:** ทุกบทความที่เผยแพร่และ indexable มี canonical URL ใน sitemap; draft ไม่ปรากฏ; จำลอง source unavailable แล้วตรวจพบชัดเจน ไม่ประกาศ audit ผ่านด้าน completeness จาก empty fallback

## หน้าที่วางแผนและหน้าที่ตั้งใจไม่ใส่ sitemap

| กลุ่ม | ผลบน local | Sitemap decision |
|---|---|---|
| /about | 404 | ไม่มีใน sitemap ถูกต้อง; สร้างเนื้อหาและตรวจรับก่อนเพิ่ม |
| บทความใหม่ 5 URL ตาม page plan | พบหน้า not-found: title ไม่พบบทความ, ไม่มี canonical, มี noindex; HTTP ที่อ่านได้เป็น 200 จาก streamed response | ไม่มีใน sitemap ถูกต้อง; ยังไม่ใช่บทความที่พร้อม แม้ HTTP เป็น 200 |
| Ads /lp/google-ads/electric-awning | 200, noindex, canonical ไป /services/electric-retractable-awning | ไม่มีใน sitemap ถูกต้อง |
| Ads /lp/google-ads/retractable-awning | 200, noindex, canonical ไป root | ไม่มีใน sitemap ถูกต้อง |
| Admin 6 route patterns, API/private | ไม่ได้เปิด UI/auth/API; ตรวจ route/generator/robots เท่านั้น | ไม่พบ URLs ใน sitemap; ไม่ใช่การ audit ความปลอดภัยหรือยืนยัน noindex ของ admin |
| /works/[id] | ตรวจ runtime 1/16; 200 ไม่มี canonical | ไม่ควรเพิ่มทั้งชุดเพียงเพราะมี route; ตัดสิน URL หลักก่อน |
| /portfolio/[id] alias | ตัวอย่าง 200 canonical ไป slug | ไม่เพิ่ม alias เพราะ sitemap มี slug หลักแล้ว |

บทความใหม่ที่ยังไม่เพิ่ม:

- `/articles/retractable-awning`
- `/articles/electric-retractable-awning`
- `/articles/automatic-awning`
- `/articles/retractable-awning-price`
- `/articles/electric-retractable-awning-price`

Source slug helper ยังเติม PRIMARY_KEYWORD ใน getArticleRouteSlug: [slug-generator.ts](../../src/lib/articles/slug-generator.ts:51). ก่อนเผยแพร่ต้องให้ route/canonical/internal links/sitemap ตรง English URL ที่อนุมัติ ไม่เพิ่ม URL จากเอกสารแผนล่วงหน้า และไม่เปลี่ยน URL บทความเก่าโดยไม่มี mapping/redirect

## รายการ URL ใน sitemap ที่ตรวจครบ

ผลร่วมทุกแถว: robots ไม่บล็อก, X-Robots-Tag ไม่พบ, canonical 1 ค่า, ไม่มี redirect ณ GET แรก

| Path (แสดงภาษาไทย decoded เพื่ออ่านง่าย) | HTTP | Canonical | noindex |
|---|---|---|---|
| `/` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/contact` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/works` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/articles` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/allawning` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/services/retractable-awning` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/services/electric-retractable-awning` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/services/retractable-awning/bangkok` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/services/retractable-awning/nonthaburi` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/services/retractable-awning/pathum-thani` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/5x2-520680` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/4-5x2-860430` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/3-5x1.5-744861` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/5x2-5-351507` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/4-5x2-542650` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/5x2-767881` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/2x1-5-326707` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/4-7x2.5-886205` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/2x1-5-368997` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/2-6x2-881761` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/3x2-204672` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/5-7x2.5-290684` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/5x2-5-472465` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/5-6x2-728032` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/4-5x2.5-854715` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/5-3x2.5-192907` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/category/คาเฟ่` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/category/บ้านพักอาศัย` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/category/อื่นๆ` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/category/ร้านค้า` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/category/โรงแรม` | 200 | ตรงกับ sitemap | ไม่พบ |
| `/portfolio/category/สำนักงาน` | 200 | ตรงกับ sitemap | ไม่พบ |

## ลำดับดำเนินการต่อ

1. แก้ lastmod (F1) โดยใช้ข้อมูลจริงหรือละค่าเมื่อไม่ทราบ แล้วตรวจซ้ำสองครั้งและหลัง build/revalidation
2. เลือกหน้าผลงานหลักและบทบาท /works, /allawning (F2–F3); เก็บ mapping ก่อน implement redirect/canonical
3. ยืนยัน published article inventory ด้วย data source ที่ใช้งานได้ (F4); ตรวจทั้ง sitemap membership และ actual page/canonical
4. ทำ About และบทความตาม page plan แยกจากงานตรวจ sitemap; แต่ละหน้าต้องผ่าน publication checks ก่อนเพิ่ม
5. เมื่อแก้และมีข้อมูลครบ ให้ตรวจ production build บน local แล้วจึงตรวจ production/GSC ภายใต้ scope ที่ได้รับอนุญาต

QA script ผ่าน 9 หน้าเป็นหลักฐานประกอบเท่านั้น: script ไม่ตรวจ lastmod, works-detail canonical หรือความครบถ้วนของ CMS และ schema-presence รวม FAQPage ไม่ยืนยันสิทธิ์แสดง FAQ rich results. ผล HTTP/HTML บน local ไม่ยืนยันว่า Google index แล้วหรือเลือก canonical ตามที่ประกาศ

แหล่งทางการข้างต้นตรวจสอบวันที่ **2026-10-04**; รายงานนี้ใช้สถานะตรวจเฉพาะขอบเขต ไม่ใช่ใบรับรอง SEO ทั้งเว็บไซต์
