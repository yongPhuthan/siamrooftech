# Content Cluster / Article System Plan

## Scope

This document defines the content architecture after the service landing pages are in place. It is a publishing system, not a request to mass-produce articles.

## Canonical Page Map

| Intent | Canonical URL | Primary keyword | Page type | Status |
|---|---|---|---|---|
| Main retractable awning service | `/services/retractable-awning` | กันสาดพับเก็บได้ | Service landing page | Implemented |
| Electric retractable awning service | `/services/electric-retractable-awning` | กันสาดพับไฟฟ้า | Service landing page | Implemented |
| Bangkok service area | `/services/retractable-awning/bangkok` | กันสาดพับเก็บได้ กรุงเทพ | Local service page | Implemented |
| Nonthaburi service area | `/services/retractable-awning/nonthaburi` | กันสาดพับเก็บได้ นนทบุรี | Local service page | Implemented |
| Pathum Thani service area | `/services/retractable-awning/pathum-thani` | กันสาดพับเก็บได้ ปทุมธานี | Local service page | Implemented |

## Article Cluster Rules

Every article must support one existing money page or a verified customer objection. Do not publish an article just because a keyword exists.

Allowed cluster types:

1. **Buying Guide**
   - Purpose: help users choose manual vs electric, fabric/material, size, and installation approach.
   - Must link to: `/services/retractable-awning` and relevant portfolio examples.
   - Example topics:
     - วิธีเลือกกันสาดพับเก็บได้ให้เหมาะกับบ้าน
     - กันสาดมือหมุนกับกันสาดไฟฟ้า ต่างกันอย่างไร

2. **Comparison / Decision**
   - Purpose: compare retractable awnings with fixed roofing, polycarbonate roofs, and cheap marketplace awnings.
   - Must avoid: claiming competitors are unsafe without evidence.
   - Example topics:
     - กันสาดพับเก็บได้ vs หลังคาถาวร เลือกแบบไหนดี
     - ซื้อกันสาดออนไลน์มาติดเองเสี่ยงอะไรบ้าง

3. **Local Proof**
   - Purpose: support location pages with real project context.
   - Must have: real project examples in or near the area.
   - Example topics:
     - ตัวอย่างกันสาดพับเก็บได้สำหรับบ้านในกรุงเทพ
     - กันสาดพับเก็บได้สำหรับร้านอาหารในนนทบุรี

4. **Problem / Objection**
   - Purpose: answer customer objections before quoting.
   - Must include: practical constraints, not generic filler.
   - Example topics:
     - กันสาดพับเก็บได้กันฝนได้แค่ไหน
     - ต้องดูอะไรบ้างก่อนติดตั้งกันสาดพับเก็บได้

5. **Project Story**
   - Purpose: turn portfolio items into detailed proof articles.
   - Must include: location, customer type, system, dimensions, material, problem, outcome.
   - Must link to: portfolio detail and service page.

## Publishing Gate

Do not publish an article unless it passes all checks:

- One primary intent only.
- One target canonical support page.
- At least one internal link to a service page.
- At least one internal link to portfolio or contact.
- No fake reviews, fake ratings, unverifiable warranty claims, or invented customer names.
- No duplicate article targeting the same query and same intent.
- Visible content matches any schema used.

## Article Brief Template

Every article request should use this template before drafting:

```markdown
# Article Brief

## Intent
- Intent type: service / local / comparison / FAQ / proof article
- Primary query:
- Supporting queries:
- Canonical support page:
- Audience:

## Proof
- Required portfolio examples:
- Required project facts: location, system, dimensions, material
- Claims that must not be made without evidence:

## Structure
- Title:
- Meta description:
- H1:
- Required H2 sections:
- FAQ questions:
- CTA:

## Internal Links
- Link to service page:
- Link to local page:
- Link to portfolio proof:
- Link to contact:

## Measurement
- Target GSC queries:
- Review date:
- Refresh trigger:
```

## Initial Backlog

| Priority | Article brief | Supports | Required proof |
|---|---|---|---|
| P0 | กันสาดมือหมุนกับกันสาดพับไฟฟ้า ต่างกันอย่างไร | `/services/retractable-awning`, `/services/electric-retractable-awning` | manual/electric project examples |
| P0 | วิธีเลือกกันสาดพับเก็บได้สำหรับบ้าน ร้านอาหาร และสำนักงาน | `/services/retractable-awning` | examples by customer type |
| P1 | กันสาดพับเก็บได้กันฝนได้ไหม และมีข้อจำกัดอะไร | `/services/retractable-awning` | installation constraints and material notes |
| P1 | กันสาดพับเก็บได้ กรุงเทพ: ตัวอย่างหน้างานและข้อควรรู้ | `/services/retractable-awning/bangkok` | Bangkok or nearby projects |
| P2 | กันสาดพับเก็บได้ vs หลังคาถาวร | `/services/retractable-awning` | use-case comparison |

## Done Criteria

This content system is ready when:

- The first 5 article briefs are documented.
- Every new article has a support target.
- Article publishing has a no-duplicate-intent rule.
- Internal links are specified before drafting.
