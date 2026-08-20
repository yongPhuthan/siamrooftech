# SEO Agent Operating Manual

## Mission

Maintain and improve Siamrooftech organic visibility for retractable awning installation without spam, duplicate intent, fake proof, or unnecessary client-side rendering.

## Operating Cycle

## Inputs

- GSC query/page exports
- GA4 events and conversion reports
- Google Business Profile visibility and action data
- `sitemap.xml`, `robots.txt`, and SEO QA crawl output
- Portfolio data from Firestore
- Published articles and their internal links
- Business guardrails from `.agents/product-marketing.md`

## Outputs

- prioritized SEO task list
- content update request
- internal link update request
- technical SEO fix request
- measurement/reporting issue
- weekly SEO operations report

### Daily Checks

1. Run technical QA:
   - `yarn seo:qa`
   - `yarn type-check`
2. Check for broken canonical/sitemap/schema/H1 on public money pages.
3. Review new or changed portfolio items for service-link opportunities.
4. Record any action as a concrete change request.

### Weekly Checks

1. Export GSC page/query data.
2. Segment by service/local/article/portfolio.
3. Identify:
   - high-impression low-CTR pages
   - queries where service pages are near page 1
   - portfolio pages ranking for service intent
   - local queries with impressions
4. Create no more than 3 prioritized SEO tasks for the week.

### Monthly Checks

1. Decide whether to add, merge, or refresh content.
2. Review if local pages have enough proof.
3. Audit internal links from homepage, service pages, portfolio, and articles.
4. Update content cluster backlog.

## Allowed Actions

- Add proof blocks from real portfolio data.
- Add internal links when intent is clear.
- Improve service-page copy with visible evidence.
- Add article briefs that support existing service pages.
- Fix technical SEO regressions.
- Update schema only when visible content supports it.

## Disallowed Actions

- Creating location pages without real service coverage and proof.
- Creating pages for contractor-pass-through work.
- Adding fake reviews, fake ratings, or unverifiable claims.
- Publishing multiple pages for the same keyword and same intent.
- Adding `'use client'` to public SEO pages unless required for real browser interaction.
- Adding Swiper or heavy client libraries to static public sections.

## Prioritization

Use this order:

1. Technical indexing or rendering defects.
2. Conversion tracking gaps.
3. Money pages with impressions but weak CTR/rank.
4. Portfolio proof/internal linking improvements.
5. Article refreshes or new briefs.
6. New local pages only after proof and query evidence.

## Output Format

Every SEO task should include:

- Problem
- Evidence
- Target URL
- Proposed change
- Risk
- Verification command or metric
- Rollback condition

## Stop Condition For System Build

The SEO system build is complete when:

- Service pages exist and are indexable.
- Portfolio proof is connected to service pages.
- Content cluster plan exists.
- Measurement spec exists.
- Agent operating manual exists.
- Automated SEO QA exists and runs in CI/local workflow.

After that point, work should move to operation mode, driven by GSC/GA4/GBP evidence.
