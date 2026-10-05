# Public UI Design System

This is the source of truth for reusable UI on public routes. It does not replace the admin shadcn API or the LINE contact contract.

## Ownership ladder

1. `src/app/globals.css` owns `site-*` color, typography, spacing, radius, shadow, and motion tokens.
2. `src/components/ui/public` owns server-safe primitives such as `PublicContainer`, `PublicHeading`, `PublicCard`, `PublicBadge`, `PublicActionLink`, `PublicButton`, and `PublicSkeleton`.
3. `src/components/site` owns cross-page patterns such as breadcrumbs, navigation, footer, final CTA, and article presentation.
4. A feature owns composition and data mapping. It does not duplicate a shared primitive or fetch data inside a shared component.

## Theme

Use `site-background` (`#f8fafc`), `site-surface` (`#fff`), `site-ink` (`#0f172a`), `site-muted` (`#64748b`), `site-border` (`#e2e8f0`), `site-brand` (`#2563eb`), `site-brand-strong` (`#1d4ed8`), `site-sky` (`#0284c7`), and the named focus, subtle, LINE, radius, and shadow tokens for public UI. Legacy gray, slate, neutral, blue, and sky palette utilities are bridged to these values only under `[data-site-theme]`. Keep the Sukhumvit fonts and existing container widths. Do not change shadcn tokens used by admin.

`heading-display`, `heading-section`, `heading-card`, `heading-panel`, `eyebrow`, `body-lead`, `body-copy`, and `article-content` are the shared typography recipes. Article renderer and data formats remain feature-owned.

## Variants

Public actions support `brand`, `outline`, `quiet`, and `line` appearances with `default`, `compact`, and `landing` sizes. Cards support `default`, `interactive`, `compact`, and `landing` variants. Headings support `display`, `section`, and `panel`. Use Phosphor icons from `@phosphor-icons/react/dist/ssr` through `PublicIcon` for public controls. `PublicIcon` accepts 16, 20, and 24 pixel sizes, uses regular weight and `currentColor` by default. Keep LINE logos and other brand assets unchanged. A page may extend layout with `className`; it should not override these visual decisions with raw colors or one-off typography.

## Accessibility and rendering

- Use native links and buttons. Every interactive element needs a visible focus state and an accessible name.
- Keep landmarks and heading hierarchy semantic.
- Public primitives remain Server Component compatible. Client behavior is an explicit pattern-level exception.
- Existing client boundaries are tracked in public site patterns and feature UI such as navigation, project filters, gallery/video controls, and LINE controls; do not add client boundaries to static public pages for visual styling.
- Article headings and future TOC anchors must be generated from the same content model; this document does not define the TOC implementation.

## Migration rule

When moving an existing component, preserve its public behavior and content first. Consolidate duplicated styles only after all consumers are identified. Keep compatibility exports temporarily when removing an old import would expand the change unnecessarily.
