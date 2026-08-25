# siamrooftech-line-chat-history

Standalone Cloudflare Worker that receives LINE Official Account webhook
events, stores them (with attachments in R2, everything else in D1), and
exposes a read-only HTTP API for an AI Agent (or a human) to pull chat
history by date/time range.

This is a **separate Worker** from the main `siamrooftech` site — it has its
own `wrangler.jsonc`, its own deploy step, and does not go through
[`src/middleware.ts`](../../src/middleware.ts) or share bindings with the
main site. See [docs/line-chat-history/README.md](../../docs/line-chat-history/README.md)
for the architecture and the LINE API constraints that shaped this design —
most importantly: **replies sent by staff through LINE Official Account
Manager are never captured**, because LINE does not emit a webhook event for
them. Every Read API response says so explicitly in its `coverage` block.

## Resources (account `a61f30bb027ef64c9577c73f5981f073` — Siamrooftech)

| Resource | Name | Purpose |
|---|---|---|
| D1 | `siamrooftech-line-chat` | events, messages, attachments, conversations |
| R2 | `siamrooftech-line-chat-media` | downloaded images/video/audio/files |
| Queue | `line-media-fetch` (+ DLQ `line-media-fetch-dlq`) | async attachment/profile fetch with retry |

## Local development

```bash
# one-time: fixture secrets for local dev (never commit this file)
cat > workers/line-chat-history/.dev.vars <<'EOF'
LINE_CHANNEL_SECRET=your-local-fixture-secret
LINE_CHANNEL_ACCESS_TOKEN=your-local-fixture-token
CHAT_HISTORY_READ_TOKEN=your-local-read-token
CHAT_HISTORY_WRITE_TOKEN=your-local-write-token
EOF

yarn line:migrate:local   # apply migrations to the local D1 shadow DB
yarn line:dev              # wrangler dev on :8788
yarn line:qa --channel-secret=your-local-fixture-secret --read-token=your-local-read-token
```

`scripts/line-chat-history-qa.mjs` sends real (correctly signed) webhook
payloads against the running dev server and checks: signature rejection,
dedupe on `webhookEventId`, redelivery handling, timezone windowing,
pagination, and auth on the Read API. It does not require real LINE
credentials — it only needs the same channel secret configured in
`.dev.vars` so it can compute a valid `x-line-signature`. Attachment/profile
fetches against the real LINE API will fail with fixture credentials (you'll
see them retry and land on the DLQ in the dev log) — that's expected locally;
verify the real path in production per the runbook below.

## Deploying

```bash
yarn line:type-check
npx wrangler deploy --dry-run --config workers/line-chat-history/wrangler.jsonc
yarn line:migrate          # apply migrations to the REMOTE D1 database
yarn line:deploy
```

### Secrets (production)

```bash
npx wrangler secret put LINE_CHANNEL_SECRET        --config workers/line-chat-history/wrangler.jsonc
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN   --config workers/line-chat-history/wrangler.jsonc
npx wrangler secret put CHAT_HISTORY_READ_TOKEN     --config workers/line-chat-history/wrangler.jsonc
npx wrangler secret put CHAT_HISTORY_WRITE_TOKEN    --config workers/line-chat-history/wrangler.jsonc
```

`CHAT_HISTORY_READ_TOKEN` is the Bearer token the AI Agent / CLI uses against
`/chat-history*`. `CHAT_HISTORY_WRITE_TOKEN` guards `/internal/messages/outbound`
(not yet wired to a producer — see docs).

### Connecting it to LINE

1. Deploy first so you have a `*.workers.dev` URL (`npx wrangler deployments list --config workers/line-chat-history/wrangler.jsonc` or check the deploy output).
2. In the [LINE Developers Console](https://developers.line.biz/console/), open the Messaging API channel → **Messaging API** tab → set **Webhook URL** to `https://<worker>.workers.dev/line/webhook` → click **Verify** (sends `{"events":[]}`, expects 200).
3. Turn **Use webhook** ON. Response mode can stay on **Chat** (or Bot) — both work with webhook enabled since Nov 2022 — but confirmed staff replies via LINE Official Account Manager still won't reach this webhook regardless of that setting (see coverage note above).

## Reading chat history

```bash
export LINE_CHAT_HISTORY_BASE_URL=https://<worker>.workers.dev
export LINE_CHAT_HISTORY_READ_TOKEN=...

yarn line:history --date=2026-08-25 --timezone=Asia/Bangkok
yarn line:history --from=2026-08-01 --to=2026-08-25 --all --ndjson > history.ndjson
yarn line:history --conversations --limit=50
```

Or directly:

```bash
curl -H "Authorization: Bearer $LINE_CHAT_HISTORY_READ_TOKEN" \
  "https://<worker>.workers.dev/chat-history?date=2026-08-25&timezone=Asia/Bangkok"
```

## Known limitations (MVP)

- Staff replies via LINE Official Account Manager are not captured (LINE platform limitation, not a bug here).
- No auto-reply bot exists yet, so `/internal/messages/outbound` has no caller — it exists so a future bot doesn't need a schema migration.
- LINE does not document how long it retains user-sent media before deleting it; attachments are fetched immediately on webhook receipt via the queue, but a sufficiently delayed retry could still find content gone (`attachments.status = 'expired'`).
- No PDPA retention/purge tooling yet.
