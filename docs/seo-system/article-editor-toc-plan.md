# แผนระบบบทความ Rich text และ TOC

วันที่: 6 ตุลาคม 2026 · สถานะ: implementation เสร็จใน local; ยังไม่ deploy และไม่มีการเขียนข้อมูล production

## ข้อตกลงและขอบเขต

- ผู้ใช้เลือก editor แบบเอกสาร Rich text ต่อเนื่อง พร้อม outline ด้านข้าง
- ใช้ข้อมูลบทความใหม่รูปแบบเดียว ยกเลิก blocks และ legacy content เดิม โดยผู้ใช้จะเขียนบทความใหม่ ไม่มี fallback renderer หรือการแปลงข้อมูลเดิมอัตโนมัติ
- สร้าง draft ที่มีเฉพาะหัวข้อได้ เติมเนื้อหาทีละส่วนแล้วบันทึกกลับมาเขียนต่อ
- public article และ TOC ใช้ server rendering/SSG/ISR; editor ทำงานเฉพาะ admin
- คงเส้นทางบทความ `/articles` และ `/articles/{stored-slug}` ในงานนี้ ไม่มี redirects หรือ URL จาก ID/title สำรอง
- แผนนี้อนุญาตให้แทน implementation เดิมของ blocks/legacy content; ไม่ deploy หรือเผยแพร่บทความโดยอัตโนมัติ

## หลักฐานจากระบบปัจจุบัน

| ส่วน | สิ่งที่พบ | สิ่งที่ต้องเปลี่ยน |
| --- | --- | --- |
| Previous article record | Article มีทั้ง `content`, `blocks`, `authoringMode` | ใช้ document schema เดียวที่ feature article เป็นเจ้าของ |
| `src/components/admin/ArticleForm.tsx` | บันทึกทั้ง blocks และข้อความรวม; มี slug generator ของตัวเอง | editor adapter ใช้ document ใหม่; URL generation มี owner เดียว |
| `src/app/articles/[slug]/page.tsx` | renderer สองทางและ Markdown regex → raw HTML; static params ใช้ทุกรายการ | server renderer ใหม่; public projection กลาง; ห้ามข้อมูล draft เข้าทางใด |
| `src/app/api/articles/route.ts` | `includeDrafts=true` ใน GET ยังไม่ตรวจ admin auth | public API ไม่มี draft; admin API ตรวจสิทธิ์ทุก request |
| `src/app/api/articles/[slug]/route.ts` | GET อ่าน record โดยไม่กรอง publication; PATCH toggle publish โดยไม่มี content policy | ทุกช่องทางเผยแพร่ผ่าน policy ฝั่ง server เดียวกัน |
| `src/types/article.ts`, `src/lib/articles/seo-analyzer.ts` | ใช้ primary keyword เดียว และคะแนน/เกณฑ์เชิงจำนวน | primary topic ต่อบทความ; editorial guidance แยกจาก structural gates |
| `package.json` | มี Zod แต่ยังไม่มี Tiptap; `yarn test` เรียก Jest ที่ไม่ได้ประกาศเป็น dependency | ใช้ Zod เดิม; จัด runner ที่รันได้จริงก่อนเริ่ม regression tests |

เป็นข้อค้นพบจากโค้ด ยังไม่ได้ตรวจ production records

## Editor และการใช้งาน

เลือก Tiptap เป็น rich-text engine แทนการเขียน contenteditable/selection/undo เอง
เพิ่มเฉพาะ packages และ extensions ที่ใช้จริง ตรวจ compatibility กับ React 18 และ
Next.js 15 แล้ว pin เวอร์ชันให้ตรงกันก่อนติดตั้ง ไม่ใช้ hosted editor/collaboration service

