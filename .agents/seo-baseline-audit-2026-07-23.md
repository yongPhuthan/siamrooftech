# Siamrooftech SEO Baseline Audit

**Date:** 2026-07-23  
**Scope:** Codebase + live site spot checks for `https://www.siamrooftech.com/`  
**Primary commercial target:** `กันสาดพับเก็บได้`  
**Secondary target:** `กันสาดพับไฟฟ้า` / electric retractable awning  
**Context source:** `.agents/product-marketing.md` v1

## Executive Summary

Overall SEO foundation is workable but not production-clean yet. The site is indexable, uses Next.js ISR/SSG headers, has portfolio proof content, and emits basic structured data. The biggest blockers are technical: duplicate host/protocol responses, inherited homepage canonicals on non-home pages, incomplete sitemap coverage, AI crawler blocking despite AI SEO goals, multiple H1s on the homepage, and heavy client/image output.

Fix the technical foundation before scaling content. Do not start daily content automation yet. The first SEO system milestone should be: canonical/robots/sitemap/schema cleaned up, GSC/GA4/GBP installed, and a keyword-to-page map approved.

## Live Checks

Checked these live URLs:

- `https://www.siamrooftech.com/`
- `https://www.siamrooftech.com/portfolio`
- `https://www.siamrooftech.com/contact`
- `https://www.siamrooftech.com/articles`
- `https://www.siamrooftech.com/allawning`
- `https://www.siamrooftech.com/robots.txt`
- `https://www.siamrooftech.com/sitemap.xml`
- sample portfolio URLs:
  - `https://www.siamrooftech.com/portfolio/5x2-520680`
  - `https://www.siamrooftech.com/portfolio/4-7x2.5-886205`

PageSpeed Insights API could not be used because the API returned quota `429 RESOURCE_EXHAUSTED`. Core Web Vitals need to be collected later from Search Console or a successful Lighthouse/PageSpeed run.

## Top Priority Findings

### P0: Host and protocol are not canonicalized

**Issue:** `http://siamrooftech.com/`, `https://siamrooftech.com/`, and `http://www.siamrooftech.com/` all returned `200` instead of redirecting to `https://www.siamrooftech.com/`.

**Impact:** High. Search engines can see duplicate versions of the same site. This splits crawl, canonical, and link signals unless Google chooses the intended canonical consistently.

**Evidence:** Live HTTP checks returned `200 (no location)` for all three non-canonical variants.

**Fix:** Add Cloudflare redirect rules or OpenNext/Next middleware equivalent:

- `http://siamrooftech.com/*` -> `https://www.siamrooftech.com/$1`
- `https://siamrooftech.com/*` -> `https://www.siamrooftech.com/$1`
- `http://www.siamrooftech.com/*` -> `https://www.siamrooftech.com/$1`

**Priority:** Critical.

### P0: Non-home pages inherit homepage canonical

**Issue:** `/contact`, `/articles`, and `/allawning` render canonical `https://www.siamrooftech.com` instead of self-referencing canonical URLs.

**Impact:** High. Google may treat those pages as duplicates of the homepage and consolidate signals away from them.

**Evidence:**

- `/contact` live canonical: `https://www.siamrooftech.com`
- `/articles` live canonical: `https://www.siamrooftech.com`
- `/allawning` live canonical: `https://www.siamrooftech.com`
- Root layout sets global canonical at `src/app/layout.tsx:54`.

**Fix:** Remove global canonical from the root layout or ensure every public page defines its own `alternates.canonical`. Add canonical metadata to `/contact`, `/articles`, and `/allawning`. Prefer a metadata helper that composes per-route canonical URLs from a single `SITE_URL`.

**Priority:** Critical.

### P0: Sitemap omits important public pages

**Issue:** Sitemap includes homepage, `/portfolio`, and portfolio detail pages, but excludes `/contact`, `/articles`, `/allawning`, `/works`, article detail pages, and category pages.

**Impact:** High. Important pages are discoverable through links, but sitemap is incomplete and weakens crawl/indexation management, especially before Search Console is configured.

**Evidence:** `src/app/sitemap.ts:15-44` has several static pages commented out. Live sitemap confirms only homepage, portfolio, and portfolio detail URLs.

**Fix:** Include all canonical public pages that should rank. Add published article URLs from Firestore, article index, contact, relevant service pages, and indexable portfolio category pages only if they have enough unique value.

**Priority:** Critical.

### P1: Robots blocks AI crawlers while AI SEO is an explicit goal

**Issue:** `robots.ts` blocks `GPTBot`, `ChatGPT-User`, `CCBot`, `anthropic-ai`, and `Claude-Web`.

