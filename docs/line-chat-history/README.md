# LINE OA Chat History — Ingestion + Read API

Status: **MVP shipped**. Scope: receive, store, and read back LINE Official
Account chat history. Explicitly **out of scope**: sales stage, sentiment,
lead scoring, or any conversion-semantic interpretation of the messages —
this system stores and serves raw, normalized chat history only.

For the researched design rationale (LINE API constraints, Cloudflare
service choices, schema, verification plan), see the implementation plan
this was built from. This document is the living reference for what's
actually deployed.

## Why a separate Worker

The main site ([`wrangler.jsonc`](../../wrangler.jsonc)) runs Next.js via
OpenNext, and [`src/middleware.ts`](../../src/middleware.ts) 308-redirects
any request that doesn't hit the canonical host over https — which would
eat a webhook's POST body. Bundling the webhook into that Worker would also
tie its cold-start and blast radius to the SSR site. So
`workers/line-chat-history/` is its own Worker
(`siamrooftech-line-chat-history`), pinned to the same Cloudflare account
(`a61f30bb027ef64c9577c73f5981f073` — see the deploy runbook's warning about
a duplicate `siamrooftech`-named Worker in a different account) but deployed
and versioned independently. See [workers/line-chat-history/README.md](../../workers/line-chat-history/README.md)
for local dev and deploy commands.

## The constraint that shaped this design

**LINE does not send a webhook event when a human staff member replies
through LINE Official Account Manager's Chat screen.** The full webhook
event catalog is user-initiated only: `message`, `edit`, `unsend`, `follow`,
`unfollow`, `join`, `leave`, `memberJoined`, `memberLeft`, `postback`,
`videoPlayComplete`, `beacon`, `accountLink`, `membership`. There is no
`send`/`echo` event for the OA's own outbound messages sent via the manual
chat console. This is confirmed by LINE's own event reference and by other
platforms integrating with LINE OA independently hitting the same wall.

Practical effect: **this system captures inbound user messages completely**,
and can capture outbound **bot** messages (sent via the Messaging API) if a
bot is ever built — but **cannot** capture what a human staff member types
back through LINE Official Account Manager. Every Read API response says so
explicitly via a `coverage` block:

```json
"coverage": {
  "inbound_user_messages": "complete",
  "outbound_bot_messages": "complete",
  "outbound_staff_messages": "not_captured",
  "note": "LINE does not emit webhook events for replies sent from LINE Official Account Manager."
}
```

Confirmed in production on 2026-XX-XX: a staff reply sent through LINE
Official Account Manager was **not** delivered to `/line/webhook`. *(Update
this line with the actual date once the production smoke test in the
runbook below is performed — the local/dev environment cannot prove this on
its own since it has no real LINE Official Account Manager session.)*

If capturing staff replies becomes a requirement, the only path is building
a reply console inside `/admin` that sends staff replies via the Messaging
API `push`/`reply` endpoints (so this system logs them as it sends them) —
staff would then use that console instead of LINE Official Account Manager
for replies. That is explicitly **not** part of this MVP.

## Architecture

```
LINE Platform ──POST (x-line-signature)──> Worker: siamrooftech-line-chat-history
                                              fetch()
                                                POST /line/webhook        (LINE → us)
                                                GET  /chat-history*       (Read API, Bearer)
                                                POST /internal/messages/outbound (future bot, Bearer)
                                              queue()
                                                consumer of MEDIA_QUEUE — downloads attachments,
                                                fetches display names
                                            │
                              ┌─────────────┼──────────────┐
                              ▼             ▼              ▼
                       CHAT_DB (D1)   CHAT_MEDIA (R2)  MEDIA_QUEUE (+ DLQ)
```

Webhook flow: verify HMAC-SHA256 signature over the raw body → insert the
raw body into `webhook_deliveries` (audit trail) → batch-insert normalized
rows into `events`/`messages`/`attachments`/`conversations` (all keyed by
LINE's `webhookEventId` via `INSERT OR IGNORE`, so redeliveries are inert) →
enqueue attachment/profile fetch jobs → respond 200. LINE has no documented
retention window for user-sent media ("automatically deleted after a
certain period of time" — no number given), so attachments are fetched
immediately rather than backfilled later.

## Schema

See [`workers/line-chat-history/migrations/0001_init.sql`](../../workers/line-chat-history/migrations/0001_init.sql)
for the authoritative schema: `webhook_deliveries` (raw audit), `events`
(dedupe key = `webhook_event_id`), `messages` (the Read API's primary
table), `attachments` (R2 keys + fetch status), `conversations` (per-user
rollup + display name).

## Read API

See [`workers/line-chat-history/src/read-api.ts`](../../workers/line-chat-history/src/read-api.ts).
Routes: `GET /chat-history` (by `date`+`timezone` or `from`/`to`, with
`conversation_id`/`direction` filters and keyset pagination via `cursor`),
`GET /chat-history/conversations`, `GET /chat-history/media/{messageId}`,
`GET /chat-history/health`. All require `Authorization: Bearer
<CHAT_HISTORY_READ_TOKEN>`; non-GET requests to `/chat-history*` get 405.

CLI wrapper: `yarn line:history --date=2026-08-25` (see
[`scripts/line-chat-history.mjs`](../../scripts/line-chat-history.mjs)).

## Verification

`yarn line:qa` ([`scripts/line-chat-history-qa.mjs`](../../scripts/line-chat-history-qa.mjs))
exercises signature rejection, dedupe, redelivery handling, timezone
windowing, pagination, and Read API auth against a running `wrangler dev`
instance. Passed locally during implementation, including a live check that
a queue attachment job which exhausts all retries lands in D1 as
`attachments.status = 'failed'` (not silently stuck `pending`) once it's
routed to the dead-letter queue.

Before going live, run the production smoke test in
[`workers/line-chat-history/README.md`](../../workers/line-chat-history/README.md#connecting-it-to-line),
including sending one real staff reply through LINE Official Account
Manager to confirm the coverage gap above in the live account, then update
the date placeholder in this document.

## MVP vs. later

**Shipped in this MVP:** webhook + signature verification + dedupe, raw
audit trail, normalized events/messages/conversations, attachment pipeline
(R2 + Queue with retry/DLQ), profile enrichment, Read API + CLI + QA,
`/internal/messages/outbound` endpoint and schema (no producer yet).

**Deferred:** capturing staff replies (requires an in-admin reply console —
see above), CSV import of LINE Official Account Manager exports, full-text
search, retention/purge tooling for PDPA, custom domain for this Worker, CI.

**Explicitly out of scope for this system entirely:** sales stage,
sentiment, lead scoring, conversion-semantic interpretation of any kind.