- toolbar: paragraph, H2/H3, bold/italic, links, bullet/numbered lists, comparison table, image/figure และ undo/redo
- title เป็นช่องแยกและสร้าง H1 ให้หน้า; body ไม่เปิด H1 หรือ heading levels ที่ไม่ได้รองรับ
- desktop: เอกสารตรงกลางและ outline ด้านข้าง; mobile: เปิด outline ผ่าน panel ที่ใช้ keyboard ได้
- outline แสดงลำดับ H2/H3 และสถานะส่วนที่ยังไม่มีเนื้อหา กดเพื่อไปเขียนส่วนนั้นได้
- เพิ่มหัวข้อ แก้ข้อความ และจัดลำดับโดยไม่ต้องพิมพ์ HTML หรือดูแลสารบัญเอง
- บันทึก draft, แสดงสถานะบันทึก/ข้อผิดพลาด/unsaved changes และเปิดกลับมาได้โดยหัวข้อกับ IDs ไม่หาย
- preview อยู่หลัง admin auth และใช้ server renderer เดียวกับ public page
- metadata pane: slug ภาษาอังกฤษที่ผู้เขียนกำหนด, topic/intent, excerpt, author, sources, title/description และ cover image เมื่อมี
- รุ่นแรกใช้ explicit save; autosave/history/collaboration ไม่เป็น dependency ของการส่งมอบแรก

## โครงข้อมูลและเจ้าของโค้ด

โครง implementation ปัจจุบัน:

```text
src/features/articles/
  AGENTS.md
  document-schema.ts      # runtime schema และ inferred types
  heading-outline.ts     # pure traversal, outline และ section completeness
  publication-policy.ts  # draft validation / publish validation
  article-path.ts        # URL จาก stored slug เท่านั้น
  admin/                 # Tiptap adapter, toolbar, outline, form composition
  public/                # server ArticleContent, ArticleToc, layout
  server/                # persistence, published projection, publish operation
```

- ใช้ Zod อธิบาย allowlisted document AST ที่เข้ากับ Tiptap JSON: document, text, paragraph, heading, list, table, figure และ marks ที่รองรับ
- record มี `schemaVersion`, stable article ID, revision และ draft envelope ซึ่งเก็บ metadata กับ document
- published snapshot ใช้ schema เดียวกับ draft แต่ผ่าน publication policy แล้ว เป็นสำเนาที่ตั้งใจแยกเพื่อให้การแก้ draft ไม่เปลี่ยนหน้า live
- public DTO ส่งเฉพาะ snapshot ไม่ส่ง draft fields; สถานะรายการคือ draft หรือมี published snapshot โดยอาจมีการแก้ไขค้างอยู่
- บันทึก `publishedAt` ครั้งแรก และ `modifiedAt` ของ snapshot เมื่อ public content เปลี่ยนจริง แยกจากวันที่ save draft
- ใช้ revision check เพื่อป้องกัน stale save/publish จากสอง tab; การเผยแพร่สำเร็จเป็น atomic write
- ไม่เก็บ HTML, Markdown body หรือ TOC array เป็น editable source อีกชุด Derived text ใช้สำหรับ excerpt suggestion/read-time เท่านั้น
- runtime validators คุม node types, attributes, nested depth/size, IDs และ URL protocols ก่อน persistence; limits ต้องวัดกับขอบเขต storage จริง
- boundary ของ storage timestamps ถูก normalize ที่ adapter; domain contract ไม่ใช้ `any`

## Heading IDs และ TOC

