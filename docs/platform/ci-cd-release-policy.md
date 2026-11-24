# Safe CI/CD and SEO release policy

Updated 2026-10-09. This document describes the implemented GitHub Actions checks, GitHub protections, and external setup still required. It is not authorization to cut over production.

## Release path

Pull requests run the three required checks: `quality`, `environment-policy`, and `runtime-seo`. `main` requires a PR and up-to-date checks, applies protection to administrators, and blocks force pushes and deletion. Repository Actions enforce full commit-SHA pinning. Staging deployment is conditional on the repository variable `STAGING_DEPLOY_ENABLED=true`. It must be repository-scoped because GitHub evaluates a job-level `if` before attaching the job's environment, so staging Environment variables are unavailable there. `STAGING_ACCESS_READY` remains scoped to the staging environment and is checked after the job starts. A production release is manual and requires the exact main SHA, a successful `staging-deployment` job from the push-to-main run for that same SHA (the release waits for it if it is still running, then confirms staging still serves that SHA instead of rebuilding and redeploying it), a production build manifest, and approval through the existing GitHub `Production` environment.

Production deploy uses the already-built `.open-next` artifact. Its manifest binds the SHA, target, canonical origin, config digest, lockfile digest, migrations checksums, and artifact digest. D1 migrations are a separate manually dispatched workflow that requires an exact database-name confirmation. Local direct deploy commands intentionally fail.

## Target isolation and readiness

| Target | Worker | Origin | Current status |
| --- | --- | --- | --- |
| Local | `siamrooftech-local` | `http://localhost:3000` | Emulator bindings only |
| Staging | `siamrooftech-staging` | `https://staging.siamrooftech.com` | D1/R2 configured; Access and custom hostname must be verified before enabling deploy |
| Production | `siamrooftech` | `https://www.siamrooftech.com` | Isolated D1/R2 resources now exist and are declared; still blocked pending data/media parity, backups, runtime/release secrets, route ownership, and rollback verification |

Production resources created in Cloudflare on 2026-10-09 and kept unbound from live traffic until an approved Worker release:

- D1: `siamrooftech-cms-production` and `siamrooftech-cache-production` (empty at creation, APAC primary location)
- R2: `siamrooftech-media-production` and `siamrooftech-opennext-cache-production` (empty at creation, APAC location)
- The existing Vercel production route remains the current live/recovery route. Resource existence does not establish content or media parity.

GitHub records the latest Production deployments as created by `vercel[bot]` (latest observed 2026-09-08). Keep the current Vercel route available as the live/recovery service while validating Cloudflare staging. A Vercel Preview deployment also ran for PR #1; this does not deploy to production. Do not disable the current Vercel route or route production traffic to the Worker until ownership, data parity, and rollback have been verified.

Check the static contract with `yarn deployment:policy`. To test a specific deploy preflight, use `node scripts/deployment-policy.mjs --target=staging --deploy` after setting `STAGING_ACCESS_READY=true`, or `--target=production --deploy`. The production command must remain blocked until isolated production resources are present. Do not copy staging resource IDs or bucket names to make it pass.

Staging has a custom-host route in Wrangler. Cloudflare has a proxied `staging.siamrooftech.com` DNS record, an Access self-hosted application restricted to the owner email through the existing one-time PIN identity provider, and a separate GitHub service-token policy. An unauthenticated request returned the Access login response; the service token passed Access; and the owner completed browser OTP login. Both authenticated paths reached the originless hostname and returned 522 because the Worker was not deployed. The staging D1 databases and R2 buckets exist and are distinct from production. `STAGING_ACCESS_READY=true` is set in the staging environment. The repository variable `STAGING_DEPLOY_ENABLED=true` is the push-to-main deployment switch. The custom Worker route becomes active after CI deploys the Worker.

## GitHub setup status and remaining work

GitHub setup completed 2026-10-09:

- PR #1 from `codex/seo-safe-cicd` was merged on 2026-10-09. Its `quality`, `environment-policy`, and `runtime-seo` checks passed. The first post-merge run also passed those checks but skipped `staging-deployment`: `STAGING_DEPLOY_ENABLED` had been set as an environment variable, which is unavailable to a job-level `if` condition.
- `main` requires PRs and the three checks above, requires the latest base branch, enforces protections for administrators, disallows force-pushes and deletion, and has no agent bypass.
- The repository requires Actions to be pinned to full commit SHAs.
- GitHub `Production` requires `yongPhuthan` as reviewer, permits the owner to approve their own release, is limited to `main`, and disables administrator bypass.
- GitHub `staging` is limited to `main` and disables administrator bypass. It contains `CLOUDFLARE_ACCOUNT_ID`, `STAGING_ACCESS_READY`, and the `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`, and `CLOUDFLARE_API_TOKEN` secrets. `STAGING_DEPLOY_ENABLED` is set as a repository variable so the job-level gate can read it.

Staging Access and CI credentials are configured. The remaining staging step is merging the gate-scope fix; its push to `main` will run the deployment job. After deployment, replace the temporary account-level bootstrap token with a per-Worker Editor token and verify health/SEO through the staging workflow.

Still required before production can deploy:

1. Reconcile and copy the published project inventory and media from the verified live source to the isolated production resources, then verify counts/checksums and take a private backup. Do not publish an empty production inventory over the live site.
2. Add least-privilege production `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` plus target-specific runtime secrets after parity and backup checks. Keep `PRODUCTION_CUTOVER_READY` unset until the owner verifies data, routing, and rollback readiness.
3. Inspect and disable overlapping automatic deployments only after identifying the live production route and recording the recovery path. Vercel remains the current production/recovery route; its Preview checks are separate from this pipeline.

Do not store database exports, OTPs, drafts, cookies, or backups in GitHub. GitHub Actions environment values are separate from Cloudflare runtime secrets. Do not infer Access, DNS, secret, or data readiness from local files.

