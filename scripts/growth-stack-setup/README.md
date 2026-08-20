# Growth stack setup (GTM + GA4)

Rebuilds the GTM container and GA4 property configuration from the same
CSVs that drive `docs/google-ads/*-qa*` — `gtm-container-build-sheet-2026-07.csv`,
`gtm-ga4-conversion-mapping-2026-07.csv`, and `ga4-custom-dimensions-2026-07.csv`.
The scripts parse those files directly instead of duplicating their values,
so there is only one place to edit when the tracking contract changes.

## What's actually CLI-able, and what isn't

Google requires a live browser session for exactly three things, all
first-time account/consent gates that have no API bypass by design (anti-abuse
policy, not a gap in these scripts):

| Step | CLI-able? | Why |
| --- | --- | --- |
| Sign up the Google account | No | Google requires a human for new-account creation |
| `gcloud auth login` | No | Authenticating a brand-new identity needs a real login |
| GTM: create the Account (bundles the first Container) | No | No `accounts.create` in the Tag Manager API; Google's onboarding UI bundles account + first container into one step |
| GA4: create the Account | No | No `accounts.create` in the Analytics Admin API either |
| Invite the service account into GTM / GA4 | No | The very first grant of access has to come from whoever already has admin rights — i.e. you, logged in |
| GCP project, APIs, service account, key | **Yes** | `gcloud`, see `gcp-bootstrap.sh` |
| GTM: variables, triggers, versions | **Yes** | Tag Manager API, fully documented |
| GTM: tags (`googtag` / `gaawe`) | **Yes** | Not documented by Google, but confirmed empirically against a live container — see "How the GTM tag schema was found" below |
| GA4: property, data stream, custom dimensions, key events | **Yes** | Analytics Admin API, fully documented |

We looked at using your own `gcloud` login (via `gcloud auth
application-default login --scopes=...`) to skip the service-account
invite step entirely. Google's own docs for that command say scopes for
APIs outside Google Cloud Platform itself — Tag Manager and Analytics
Admin both count — need a separate custom OAuth Client ID
(`--client-id-file`), not just a `--scopes` flag. That trades one
well-supported manual step (inviting a service account through GTM/GA4's
own "add user" screen, which is designed for exactly this) for a flakier
one (configuring an OAuth consent screen + client by hand). We kept the
service account.

Google Ads is out of scope here entirely — a separate, larger effort (Ads
API access requires a developer token Google has to approve, which can take
days) and isn't part of this GTM/GA4 rebuild.

## 1. GCP (fully scripted)

```bash
PROJECT_ID=siamrooftech-growth ./scripts/growth-stack-setup/gcp-bootstrap.sh
```

Run this yourself, not through me — it opens a browser for `gcloud auth
login` and needs to run as `admin.siamrooftech@gmail.com`, not whatever
account your `gcloud` is currently logged into. It creates a GCP project,
enables the Tag Manager API and Analytics Admin API, creates a service
account, and writes its JSON key to
`~/.config/siamrooftech/growth-stack-setup-key.json`. Prints the service
account email at the end — you'll need it in step 2.

Needs a billing account linked to the project (GCP requires this to enable
most APIs, even free-tier ones); the script pauses and tells you the
command if none is linked yet.

## 2. GTM and GA4 accounts (the parts that need a browser)

1. `tagmanager.google.com` → create account → create your first web
   container for `siamrooftech.com`. Note the **Account ID** and
   **Container ID** from Admin > Container Settings.
