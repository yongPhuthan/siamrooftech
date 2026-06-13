# Portfolio Source Truth Audit

Date: 2026-06-13

Source of truth used for emergency recovery:

- Commit: `a08d0c72d9ebe368eaa338bc983f1eb04dcba5f6`
- File: `src/app/components/Main.tsx`
- Data shape: legacy `ProjectShow` groups with `description`, `smallSize`, and `originalSize`

## Restored To Fallback

These projects use verified R2 image URLs. Every restored image returned `200 image/webp` during the recovery check.

1. `legacy-office-saimai-530x250`
   - Source title: `กันสาดพับเก็บได้ อาคาร-สำนักงาน`
   - Location: `แขวงคลองถนน เขตสายไหม กรุงเทพมหานคร`
   - Images: `46570`, `17042`, `63425`, `61840`

2. `legacy-cafe-samutprakan-450x250`
   - Source title: `กันสาดพับเก็บได้ ร้านคาเฟ่ & เบเกอรี่`
   - Location: `อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ`
   - Images: `71865`, `59107`, `38009`, `37540`

3. `legacy-hotel-suvarnabhumi-500x250`
   - Source title: `กันสาดพับเก็บได้ โรงแรม-รีสอร์ท`
   - Location: `Suvarnabhumi Airport Hotel เขตลาดกระบัง กรุงเทพมหานคร`
   - Images: `61013`, `74234`, `10955`

4. `legacy-salon-nakhonpathom-570x250`
   - Source title: `กันสาดพับเก็บได้ ร้านเสริมสวย-สปา`
   - Location: `ร้าน แจ็คคิ้วสวยบอกต่อ อำเภอเมืองนครปฐม จังหวัดนครปฐม`
   - Images: `93381`, `56084`, `83821`, `13033`

5. `legacy-home-prawet-300x200`
   - Source title: `กันสาดพับเก็บได้ บ้านเดี่ยว-ทาวน์โฮม`
   - Location: `เขตประเวศ กรุงเทพมหานคร`
   - Images: `44373`, `43948`, `54182`

6. `legacy-kiosk-black-duck-200x150`
   - Source title: `กันสาดพับเก็บได้ คีออส-แฟรนไชส์`
   - Location: `ร้าน Black Duck กรุงเทพมหานคร`
   - Images: `41791`, `25336`, `71837`, `92517`

## Not Restored Yet

These groups exist in the first commit, but their image host `siamroof.workstandard.co` no longer resolves. They are intentionally excluded from production fallback until the original images are recovered or migrated to a live asset host.

1. `legacy-7-cafe-rama2`
   - Title: `กันสาดพับเก็บได้ ร้านคาเฟ่ & เบเกอรี่ พระราม 2`
   - Missing images: `IMG_6441.JPG`, `IMG_6444.JPG`, `IMG_6443.JPG`, `IMG_6445.JPG`

2. `legacy-8-home-saransiri`
   - Title: `กันสาดพับเก็บได้ บ้านเดี่ยว-ทาวน์โฮม ศรีวารี`
   - Missing images: `IMG_6307 2.JPG`, `IMG_6436.JPG`, `IMG_6438.JPG`, `IMG_6439.JPG`

3. `legacy-9-temple-wat-thaphra`
   - Title: `กันสาดพับเก็บได้ วิหาร-สำนักสงฆ์`
   - Missing images: `IMG_6431.JPG`, `IMG_6433.JPG`, `IMG_6434.JPG`, `IMG_6430.JPG`

## Guardrails Added

- Fallback data is stored in `src/lib/legacy-projects.ts`.
- `validateLegacyFallbackProjects()` throws if fallback projects have:
  - no images
  - missing `featured_image`
  - `default-project.jpg`
  - duplicate featured images across projects
  - duplicate images inside one project
  - missing image URLs
- Portfolio sorting now returns `0` when sort keys are equal, preserving source order.
