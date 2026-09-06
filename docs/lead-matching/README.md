# Lead Matching + Dashboard + Google Ads Conversion Feedback

Status: **direct LINE handoff shipped in code, `ADS_SYNC_MODE=dry_run`**.
Scope: bind a LINE conversation to the ad click that produced it, count the
first matched inbound message as the real initial conversion, and allow staff
to restate its value once the outcome is known. No survey or persona question
is shown before LINE opens.

Builds directly on [docs/line-chat-history/README.md](../line-chat-history/README.md)
— same Worker, same D1 database, same account. Read that doc first for the
webhook/ingestion side; this doc covers everything added on top: leads,
matching, the dashboard, and the Google Ads adapter.

## The problem this solves

Before this, `gclid` never left the browser and the LINE buttons across the
site all pointed at the same bare `https://lin.ee/pPz1ZqN` link with no
parameters. There was no way to connect *which* ad click produced *which*
LINE conversation. `src/lib/firestore.ts`
had a `contact_submissions` collection that could have been the answer, but
the form that wrote to it (`ContactForm.tsx`) isn't rendered anywhere in the
app, and separately, **`firebase-admin` cannot run in this Cloudflare
Workers runtime** (`EvalError: Code generation from strings disallowed` —
see commit `ceca931`), which is why lead storage lives in D1 alongside chat
history rather than Firestore.

## Why gclid-only matching, not phone number

The obvious alternative — collect the customer's phone number and let
Google's Enhanced Conversions for Leads match it against ad-click data —
was considered and rejected for this system. The reason: **the phone
number a lead gives mid-chat is often not their own**. A `procurement`
persona (someone at a company searching on behalf of the business) commonly
hands over a site contractor's or coordinator's number instead of their
own. If that other person also happens to have clicked the same ad
campaign — plausible for someone at the same company — Google would
silently attribute the conversion to the wrong person's click, corrupting
the bidding signal with no way to detect it. It's also a PDPA problem:
uploading a third party's phone number to Google without their consent.
`gclid` doesn't have this failure mode — it identifies a *click*, not a
*person*, so there's no "wrong person" to attribute to.

So: **only `gclid`/`gbraid`/`wbraid` are ever used to match or sent to
Google. No phone numbers are collected, stored, or uploaded by this
system.**

## How matching actually works

LINE gives no way to attach metadata to an inbound message, and the
Messaging API's `line.me/R/oaMessage/{id}/?{text}` URL scheme (confirmed
from LINE's own docs) is the only lever available: it opens a chat with the
OA and **prefills the message input box** with arbitrary text. So:

1. Every click on a LINE button (`src/app/components/AttributionCapture.tsx`)
   mints an 8-character ref code client-side (`SRT-K3F9QA2M`, using a
   Crockford-style alphabet without `0/O/1/I/L/U` — see
   `src/lib/lead-intake.ts`), fires a `POST /api/leads/intake` beacon with
   the ref code plus whatever attribution is in `localStorage` at that
   moment (gclid, utm_*, persona if already known), and rewrites the click
   target to `https://line.me/R/oaMessage/%40siamrooftech/?<message>%20[<ref>]`.
2. The lead is minted **client-side**, not server-round-tripped first — the
   intake POST is fire-and-forget (`keepalive: true`) so it never delays
   opening LINE, and a failed intake never blocks a lead from reaching a
   human. The Worker (`workers/line-chat-history/src/leads.ts`
   `createLead`) just records the same code the client already burned into
   the URL.
3. If the visitor taps send without editing the prefilled text, their first
   LINE message contains the ref code. The webhook
   (`workers/line-chat-history/src/webhook.ts`) scans every inbound text
   message for the `SRT-XXXXXXXX` pattern and, on a hit, binds
   `leads.conversation_id` to that LINE conversation
   (`matchLeadByRefCode` in `leads.ts`).
4. **If they clear the prefilled text, the lead is never automatically
   matched.** It shows up in `GET /leads/unmatched` with time-window
   candidates (LINE conversations that started within ±15 minutes) for a
   human to confirm manually in the dashboard. Automatic matching is
   deliberately exact-ref-only — a wrong *automatic* guess would silently
   attach a conversion to the wrong gclid with no way to notice, which is
   the same failure mode phone-number matching has. A wrong *manual* match
   is at least a decision a human made on purpose.

**Not yet verified on real devices**: whether `oaMessage` still prefills
correctly when the visitor isn't already a friend of the OA (it may show an
add-friend interstitial first), and whether behavior differs between iOS,
Android, and LINE's desktop client. Verify this before treating the match
rate as reliable — see the runbook below.

## Two-layer value model

The first matched inbound LINE message creates an initial conversion with a
1 THB technical placeholder. This is not revenue. Once staff knows the
outcome, `actual_value` (or an interim `estimated_value`) can be set through
the dashboard or `yarn leads:value`, restating the same transaction ID.
Historical persona fields remain nullable for backward compatibility.