2. Admin (gear icon) > User Management > add the service account email
   (from step 1's output) as a User on the **account**, **Edit** permission
   on the container.
3. `analytics.google.com` → create account only (property + data stream get
   created by `ga4-setup.mjs` in step 4). Note the **Account ID** from
   Admin > Account Settings.
4. Admin > Account Access Management > add the service account email,
   **Editor** role, at the **account** level (not property — the property
   doesn't exist yet).

## 3. Environment variables

```bash
export GOOGLE_SERVICE_ACCOUNT_KEY_FILE=~/.config/siamrooftech/growth-stack-setup-key.json
export GTM_ACCOUNT_ID=123456789
export GTM_CONTAINER_ID=987654321
export GA4_ACCOUNT_ID=444555666
```

`ga4-setup.mjs` creates the property and web data stream on first run and
prints a `GA4_PROPERTY_ID` and `Measurement ID` to export for subsequent
runs (so it doesn't create a duplicate property every time, and so
`gtm-setup.mjs` — which requires `GA4_MEASUREMENT_ID` — knows what to use):

```bash
export GA4_PROPERTY_ID=111222333       # numeric, not the G-XXXXXXX
export GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 4. Run

```bash
# GA4: property + data stream (first run only), custom dimensions, key
# events.
yarn ga4:setup --wipe

# GTM: variables, triggers, tags, draft version. Does NOT publish.
yarn gtm:setup --wipe
```

`--wipe` deletes/archives everything currently in the workspace/property
first. Safe to run without it on a brand-new container/property — there's
nothing to wipe, and re-running either script is idempotent (skips anything
that already exists by name).

Tag Manager's default per-minute write quota is easy to trip on a full
rebuild (30+ variables plus triggers plus tags) — `gtm-setup.mjs` sleeps
1s between writes to stay under it. If you still hit `429 RESOURCE_EXHAUSTED`,
just wait ~60s and re-run the same command; it resumes from wherever it
left off.

### How the GTM tag schema was found

Google's Tag Manager API reference documents the `Tag` resource shape
(`name`, `type`, `parameter`, ...) but does **not** publish the concrete
`type` string or parameter schema for built-in tag types like "Google tag"
or "GA4 Event" — those are part of GTM's internal template system, not the
public API surface.

`gtm-setup.mjs` hardcodes the schema directly (`type: 'googtag'` for the
base config tag, `type: 'gaawe'` for GA4 Event tags, with an
`eventSettingsTable` LIST parameter for event parameters). This was found
by creating tags against a real container via the API and reading back
what Google's server actually accepted and normalized the request into —
in particular, `eventSettingsTable` is not a name we chose; it's what the
API renamed our request's parameter key to in its response, which is the
only way to have learned it. If Google changes this internal schema in the
future, tag creation will fail with a 400 from `tags.create` naming the
bad field, the same way `measurementIdOverride` was discovered — the error
messages are specific enough to fix from.

## 5. After running

- **GTM**: `gtm-setup.mjs` does **not** map `lead_persona` as a GA4 User
  Property on the base config tag (the parameter schema for that specific
  field wasn't worth reverse-engineering on the first pass — it only
  matters for the future contractor-exclusion audience, not for the P0
  events themselves). Add it by hand once: open the "Google tag / GA4 base
  tag", expand Configuration Settings, add a User Property row
  `lead_persona` → `{{DLV - lead_persona}}`, save.
- **GTM**: open the container, use Preview mode against a staging/production
  URL, confirm each event fires once per action with the right parameters
  (see the Verification checklist in `docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md`
  and `docs/google-ads/pilot-launch-plan-2026-07.md`), then Publish manually.
  The script deliberately does not auto-publish.
- **GA4**: confirm the custom dimensions and key events appear (Admin >
  Custom definitions / Events > mark as key event may need up to 24-48h to
  fully propagate).
- **Code**: set `NEXT_PUBLIC_GTM_ID` to the new `GTM-XXXXXXX` in your hosting
  platform's environment variables and redeploy — `src/app/layout.tsx` no
  longer has a hardcoded fallback, so GTM silently stays off in production
  until this is set.

## Files

- `gcp-bootstrap.sh` — one-time `gcloud` setup: project, APIs, service
  account, key. Run this one yourself; see step 1.
- `lib/auth.mjs` — service-account JWT auth, shared by both APIs.
- `lib/csv.mjs` — tiny CSV parser (quoted fields, no external dependency).
- `lib/gtm.mjs` / `lib/ga4.mjs` — thin REST wrappers, one function per API
  call actually used here.
- `gtm-manifest.mjs` / `ga4-manifest.mjs` — parse the docs/google-ads CSVs
  into the shape the setup scripts need.
- `gtm-setup.mjs` / `ga4-setup.mjs` — the scripts you actually run.