- ใช้ H2/H3 จาก document traversal ชุดเดียว แสดง H3 เยื้องใต้ H2
- heading มี ID ถาวร เช่น `section-<uuid>` ตั้งตอนสร้าง ไม่ผูกกับเลขลำดับหรือข้อความหัวข้อ
- แก้ข้อความ จัดลำดับ undo/redo หรือ save/reload ต้องรักษา ID; copy/paste/duplicate ต้องสร้าง ID ของ node ใหม่โดยไม่เปลี่ยน node เดิม
- server rendering ไม่ generate UUID และไม่หวังว่า static renderer จะรัน editor plugins; validate ID ที่บันทึกมาแล้วก่อน render
- หมายเลข 1–7 ใน outline ตัวอย่างเป็นข้อความ editorial ไม่มีเลขที่ TOC เพิ่มซ้ำ
- desktop TOC เป็น sticky sidebar ภายใน article layout ที่ไม่ทับ footer; mobile ใช้ native `details`/`summary` ก่อน body
- `<nav aria-label="สารบัญบทความ">` และ `<a href="#section-id">` ใช้งานได้เมื่อปิด JavaScript
- ตำแหน่งเป้าหมายใช้ shared header offset และ `scroll-margin`; focus มีสถานะชัด อ่าน label ได้ และ reduced-motion ไม่ถูก override
- รุ่นแรกไม่มี scroll spy หรือ public client boundary ใหม่
- ถ้า document ไม่มี H2/H3 ให้ซ่อนกล่อง TOC; หัวข้อที่ยังไม่ตั้งชื่อแสดง placeholder เฉพาะ admin และเป็น publish error

## Outline ก่อนเนื้อหา

[outline ตัวอย่าง](article-electric-awning-outline.md) มี 4 H2 และ 7 H3 ตามข้อความที่ผู้ใช้ส่ง
ไฟล์นี้มีเฉพาะหัวข้อ ไม่มีบทนำ ข้อสรุป ข้อมูลสินค้า หรือเนื้อหาที่แต่งขึ้น
ยังไม่ใช่บทความใน CMS และยังไม่มี public URL ที่ eligible สำหรับ sitemap

- draft ยอมให้ทุกหัวข้อมี body ว่าง เพื่อให้เติมทีละส่วน
- admin แสดงส่วนที่ยังไม่เสร็จ; public ไม่แสดงหัวข้อเปล่าหรือ placeholder
- H2 ที่ทำหน้าที่เป็นชื่อกลุ่มครบได้เมื่อ H3 descendants มีเนื้อหาครบ ไม่บังคับ paragraph ใต้ H2 ทุกอัน
- ก่อน publish หัวข้อปลายทางที่ตั้งใจแสดงต้องมีเนื้อหาสาระ และลำดับต้องไม่เริ่ม H3 ก่อน H2
- การเติมหัวข้อบางส่วนแล้ว save ยังเป็น draft; ถ้ามี snapshot เผยแพร่ก่อนหน้า ให้ public ใช้ snapshot เดิมต่อ

## AEO/GEO และคุณภาพเนื้อหา

ระบบช่วยจัดเนื้อหาให้ผู้อ่านค้นหาคำตอบและตรวจหลักฐานได้:

- ใต้หัวข้อที่เป็นคำถาม แนะนำให้เริ่มด้วยคำตอบตรงประเด็นแล้วอธิบายเงื่อนไข ไม่บังคับจำนวนคำ
- รองรับ definitions, lists, tables และภาพประกอบเมื่อเหมาะกับคำตอบ ไม่บังคับทุกบทความใช้ทุก format
- ใช้ประสบการณ์ติดตั้งและลิงก์ไปผลงานจริงจาก project URL owner; ไม่มีข้อมูลตัวอย่างที่สื่อว่าเป็นผลงานจริง
- รองรับ source links, ชื่อแหล่งอ้างอิง และวันที่ตรวจสอบสำหรับสเปก/มาตรฐาน/ข้อมูลที่เปลี่ยนได้ ผู้เขียนเป็นผู้ให้ข้อมูล ไม่สร้างแหล่งอ้างอิงอัตโนมัติ
- author/reviewer เป็นบุคคลหรือองค์กรตามข้อมูลจริง ไม่ใส่ผู้เชี่ยวชาญ/คุณวุฒิสมมติ
- primary topic/keyword เป็นข้อมูลต่อบทความ; keyword density, จำนวนคำขั้นต่ำ, readability score และความยาวคำตอบเป็นคำแนะนำ ไม่ใช่คะแนน AEO/GEO หรือกฎผ่าน/ตก
- Article/BlogPosting และ breadcrumb markup สอดคล้องกับเนื้อหาที่แสดงจริง ไม่มี schema เฉพาะ AI ที่ต้องเพิ่ม และไม่เปิด FAQ/HowTo markup อัตโนมัติ
- เครื่องมือไม่รับประกันอันดับ การถูกอ้างอิง หรือ Google indexing

