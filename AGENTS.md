# Siamrooftech repository rules

## Product and stack

This is an SEO-focused public website and private CMS. The app uses Next.js 15 App Router, TypeScript, Better Auth, Cloudflare D1, Drizzle, R2, and OpenNext. The LINE chat-history Worker is a separate service with its own database and access tokens.

Use `yarn` for package management. Run `yarn type-check`, `yarn lint`, and relevant tests for code changes. Use `yarn db:migrate:local` and `yarn db:seed:local` for local data; `yarn cf:preview` provides the complete local CMS with real email OTP delivery. Production deploy commands require an explicit request. Never expose environment values in output.

## Architecture and reuse

- Follow typed contract → pure domain policy → runtime adapter → thin route/UI composition. Keep SQL and Cloudflare bindings under server-owned data adapters; validate external JSON at runtime.
- Before adding UI, find its owner. Reuse in this order: theme tokens → server-safe primitive → reusable site pattern → feature composition. Use `site-*` tokens, primitives under `src/components/ui/public`, and cross-site patterns under `src/components/site`; keep feature composition with its feature and avoid duplicate components.
- Public pages must render useful content in initial HTML using server rendering, SSG, or ISR. Keep client boundaries limited to those listed in `docs/design-system/PUBLIC_CLIENT_BOUNDARIES.md`.
- Admin UI may use client components. The browser uses same-origin APIs and HttpOnly session cookies; it never connects to D1 or R2 directly.
- Admin registration and sign-in use email OTP through `src/features/auth/`. Only server-configured `ADMIN_ALLOWED_EMAILS` may self-register; grant admin access after verified mailbox ownership. Never enable unrestricted signup, trust browser-supplied roles, log OTPs, or bypass verification in local/staging. Protect state-changing APIs against cross-site requests. CLI user tools are optional maintenance, not an onboarding requirement.
- Local, staging, and production are deployment environments, not per-record content attributes. Local data and bindings must never silently connect to remote resources.
- CI/CD is the only supported Worker deployment path. The default `cf:deploy` command is intentionally disabled; keep deploy credentials in GitHub Environments and never create local shortcuts around required checks or production review.
- Keep CMS-backed public routes runtime-rendered from the selected environment. A database/query failure must return an error, never a successful empty listing or sitemap. Release artifacts must not contain local CMS/QA records.
- Staging must use its own D1/R2/cache resources, Cloudflare Access, a staging canonical origin, `X-Robots-Tag: noindex`, and a disallow-all robots policy. Do not route staging publicly until Access is verified.
- Production config remains blocked until production resources and content parity are verified. Code rollback does not roll back D1, R2, or Durable Object lifecycle changes; do not restore a database automatically.

## SEO and page lifecycle

- For every created, renamed, removed, or republished public page, update `docs/seo-system/site-page-plan.md`, the sitemap source, canonical/structured-data URLs, breadcrumbs, and internal links. Only real published, indexable canonical pages belong in the sitemap.
- Do not create redirects for renamed or removed URLs unless the user explicitly authorizes a specific old URL and equivalent destination in the current task. Retired and unknown URLs return a real 404 without `Location`, rewrite, meta refresh, or client navigation. Do not add URLs solely to insert keywords.
- Before publication, check meaningful content, HTTP status, initial HTML, title/description, H1, canonical, robots, structured data, incoming internal links, and sitemap eligibility. A 200 response or source code alone does not prove indexation.
- Choose SEO QA by blast radius: focused for a few existing-template pages, template for shared rendering/metadata/navigation, and site-wide for bulk URL/indexing/sitemap changes. Use `technical-seo-audit`; route media work to `media-seo` and performance work to `core-web-vitals-audit` when relevant.
- Keep `lastmod` tied to a known substantial content change. Local results do not establish production behavior or search-engine indexing.

## Public UI and contact

- Follow `docs/design-system/PUBLIC_UI_DESIGN.md` and `docs/design-system/PROJECT_UI_DESIGN.md`. Public colors, typography, radius, shadows, and motion belong in `site-*` tokens or named variants. Sarabun is the shared body font; Sukhumvit is for semantic headings and titles across public pages and admin. Keep font loading in the root layout, use the shared font tokens, and do not duplicate `@font-face` declarations. Public rounded surfaces use 4px; fully round only intentional pills/circles. Preserve admin visual tokens and component styling.
- Use Phosphor through the public icon owner for public controls. Keep icons accessible and decorative icons hidden from assistive technology.
- `src/features/line-contact/` owns the canonical contact destination, analytics, and lead-intake behavior. Read its nested rules before changing those flows. Outside that feature import its canonical URL; preserve a native contact handoff without waiting for analytics or API work.

## Content and security

- `src/features/projects/` and `src/features/articles/` own their validators, publication policy, and repositories. Save drafts separately from public snapshots. Public routes, metadata, related lists, and sitemap read published records only.
- Use revision checks for editorial mutations. Publishing and unpublishing must update the live snapshot, route reservation, and cache invalidation coherently. A failed invalidation must be observable and recoverable.
- Store uploads in R2 through authenticated same-origin handlers. Validate type, size, and path; never report temporary browser blobs as persistent media.
- Keep secrets out of code, arguments, fixtures, docs, logs, and committed env files. `.dev.vars.example` contains placeholders only; local secrets stay in ignored `.dev.vars`.
- Do not send external messages, publish, deploy, or change remote services unless the user explicitly asks.

## Verification

Use the smallest relevant checks first, then run the required checks for the affected blast radius. For platform/content changes use `yarn test:admin`, `yarn test:articles`, `yarn db:test:local`, `yarn type-check`, `yarn build`, and `yarn cf:build` as applicable. For UI use `yarn ui:qa`; for contact use `yarn line-contact:qa`; for page changes use `yarn seo:qa` against a running local server. Report the exact environment, tested behavior, failures, and unavailable production/GSC evidence.