**Impact:** Medium to High. If the strategy includes AI search visibility, citations, LLM discovery, or AI answer inclusion, blocking these crawlers conflicts with the goal.

**Evidence:** `src/app/robots.ts:17-35` and live `robots.txt`.

**Fix:** Decide policy intentionally. Recommended for this project: allow reputable AI crawlers on public marketing pages while keeping `/admin`, `/api`, private assets, and customer-sensitive paths blocked. If business policy is to block AI training, keep blocking, but do not claim AI SEO coverage.

**Priority:** High.

### P1: Homepage has multiple H1s

**Issue:** Live homepage has 6 H1 tags. The main sources are hero and why-us components using H1 for section styling.

**Impact:** Medium. Modern Google can parse multiple H1s, but this weakens semantic clarity. For the money keyword, the homepage should have one primary H1 and section headings should use H2/H3.

**Evidence:**

- Live homepage H1 count: 6.
- `src/app/components/section/HeroSection.tsx:26` and `:29` both use H1.
- `src/app/components/section/WhyUs.tsx:9` and `:12` use H1.
- `src/app/components/section/WhyUs2.tsx:136` and `:139` use H1 on mobile.

**Fix:** Keep one H1 around the main keyword, e.g. `กันสาดพับเก็บได้ ระบบมือหมุนและไฟฟ้า โดยสยามรูฟเทค`. Change brand/section headings to H2/H3 or styled div/span.

**Priority:** High.

### P1: Portfolio detail metadata is too long and may keyword-stuff

**Issue:** Sample portfolio detail titles are 82-108 Thai characters and descriptions can exceed the practical SERP display range.

**Impact:** Medium. Long titles/descriptions get truncated and dilute the main keyword. They also read mechanically because dimensions, system, location, and brand are all packed into the title.

**Evidence:** `src/app/portfolio/[slug]/page.tsx:65-66` constructs long metadata. Live sample:

- `/portfolio/5x2-520680` title length: 108
- `/portfolio/4-7x2.5-886205` title length: 82

**Fix:** Use shorter patterns:

- Title: `กันสาดพับเก็บได้ ร้านกาแฟ มวลชน | Siamrooftech`
- Description: include system, dimensions, material, location, and proof in natural language.

**Priority:** High.

### P1: Public SEO pages rely heavily on client components

**Issue:** Many public components use `'use client'`, including navigation, CTA, portfolio grid/filter/card, gallery, hero-related sections, contact tracking, and portfolio detail client.

**Impact:** Medium to High. The current site is still server-rendered, but hydration and client bundle cost can hurt performance. AGENTS.md explicitly says public pages should prioritize SSG/ISR and avoid client rendering except where required.

**Evidence:** `rg "'use client'" src/app src/components src/lib` found client components across public UI, including `src/app/components/portfolio/PortfolioGrid.tsx`, `PortfolioCard.tsx`, `PortfolioWithFilters.tsx`, `Navigation.tsx`, `FinalCTASection.tsx`, and `PortfolioDetailClient.tsx`.

**Fix:** Split public components into server-rendered static shells plus small client islands only for real interaction:

- Navigation can mostly be server/static, with a tiny mobile-menu client component.
- CTA can be server unless tracking requires a client wrapper.
- Portfolio listing should render indexable cards on the server; filters/search can be progressive enhancement.
- Detail page should render core content, headings, images, and schema in the server component.

**Priority:** High.

### P1: Image optimization is disabled

**Issue:** `next.config.mjs` sets `images.unoptimized: true`.

**Impact:** Medium to High. Homepage live HTML contains 277 image tags, 162 external image URLs, and 265 KB HTML. Disabling Next image optimization makes LCP and payload management harder.

**Evidence:**

- `next.config.mjs:3-6`
- Live homepage spot check: 277 images, 12 without explicit width/height in HTML, 162 external images.

**Fix:** Re-enable image optimization if Cloudflare/OpenNext deployment supports it. If not, create a deterministic image pipeline for R2 variants, enforce width/height/sizes, lazy-load non-critical images, and limit homepage portfolio/image volume.

**Priority:** High.

### P2: Homepage structured data uses unverifiable ratings/review claims

**Issue:** Homepage JSON-LD includes `aggregateRating` with `4.8` and `127` reviews plus a sample review. The product context says review counts and testimonials need verification.

**Impact:** Medium. Publishing unverified review markup can create trust and rich-results risk. Google structured data policies require visible, accurate, user-facing review content.