## Draft, publication และ API

Draft save validation ตรวจรูปแบบ/ความปลอดภัยแต่ไม่ต้องมีเนื้อหาครบ; publish validation
ตรวจเนื้อหาที่จะออกสู่สาธารณะและ metadata ที่จำเป็น ทั้ง UI และ API ใช้ policy เดียวกัน
โดย server เป็นผู้ตัดสินสุดท้าย ไม่เชื่อ `isPublished` หรือคะแนนจาก browser

- public GET `/api/articles` และ `/api/articles/{slug}` คืนเฉพาะ valid published projection
- admin CRUD ย้ายไป authenticated `/api/admin/articles` และ `/api/admin/articles/{id}` เพื่อไม่ผูกการแก้ draft กับ slug ที่อาจยังไม่ได้กำหนด
- publish/unpublish เป็น explicit authenticated operation ที่ทุกหน้ารายการและ editor เรียกใช้ร่วมกัน ไม่มี toggle ที่ข้าม policy
- admin preview renderer อยู่ใน authenticated server boundary; ผลตอบกลับใช้ private/no-store caching และ public route ของ draft ตอบ 404 จริง
- ใช้ existing admin authentication/fetch owner ไม่สร้างระบบ auth ใหม่
- slug ภาษาอังกฤษตรวจความถูกต้องและ uniqueness; การแก้ title ไม่เปลี่ยน published slug ไม่มีการเติม `PRIMARY_KEYWORD` หรือ rewrite URL อัตโนมัติ
- metadata, static params, related articles และ sitemap ใช้ published projection เดียวกัน; ID/title/legacy slug ไม่เป็น public aliases
- save draft ไม่เปลี่ยน sitemap/Article dateModified; publish/unpublish ทำ revalidation ให้ detail/list/related/sitemap โดยตรวจว่า tags ถูกผูกกับ readers จริง
- คง `datePublished` เดิมเมื่อ republish และเปลี่ยน `lastmod` ตาม significant public change จริง
- raw HTML/scripts/event handlers/unsafe URLs ถูก reject หรือ normalize พร้อมแจ้งผู้เขียน; renderer escape text และ JSON-LD อย่างปลอดภัย

## การเลิกใช้ระบบเดิม

1. เก็บ consumer inventory ของ Article types, form, preview, renderer, analysis helpers, list, APIs และ sitemap ก่อนเปลี่ยน
2. ทดสอบ replacement กับ local fixtures ให้ draft → save/reload → preview → publish → public/TOC ทำงานครบ
3. เปลี่ยน consumers ไป owner ใหม่ แล้วลบ `ArticleBlockEditor`, preview เดิม, `ArticleBlock`, `authoringMode`, legacy body และ Markdown regex renderer ที่หมด consumer
4. ลบหรือปรับ analysis helpers ที่ผูกกับ Markdown/คีย์เวิร์ดรวม เมื่อยืนยัน consumers แล้ว ไม่เก็บ dead fallback ไว้
5. old-format records ถูกระบุว่าต้องเขียนใหม่ใน admin และถูกตัดจาก public projection; public path ที่ไม่มี valid snapshot ตอบ 404 ไม่มี redirect
6. ไม่ลบข้อมูลหรือ assets จากบริการภายนอกในขั้นตอนนี้ การทำข้อมูลใหม่ใน production เป็นงานแยก; deployment ต้องมี inventory และ content cutover ที่ชัด
7. อัปเดตทะเบียนหน้าและหลักฐาน sitemap ตอนเปลี่ยน publication behavior จริง ไม่เพิ่มไฟล์ outline หรือ drafts ลง sitemap

