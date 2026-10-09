# Cloudflare CMS staging and cutover readiness

Reviewed: 2026-10-06 (Asia/Bangkok)
Scope: read-only production and Cloudflare account inventory, plus isolated staging schema/storage setup after local CMS migration. No production resources, secrets, production data, DNS, or deployments were changed.

## Decision

The local migration is not ready for production cutover. Production still serves the old public URL structure, while this checkout has the new `/projects` routes and local D1/R2 implementation. Dedicated staging D1/R2 resources now exist with the 16-project baseline. The staging Worker and owner email authentication are not yet configured/deployed. Reconcile the source-of-truth content inventory and verify the deployed staging migration before cutover. Keep production traffic and storage untouched until staging passes.

## Observed production state

The following public read-only requests succeeded on 2026-10-06 around 16:10 ICT (09:10 UTC):

| Check | Observation |
| --- | --- |
| `https://www.siamrooftech.com/robots.txt` | HTTP 200; sitemap points to `https://www.siamrooftech.com/sitemap.xml` |
| `https://www.siamrooftech.com/sitemap.xml` | HTTP 200; 33 URLs |
| Public portfolio detail routes in sitemap | 16 under `/portfolio/{legacy-id}` |
| Other retired portfolio paths in sitemap | `/portfolio`, six `/portfolio/category/*` pages, `/works`, and `/allawning` (25 legacy portfolio URLs total including the 16 details) |
| Article detail routes in sitemap | 0; `/articles` index is present |
| `/projects` | HTTP 404, no `Location` header |
| `/portfolio`, `/works`, `/allawning`, `/articles` | HTTP 200 |

Most sampled portfolio details returned 200. Three detail URLs returned Cloudflare 503 `Worker exceeded resource limits` during the same scan: `/portfolio/5-6x2-728032`, `/portfolio/4-5x2.5-854715`, and `/portfolio/5-3x2.5-192907`. Repeated checks for those URLs also returned 503. A later request to the sitemap timed out without a response. Treat these as production availability findings that need a fresh check before cutover; a single sitemap snapshot does not prove every public page is healthy.

Route response snapshot from that sitemap scan:

| Public detail URL | Response |
| --- | --- |
| `/portfolio/5x2-520680` | 200 |
| `/portfolio/4-5x2-860430` | 200 |
| `/portfolio/3-5x1.5-744861` | 200 |
| `/portfolio/5x2-5-351507` | 200 |
| `/portfolio/4-5x2-542650` | 200 |
| `/portfolio/5x2-767881` | 200 |
| `/portfolio/2x1-5-326707` | 200 |
| `/portfolio/4-7x2.5-886205` | 200 |
| `/portfolio/2x1-5-368997` | 200 |
| `/portfolio/2-6x2-881761` | 200 |
| `/portfolio/3x2-204672` | 200 |
| `/portfolio/5-7x2.5-290684` | 200 |
| `/portfolio/5x2-5-472465` | 200 |
| `/portfolio/5-6x2-728032` | 503 |
| `/portfolio/4-5x2.5-854715` | 503 |
| `/portfolio/5-3x2.5-192907` | 503 |

The current production sitemap therefore does not represent the local route policy. Do not remove legacy public paths or point production at the new sitemap until the staging and cutover gates below pass.

## Data inventory and parity

| Data area | Local evidence | Production evidence | Status |
| --- | --- | --- | --- |
| Published projects | `src/data/projects.ts` contains 16 projects and 67 image records (201 thumbnail/medium/original URL references). The 2026-10-06 local baseline is now seeded into staging D1 as published content. | Sitemap contains 16 portfolio detail routes. | Staging matches all 16 local IDs, paths, content hashes, and image-record counts. This still does not prove parity with the live source database or capture later production edits. |
| Project media | All local image references use `assets.siamrooftech.com`; 67 image records / 201 thumbnail, medium, and original URL references are stored with the project payloads in staging D1. | Public project pages reference the same site asset domain in the current application data. | URLs are preserved; no image blobs were copied to staging R2. The bucket object inventory, checksums, and all variant responses have not been verified. |
| Published articles | Local D1 was empty at the end of the local QA run. | Sitemap and article index expose no `/articles/{slug}` detail routes. | No public article details observed; this does not prove there are no drafts or unpublished records. |
| Drafts and revisions | Local test data was removed after QA. | Not publicly discoverable. | Unknown; requires a source database export or authorized source-console inventory. |
| Admin users and roles | Local test users were removed after QA. | Not publicly discoverable. | Unknown; requires a source Auth user/role inventory and an explicit account migration/reset plan. |
| Other unpublished projects | Local seed source covers 16 public projects. | Not discoverable from the sitemap. | Unknown until source export is reconciled. |

No source CMS/auth export or source database dump was found among the inspected repository artifacts. The deployed public site can provide a published-page inventory only; it cannot reveal private drafts, account roles, or all media object metadata. Do not treat the 16-record local seed as a complete production export until source-of-truth parity is checked.

## Cloudflare resource inventory

Read-only Wrangler checks used the configured Siamrooftech account. The site Worker `siamrooftech` exists; the latest deployment listed by Wrangler was created on 2026-09-18. No deployment or secret change was made.

Before staging setup, the account-visible D1 list contained `siamrooftech-line-chat`, `siamrooftech-line-chat-staging`, and an unrelated DoubleDoors staging database; it contained no CMS database. The D1 names in the root `wrangler.jsonc` (`siamrooftech-cms-local` and `siamrooftech-cache-local`, with local placeholder IDs) remain local-development bindings.

