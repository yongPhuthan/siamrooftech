# OpenAI Ads (ChatGPT Ads) measurement

Applies to every file in this directory. Root `AGENTS.md` and
`src/features/line-contact/AGENTS.md` still apply.

## Ownership

- `pixel-config.ts`: pure, browser-safe policy (Pixel ID format, loader
  snippet, custom event names).
- `OpenAIPixel.tsx`: server-rendered loader in the root layout. Renders only in
  production builds with a valid `NEXT_PUBLIC_OPENAI_PIXEL_ID`.
- `measure.ts`: fire-and-forget browser calls (`page_viewed`, `line_click`,
  `phone_click`). Called from `AttributionCapture`'s passive click listener.
- `conversions-api.ts`: server-only Conversions API client
  (`https://bzr.openai.com/v1/events?pid=<PIXEL-ID>`). Not wired to a trigger yet.

## Rules

- The Pixel ID is public (it ships in page HTML) and lives only in the
  production `vars` of `wrangler.jsonc` as `NEXT_PUBLIC_OPENAI_PIXEL_ID`, like
  the GA4 ID. Staging is forced empty in `next.config.mjs`; local builds measure
  only when the env var is set explicitly. Never commit
  `OPENAI_CONVERSIONS_API_KEY` or customer data: the API key is a Worker secret,
  never a `NEXT_PUBLIC_*` value.
- Measurement never blocks LINE: no `preventDefault`, no awaited calls, no
  href changes in a click path. `line_click`/`phone_click` are diagnostics, not
  the campaign optimization goal.
- Conversions API requests default to `validate_only: true`. Sending live events
  (`{ live: true }`) needs explicit owner approval and a deterministic `id`
  equal to the Pixel `event_id` for the same action. Include the original
  `oppref` when known. Batches are atomic (max 1,000 events).
- Paid ChatGPT ad URLs must carry `utm_source=chatgpt&utm_medium=cpc`; organic
  ChatGPT citations arrive as `utm_source=chatgpt.com`.
- Keep `robots.ts` from disallowing `OAI-AdsBot` on landing pages.
