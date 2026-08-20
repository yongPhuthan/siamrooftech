# Measurement + Conversion Tracking Spec

## Scope

This spec defines what must be measured before daily SEO operations become data-driven. It does not require immediate access to Google accounts, but it defines the implementation target.

## Required Tools

- Google Search Console
- GA4
- Google Business Profile
- Optional: Looker Studio or a simple exported CSV dashboard

## GSC Setup Checklist

- Verify `https://www.siamrooftech.com` as the canonical property.
- Submit `https://www.siamrooftech.com/sitemap.xml`.
- Inspect all service pages after deployment.
- Confirm service pages are indexed or queued for indexing.
- Export query/page data weekly after the first impression data appears.

## GA4 Setup Checklist

- Install GA4 on public pages without forcing public pages into client rendering.
- Mark LINE, phone, and form submit events as key events.
- Preserve `page_path`, `service`, `location`, and CTA `position` as event parameters.
- Exclude admin traffic where possible.
- Confirm events appear in DebugView before treating reports as reliable.

## Conversion Events

| Event | Trigger | Parameters | Priority |
|---|---|---|---|
| `generate_lead_line_click` | User clicks LINE CTA | `page_path`, `position`, `service`, `location` | P0 |
| `generate_lead_phone_click` | User clicks phone link | `page_path`, `position`, `phone_number`, `service`, `location` | P0 |
| `generate_lead_form_submit` | Contact/quote form submitted | `page_path`, `service`, `location`, `customer_type` | P0 |
| `view_service_page` | Service/local page view | `service`, `location`, `page_path` | P1 |
| `portfolio_proof_click` | Service page proof card clicked | `source_page`, `target_project`, `service`, `location` | P1 |
| `service_internal_link_click` | Portfolio detail service link clicked | `source_project`, `target_service`, `location` | P1 |

## URL Classification

| URL pattern | Page group | Service | Location |
|---|---|---|---|
| `/services/retractable-awning` | service | retractable_awning | none |
| `/services/electric-retractable-awning` | service | electric_retractable_awning | none |
| `/services/retractable-awning/bangkok` | local_service | retractable_awning | bangkok |
| `/services/retractable-awning/nonthaburi` | local_service | retractable_awning | nonthaburi |
| `/services/retractable-awning/pathum-thani` | local_service | retractable_awning | pathum_thani |
| `/portfolio/*` | portfolio_proof | inferred_from_project | inferred_from_project |
| `/articles/*` | article | inferred_from_links | none |

## GSC Review Segments

Review search performance by:

- Brand vs non-brand
- Service pages vs local pages vs articles vs portfolio
- Query intent: service, local, price, comparison, problem, informational
- Device: mobile vs desktop
- Location where available

## Minimum Dashboard

Weekly report fields:

- Organic clicks to service pages
- Organic impressions for primary money queries
- Average CTR by service page
- Average position by primary query
- LINE clicks from organic landing pages
- Phone clicks from organic landing pages
- Top 10 rising queries
- Top 10 declining queries
- Pages with impressions but low CTR

## Decision Rules

- If a service page has impressions but CTR below 2 percent for 4 weeks, review title/meta and SERP intent.
- If a local page has no impressions after indexing for 8 weeks, do not create more local pages. Add proof/internal links first.
- If an article gets traffic but no service-page clicks, add or revise contextual CTAs.
- If portfolio pages rank for service queries, add stronger service-page links and proof blocks.

## Done Criteria

Measurement setup is ready when:

- GSC property is verified.
- GA4 is installed.
- LINE and phone clicks are tracked as conversion events.
- Service pages and portfolio pages are classified in reporting.
- The weekly report can be produced without manual interpretation of raw URLs.
