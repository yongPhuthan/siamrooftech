# LINE chat history and reviewed CRM Worker

D1 owns chat/CRM data, R2 owns message files, media/Ads Queues process background
work. This is separate from the Next.js CMS Worker. See
[reviewed CRM contract](../../docs/lead-matching/README.md).

## Local setup

Use `yarn`. Add fixture-only values to ignored `.dev.vars.local` in this Worker
folder for `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`,
`CHAT_HISTORY_READ_TOKEN`, `CHAT_HISTORY_WRITE_TOKEN`, `LEADS_INTAKE_TOKEN`, and
`ADS_SYNC_MODE=dry_run`. Never put real secrets in command arguments or logs.

- `yarn line:migrate:local`: migrations against local emulator only.
- `yarn line:dev`: explicit `local` environment on port 8788.
- `yarn line:type-check`, `yarn test:crm`, `yarn line:policy`.
- `yarn line:qa` and `yarn leads:qa`: against the running local Worker; provide
  fixture tokens through environment variables. CRM QA refuses remote hosts.

Set the main local Next.js runtime's `LINE_CHAT_HISTORY_WORKER_URL` to the local
Worker origin, with matching read/write/intake tokens in ignored local config.
Keep the CMS/auth local environment isolated too; no production OTP bypass.

Every environment has distinct D1/R2/Queue names. Local resources have placeholder
IDs and run in the emulator. Staging uses its own test LINE channel and fixtures;
never point the production OA webhook at staging.

## Deployment and migrations

Only `.github/workflows/line-worker-release.yml` deploys or applies remote
migrations. Local deploy/migrate shortcuts refuse execution. The workflow is
manual, main-only and requires the exact selected SHA. Normal deployment never
applies schema migrations.

Environment owners must verify and set `LINE_RELEASE_READY=true` separately in
staging/Production only after schema, bindings, separate LINE channel, private
access, least-privilege credentials and recovery readiness are verified. Keep
it unset until then. LINE webhook signature verification remains required even
where a test webhook path must be reachable through Access.

- Migration operation requires the exact target CHAT_DB name (and separate
  staging name confirmation before a production migration) and environment
  review. Apply staging first and validate the workflow before production.
- Deploy operation bundles without secrets, hashes bundle/config/lockfile/schema,
  verifies artifacts, deploys staging first, then probes authenticated D1/CRM
  health and the deployed SHA. Production consumes its prebuilt bundle only
  after same-run staging success and Production environment approval.
- `LINE_WORKER_SMOKE_URL`, `CHAT_HISTORY_READ_TOKEN` and optional Access service
  headers support authenticated smoke tests. Cloudflare tokens stay in GitHub
  Environments. Runtime LINE/Google/read/write/intake secrets stay on the correct
  Worker; they are not build artifacts.
- `CRM_ADS_LIVE_ENABLED=false` remains committed for all targets. No deployment
  in this workflow enables Google uploads. Activation is a separate change.
- Worker rollback never restores D1/R2. Schema changes are expand-only and must
  preserve compatibility with a reviewed rollback version.

Do not infer deployed state, Access, resource readiness or accepted Google
conversions from files in this repository. No live verification is claimed here.