The Worker also needs target-specific Cloudflare runtime secrets before CMS/auth/API use: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_ALLOWED_EMAILS`, `REVALIDATION_SECRET_TOKEN`, `GOOGLE_GENAI_API_KEY`, `LEADS_INTAKE_TOKEN`, `CHAT_HISTORY_READ_TOKEN`, and `CHAT_HISTORY_WRITE_TOKEN`. Set `BETTER_AUTH_URL` to the target's exact origin and allow only the owner's verified mailbox in `ADMIN_ALLOWED_EMAILS`. Keep these secrets in Cloudflare, not in the build artifact or GitHub workflow variables.

Do not infer Access, DNS, required reviewer, secret, or build status from local files. Verify each in the actual service before enabling a deploy switch.

## SEO and runtime safeguards

The build selects only `CMS_BUILD_ENV=local|staging|production`; unknown targets fail. The target origin is injected into one shared SEO config for canonical, metadata base, Open Graph, and schema helpers. The build and Cloudflare runtime identity must agree at `/api/health`; health also queries D1 and responds `503` without internals if the database is unavailable. Staging pages and sitemap carry `X-Robots-Tag: noindex`, and staging `robots.txt` disallows crawling and declares no sitemap. Cloudflare Access is the primary staging barrier because a disallow rule alone does not make a site private.

CMS-backed homepage, project, article, and sitemap routes render at request time. A true empty publication inventory remains a valid empty result; D1 errors now fail the request so the release gate can see them. SEO QA discovers project URLs from the target sitemap instead of assuming the inventory always has 16 records; reconcile the first production inventory against the documented 16-project baseline separately.

## Migration and rollback

Routine release does not apply D1 migrations. Use the separate manual migration workflow against staging first, check the checksums and expansion compatibility, then validate the CMS lifecycle before considering production. The workflow refuses local targets and refuses database names that do not exactly match the target configuration.

Worker rollback does not restore D1/R2 or reverse Durable Object class lifecycle changes. Use a compatible previous Worker version only after confirming its bindings/schema still exist. Do not run automatic database restore on a failed smoke test. Until repeated smoke failures and Cloudflare rollback compatibility are verified in staging, treat rollback as a reviewed operator procedure rather than an automatic guarantee.

Staging and production deployments run smoke checks immediately and again at five minutes. A passing local build or local SEO QA does not prove staging/production behavior or Google indexation. GSC evidence is separate from HTTP/runtime checks.

## Reviewed LINE Worker release (2026-10-17)

The separate LINE Worker now has a manual main-only release/migration workflow in
`.github/workflows/line-worker-release.yml`; the CMS release path above remains
unchanged. `yarn line:policy` verifies isolated local/staging/production resources,
Queue names and the committed live-sync-off gate. Direct LINE deploy/remote
migration package scripts are disabled. CI quality runs CRM SQLite tests and
Worker type checks; policy QA covers the new workflow too.

The LINE workflow requires exact SHA confirmation, pinned actions, least-privilege
Environment credentials and `LINE_RELEASE_READY=true` in each selected
Environment. That flag is an owner-verified prerequisite, not an instruction to
set it during validation. Verify the separate staging LINE channel, schema and
Access setup first. Migration is a separate operation requiring the exact D1
name; no migration runs during deployment. Production migration remains a
reviewed operation after successful staging migration and verification.

Deployments use prebuilt manifests binding SHA/config/lockfile/migrations/bundle.
Production requires same-run authenticated staging health/CRM schema checks and
SHA evidence plus Production review. Runtime Google uploads remain disabled even
if an older ADS_SYNC_MODE secret says live. Worker rollback does not restore
chat data or files. Real remote migration, release and Google activation remain
separate explicit operations; this change does not authorize them.

## Reviewed Google Ads IP exclusions release

`ip-exclusions-release.yml` is a manual, main-only GitHub Actions release for the two standalone IP exclusion Workers. It takes the exact SHA that passed staging and six distinct approved Search campaign IDs. The Production Environment review applies to each release. The public Worker serves the existing `/__ipb` route and the private Worker reuses its Cloudflare-held Google Ads credentials. To roll back creation, dispatch `off` with the reviewed SHA and campaign list. Expiration of criteria that the Worker already owns continues in that mode.

Start with `audit`, which checks click IDs and calculates candidate exclusions. Review `ip_exclusions_verified` events in the private Worker's Cloudflare logs before dispatching `live` with the same SHA and campaign list. The release verifies the existing audit mode and campaign list before promotion. The empty POST smoke verifies route ownership. Google Ads criteria or a successful API response establish that an exclusion was written.

The Worker accepts a `gclid` from the current paid landing page, verifies it in the account's ClickView, and evaluates only the approved campaigns that are still enabled Search campaigns. In live mode it creates individual public IPv6 exclusions for 30 days. The queue caps new submissions and retries for at most six hours. The ledger stores Google Ads criterion resource names for expiry and drops raw click IDs and IP addresses when processing ends. It expires only criteria whose creation was acknowledged by Google Ads and recorded in the ledger. If an external write succeeds but its response or local record is lost, reconcile the uncertain entry in Google Ads before removing it. The previous Worker version's `VALIDATE_ONLY` flag remains true to keep its expiry routine in trial mode if that version is restored.

## Worker compatibility flags

`wrangler.jsonc` sets `no_handle_cross_request_promise_resolution` for every environment. With the behavior enabled by the current `compatibility_date`, a promise shared across concurrent requests in one isolate (Next.js/OpenNext lazy initialization and cache de-duplication) never settles once the request that created it ends. Production then cancels the waiting request with "Worker's code had hung and would never generate a response". Remove the flag only after confirming OpenNext no longer shares promises across requests. Keep `wrangler.jsonc` strict JSON: deployment scripts and `next.config.mjs` parse it with `JSON.parse`, so comments break the build.

