# Portfolio Proof Data

Portfolio items are not only gallery content. They are proof assets for service and local SEO pages.

## Required Fields For New Portfolio Items

Every new public portfolio item should include:

- `category`: customer/job type, such as `บ้านพักอาศัย`, `ร้านอาหาร`, `คาเฟ่`, or `สำนักงาน`
- `location`: real visible install location text
- `width` and `extension`: awning size in meters
- `type`: manual, electric motor, or combined system
- `canvas_material`: visible material choice
- `proof.problem`: the real pre-install problem
- `proof.solution`: what Siamrooftech installed or changed
- `proof.outcome`: the post-install result

Optional but recommended:

- `proof.serviceType`: canonical service bucket
- `proof.customerType`: normalized customer type
- `proof.serviceArea`: normalized SEO area
- `proof.proofNotes`: short evidence notes, one fact per item

## Writing Rules

- Write from observed project facts, not generic sales copy.
- Mention the customer type and install area when relevant.
- Keep claims verifiable from the job record or images.
- Do not invent metrics such as temperature reduction, revenue lift, or lead increase unless measured.
- Avoid duplicate proof text across projects.
- For local pages, prefer projects with matching `proof.serviceArea` or a location that clearly contains the target province.

## Good Example

```ts
proof: {
  serviceType: "กันสาดพับไฟฟ้า",
  customerType: "บ้านพักอาศัย",
  serviceArea: "กรุงเทพ",
  problem: "บ้านพักอาศัยต้องการกันสาดที่ใช้งานสะดวกและเดินระบบไฟให้เรียบร้อยไม่รบกวนภาพรวมของบ้าน",
  solution: "ติดตั้งกันสาดพับเก็บได้มอเตอร์ไฟฟ้า ขนาด 2.6 x 2 เมตร ใช้ผ้าอะคริลิคสเปนและซ่อนแนวเดินสายไฟ",
  outcome: "เจ้าของบ้านใช้งานกางพับได้สะดวกขึ้น ลดแดดและความร้อน พร้อมงานเดินสายที่ดูเรียบร้อย",
  proofNotes: ["ระบบมอเตอร์ไฟฟ้า", "กรุงเทพ", "มีรูปหลังติดตั้ง"],
}
```

## Where The Data Appears

- Service pages render matching proof projects through `src/lib/service-project-matching.ts`.
- Portfolio detail pages render the proof narrative through `src/lib/project-proof.ts`.
- Static project data is validated by `src/lib/file-projects.ts`.
