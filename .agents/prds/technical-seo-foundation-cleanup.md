# PRD: Technical SEO Foundation Cleanup

## Problem Statement

Siamrooftech needs to build an SEO system for ranking on commercially important retractable awning queries, especially `กันสาดพับเก็บได้` and `กันสาดพับไฟฟ้า`. The current site has enough portfolio proof and Next.js SEO infrastructure to start, but the technical foundation has issues that can dilute ranking signals before content or automation work begins.

The user needs the public website to send clear crawl, indexation, canonical, and semantic signals to Google and other search systems. Right now, non-canonical host/protocol variants return 200, several public pages inherit the homepage canonical, the sitemap omits important indexable pages, robots.txt blocks AI crawlers despite AI SEO goals, the homepage has multiple H1s, portfolio detail metadata is too long, and some structured data claims are not yet verified.

If this is not fixed first, future SEO agent work may create content on top of a shaky foundation and produce unreliable ranking results.

## Solution

Implement a focused technical SEO cleanup that makes the website production-ready for organic search baseline work.

The site should have one canonical host, correct per-page canonicals, complete sitemap coverage for intended indexable public pages, an intentional robots policy, clean heading hierarchy on key SEO pages, truthful structured data, and service-area metadata aligned with the business strategy.

This PRD covers only foundational SEO fixes. It does not create new content at scale, design a conversion system, or implement programmatic location pages.

## User Stories

1. As the business owner, I want every domain/protocol variant to redirect to the canonical website, so that search engines consolidate ranking signals.
2. As the business owner, I want `https://www.siamrooftech.com` to be the single canonical host, so that duplicate host indexing does not split SEO value.
3. As a Google crawler, I want the homepage to return a self-consistent canonical URL, so that I understand the preferred version of the root page.
4. As a Google crawler, I want `/contact` to have its own canonical URL, so that it is not treated as a duplicate of the homepage.
5. As a Google crawler, I want `/articles` to have its own canonical URL, so that article index content can be crawled and indexed correctly.
6. As a Google crawler, I want `/allawning` either to have its own canonical URL or be intentionally noindexed/redirected, so that the page does not accidentally compete with the homepage.
7. As a Google crawler, I want portfolio pages to preserve their self-referencing canonicals, so that real project proof can rank and support topical authority.
8. As a search engine, I want the sitemap to include all intended public indexable pages, so that crawl discovery is reliable.
9. As a search engine, I want the sitemap to exclude non-canonical or thin pages, so that crawl budget is not wasted.
10. As the business owner, I want published article pages included in the sitemap, so that educational SEO content can be discovered.
11. As the business owner, I want portfolio detail pages included in the sitemap, so that real installation proof supports SEO.
12. As the business owner, I want service-area and contact pages included only when they are intended to rank, so that the sitemap reflects the real SEO strategy.
13. As an AI search crawler, I need an intentional robots policy, so that Siamrooftech either permits or deliberately blocks AI visibility.
14. As the business owner, I want public marketing pages available to reputable AI crawlers if AI SEO is part of the strategy, so that future AI search visibility work is not self-blocked.
15. As the business owner, I want private/admin/API routes blocked from all crawlers, so that operational surfaces are not indexed.
16. As a search engine, I want one clear homepage H1 around the money keyword, so that the main page topic is unambiguous.
17. As a visitor, I want section headings to be semantically structured, so that the page reads clearly and accessibly.
18. As the business owner, I want portfolio detail titles to be concise and natural, so that search snippets are compelling instead of mechanical.
19. As a search engine user, I want portfolio snippets to clearly show the customer type or site context, so that I know whether the example is relevant to me.
20. As the business owner, I want unverified rating/review structured data removed until proof is available, so that the site avoids trust and rich-result policy risk.
21. As a search engine, I want LocalBusiness and Service schema to contain accurate service-area information, so that local relevance matches the real business footprint.
22. As a qualified buyer, I want the contact page to describe the real service area, so that I do not assume nationwide installation if that is not the target.
23. As the business owner, I want copy to avoid attracting contractor-pass-through jobs, so that SEO lead quality matches the anti-persona.
24. As an SEO operator, I want reusable metadata patterns, so that future public pages do not accidentally inherit homepage canonicals.
25. As a developer, I want tests or checks around metadata output, so that regressions are caught before deployment.
26. As a developer, I want sitemap generation to handle Firestore failures safely, so that a transient data issue does not break crawl discovery for static pages.
27. As a developer, I want public SEO output validated without relying only on implementation details, so that tests reflect what crawlers actually see.
28. As the business owner, I want this cleanup done before daily SEO automation, so that future automated tasks work from a trustworthy baseline.
29. As an SEO agent, I want guardrails documented in the repo, so that I do not create doorway pages, spam pages, or pages targeting unwanted contractor work.
30. As the business owner, I want the cleanup to preserve SSG/ISR behavior, so that public pages stay SEO-first and performant.

