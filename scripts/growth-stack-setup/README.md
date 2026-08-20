# Growth stack setup (GTM + GA4)

Rebuilds the GTM container and GA4 property configuration from the same
CSVs that drive `docs/google-ads/*-qa*` — `gtm-container-build-sheet-2026-07.csv`,
`gtm-ga4-conversion-mapping-2026-07.csv`, and `ga4-custom-dimensions-2026-07.csv`.
The scripts parse those files directly instead of duplicating their values,
so there is only one place to edit when the tracking contract changes.

This does **not** create the Google account, the GTM account, or the GA4
account/property themselves. Google requires those to go through the normal
web onboarding at least once per account — there is no API for it, and it
would be inappropriate to script account creation on your behalf. Everything
after that first onboarding screen is scriptable.

## What this does not touch

Google Ads is out of scope here. Creating a Google Ads account, conversion
actions, and campaigns is a separate, larger effort (Ads API access requires
a developer token that Google has to approve, which can take days) and isn't
part of this GTM/GA4 rebuild.

## 1. One-time manual setup (you do this, ~10 minutes)

1. Sign up the new Google account.
2. Go to `tagmanager.google.com` → create a GTM account → create your first
   web container for `siamrooftech.com`. Note the **Container ID**
   (`GTM-XXXXXXX`) and **Account ID** (numeric, in the URL or Admin panel).
3. Go to `analytics.google.com` → create a GA4 account → property → web data
   stream for `siamrooftech.com`. Note the **Measurement ID** (`G-XXXXXXX`)
   and the **Property ID** (numeric, Admin > Property Settings).
4. Go to `console.cloud.google.com` → create a new project (any name) →
   enable "**Tag Manager API**" and "**Google Analytics Admin API**" under
   APIs & Services.
5. IAM & Admin > Service Accounts > Create service account (no roles needed
   at the GCP-project level — GTM/GA4 permissions are granted separately in
   step 6). Create a JSON key and download it.
6. Grant that service account access in both products, using the email
   address shown on the service account (looks like
   `name@project-id.iam.gserviceaccount.com`):
   - GTM: Admin (top-left gear) > User Management > add the service account
     email as a User on the **account**, with **Edit** permission on the
     container.
   - GA4: Admin > Property Access Management > add the service account
     email with the **Editor** role.

## 2. Environment variables

```bash
export GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/path/to/service-account.json
export GTM_ACCOUNT_ID=123456789
export GTM_CONTAINER_ID=987654321
export GA4_PROPERTY_ID=111222333        # numeric, not the G-XXXXXXX
export GA4_MEASUREMENT_ID=G-XXXXXXXXXX   # only used for a console reminder, not the API
```

## 3. Run

```bash
# GTM: variables, triggers, and (after one manual bootstrap step -- see
# below) tags. Creates a draft version but does NOT publish it.
yarn gtm:setup

# Add --wipe to delete everything currently in the workspace/property first.
# Safe to run without --wipe on a brand-new container/property -- there's
# nothing to wipe, and re-running is idempotent (skips anything that
# already exists by name).
yarn gtm:setup --wipe
yarn ga4:setup --wipe
```

### Why GTM tags need one manual step first

Google's Tag Manager API reference documents the `Tag` resource shape
(`name`, `type`, `parameter`, ...) but does **not** publish the concrete
`type` string or parameter schema for built-in tag types like "Google tag"
or "GA4 Event" — those are part of GTM's internal template system, not the
public API surface. Guessing that schema risks creating a tag that looks
right but silently fires wrong on the live site, with no way to verify it
without a live container to test against.

Instead, `gtm-setup.mjs` asks you to create exactly two tags by hand in the
GTM UI the first time you run it (it will print the exact steps and pause):

1. The GA4 Configuration tag ("Google tag"), pointed at your Measurement ID,
   with the `lead_persona` User Property mapping.
2. One GA4 Event tag (`GA4 Event - line_click`), as a template.

The script then reads that template tag's real JSON back via the API and
clones it for every other event (`line_survey_start`, `line_survey_complete`,
`phone_click`, `contact_click`), swapping only the name, event name, trigger,
and parameter list. This guarantees the schema matches what GTM's own UI
produces, rather than a guess.

## 4. After running

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

- `lib/auth.mjs` — service-account JWT auth, shared by both APIs.
- `lib/csv.mjs` — tiny CSV parser (quoted fields, no external dependency).
- `lib/gtm.mjs` / `lib/ga4.mjs` — thin REST wrappers, one function per API
  call actually used here.
- `gtm-manifest.mjs` / `ga4-manifest.mjs` — parse the docs/google-ads CSVs
  into the shape the setup scripts need.
- `gtm-setup.mjs` / `ga4-setup.mjs` — the scripts you actually run.
