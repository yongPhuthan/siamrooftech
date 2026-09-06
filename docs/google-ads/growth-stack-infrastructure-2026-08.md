# Growth Stack Infrastructure Record (2026-08)

> **Conversion-flow notice (2026-09-07):** The two GA4 key events recorded
> below are legacy state. Current website CTA events are diagnostics; the
> Primary conversion is the first matched inbound LINE message via Data Manager.

Concrete account and ID reference for the GTM/GA4/GCP stack rebuilt in
2026-08. The "how to rebuild this" runbook lives in
`scripts/growth-stack-setup/README.md` — this file is the "what actually
exists right now" record, since the numeric IDs below only ever appeared in
chat/terminal output otherwise and are not recoverable from the GTM/GA4 UI
without hunting.

## Why this exists

The previous GTM container (`GTM-TDXKN9MG`) was hand-configured, wired
incorrectly, and nobody remembered what was bound to it. Rather than debug
it, everything was rebuilt from scratch under a new dedicated Google
account, entirely through the Tag Manager API and GA4 Admin API — see
`scripts/growth-stack-setup/` for the scripts and
`docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md` (Survey
gate section) for what the tracking is actually for.

## Accounts

| Account | Email | Purpose |
| --- | --- | --- |
| GTM / GA4 | `admin.siamrooftech@gmail.com` | Owns the GTM account, GA4 account, and container/property under them |
| GCP | `yongmontha@gmail.com` | Owns the GCP project and billing that the automation service account lives under |

Deliberately split: GCP billing was already active on `yongmontha@gmail.com`
(the marketing-facing accounts on `admin.siamrooftech@gmail.com` didn't need
their own billing setup). A GTM/GA4 "User" invite works across accounts —
the service account doesn't need to live under the same identity as the
GTM/GA4 accounts it manages.

## GCP

| Item | Value |
| --- | --- |
| Project ID | `siamrooftech-tools` |
| Billing account | `01136F-2ACF97-A72D00` ("My Billing Account", under `yongmontha@gmail.com`) |
| APIs enabled | Tag Manager API, Analytics Admin API |
| Service account | `growth-stack-setup@siamrooftech-tools.iam.gserviceaccount.com` |
| Service account key | `~/.config/siamrooftech/growth-stack-setup-key.json` (local machine only, not in git, not backed up anywhere else — regenerate via `gcloud iam service-accounts keys create` under this service account if lost) |
| Service account permissions | GTM: Edit on the container (Account-level user). GA4: Editor at Account level. |

## GTM

| Item | Value |
| --- | --- |
| Account ID | `6372478957` |
| Container ID | `261804605` |
| Public Container ID | `GTM-WVZ3KQ6F` (this is what `NEXT_PUBLIC_GTM_ID` is set to) |
| Container name | `siamrooftech.com` |
| Contents | 29 variables, 5 triggers, 6 tags — see `scripts/growth-stack-setup/gtm-manifest.mjs` and `docs/google-ads/gtm-container-build-sheet-2026-07.csv` for the full list |
| Status | Published and live as of 2026-08-21 |

Tag types `googtag` (base config) and `gaawe` (GA4 Event) aren't documented
by Google — the working schema, including the `eventSettingsTable` and
`userProperties` parameter keys, was found empirically against this
container and is now hardcoded in `scripts/growth-stack-setup/gtm-setup.mjs`.

## GA4

| Item | Value |
| --- | --- |
| Account ID | `396985069` |
| Property ID | `550738656` |
| Measurement ID | `G-5FHY39RKJ0` |
| Web data stream URL | `https://www.siamrooftech.com` |
| Contents | 17 custom dimensions, 2 key events (`line_survey_complete`, `phone_click`) — see `docs/google-ads/ga4-custom-dimensions-2026-07.csv` |

## Cloudflare / deploy

| Item | Value |
| --- | --- |
| Wrangler account | `Siamrooftech` (`a61f30bb027ef64c9577c73f5981f073`), under `yongmontha@gmail.com`'s Cloudflare login |
| `NEXT_PUBLIC_GTM_ID` | Set in `wrangler.jsonc` (`vars`), not `.env` — requires `yarn cf:build && npx wrangler deploy` to take effect, since it's a Next.js `NEXT_PUBLIC_*` var baked in at build time |
| Deployed | 2026-08-21, verified live on `https://www.siamrooftech.com` |

## Known gaps / not done yet

- GTM Preview / GA4 DebugView live verification (needs a human browser
  session — see Verification checklist in
  `docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md`).
- Google Ads account/campaigns — separate, larger effort, out of scope for
  this rebuild (see `scripts/growth-stack-setup/README.md`).
- The old GCP project created mid-setup under `admin.siamrooftech@gmail.com`
  (`siamrooftech-growth`) is orphaned — empty, no billing, no cost, safe to
  delete or ignore.