## ลำดับ implementation และตรวจรับ

| ช่วง | งาน | เกณฑ์ผ่าน |
| --- | --- | --- |
| 1 | schema, stable IDs, draft/publication policy และ fixtures | บันทึก 4 H2/7 H3 ว่างได้; publish ถูกปฏิเสธ; duplicate IDs/unsafe input ไม่ผ่าน |
| 2 | Tiptap admin adapter, outline, save/reload และ authenticated preview | แก้/reorder/paste/undo IDs ถูกต้อง; Thai IME/keyboard ใช้งานได้; preview ใช้ renderer กลาง |
| 3 | published projection, server renderer, native TOC, metadata และ APIs | published page มีเนื้อหา/TOC ใน initial HTML; draft เข้าถึงไม่ได้; stale save ไม่ทับข้อมูล |
| 4 | เปลี่ยน consumers, ลบระบบเดิม, sitemap/cache และ QA | ไม่มี fallback/import เก่า; publish/unpublish ทั้ง editor/list ใช้ policy; sitemap สอดคล้อง |

ก่อนช่วง 1 ตรวจ test runtime ที่ repo ใช้งานได้จริง ถ้ายังไม่มีให้ตั้ง focused runner
สำหรับ `yarn test:articles` (เสนอ Vitest แบบ Node environment โดยตรวจ Node/CI compatibility ก่อนเลือกเวอร์ชัน) โดยไม่อ้างว่า script Jest
ปัจจุบันผ่าน tests แล้ว ไม่สร้าง crawler หรือ test framework ของ editor ขึ้นเอง

ทดสอบเพิ่มเติม:

- duplicate heading labels, ID collisions, H3 ก่อน H2, heading rename/reorder และ title edit ที่ไม่เปลี่ยน URL
- body ว่างหลัง publish แล้ว save เป็น draft ต้องไม่เปลี่ยน snapshot; publish attempt ที่ไม่ผ่านต้องไม่ทำ partial write
- anonymous draft reads รวม `includeDrafts=true`, detail GET, preview, metadata และ related cards
- Thai text/IME, table headers, source links, figure alt ว่างที่ตั้งใจตกแต่ง, dimensions, unsafe paste และ unsupported nodes
- mobile/desktop ที่ 390/768/1440px, keyboard/focus, sticky boundaries, ไม่มี horizontal overflow และ native anchors เมื่อ JS ปิด
- ตรวจ bundle graph ว่า Tiptap/admin editor ไม่เข้า public client bundle
- ปรับ UI QA owner inventory ให้ครอบคลุม feature ใหม่ และเพิ่มกรณีไม่มี headings/มี heading เดียว โดยไม่ทำให้ outline fixture กลายเป็น renderer สำหรับ legacy Markdown
- `yarn type-check`, lint, build, UI QA; LINE QA เมื่อแตะ contact composition; SEO QA ระดับ Template พร้อม fixtures เมื่อ CMS local ไม่มีบทความ
- SEO ตรวจ HTTP status, initial HTML, headings/IDs, canonical, metadata/schema, links, published-only sitemap และ 404 ของ draft/unknown/retired article aliases
- รายงานข้อจำกัดของ CMS/emulator/browser/GSC และแยก local จาก production ไม่มี deploy หรือ sitemap submission ในรอบ implementation local

## แหล่งทางการที่ตรวจสอบ

ตรวจเมื่อ 6 ตุลาคม 2026:

- [Google: optimizing for generative AI search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) — เน้นข้อมูลมีคุณค่าและผู้อ่านจริง ไม่มีคำยาวที่เหมาะที่สุดหรือ schema เฉพาะ AI
- [Google: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) — metadata ของบทความ ผู้เขียน และวันที่
- [Tiptap: React](https://tiptap.dev/docs/editor/getting-started/install/react) — admin rich text และการ initialize ใน Next/SSR
- [Tiptap: Static Renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer) — JSON → React แบบ server-safe; static rendering ไม่รัน plugins ที่สร้าง IDs
- [Tiptap: UniqueID](https://tiptap.dev/docs/editor/extensions/functionality/uniqueid) — ใช้ประกอบการออกแบบ stable node identity ตรวจ mapping เป็น HTML `id` ให้ตรงกับ TOC
- [Vitest: Getting Started](https://vitest.dev/guide/) — ตรวจข้อกำหนด runtime และการตั้ง focused runner ก่อนติดตั้ง
- [Next.js: not-found convention](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) และ [loading convention](https://nextjs.org/docs/app/api-reference/file-conventions/loading) — streamed not-found อาจได้ HTTP 200 เพราะ response headers ถูกส่งแล้ว; ตรวจ resource ก่อนเริ่ม stream เมื่อจำเป็นต้องได้ 404 จริง

## Implementation และผลตรวจ local

- สร้าง schema ที่ versioned, stable H2/H3 IDs, draft/publication policy, Tiptap editor, outline, authenticated preview, D1 draft/snapshot repository และ public server renderer/native TOC ตามโครงข้างต้น
- public reads, metadata, related articles, API และ sitemap ใช้ published snapshot เท่านั้น; old-format records are not converted or overwritten automatically
- เพิ่ม pre-render existence check สำหรับ `/articles/{slug}` เพื่อรับ HTTP 404 จริงเมื่อ slug ไม่ถูกต้องหรือไม่มี published snapshot แม้ root loading boundary จะเริ่ม streaming; unknown URL ไม่มี `Location` header
- ตรวจจริงบน local production build: unknown article detail 404, `/articles` 200 และ public unknown-article API 404; actual content publication requires an authenticated local editor session
- `yarn type-check`, `yarn test:articles` (8 tests), `yarn lint`, `yarn ui:qa` และ `yarn build` ผ่าน; lint มี 3 warnings เดิมในหน้า admin ที่ใช้ `<img>`
- `node scripts/seo-qa.mjs --base=http://127.0.0.1:3000` ผ่าน 9 หน้าหลังรวม article check เข้ากับ middleware เดิม; URL alias ของบริการยังได้ 308 และไม่เปลี่ยน behavior
- ไม่มีการยืนยัน GSC, production CMS data, production HTTP behavior, browser-authenticated admin, การเผยแพร่ หรือ indexing; local checks ไม่ยืนยันสถานะเหล่านั้น

## Full-screen article editor workspace

ผู้ใช้ยืนยันให้เปิด editor เป็น workspace เต็มหน้าจอและคง explicit save:

- `ArticleForm` เป็นเจ้าของ document/metadata state และคำสั่ง save, preview,
  publish และ unpublish; `ArticleWorkspace` จัดวาง shell และ responsive panels;
  `ArticleEditor` คง Tiptap instance เดียว; outline และ metadata sidebar เป็น
  components แยกของ feature บทความ
- ที่ 1280px ขึ้นไป แสดง TOC 240px, พื้นที่เอกสารกว้างสูงสุด 760px และ metadata
  320px; ที่ 768–1279px ซ่อน TOC ไว้ใน drawer และให้พับ metadata ได้; ต่ำกว่า
  768px เปิด TOC หรือ metadata เป็น drawer ทีละแผง
- โหมดโฟกัสซ่อน sidebar ทั้งคู่; การเปลี่ยนขนาดจอหรือพับ sidebar ไม่เปลี่ยน key
  หรือย้ายตำแหน่ง component ของ Tiptap เพื่อคง selection, IME, undo history และ
  scroll state
- TOC แสดง H2/H3 จาก document outline, พับกลุ่ม H2, ระบุหัวข้อที่ยังไม่มีเนื้อหา
  และเลือก heading ID เพื่อ scroll/focus editor. Metadata แบ่งเป็นกลุ่มทั่วไป,
  SEO, ผู้เขียน/ผู้ตรวจทาน และแหล่งอ้างอิง โดยเริ่มเปิดเฉพาะกลุ่มทั่วไป
- Admin shell ซ่อน navigation ขณะ workspace เปิดผ่าน `AdminWorkspaceContext`;
  ปุ่มกลับรายการเตือนก่อนทิ้งการแก้ไข และ draft ใหม่ที่ยังไม่แก้ถือว่ายังสะอาด
- Link/image controls ใช้ Base UI popovers และ drawer ใช้ Base UI Dialog. ไม่มีการ
  เปลี่ยน API, database schema, publication policy, public article renderer หรือ
  deploy ในงานนี้

ผลตรวจ local ของ workspace:

- `yarn type-check`, `yarn test:articles` (15 tests), `yarn lint`, `yarn ui:qa`,
  `yarn build` และ `yarn cf:build` ผ่าน; lint ยังแสดง 3 warnings เดิมใน admin
  image previews
- `yarn build` และ `yarn cf:build` รายงานคำเตือน Cloudflare Durable Object
  `DOQueueHandler` ที่ไม่ export ใน local และ build-time article sitemap read
  ล้มเหลวจาก local CMS binding; build เสร็จ แต่ sitemap coverage ใน build นี้ยัง
  ไม่ยืนยันได้
- Browser ที่เปิดอยู่เริ่มต้นที่ port 3002 ซึ่งเสิร์ฟ build เก่า; preview build
  แยกที่ port 3003 ใช้ local D1 ที่ว่างและไม่พบรายการบทความ จึงเปิด workspace
  สร้างใหม่ได้ แต่ไม่สามารถยืนยัน save/reload/preview/publish กับ draft จริงโดยไม่
  บันทึกข้อมูลทดสอบเพิ่ม
- Browser QA บน port 3003 ตรวจที่ 390/768/1024/1440px: ไม่มี horizontal
  overflow; แผงมีขนาด 240/320px ตาม breakpoint; TOC drawer ปิดหลังเลือกหัวข้อและ
  ย้าย focus ไปยัง editor; metadata drawer ปิดด้วย Escape และคืน focus; พับ metadata
  กับโหมดโฟกัสแล้วเนื้อหา editor ยังคงอยู่
- Browser QA ยืนยันการพิมพ์ข้อความไทย, เปิด popover แล้วใส่ลิงก์กับข้อความที่เลือก,
  แทรกตาราง และ undo/redo เมื่อเป็นคนละ history group. ทดสอบคำเตือนออกจาก draft
  แล้วพบ JavaScript confirm; การควบคุม browser หยุดตอบสนองระหว่าง dismiss prompt
  จึงไม่ได้ตรวจการคืนกลับหลังยกเลิกคำเตือนต่อ
- ระหว่างทดสอบ browser สั่ง save โดยไม่ตั้งใจทำให้เกิด draft ว่างใน local D1
  (ID `947bc63d-1b29-431c-9b8a-e748fef63211`, ไม่มี publication หรือ route);
  ตรวจ payload แล้วลบเฉพาะ record ทดสอบนี้ทั้ง draft และ entry จาก local D1 และ
  ยืนยันว่าเหลือ article count 0. ไม่มีข้อมูล production หรือบริการภายนอกถูกเขียน
- ไม่อัปโหลดไฟล์จริงไป R2 และไม่ได้ทดลอง publish/preview/reload จาก browser เพราะ
  ไม่มี draft fixture ใน local DB; article workflow tests ครอบคลุม explicit save
  และ publish revision โดยไม่เขียนไป production
- หลังตรวจเสร็จเปิด local Cloudflare preview build ล่าสุดที่ `localhost:3002`
  เพื่อให้ผู้ใช้ตรวจต่อ; D1 local มี projects เดิม 16 รายการและไม่เหลือ article
  fixture. ไม่มีการ deploy

## On-page SEO Assistant

เพิ่มตัววิเคราะห์เฉพาะเครื่องใน `src/features/articles/analysis/` และแผงพับได้ใน
metadata sidebar โดยใช้กฎรุ่น `on-page-local-v1` ผลวิเคราะห์คำนวณใหม่หลังหยุดแก้ไข
400 ms และรอให้ Thai IME composition จบก่อน ผลที่เก่ากว่า document ปัจจุบันคลิกไม่ได้
เพื่อไม่พา cursor ไปตำแหน่งผิด

- อ่านข้อความจาก Article document JSON รวม headings, paragraphs, nested lists/table
  cells และ image captions; ไม่นับ title, SEO metadata, URLs, alt text และ outline
  ที่สร้างซ้ำในจำนวนคำของ body
- ใช้ `Intl.Segmenter('th', { granularity: 'word' })` กับ token matching แบบตรงตัว
  หลัง NFC normalization ไม่บังคับช่องว่างระหว่างคำไทย ไม่จับ substring เช่น “ไฟ”
  ใน “ไฟฟ้า” และไม่เดาคำพ้อง การนับภาษาไทยเป็นค่าประมาณ ไม่ใช่จำนวนตาม Google
- ผลแสดงจำนวนคำ, occurrences และตำแหน่งใน title/SEO title/บทนำ/headings/sections,
  ความถี่ต่อ 100 คำโดยไม่มี threshold, title/description preview โดยประมาณ, heading
  completeness, link types/anchor concerns, image alt/dimensions และข้อมูลผู้เขียน/
  แหล่งอ้างอิงที่กรอก
- แต่ละผลมีสถานะ “พบแล้ว”, “ควรพิจารณา” หรือ “ต้องตรวจเอง” พร้อมเหตุผลและหลักฐาน
  คลิกไปยังข้อความต้นฉบับหรือ metadata field ได้; decorative image alt ว่างถือว่าตั้งใจ
- Optional `seoSettings` เก็บ primary keyword, secondary keywords และ aliases ที่ผู้เขียน
  ยืนยันใน D1 draft JSON เท่านั้น Legacy records/request อ่านได้และ request เก่าที่ละ
  settings จะรักษาค่าที่บันทึกไว้ Settings-only saves ไม่เปลี่ยน public snapshot,
  `modifiedAt` หรือ sitemap `lastmod`
- ไม่มีคะแนนรวม, keyword density target, publish gate, AI/API call, crawler หรือการ
  คาดการณ์อันดับ/AEO/GEO; result และ rule version ไม่ถูกบันทึก

## ธีมของ Article Editor

เพิ่มปุ่มสลับธีมมืด/สว่างภายใน workspace ของ `/admin/articles` และเก็บ preference
ไว้ใน local storage ของ browser นั้น ขอบเขตสีครอบคลุมพื้นที่เขียน TOC, metadata,
On-page findings, inputs, drawers และ popovers โดยใช้ tokens เฉพาะ article workspace
ไม่เปลี่ยน public-site tokens หรือหน้าหลังบ้านอื่น การสลับธีมเป็น presentation-only
และไม่ remount Tiptap editor; ถ้า browser ปิด storage ยังสลับธีมได้จนออกจากหน้า

## แถบเครื่องมือเขียนบทความ

พื้นที่กลางของ editor แสดงชื่อบทความและเอกสารโดยไม่มีแถบจัดรูปแบบค้างเหนือเนื้อหา
คำสั่ง H2/H3 ย่อหน้า ตัวหนา/เอียง รายการ ตาราง undo/redo ลิงก์ และรูปภาพอยู่ใน popover
“เครื่องมือจัดรูปแบบ” บนแถบด้านบน `ArticleEditor` ยังเป็นเจ้าของคำสั่งและ selection ส่วน
`ArticleWorkspace` เป็นเจ้าของตำแหน่ง trigger; การย้ายตำแหน่งนี้ต้องไม่ remount editor
หรือทำให้ selection/cursor หาย
