# Cloudflare CMS migration: local implementation report

Updated: 2026-10-06 · Status: local implementation and Worker preview verified; production cutover not performed.

## Runtime ownership

The application uses Next.js 15 with OpenNext on Cloudflare Workers. Better Auth owns email OTP registration, authentication, and sessions, D1 `APP_DB` stores auth and CMS data, Drizzle owns typed schema and reviewed migrations, and R2 stores uploaded media and OpenNext incremental cache. OpenNext's Durable Object queue and D1 tag cache support cache coordination. The LINE history Worker continues to own its separate database.

Public pages read only validated publication snapshots. Admin edits write private drafts; explicit publish and unpublish actions update public visibility, route reservation, sitemap, and cache tags. Project IDs and existing media references are preserved; the local import contains 16 projects and 67 image records. Article authoring uses the document editor and supports heading-only drafts, private preview, publication, and TOC generation from stored headings.

Accounts are created through the admin email OTP form after verified ownership of a server-approved mailbox. Unrestricted signup is disabled. API authorization verifies the server session and persisted administrator role; write requests also validate same-origin headers. CLI user tools remain optional legacy maintenance. See `docs/security/admin-access.md`.

Authentication rate limiting trusts only Cloudflare's `cf-connecting-ip` header for client identity. Wrangler's local proxy may not synthesize this header and can warn that it uses one shared per-route bucket; verify per-client throttling on the provisioned Worker before production cutover.

## Local setup

Requirements: the pinned Yarn version in `package.json`, Node.js, and Wrangler. From the repository root:

```sh
cp .dev.vars.example .dev.vars
# Set BETTER_AUTH_SECRET to a fresh random value of at least 32 characters.
# Set BETTER_AUTH_URL=http://localhost:3000.
yarn install --frozen-lockfile
yarn db:migrate:local
yarn db:migrate:cache:local
yarn db:seed:local
# Configure ADMIN_ALLOWED_EMAILS and the AUTH_EMAIL binding.
# Register/sign in through the email OTP form on /admin/articles.
yarn dev
```

Administrative registration and sign-in use the email OTP form after server configuration. CLI commands below are optional legacy maintenance. `.dev.vars` and Wrangler local state are ignored local files. Startup does not migrate or seed. D1/R2 stay local during local testing; only the configured email transport uses real remote delivery. See `docs/security/admin-access.md`.

Useful local commands:

```sh
yarn admin:user:inspect --email admin@example.com
yarn admin:user:grant --email admin@example.com --apply
yarn admin:user:revoke --email admin@example.com --apply
yarn admin:user:reset-password --email admin@example.com --apply
yarn db:inspect:local
yarn db:test:local
yarn test:admin
yarn test:admin:local
yarn test:articles
yarn cms:qa:local
yarn cf:build
yarn cf:preview
```

Use `yarn cf:preview` to test the built Worker in local workerd. OpenNext currently warns that its internal Durable Object binding is not available through Wrangler's local binding proxy. The generated Worker exports the queue class, preview starts, and the local publishing integration test passes; treat this warning as a local-proxy limitation and recheck Cloudflare runtime behavior after infrastructure is provisioned.

## Verified local behavior

Verification completed on 2026-10-06:

- `yarn type-check` passes.
- `yarn test:admin` passes 9 unit cases; `yarn test:admin:local` passes sign-in, persisted administrator role, and signup refusal against local D1.
- `yarn test:articles` passes 14 cases; `yarn db:test:local` passes import parity, draft isolation, publication visibility, route retention, and batch rollback.
- `yarn cms:qa:local` passes against both Next dev and the OpenNext Worker preview on port 3000: admin session, draft privacy, preview, save, publish, immediate page and sitemap freshness, duplicate-slug rejection, stale revision rejection, and unpublish returning a true 404.
- `yarn cf:build` succeeds and produces `.open-next/worker.js`. CMS detail routes use on-demand server rendering with ISR caching instead of reading editorial content during deployment builds; this keeps publishing independent from code deployment and removes build-time CMS read failures. Static generation is bounded to two parallel routes for stable local D1 reads.
- `yarn seo:qa --base=http://127.0.0.1:3000 --host=www.siamrooftech.com` passes against Worker preview, including all 16 published project URLs in the sitemap, detail-page canonical/schema checks, old project paths returning 404 without `Location`, and public page metadata checks.
- Direct Worker-preview requests returned 200 for home, project index/detail, and article listing; unpublished/unknown article and project paths returned 404 without redirects. The Ads query rewrite reached the intended landing page.
- `yarn ads:browser-qa` passes against the built Worker; its event assertions support both GTM event objects and the GA event-argument format used by `sendGAEvent`. The public measurement ID is forwarded from Wrangler config at build time, with environment override support.
- `yarn ui:qa` and `yarn line-contact:qa` pass. `yarn lint` reports three existing admin `<img>` warnings in project and image-upload components.

## Environment boundary and remaining work

These results prove local D1/R2 and Worker-preview behavior only. After the local migration, isolated staging CMS/cache D1 databases and media/cache R2 buckets were created, and the reviewed schema migrations were applied to staging. No production resource, secret, domain, deployment, or external content was changed. Production resources and secrets still need explicit provisioning, administrator creation, source-data parity checks, staging verification, and an authorized cutover. See [staging and cutover readiness](./staging-cutover-readiness-2026-10-06.md) for the read-only production inventory and gates. Keep the current public asset URLs until any future asset move has verified access, content type, and checksums. Local QA does not establish production behavior or search-engine indexing.

Do not combine content states with code environments. A draft and a published snapshot are editorial states inside an environment; local, staging, and production are separate runtime/database environments.

## Architecture references

- [Better Auth database concepts](https://better-auth.com/docs/concepts/database)
- [Better Auth admin plugin](https://better-auth.com/docs/plugins/admin)
- [Drizzle D1](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [OpenNext Cloudflare bindings](https://opennext.js.org/cloudflare/bindings)
- [OpenNext Cloudflare caching](https://opennext.js.org/cloudflare/caching)
- [OpenNext supported features](https://opennext.js.org/cloudflare)