`updateLeadValue` refuses any value `<= 0`: Data Manager treats a restatement
to 0 as a permanent retraction that cannot later be restored.

## Google Ads side: Data Manager API, not `UploadClickConversions`

This matters because it's a **2026 platform change**, not a design choice:
**`ConversionUploadService.UploadClickConversions` on the Google Ads API
stopped accepting new adopters on June 15, 2026** — the allowlist is based
on developer tokens that were already actively uploading conversions
between December 2025 and May 2026. Siamrooftech's token has never done
this, so calling that endpoint today would fail with
`CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_FEATURE`. Google's own migration
guidance points everyone — allowlisted or not — to the newer
**Data Manager API** (`POST https://datamanager.googleapis.com/v1/events:ingest`)
instead.

Practical implications of that API, reflected in `workers/line-chat-history/src/ads-sync.ts`:

- **Auth is a plain service account, no developer token needed** — add the
  service account's email as a user on the Google Ads account
  (Tools & Settings → Access and security) and grant it
  `https://www.googleapis.com/auth/datamanager`. `google-auth.ts` mints the
  JWT and exchanges it for an access token using only `crypto.subtle`
  (Workers-compatible, no Node crypto).
- `adIdentifiers.gclid`/`gbraid`/`wbraid` are still first-class fields —
  gclid matching is not being deprecated by this API change.
