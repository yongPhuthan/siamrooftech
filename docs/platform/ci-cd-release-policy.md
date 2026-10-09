# Safe CI/CD and SEO release policy

Updated 2026-10-09. This document describes the implemented GitHub Actions checks and the external setup still required. It is not authorization to cut over production.

## Release path

Pull requests run three stable required-check candidates: `quality`, `environment-policy`, and `runtime-seo`. Merging to `main` runs the same checks. Staging deployment is conditional on `staging` environment variable `STAGING_DEPLOY_ENABLED=true`; this switch must stay unset until the hostname is behind Cloudflare Access and its service token works. A production release is manual and requires the exact main SHA, successful staging validation for that SHA, a production build manifest, and approval through the existing GitHub `Production` environment.

Production deploy uses the already-built `.open-next` artifact. Its manifest binds the SHA, target, canonical origin, config digest, lockfile digest, migrations checksums, and artifact digest. D1 migrations are a separate manually dispatched workflow that requires an exact database-name confirmation. Local direct deploy commands intentionally fail.

## Target isolation and readiness

| Target | Worker | Origin | Current status |
| --- | --- | --- | --- |
| Local | `siamrooftech-local` | `http://localhost:3000` | Emulator bindings only |
| Staging | `siamrooftech-staging` | `https://staging.siamrooftech.com` | D1/R2 configured; Access and custom hostname must be verified before enabling deploy |
| Production | `siamrooftech` | `https://www.siamrooftech.com` | Intentionally blocked: production D1, cache D1, R2, and self-reference are not configured here |

GitHub records the latest Production deployments as created by `vercel[bot]` (latest observed 2026-09-08). Keep the current Vercel route available as the live/recovery service while validating Cloudflare staging. Do not disable it or route production traffic to the Worker until ownership, data parity, and rollback have been verified.

Check the static contract with `yarn deployment:policy`. To test a specific deploy preflight, use `node scripts/deployment-policy.mjs --target=staging --deploy` after setting `STAGING_ACCESS_READY=true`, or `--target=production --deploy`. The production command must remain blocked until isolated production resources are present. Do not copy staging resource IDs or bucket names to make it pass.

Staging currently has a custom-host route in Wrangler, so set Cloudflare Access for the hostname and test both browser login and CI service-token access before setting the GitHub variable. The route is only activated by deploying the Worker. Keep `STAGING_DEPLOY_ENABLED` and `STAGING_ACCESS_READY` unset until that policy is verified.

## GitHub setup still required

1. Push the intended code to `main` or a feature branch and verify the workflow run. This working copy can contain unrelated uncommitted changes; never stage those into this release.
2. Add staging environment variable `CLOUDFLARE_ACCOUNT_ID`, `STAGING_ACCESS_READY=true`, and `STAGING_DEPLOY_ENABLED=true`. Add staging secrets `CLOUDFLARE_API_TOKEN`, `CF_ACCESS_CLIENT_ID`, and `CF_ACCESS_CLIENT_SECRET`. Scope the Cloudflare API token to this account and Worker/D1/R2 deployment operations only.
3. Add equivalent production `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` only after production D1/R2/cache resources, content/media parity, backup, and rollback compatibility have been checked. Keep `PRODUCTION_CUTOVER_READY` unset until the owner has verified those items and resolved the Vercel/Cloudflare route ownership. Do not store database exports, OTPs, drafts, cookies, or backups in GitHub.
4. Configure `Production` with the repository owner as required reviewer and disable administrator bypass. If GitHub does not permit the intended self-approval behavior under the current repository policy, leave production deployment blocked.
5. After a workflow has run on GitHub, set `quality`, `environment-policy`, and `runtime-seo` as required checks for `main`; require PRs, disallow force pushes, and do not grant bypass to automation.
6. Inspect and disable overlapping Vercel/Workers Builds automatic deployments only after identifying which service currently serves production and recording the recovery path. The Actions environment variables `STAGING_DEPLOY_ENABLED` and `Production` approval are separate from Cloudflare environment variables/secrets.

The Worker also needs target-specific Cloudflare runtime secrets before CMS/auth/API use: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_ALLOWED_EMAILS`, `REVALIDATION_SECRET_TOKEN`, `GOOGLE_GENAI_API_KEY`, `LEADS_INTAKE_TOKEN`, `CHAT_HISTORY_READ_TOKEN`, and `CHAT_HISTORY_WRITE_TOKEN`. Set `BETTER_AUTH_URL` to the target's exact origin and allow only the owner's verified mailbox in `ADMIN_ALLOWED_EMAILS`. Keep these secrets in Cloudflare, not in the build artifact or GitHub workflow variables.

Do not infer Access, DNS, required reviewer, secret, or build status from local files. Verify each in the actual service before enabling a deploy switch.

## SEO and runtime safeguards

The build selects only `CMS_BUILD_ENV=local|staging|production`; unknown targets fail. The target origin is injected into one shared SEO config for canonical, metadata base, Open Graph, and schema helpers. The build and Cloudflare runtime identity must agree at `/api/health`; health also queries D1 and responds `503` without internals if the database is unavailable. Staging pages and sitemap carry `X-Robots-Tag: noindex`, and staging `robots.txt` disallows crawling and declares no sitemap. Cloudflare Access is the primary staging barrier because a disallow rule alone does not make a site private.

CMS-backed homepage, project, article, and sitemap routes render at request time. A true empty publication inventory remains a valid empty result; D1 errors now fail the request so the release gate can see them. SEO QA discovers project URLs from the target sitemap instead of assuming the inventory always has 16 records; reconcile the first production inventory against the documented 16-project baseline separately.

## Migration and rollback

Routine release does not apply D1 migrations. Use the separate manual migration workflow against staging first, check the checksums and expansion compatibility, then validate the CMS lifecycle before considering production. The workflow refuses local targets and refuses database names that do not exactly match the target configuration.

Worker rollback does not restore D1/R2 or reverse Durable Object class lifecycle changes. Use a compatible previous Worker version only after confirming its bindings/schema still exist. Do not run automatic database restore on a failed smoke test. Until repeated smoke failures and Cloudflare rollback compatibility are verified in staging, treat rollback as a reviewed operator procedure rather than an automatic guarantee.

The production workflow runs smoke checks immediately and again at two and five minutes. A passing local build or local SEO QA does not prove staging/production behavior or Google indexation. GSC evidence is separate from HTTP/runtime checks.