R2 bucket listing shows an existing `siamrooftech` bucket and separate LINE chat-media buckets. It does not show the root config's `siamrooftech-media` or `siamrooftech-opennext-cache` buckets. The existing `siamrooftech` bucket may hold live assets; do not rename, reuse, or delete it until its ownership, custom domain, and object inventory are confirmed. Wrangler's bucket listing did not reveal object-level counts or contents.

Dedicated staging resources were created in the Siamrooftech Cloudflare account and bound in `wrangler.jsonc` under `env.staging`:

| Resource | Name | ID/status |
| --- | --- | --- |
| CMS D1 | `siamrooftech-cms-staging` | `9a9be19b-990c-4e3b-bdae-fa5d9ba73716`; migrations `0000_cms_auth.sql` and `0001_contact_rate_limits.sql` applied; 16 published project records seeded |
| OpenNext tag-cache D1 | `siamrooftech-cache-staging` | `4332fbf7-cfb6-417a-8963-099d6ab726ba`; migration `0000_tag_cache.sql` applied |
| Upload/media R2 | `siamrooftech-media-staging` | created; no project media blobs copied; object-level verification pending |
| OpenNext incremental-cache R2 | `siamrooftech-opennext-cache-staging` | created; empty pending deployment |

No Worker was deployed, and no staging admin account or secret was added. The 16-project local baseline was imported explicitly into the staging CMS D1 with `yarn db:seed:staging`. That command is limited to the fixed staging Worker/database identity, requires the staging target and apply flag, refuses to overwrite records whose path or content hashes differ, and verifies published rows and media-record counts after import. A second run verified idempotency and imported zero additional projects. The optional legacy admin account CLI remains local-only. Email OTP self-registration is now implemented for server-approved mailboxes; staging still needs migration `0002_auth_otp.sql`, owner-email configuration, auth secret/origin, and a deployed Worker before it can be used there. Real-owner email delivery is pending mailbox confirmation.

The staging Worker build must not embed the production GA4 ID. `next.config.mjs` now reads Wrangler vars for `CMS_BUILD_ENV`, and `cf:build:staging` selects the staging public variables while building against the normal local D1 emulator. This is separate from Wrangler's `CLOUDFLARE_ENV`, which selects the runtime D1 proxy. Staging has no LINE history Worker URL configured, so admin LINE proxies and lead intake stay disconnected from production. `workers_dev` is disabled for staging and no route is configured, so an accidental deploy is blocked until a protected staging hostname is deliberately configured.

Build verification: `yarn cf:build:staging` succeeds after preparing the local staging emulator with local-only migrations. The generated browser assets contain no production GA4 measurement ID. `yarn type-check`, Wrangler staging type generation, and `git diff --check` pass. OpenNext prints the existing internal Durable Object local-proxy warning and the existing three admin `<img>` lint warnings. This verifies a build only; it does not prove the deployed staging Worker or remote bindings work.

## Staging gates

1. Obtain a source-of-truth export/inventory for projects, article drafts and publications, admin users/roles, route history, and media object keys. Record export time, counts, and a checksum manifest. Keep credentials and exports outside Git.
2. Reconcile every production project ID and media reference against the 16 local projects. Investigate missing/extra records, unpublished projects, and any content changed after the local seed was created. Decide whether admin accounts are recreated with password resets or migrated through a supported credential flow.
3. Dedicated staging D1/R2 resources and bindings now exist. Before deployment, configure a staging hostname behind an access policy, set staging-specific canonical/robots behavior, and verify every binding—including the Worker self-reference—resolves only to staging. Current SEO metadata points at production and allows indexing, so deploying the current build to a public staging hostname is blocked.
4. Configure distinct staging secrets through Cloudflare's secret mechanism, including a staging-only Better Auth secret and approved callback/origin values. Do not place secret values in `wrangler.jsonc`, `.env.example`, or GitHub logs. Verify per-client auth throttling in the deployed staging Worker.
5. Review and apply only versioned Drizzle/D1 migrations to staging; do not use schema push. Configure the approved owner mailbox and email delivery binding, apply the versioned auth OTP migration, and verify owner self-registration/sign-in through the staging web form. No CLI account provisioning is required for onboarding.
6. Reconcile the seeded project baseline against the source-of-truth export and import any approved differences, articles, and other unpublished content. Keep existing `assets.siamrooftech.com` URLs until object access, content type, and checksums prove that any media copy is complete.
7. Verify staging login and roles, private drafts, previews, publication/unpublication, route reservations, cache invalidation, media upload/read, sitemap, canonical metadata, and 404 behavior for retired paths. Compare all published URLs and records against the source export.
8. Capture a production database/media backup and write a timed cutover/rollback runbook. Cutover requires a separate explicit authorization after staging evidence is reviewed; this document does not authorize production deployment, DNS changes, source shutdown, or sitemap submission.

Cloudflare Wrangler environments create separate Workers. Bindings and environment variables do not inherit, so each environment needs explicit staging bindings. Secrets are environment-specific. D1 changes should use reviewed sequential migrations and preserve an export/backup point before imports.

## Commit boundary

The working tree contains the migration alongside earlier UI/theme, article-editor, SEO, Ads, and LINE work, including edits to the same application files. This readiness report is isolated, but the implementation changes have not been committed because a broad commit would include unrelated work and a path-only staging would capture mixed-purpose file edits. Preserve the existing working tree; create a reviewed migration-only commit once its mixed-file changes are separated.

## Sources

- Cloudflare Wrangler environments: https://developers.cloudflare.com/workers/wrangler/environments/ (checked 2026-10-06)
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/ (checked 2026-10-06)
- Cloudflare D1 import/export: https://developers.cloudflare.com/d1/best-practices/import-export-data/ (checked 2026-10-06)
- Cloudflare Worker secrets: https://developers.cloudflare.com/workers/configuration/secrets/ (checked 2026-10-06)
