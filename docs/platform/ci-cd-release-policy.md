# Safe CI/CD and SEO release policy

Updated 2026-10-09. This document describes the implemented GitHub Actions checks, GitHub protections, and external setup still required. It is not authorization to cut over production.

## Release path

Pull requests run the three required checks: `quality`, `environment-policy`, and `runtime-seo`. `main` requires a PR and up-to-date checks, applies protection to administrators, and blocks force pushes and deletion. Repository Actions enforce full commit-SHA pinning. Staging deployment is conditional on the `staging` environment variable `STAGING_DEPLOY_ENABLED=true`; this switch must stay unset until the hostname is behind Cloudflare Access and its service token works. A production release is manual and requires the exact main SHA, successful staging validation for that SHA, a production build manifest, and approval through the existing GitHub `Production` environment.

Production deploy uses the already-built `.open-next` artifact. Its manifest binds the SHA, target, canonical origin, config digest, lockfile digest, migrations checksums, and artifact digest. D1 migrations are a separate manually dispatched workflow that requires an exact database-name confirmation. Local direct deploy commands intentionally fail.

## Target isolation and readiness

| Target | Worker | Origin | Current status |
| --- | --- | --- | --- |
| Local | `siamrooftech-local` | `http://localhost:3000` | Emulator bindings only |
| Staging | `siamrooftech-staging` | `https://staging.siamrooftech.com` | D1/R2 configured; Access and custom hostname must be verified before enabling deploy |
| Production | `siamrooftech` | `https://www.siamrooftech.com` | Intentionally blocked: production D1, cache D1, R2, and self-reference are not configured here |

GitHub records the latest Production deployments as created by `vercel[bot]` (latest observed 2026-09-08). Keep the current Vercel route available as the live/recovery service while validating Cloudflare staging. A Vercel Preview deployment also ran for PR #1; this does not deploy to production. Do not disable the current Vercel route or route production traffic to the Worker until ownership, data parity, and rollback have been verified.

Check the static contract with `yarn deployment:policy`. To test a specific deploy preflight, use `node scripts/deployment-policy.mjs --target=staging --deploy` after setting `STAGING_ACCESS_READY=true`, or `--target=production --deploy`. The production command must remain blocked until isolated production resources are present. Do not copy staging resource IDs or bucket names to make it pass.

Staging currently has a custom-host route in Wrangler, so set Cloudflare Access for the hostname and test both browser login and CI service-token access before setting the GitHub variable. The route is only activated by deploying the Worker. Keep `STAGING_DEPLOY_ENABLED` and `STAGING_ACCESS_READY` unset until that policy is verified.

## GitHub setup status and remaining work

GitHub setup completed 2026-10-09:

- PR #1 is open from `codex/seo-safe-cicd`. Its latest GitHub run passed `quality`, `environment-policy`, and `runtime-seo`; `staging-deployment` was skipped because `STAGING_DEPLOY_ENABLED` is unset. The PR contains six previously committed local website/CMS changes as well as the CI/CD commits because those commits were ahead of `origin/main`.
- `main` requires PRs and the three checks above, requires the latest base branch, enforces protections for administrators, disallows force-pushes and deletion, and has no agent bypass.
- The repository requires Actions to be pinned to full commit SHAs.
- GitHub `Production` requires `yongPhuthan` as reviewer, permits the owner to approve their own release, is limited to `main`, and disables administrator bypass.
- GitHub `staging` is limited to `main` and disables administrator bypass. It has no deployment secrets or enable switch configured.

Still required before staging can deploy:

1. Verify Cloudflare Access protects `staging.siamrooftech.com` and test both owner browser access and CI service-token access.
2. Add staging environment variable `CLOUDFLARE_ACCOUNT_ID`, `STAGING_ACCESS_READY=true`, and `STAGING_DEPLOY_ENABLED=true`. Add staging secrets `CLOUDFLARE_API_TOKEN`, `CF_ACCESS_CLIENT_ID`, and `CF_ACCESS_CLIENT_SECRET`. Scope the Cloudflare API token to this account and Worker/D1/R2 deployment operations only.

Still required before production can deploy:

1. Add production `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` only after production D1/R2/cache resources, content/media parity, backup, and rollback compatibility have been checked. Production D1/cache/R2 bindings are intentionally absent. Keep `PRODUCTION_CUTOVER_READY` unset until the owner verifies those items and resolves the Vercel/Cloudflare route ownership.
2. Inspect and disable overlapping automatic deployments only after identifying the live production route and recording the recovery path. Vercel remains the current production/recovery path; its Preview check on PR #1 is separate from the Cloudflare pipeline.

Do not store database exports, OTPs, drafts, cookies, or backups in GitHub. GitHub Actions environment values are separate from Cloudflare runtime secrets. Do not infer Access, DNS, secret, or data readiness from local files.

The Worker also needs target-specific Cloudflare runtime secrets before CMS/auth/API use: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_ALLOWED_EMAILS`, `REVALIDATION_SECRET_TOKEN`, `GOOGLE_GENAI_API_KEY`, `LEADS_INTAKE_TOKEN`, `CHAT_HISTORY_READ_TOKEN`, and `CHAT_HISTORY_WRITE_TOKEN`. Set `BETTER_AUTH_URL` to the target's exact origin and allow only the owner's verified mailbox in `ADMIN_ALLOWED_EMAILS`. Keep these secrets in Cloudflare, not in the build artifact or GitHub workflow variables.

Do not infer Access, DNS, required reviewer, secret, or build status from local files. Verify each in the actual service before enabling a deploy switch.

## SEO and runtime safeguards

The build selects only `CMS_BUILD_ENV=local|staging|production`; unknown targets fail. The target origin is injected into one shared SEO config for canonical, metadata base, Open Graph, and schema helpers. The build and Cloudflare runtime identity must agree at `/api/health`; health also queries D1 and responds `503` without internals if the database is unavailable. Staging pages and sitemap carry `X-Robots-Tag: noindex`, and staging `robots.txt` disallows crawling and declares no sitemap. Cloudflare Access is the primary staging barrier because a disallow rule alone does not make a site private.

CMS-backed homepage, project, article, and sitemap routes render at request time. A true empty publication inventory remains a valid empty result; D1 errors now fail the request so the release gate can see them. SEO QA discovers project URLs from the target sitemap instead of assuming the inventory always has 16 records; reconcile the first production inventory against the documented 16-project baseline separately.

## Migration and rollback

Routine release does not apply D1 migrations. Use the separate manual migration workflow against staging first, check the checksums and expansion compatibility, then validate the CMS lifecycle before considering production. The workflow refuses local targets and refuses database names that do not exactly match the target configuration.

Worker rollback does not restore D1/R2 or reverse Durable Object class lifecycle changes. Use a compatible previous Worker version only after confirming its bindings/schema still exist. Do not run automatic database restore on a failed smoke test. Until repeated smoke failures and Cloudflare rollback compatibility are verified in staging, treat rollback as a reviewed operator procedure rather than an automatic guarantee.

The production workflow runs smoke checks immediately and again at two and five minutes. A passing local build or local SEO QA does not prove staging/production behavior or Google indexation. GSC evidence is separate from HTTP/runtime checks.
