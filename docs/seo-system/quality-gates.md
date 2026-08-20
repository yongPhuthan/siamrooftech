# SEO Quality Gates

## Required Before Deploy

Run:

```bash
yarn build
yarn type-check
yarn start -p 3000
yarn seo:qa
```

The production server can be stopped after `yarn seo:qa` passes.

## Automated Checks

`yarn seo:qa` verifies:

- important public pages return `200`
- canonical URLs match `https://www.siamrooftech.com`
- each checked page has exactly one H1
- title length stays within the configured limit
- service pages include `Service` and `FAQPage` schema
- sitemap includes service pages
- robots.txt includes sitemap and does not explicitly block AI crawlers
- legacy Thai service URLs redirect to canonical service URLs

## Manual Checks

Before publishing SEO changes, confirm:

- no new public page uses `'use client'` unless it needs browser interaction
- no new page targets the same primary keyword and same intent as an existing page
- no fake reviews, ratings, certifications, or unverifiable warranty claims were added
- schema matches visible page content
- new service/location pages have real service coverage and proof requirements
- new article briefs specify internal links before drafting

## Failure Policy

If any automated or manual quality gate fails:

1. Do not deploy.
2. Fix the cause.
3. Re-run the failed command and `yarn seo:qa`.
4. Record the fix in the relevant SEO system doc if it changes operating rules.