## Implementation Decisions

- Use `https://www.siamrooftech.com` as the assumed canonical host unless the business explicitly changes it.
- Implement canonical host/protocol redirect behavior at the edge/platform level when possible. If platform redirects are not available, use the highest available request-routing layer.
- Remove global homepage canonical behavior from shared root metadata if it causes child routes to inherit the homepage canonical.
- Use a shared metadata convention/helper for canonical URLs so every indexable public route declares the correct canonical.
- Add or correct route-level metadata for contact, articles, all-awning, portfolio, article detail, and other public SEO routes.
- Decide the SEO role of `/allawning`: either keep as an indexable portfolio/support page with unique metadata or consolidate it into `/portfolio`/homepage to avoid duplicate intent.
- Expand sitemap generation to include static public pages, portfolio detail pages, published article pages, and only value-bearing category/service pages.
- Keep sitemap generation resilient: static URLs should still be returned if Firestore project or article fetches fail.
- Keep `/admin`, `/api`, private, static internals, and operational routes disallowed in robots.
- Replace blanket AI crawler blocking with an intentional policy. Recommended default for this SEO strategy is to allow reputable AI crawlers on public marketing pages while still blocking private/operational routes.
- Normalize homepage heading hierarchy to one H1. Section headings should use H2/H3 while preserving the visual design.
- Shorten portfolio detail metadata patterns so titles focus on the page’s ranking intent and user relevance, while descriptions carry dimensions/material/system detail.
- Remove aggregate rating and review schema unless the rating/review data is verified and visible on the public page.
- Correct contact/service-area copy to Bangkok and nearby provinces: กรุงเทพ, นครปฐม, นนทบุรี, ปทุมธานี, สมุทรปราการ, อยุธยา, สมุทรสาคร.
- Preserve the project’s SEO-first rule: public pages should remain server-rendered through SSG/ISR where possible.
- Do not refactor all public client components in this PRD. Flag them for a later performance/client-island PRD unless a small change is necessary for this cleanup.

## Testing Decisions

- Tests should validate crawler-observable behavior rather than component internals.
- Add metadata tests or route-level checks that assert canonical URLs for homepage, contact, articles, all-awning, portfolio, and representative detail pages.
- Add sitemap tests that assert required static URLs are included and non-indexable routes are excluded.
- Add robots tests that assert admin/API/private routes are blocked and public pages are crawlable according to the chosen AI crawler policy.
- Add a rendered HTML check for homepage H1 count, expecting exactly one H1.
- Add a rendered HTML or metadata check for representative portfolio detail pages, ensuring title/description lengths stay within agreed limits.
- Add a schema validation smoke test for homepage JSON-LD to ensure Organization/LocalBusiness/Service data is parseable JSON and does not include unverified ratings unless explicitly enabled.
- Add regression coverage around Firestore fetch failure behavior for sitemap generation, ensuring static sitemap entries still render.
- Existing test seams should be preferred: Next route metadata functions, sitemap/robots functions, and rendered HTML snapshots or lightweight integration checks.
- If no current route test harness exists, create the smallest seam possible around pure metadata/sitemap/robots functions before introducing heavier browser tests.
- Manual verification after implementation should include live checks for:
  - canonical redirects
  - `/robots.txt`
  - `/sitemap.xml`
  - page source metadata
  - JSON-LD parseability

## Out of Scope

- Full conversion system design.
- GA4 conversion event architecture beyond keeping the site ready for analytics.
- Google Search Console account setup steps inside code.
- Google Business Profile setup.
- New blog/content production.
- Programmatic SEO or mass location page creation.
- Backlink building.
- Full client-component/performance refactor.
- Design overhaul.
- Rewriting all portfolio content.
- Adding unverified customer logos, ratings, or testimonials.

## Further Notes

- This work should happen before daily SEO automation.
- The anti-persona is explicit: do not target work passed through by other contractors.
- The content strategy should remain focused on real buyer intent around `กันสาดพับเก็บได้` and `กันสาดพับไฟฟ้า`.
- Location SEO must avoid doorway pages. Location-specific pages should only be created when there is real local proof, project data, or useful local content.
- PageSpeed Insights API was unavailable during baseline audit due to quota exhaustion, so Core Web Vitals should be measured later via Search Console or Lighthouse once available.
- Issue tracker publishing is pending repo agent setup. The repo has a GitHub remote, but no `docs/agents/issue-tracker.md` configuration exists yet.