**Evidence:** Homepage schema in `src/app/page.tsx` includes rating/review data. Product context marks reviews as pending verification.

**Fix:** Remove aggregateRating/review schema until the same reviews are visible on the page and verifiably sourced. Keep Organization/LocalBusiness/Service schema accurate.

**Priority:** Medium.

### P2: Contact metadata overclaims service area

**Issue:** Contact page says `ติดตั้งทั่วประเทศ`, but product context says target service areas are Bangkok, Nakhon Pathom, Nonthaburi, Pathum Thani, Samut Prakan, Ayutthaya, and Samut Sakhon.

**Impact:** Medium. This creates mismatch in local SEO relevance and lead quality.

**Evidence:** `src/app/contact/page.tsx` metadata description says nationwide service. Product context intentionally avoids `รับทั่วประเทศ`.

**Fix:** Rewrite as Bangkok and nearby provinces. Add actual service area list in visible copy and schema.

**Priority:** Medium.

## Current SEO Strengths

- Homepage is indexable and responds with ISR headers.
- Portfolio proof content exists and is a strong differentiator versus DIY/marketplace competitors.
- Homepage emits LocalBusiness/Organization and FAQPage JSON-LD.
- Portfolio index emits CollectionPage structured data.
- Portfolio detail pages have self-referencing canonicals.
- Public article pages support metadata and Article schema at detail level.
- Thai `lang="th"` is set.
- Contact actions for phone/LINE exist and are trackable once analytics is configured.

## Missing Measurement Setup

These are not configured yet per business grilling:

- Google Search Console
- GA4
- Google Business Profile

Without these, there is no reliable baseline for impressions, clicks, keyword positions, indexing, Core Web Vitals field data, or local pack performance.

## SERP Competitors to Track

Monitor these for `กันสาดพับเก็บได้`, `กันสาดพับไฟฟ้า`, `กันสาดอัตโนมัติ`, and location-modified queries:

- Highspeed กันสาด: `highspeedkansad.com`
- Sun Shine Shades: `sun-battle.com`
- Fortune Shading / Heicko: `fortune-shading.com`
- Sard Song Sang Group: `sardsongsanggroup.com`
- KS Awning: `ksawning.com`
- ShadeKit: `shadekit.co`
- Marketplaces/content players: Shopee, Lazada, HomePro

## First 30-Day Action Plan

### Week 1: Technical Indexing Foundation

1. Add canonical host/protocol redirects.
2. Fix per-page canonical metadata.
3. Expand sitemap to all intended indexable public pages.
4. Revisit AI crawler rules in `robots.txt`.
5. Set up Google Search Console and submit sitemap.
6. Set up GA4 and decide final conversion events later.

### Week 2: Homepage and Portfolio SEO Cleanup

1. Reduce homepage to one H1.
2. Shorten portfolio detail title templates.
3. Remove unverified review/rating schema.
4. Fix "ทั่วประเทศ" copy to real service areas.
5. Audit portfolio data quality: dimensions, location, material, system type, images, and alt text.

### Week 3: Service and Local SEO Architecture

1. Create or optimize one core service page for `กันสาดพับเก็บได้`.
2. Create or optimize one support page for `กันสาดพับไฟฟ้า`.
3. Build a location strategy that avoids doorway pages:
   - start with a strong service area page
   - only create city pages when there is real project proof/content for that province
4. Add LocalBusiness + Service schema with Thai service areas.

### Week 4: Content and AI SEO System

1. Build keyword-to-page map.
2. Create content briefs for:
   - price/range explanation
   - manual vs electric awning
   - retractable awning for restaurants/cafes
   - retractable awning for homes
   - maintenance/warranty
3. Add AI SEO guardrails:
   - answer direct questions clearly
   - cite real project proof
   - avoid filler content and doorway pages
   - no backlink spam

## Recommended Next Implementation PRD

Create a PRD for: **Technical SEO Foundation Cleanup**.

Scope:

- Canonical redirects
- Canonical metadata helper
- Sitemap expansion
- Robots policy update
- H1 normalization on homepage
- Remove unverified review schema
- Correct contact/service area metadata

Out of scope:

- Full conversion system
- Programmatic location pages
- New blog/content production
- Design overhaul

## Open Questions

1. What is the preferred canonical brand/domain: `https://www.siamrooftech.com`? Current code assumes yes.
2. Are review count `127` and rating `4.8` verifiable and visible somewhere public?
3. What exact warranty terms can be published?
4. Which project/customer logos can legally be shown as proof?
5. Should AI crawlers be allowed for public pages, or does the business prefer strict AI bot blocking despite AI SEO goals?