- **Restating a value is just re-sending the same `transactionId`** (this
  system uses the lead's `lead_id` as the transactionId) with a new
  `conversionValue` — no separate "adjustment" call needed, unlike the old
  Ads API's conversion-adjustment upload.
- The API has a built-in `validateOnly` dry-run flag, but this system's own
  `ADS_SYNC_MODE=dry_run` (the current default) is a level above that: it
  never calls Google's network at all, and only records the exact payload
  that *would* be sent. There's no live Ads account or conversion action to
  validate against yet, so calling Google at all — even with
  `validateOnly` — would just fail on an empty `ADS_CUSTOMER_ID`.

## Architecture

```
Ad click (?gclid=...)
   │  AttributionCapture stores click attribution in localStorage
   ▼
LINE button click ── AttributionCapture.tsx ──► POST /api/leads/intake (Next.js proxy)
   │  rewrites href to a ref-coded                    │
   │  line.me/R/oaMessage/... URL                      ▼
   │                                    Worker: POST /internal/leads/intake
   │                                       └─► D1 leads (gclid, persona, ref_code, ...)
   ▼
Opens LINE, ref code in prefilled message
   │
   ▼
Visitor taps send ──► LINE webhook (existing /line/webhook)
                          └─► normalize.ts finds SRT-XXXXXXXX in the text
                                └─► leads.matchLeadByRefCode()
                                      ├─ UPDATE leads SET conversation_id, matched_at
                                      └─ enqueue ADS_QUEUE {kind: initial}
                                            └─► ads-sync.ts → Data Manager events:ingest
                                                  (or just records the payload, in dry_run)

Staff / AI Agent ──► yarn leads:show <id> --with-transcript
                  ──► yarn leads:value <id> --value=45000 --status=won
                        └─► enqueue ADS_QUEUE {kind: restatement, same transactionId}

Dashboard: /admin/leads ──► /api/admin/lead-proxy/* (Firebase-auth gated) ──► Worker /leads*
```

## Schema

`workers/line-chat-history/migrations/0002_leads.sql`: `leads` (attribution
snapshot + match + status + two-layer value + ads-sync state),
`lead_events` (append-only audit trail — every match/status/value/ads-sync
change), `ads_sync_jobs` (one row per Data Manager call attempt, storing
the exact request payload and response for every job regardless of mode).

## Read/Write API + CLI

See `workers/line-chat-history/src/leads-api.ts` for the full route table.
Reads (`GET /leads`, `/leads/{id}`, `/leads/{id}/transcript`,
`/leads/unmatched`, `/ads-sync/jobs`) require `CHAT_HISTORY_READ_TOKEN`;
writes (`POST /leads/{id}/status|value|match`) require
`CHAT_HISTORY_WRITE_TOKEN` — the same two tokens the chat-history Read API
already uses. `POST /internal/leads/intake` has its own
`LEADS_INTAKE_TOKEN`, held only by the Next.js server (never the browser).

CLI (`scripts/leads.mjs`, same no-dependency `.mjs` shape as
`scripts/line-chat-history.mjs`):

```bash
yarn leads:list --date=2026-08-26 --status=new
yarn leads:show <lead_id> --with-transcript     # the command an AI Agent uses
yarn leads:value <lead_id> --value=45000 --status=won --reason="ปิดงานแล้ว"
yarn leads:match <lead_id> --conversation=user:U4af49...
yarn leads:unmatched
yarn leads:ads-jobs --state=pending
```

## Dashboard

`/admin/leads` follows the exact conventions of `/admin/projects` /
`/admin/articles` — `page.tsx` dynamic-imports the client component with
`{ ssr: false }` (same reason as always: `firebase/auth`'s `eval()` crashes
Workers SSR), wrapped in `AdminAuthGate`. **Unlike the existing
articles/projects admin routes, `GET` is also gated** behind
`verifyAdminRequest` here (`src/app/api/admin/lead-proxy/[...path]/route.ts`)
— lead data carries gclid and other attribution that shouldn't be openly
readable the way draft articles currently are.

## Verification

`yarn leads:qa` (`scripts/leads-qa.mjs`) exercises: intake, ref-code
matching, idempotency under webhook redelivery, the unmatched-lead listing,
refusing a `value <= 0`, restatement using the same `transactionId`,
payload recording in dry-run mode, auth on every route, timezone
windowing, and the transcript endpoint. It polls rather than sleeping a
fixed amount, since the ads-sync queue consumer runs asynchronously (up to
`max_batch_timeout` in `wrangler.jsonc`).

`yarn ads:qa` and `yarn ads:browser-qa` verify the direct handoff: one click
opens a ref-coded `line.me/R/oaMessage` URL through native anchor navigation,
records one intake and one diagnostic `line_click`, emits no survey events,
and still opens the original LINE URL if JavaScript or intake fails.

**Manual verification still required before relying on the match rate:**

- Click a LINE button on a real phone, both **iOS and Android**, both as a
  first-time visitor (not yet a friend of the OA) and as an existing
  friend — confirm the prefilled `[SRT-...]` text survives whatever
  interstitial LINE shows, and confirm sending it produces a matched lead
  (`yarn leads:show <id>` shows `match.conversation_id`).
- Same check on desktop (LINE desktop client / browser fallback).

## Going live with Google Ads

Nothing in this system can be exercised against a real Google Ads account
yet — none exists (see `docs/google-ads/growth-stack-infrastructure-2026-08.md`).
When one does:

1. Create a **new service account** scoped only to `datamanager` (don't
   reuse `growth-stack-setup@...`, which only has GTM/GA4 scopes and no
   reason to also hold Ads write access).
2. Add its email as a user on the Google Ads account, grant it access.
3. Create a conversion action of the appropriate type for Data Manager
   ingestion; note its ID.
4. Set on the Worker: `wrangler secret put GOOGLE_SA_PRIVATE_KEY`, and
   update the `vars` in `workers/line-chat-history/wrangler.jsonc`:
   `ADS_CUSTOMER_ID`, `ADS_CONVERSION_ACTION_ID`, `GOOGLE_SA_CLIENT_EMAIL`.
5. Flip `ADS_SYNC_MODE` to `"live"` and redeploy.
6. Re-run `yarn leads:qa` against production-like config before trusting it
   with a real lead — the QA script is mode-agnostic and will exercise a
   real (non-`validateOnly`) call if pointed at a `live` Worker.

## Environment variables (main site)

The Next.js proxies (`/api/leads/intake`, `/api/admin/lead-proxy/*`) need,
on the **main** `siamrooftech` Worker (not the chat-history one):

- `LINE_CHAT_HISTORY_WORKER_URL` — set in `wrangler.jsonc` `vars` (not
  secret, just a URL)
- `LEADS_INTAKE_TOKEN`, `CHAT_HISTORY_READ_TOKEN`, `CHAT_HISTORY_WRITE_TOKEN`
  — set via `wrangler secret put <NAME>` on the main site's Worker, with
  the exact same values configured on the chat-history Worker (see
  `workers/line-chat-history/README.md`)

For local `next dev`, export these three token vars in your shell (no
`.dev.vars` equivalent exists for the main Next.js app — see
`workers/line-chat-history/.dev.vars` for the matching values used by the
Worker's own local dev server).

## MVP vs. later

**Shipped:** ref-code minting + intake, exact-ref matching in the webhook,
`leads`/`lead_events`/`ads_sync_jobs` schema, `/admin/leads` dashboard,
Read/Write API + CLI, Data Manager adapter with `dry_run` default, manual
match for unmatched leads with time-window candidate suggestions.

**Deferred:** flipping to `live` mode (blocked on an actual Google Ads
account existing), smarter automatic-match heuristics beyond exact ref
code, retention/purge tooling for PDPA, campaign/keyword-level reporting
rollups.

**Deliberately excluded, not just deferred:** collecting or uploading any
phone number or other third-party PII as a Google Ads match key (see
"Why gclid-only matching" above) — if this is revisited later, it needs an
explicit decision, not a quiet re-introduction.
